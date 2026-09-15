import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client';
import { RefreshCw, Plus, Edit2, Trash2, TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';
import type { PortfolioItem } from '../types/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export const Portfolio: React.FC = () => {
    const [holdings, setHoldings] = useState<PortfolioItem[]>([]);
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

    // Form state
    const [formTicker, setFormTicker] = useState('');
    const [formQuantity, setFormQuantity] = useState('');
    const [formAvgCost, setFormAvgCost] = useState('');

    const fetchPortfolio = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ApiClient.getPortfolio();
            setHoldings(data.portfolio);
            
            // Fetch prices for all holdings
            const priceMap: Record<string, number> = {};
            await Promise.all(data.portfolio.map(async (item) => {
                try {
                    const quote = await ApiClient.getMarketQuote(item.ticker);
                    if (quote && quote.market_data && quote.market_data.current_price) {
                        priceMap[item.ticker] = quote.market_data.current_price;
                    }
                } catch (e) {
                    console.error(`Failed to fetch price for ${item.ticker}`);
                }
            }));
            setPrices(priceMap);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch portfolio');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolio();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const openAddModal = () => {
        setModalMode('add');
        setFormTicker('');
        setFormQuantity('');
        setFormAvgCost('');
        setSelectedItem(null);
        setShowModal(true);
    };

    const openEditModal = (item: PortfolioItem) => {
        setModalMode('edit');
        setSelectedItem(item);
        setFormTicker(item.ticker);
        setFormQuantity(item.quantity.toString());
        setFormAvgCost(item.average_cost.toString());
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        const q = parseFloat(formQuantity);
        const c = parseFloat(formAvgCost);

        if (isNaN(q) || !isFinite(q) || q <= 0) {
            setError('Quantity must be a number greater than 0.');
            setShowModal(false);
            return;
        }
        if (isNaN(c) || !isFinite(c) || c < 0) {
            setError('Average cost must be a non-negative number.');
            setShowModal(false);
            return;
        }

        try {
            if (modalMode === 'add') {
                await ApiClient.addPortfolioItem({
                    ticker: formTicker,
                    quantity: q,
                    average_cost: c
                });
            } else if (modalMode === 'edit' && selectedItem) {
                await ApiClient.updatePortfolioItem(selectedItem.id, {
                    quantity: q,
                    average_cost: c
                });
            }
            setShowModal(false);
            fetchPortfolio();
        } catch (err: any) {
            setError(err.message || 'Failed to save holding');
            setShowModal(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this holding?')) return;
        setError(null);
        try {
            await ApiClient.deletePortfolioItem(id);
            fetchPortfolio();
        } catch (err: any) {
            setError(err.message || 'Failed to delete holding');
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    const formatPct = (val: number) => `${val.toFixed(2)}%`;

    // Calculations
    const enrichedHoldings = holdings.map(item => {
        const currentPrice = prices[item.ticker] || 0;
        const invested = item.quantity * item.average_cost;
        const marketValue = item.quantity * currentPrice;
        const unrealizedPL = marketValue - invested;
        const unrealizedPLPct = invested > 0 ? (unrealizedPL / invested) * 100 : 0;
        return {
            ...item,
            currentPrice,
            invested,
            marketValue,
            unrealizedPL,
            unrealizedPLPct
        };
    });

    const totalInvested = enrichedHoldings.reduce((sum, item) => sum + item.invested, 0);
    const totalValue = enrichedHoldings.reduce((sum, item) => sum + item.marketValue, 0);

    const enrichedHoldingsWithWeight = enrichedHoldings.map(item => ({
        ...item,
        weight: totalValue > 0 ? (item.marketValue / totalValue) * 100 : 0
    }));

    const totalUnrealizedPL = totalValue - totalInvested;
    const totalUnrealizedPLPct = totalInvested > 0 ? (totalUnrealizedPL / totalInvested) * 100 : 0;
    
    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

    return (
        <div className="research-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Paper Portfolio</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Track simulated holdings and performance</p>
                </div>
                <button className="trade-btn" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={16} /> Add Holding
                </button>
            </div>

            {error && (
                <div className="badge badge-danger" style={{ padding: '1rem', marginBottom: '2rem' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="panel" style={{ padding: '1.5rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Market Value</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(totalValue)}</div>
                </div>
                <div className="panel" style={{ padding: '1.5rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Invested</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{formatCurrency(totalInvested)}</div>
                </div>
                <div className="panel" style={{ padding: '1.5rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Unrealized P/L</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: totalUnrealizedPL >= 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {totalUnrealizedPL >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        {totalUnrealizedPL > 0 ? '+' : ''}{formatCurrency(totalUnrealizedPL)} ({formatPct(totalUnrealizedPLPct)})
                    </div>
                </div>
            </div>

            {loading && enrichedHoldingsWithWeight.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <RefreshCw className="spinner" size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                    <p>Loading portfolio data...</p>
                </div>
            )}

            {!loading && enrichedHoldingsWithWeight.length > 0 && (
                <div className="panel" style={{ marginBottom: '2rem', height: '300px' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PieChartIcon size={16} /> Allocation
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={enrichedHoldingsWithWeight}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="marketValue"
                                nameKey="ticker"
                            >
                                {enrichedHoldingsWithWeight.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip 
                                formatter={(value: any) => formatCurrency(Number(value))}
                                contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '4px' }}
                                itemStyle={{ color: 'var(--text-primary)' }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Holdings</h3>
                    <button className="action-btn" onClick={fetchPortfolio} disabled={loading}><RefreshCw size={16} className={loading ? "spinner" : ""} style={loading ? {animation: 'spin 1s linear infinite'} : {}} /></button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Ticker</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Qty</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Avg Cost</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Price</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Market Value</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Weight</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Total P/L</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrichedHoldingsWithWeight.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No holdings in your paper portfolio.
                                    </td>
                                </tr>
                            )}
                            {enrichedHoldingsWithWeight.map(h => (
                                <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ color: 'var(--accent-light)', fontWeight: 500 }}>{h.ticker}</div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-primary)' }}>{h.quantity}</td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{formatCurrency(h.average_cost)}</td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-primary)' }}>{h.currentPrice ? formatCurrency(h.currentPrice) : 'Loading...'}</td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-primary)' }}>{h.currentPrice ? formatCurrency(h.marketValue) : '-'}</td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{h.currentPrice ? formatPct(h.weight) : '-'}</td>
                                    <td style={{ padding: '1rem 1.5rem', color: h.unrealizedPL >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                        {h.currentPrice ? (
                                            <>
                                                {h.unrealizedPL > 0 ? '+' : ''}{formatCurrency(h.unrealizedPL)} <br/>
                                                <span style={{ fontSize: '0.75rem' }}>({h.unrealizedPL > 0 ? '+' : ''}{formatPct(h.unrealizedPLPct)})</span>
                                            </>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button className="action-btn" onClick={() => openEditModal(h)} title="Edit"><Edit2 size={16} /></button>
                                            <button className="action-btn" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(h.id)} title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="panel" style={{ width: '400px', padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                            {modalMode === 'add' ? 'Add Holding' : 'Edit Holding'}
                        </h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Ticker Symbol</label>
                                <input 
                                    className="settings-input" 
                                    value={formTicker} 
                                    onChange={e => setFormTicker(e.target.value.toUpperCase())} 
                                    placeholder="e.g. AAPL" 
                                    required 
                                    disabled={modalMode === 'edit'}
                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.75rem', borderRadius: '4px', width: '100%', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Quantity</label>
                                <input 
                                    type="number"
                                    step="any"
                                    className="settings-input" 
                                    value={formQuantity} 
                                    onChange={e => setFormQuantity(e.target.value)} 
                                    placeholder="0" 
                                    required 
                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.75rem', borderRadius: '4px', width: '100%', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Average Cost ($)</label>
                                <input 
                                    type="number"
                                    step="any"
                                    className="settings-input" 
                                    value={formAvgCost} 
                                    onChange={e => setFormAvgCost(e.target.value)} 
                                    placeholder="0.00" 
                                    required 
                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.75rem', borderRadius: '4px', width: '100%', outline: 'none' }}
                                />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="action-btn" style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="trade-btn" style={{ flex: 1 }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
