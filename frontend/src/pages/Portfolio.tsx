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

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

    const [formTicker, setFormTicker] = useState('');
    const [formQuantity, setFormQuantity] = useState('');
    const [formAvgCost, setFormAvgCost] = useState('');

    const fetchPortfolio = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ApiClient.getPortfolio();
            setHoldings(data.portfolio);
            const priceMap: Record<string, number> = {};
            await Promise.all(data.portfolio.map(async (item) => {
                try {
                    const quote = await ApiClient.getMarketQuote(item.ticker);
                    if (quote?.market_data?.current_price) priceMap[item.ticker] = quote.market_data.current_price;
                } catch (_e) {
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
        setModalMode('add'); setFormTicker(''); setFormQuantity(''); setFormAvgCost('');
        setSelectedItem(null); setShowModal(true);
    };

    const openEditModal = (item: PortfolioItem) => {
        setModalMode('edit'); setSelectedItem(item);
        setFormTicker(item.ticker); setFormQuantity(item.quantity.toString()); setFormAvgCost(item.average_cost.toString());
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const q = parseFloat(formQuantity);
        const c = parseFloat(formAvgCost);
        if (isNaN(q) || !isFinite(q) || q <= 0) { setError('Quantity must be a number greater than 0.'); setShowModal(false); return; }
        if (isNaN(c) || !isFinite(c) || c < 0) { setError('Average cost must be a non-negative number.'); setShowModal(false); return; }
        try {
            if (modalMode === 'add') {
                await ApiClient.addPortfolioItem({ ticker: formTicker, quantity: q, average_cost: c });
            } else if (modalMode === 'edit' && selectedItem) {
                await ApiClient.updatePortfolioItem(selectedItem.id, { quantity: q, average_cost: c });
            }
            setShowModal(false);
            fetchPortfolio();
        } catch (err: any) {
            setError(err.message || 'Failed to save holding');
            setShowModal(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this holding?')) return;
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

    const anyPriceMissing = holdings.some(h => prices[h.ticker] === undefined);
    const enrichedHoldings = holdings.map(item => {
        const currentPrice = prices[item.ticker];
        const invested = item.quantity * item.average_cost;
        const marketValue = currentPrice !== undefined ? item.quantity * currentPrice : undefined;
        const unrealizedPL = marketValue !== undefined ? marketValue - invested : undefined;
        const unrealizedPLPct = (unrealizedPL !== undefined && invested > 0) ? (unrealizedPL / invested) * 100 : undefined;
        return { ...item, currentPrice, invested, marketValue, unrealizedPL, unrealizedPLPct };
    });

    const totalInvested = enrichedHoldings.reduce((sum, item) => sum + item.invested, 0);
    const totalValue = (!loading && !anyPriceMissing) ? enrichedHoldings.reduce((sum, item) => sum + (item.marketValue || 0), 0) : undefined;
    const enrichedHoldingsWithWeight = enrichedHoldings.map(item => ({
        ...item,
        weight: (totalValue !== undefined && totalValue > 0 && item.marketValue !== undefined) ? (item.marketValue / totalValue) * 100 : 0,
    }));
    const totalUnrealizedPL = totalValue !== undefined ? totalValue - totalInvested : undefined;
    const totalUnrealizedPLPct = (totalUnrealizedPL !== undefined && totalInvested > 0) ? (totalUnrealizedPL / totalInvested) * 100 : undefined;

    const COLORS = ['#D9774F', '#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f43f5e'];

    return (
        <div className="page-content">
            {/* Header */}
            <div className="page-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 className="page-title">Paper Portfolio</h1>
                        <span className="badge badge-warning">SIMULATED</span>
                    </div>
                    <p className="page-subtitle">Simulated holdings — not real trades or financial advice.</p>
                </div>
                <div className="page-header-actions">
                    <button className="action-btn" onClick={fetchPortfolio} disabled={loading} title="Refresh prices" style={{ padding: '0.5rem' }}>
                        <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
                    </button>
                    <button className="btn btn-primary" onClick={openAddModal} style={{ gap: '0.375rem' }}>
                        <Plus size={15} /> Add Holding
                    </button>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {/* Summary stats */}
            <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-label">Market Value</div>
                    <div className="stat-value">{loading ? '—' : (totalValue !== undefined ? formatCurrency(totalValue) : '—')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Total Invested</div>
                    <div className="stat-value">{formatCurrency(totalInvested)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Unrealized P/L</div>
                    <div className={`stat-value ${totalUnrealizedPL !== undefined ? (totalUnrealizedPL >= 0 ? 'positive' : 'negative') : ''}`}
                         style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        {loading ? '—' : totalUnrealizedPL !== undefined && totalUnrealizedPLPct !== undefined ? (
                            <>
                                {totalUnrealizedPL >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                {totalUnrealizedPL > 0 ? '+' : ''}{formatCurrency(totalUnrealizedPL)}
                            </>
                        ) : '—'}
                    </div>
                    {totalUnrealizedPLPct !== undefined && (
                        <div style={{ fontSize: '0.8125rem', color: totalUnrealizedPLPct >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: '0.25rem' }}>
                            ({totalUnrealizedPLPct > 0 ? '+' : ''}{formatPct(totalUnrealizedPLPct)})
                        </div>
                    )}
                </div>
                <div className="stat-card">
                    <div className="stat-label">Holdings</div>
                    <div className="stat-value">{holdings.length}</div>
                </div>
            </div>

            {loading && holdings.length === 0 && (
                <div className="loading-state">
                    <RefreshCw size={18} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                    Loading portfolio…
                </div>
            )}

            {/* Allocation chart */}
            {!loading && enrichedHoldingsWithWeight.length > 0 && totalValue !== undefined && (
                <div className="panel" style={{ marginBottom: '1.5rem', height: '260px', display: 'flex', flexDirection: 'column' }}>
                    <div className="panel-header">
                        <div className="panel-title"><PieChartIcon size={13} /> Allocation</div>
                    </div>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={enrichedHoldingsWithWeight}
                                    cx="50%" cy="45%"
                                    innerRadius={48} outerRadius={75}
                                    paddingAngle={4}
                                    dataKey="marketValue" nameKey="ticker"
                                >
                                    {enrichedHoldingsWithWeight.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(value: any) => formatCurrency(Number(value))}
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '0.8125rem' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Holdings table */}
            <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="panel-header" style={{ padding: '1rem 1.25rem' }}>
                    <div className="panel-title">Holdings</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="terminal-table">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th className="numeric">Qty</th>
                                <th className="numeric">Avg Cost</th>
                                <th className="numeric">Price</th>
                                <th className="numeric">Mkt Value</th>
                                <th className="numeric">Weight</th>
                                <th className="numeric">P/L</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrichedHoldingsWithWeight.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No holdings in your paper portfolio. Click "Add Holding" to start.
                                    </td>
                                </tr>
                            )}
                            {enrichedHoldingsWithWeight.map(h => (
                                <tr key={h.id} className="history-row">
                                    <td>
                                        <div style={{ fontWeight: 700, fontFamily: 'var(--mono)', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{h.ticker}</div>
                                        {h.company_name && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{h.company_name}</div>}
                                    </td>
                                    <td className="numeric">{h.quantity}</td>
                                    <td className="numeric">{formatCurrency(h.average_cost)}</td>
                                    <td className="numeric">{h.currentPrice !== undefined ? formatCurrency(h.currentPrice) : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                    <td className="numeric">{h.marketValue !== undefined ? formatCurrency(h.marketValue) : '—'}</td>
                                    <td className="numeric">{h.marketValue !== undefined ? formatPct(h.weight) : '—'}</td>
                                    <td className="numeric" style={{ color: h.unrealizedPL !== undefined ? (h.unrealizedPL >= 0 ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)', fontWeight: 600 }}>
                                        {h.unrealizedPL !== undefined && h.unrealizedPLPct !== undefined ? (
                                            <div>
                                                <div>{h.unrealizedPL > 0 ? '+' : ''}{formatCurrency(h.unrealizedPL)}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>({h.unrealizedPL > 0 ? '+' : ''}{formatPct(h.unrealizedPLPct)})</div>
                                            </div>
                                        ) : '—'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                                            <button className="action-btn" onClick={() => openEditModal(h)} title="Edit holding"><Edit2 size={14} /></button>
                                            <button className="action-btn" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(h.id)} title="Delete holding"><Trash2 size={14} /></button>
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
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-panel" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">{modalMode === 'add' ? 'Add Holding' : 'Edit Holding'}</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Ticker Symbol</label>
                                <input
                                    className="form-input"
                                    value={formTicker}
                                    onChange={e => setFormTicker(e.target.value.toUpperCase())}
                                    placeholder="e.g. AAPL"
                                    required
                                    disabled={modalMode === 'edit'}
                                    style={{ fontFamily: 'var(--mono)', fontWeight: 600, letterSpacing: '0.04em' }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quantity</label>
                                <input type="number" step="any" className="form-input" value={formQuantity} onChange={e => setFormQuantity(e.target.value)} placeholder="0" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Average Cost ($)</label>
                                <input type="number" step="any" className="form-input" value={formAvgCost} onChange={e => setFormAvgCost(e.target.value)} placeholder="0.00" required />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary btn-full">Save Holding</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
