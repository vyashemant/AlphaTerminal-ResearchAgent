import React, { useState, useEffect } from 'react';
import { ApiClient } from '../api/client';
import { RefreshCw, Plus, Edit2, Trash2, TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';
import type { PortfolioItem } from '../types/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

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
                } catch (err) {
                    console.error(`Failed to fetch price for ${item.ticker}`, err);
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

    const anyPriceMissing = holdings.length > 0 && holdings.some(h => prices[h.ticker] === undefined);
    const enrichedHoldings = holdings.map(item => {
        const currentPrice = prices[item.ticker];
        const invested = item.quantity * item.average_cost;
        const marketValue = currentPrice !== undefined ? item.quantity * currentPrice : undefined;
        const unrealizedPL = marketValue !== undefined ? marketValue - invested : undefined;
        const unrealizedPLPct = (unrealizedPL !== undefined && invested > 0) ? (unrealizedPL / invested) * 100 : undefined;
        return { ...item, currentPrice, invested, marketValue, unrealizedPL, unrealizedPLPct };
    });

    const totalInvested = enrichedHoldings.reduce((sum, item) => sum + item.invested, 0);
    const hasAnyMarketValue = enrichedHoldings.some(h => h.marketValue !== undefined);
    const totalValue = (!loading && hasAnyMarketValue && !anyPriceMissing) 
        ? enrichedHoldings.reduce((sum, item) => sum + (item.marketValue || 0), 0) 
        : undefined;

    const baseForWeight = (totalValue && totalValue > 0) 
        ? totalValue 
        : (totalInvested > 0 ? totalInvested : 1);

    const enrichedHoldingsWithWeight = enrichedHoldings.map(item => {
        const effectiveVal = item.marketValue !== undefined ? item.marketValue : item.invested;
        return {
            ...item,
            chartValue: effectiveVal > 0 ? effectiveVal : 0.01,
            weight: baseForWeight > 0 ? (effectiveVal / baseForWeight) * 100 : 0,
        };
    });

    const totalUnrealizedPL = (totalValue !== undefined && !anyPriceMissing) ? totalValue - totalInvested : undefined;
    const totalUnrealizedPLPct = (totalUnrealizedPL !== undefined && totalInvested > 0) ? (totalUnrealizedPL / totalInvested) * 100 : undefined;

    const COLORS = ['#D9774F', '#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f43f5e', '#14b8a6', '#e11d48'];

    return (
        <div className="page-content">
            {/* Header */}
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 className="page-title">Paper Portfolio</h1>
                        <span className="badge badge-warning">SIMULATED</span>
                    </div>
                    <p className="page-subtitle">Simulated holdings — not real trades or financial advice.</p>
                </div>
                <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button className="action-btn" onClick={fetchPortfolio} disabled={loading} title="Refresh prices" style={{ padding: '0.5rem' }}>
                        <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={openAddModal} style={{ gap: '0.375rem' }}>
                        <Plus size={14} /> Add Holding
                    </button>
                </div>
            </div>

            {error && <div className="error-banner" style={{ marginBottom: '1.5rem' }}>{error}</div>}

            {/* Summary stats */}
            <div className="stat-grid portfolio-stat-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '104px', height: '100%', padding: '1.25rem' }}>
                    <div className="stat-label">Market Value</div>
                    <div className="stat-value" style={{ fontFamily: 'var(--mono)', fontSize: '1.5rem', lineHeight: 1.2, margin: '0.375rem 0' }}>
                        {loading ? '—' : (totalValue !== undefined ? formatCurrency(totalValue) : (hasAnyMarketValue ? 'Partial' : '—'))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {anyPriceMissing && !loading && holdings.length > 0 ? 'Updating real-time prices…' : 'Live mark-to-market'}
                    </div>
                </div>
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '104px', height: '100%', padding: '1.25rem' }}>
                    <div className="stat-label">Total Invested</div>
                    <div className="stat-value" style={{ fontFamily: 'var(--mono)', fontSize: '1.5rem', lineHeight: 1.2, margin: '0.375rem 0' }}>
                        {formatCurrency(totalInvested)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cost basis of paper positions</div>
                </div>
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '104px', height: '100%', padding: '1.25rem' }}>
                    <div className="stat-label">Unrealized P/L</div>
                    <div className={`stat-value ${totalUnrealizedPL !== undefined ? (totalUnrealizedPL >= 0 ? 'positive' : 'negative') : ''}`}
                         style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontFamily: 'var(--mono)', fontSize: '1.5rem', lineHeight: 1.2, margin: '0.375rem 0' }}>
                        {loading ? '—' : totalUnrealizedPL !== undefined ? (
                            <>
                                {totalUnrealizedPL >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                {totalUnrealizedPL > 0 ? '+' : ''}{formatCurrency(totalUnrealizedPL)}
                            </>
                        ) : '—'}
                    </div>
                    {totalUnrealizedPLPct !== undefined ? (
                        <div style={{ fontSize: '0.75rem', color: totalUnrealizedPLPct >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>
                            {totalUnrealizedPLPct > 0 ? '+' : ''}{formatPct(totalUnrealizedPLPct)} return
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculation requires full pricing</div>
                    )}
                </div>
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '104px', height: '100%', padding: '1.25rem' }}>
                    <div className="stat-label">Holdings Count</div>
                    <div className="stat-value" style={{ fontFamily: 'var(--mono)', fontSize: '1.5rem', lineHeight: 1.2, margin: '0.375rem 0' }}>{holdings.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active simulated assets</div>
                </div>
            </div>

            {loading && holdings.length === 0 && (
                <div className="loading-state" style={{ marginBottom: '1.5rem' }}>
                    <RefreshCw size={18} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                    Loading portfolio…
                </div>
            )}

            {/* Allocation section: 2-column balanced layout on desktop, single column on mobile */}
            {!loading && enrichedHoldingsWithWeight.length > 0 && (
                <div className="portfolio-allocation-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* Donut Chart */}
                    <div className="panel" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
                        <div className="panel-header" style={{ padding: 0, paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
                            <div className="panel-title"><PieChartIcon size={14} /> Allocation Weight</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By Market Value</span>
                        </div>
                        <div style={{ flex: 1, minHeight: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height={230}>
                                <PieChart>
                                    <Pie
                                        data={enrichedHoldingsWithWeight}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={92}
                                        paddingAngle={3}
                                        dataKey="chartValue" nameKey="ticker"
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
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Breakdown List */}
                    <div className="panel" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
                        <div className="panel-header" style={{ padding: 0, paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
                            <div className="panel-title">Asset Breakdown</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{holdings.length} {holdings.length === 1 ? 'Asset' : 'Assets'}</span>
                        </div>
                        <div style={{ flex: 1, maxHeight: '230px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
                            {enrichedHoldingsWithWeight.map((h, idx) => (
                                <div key={h.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.5rem 0.75rem', background: 'var(--bg-primary)',
                                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[idx % COLORS.length], flexShrink: 0 }} />
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontFamily: 'var(--mono)', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{h.ticker}</div>
                                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company_name || h.ticker}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.5rem' }}>
                                        <div style={{ fontWeight: 600, fontFamily: 'var(--mono)', fontSize: '0.8125rem' }}>
                                            {formatPct(h.weight)}
                                        </div>
                                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                            {h.marketValue !== undefined ? formatCurrency(h.marketValue) : formatCurrency(h.invested)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Holdings table with contained horizontal scrolling */}
            <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="panel-header" style={{ padding: '1rem 1.25rem' }}>
                    <div className="panel-title">Holdings</div>
                </div>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                    <table className="terminal-table" style={{ width: '100%', minWidth: '720px', tableLayout: 'fixed' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '20%' }}>Ticker</th>
                                <th className="numeric" style={{ width: '10%' }}>Qty</th>
                                <th className="numeric" style={{ width: '12%' }}>Avg Cost</th>
                                <th className="numeric" style={{ width: '12%' }}>Price</th>
                                <th className="numeric" style={{ width: '14%' }}>Market Value</th>
                                <th className="numeric" style={{ width: '10%' }}>Weight</th>
                                <th className="numeric" style={{ width: '14%' }}>P/L</th>
                                <th style={{ width: '8%', textAlign: 'right' }}>Actions</th>
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
                                        {h.company_name && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company_name}</div>}
                                    </td>
                                    <td className="numeric">{h.quantity}</td>
                                    <td className="numeric">{formatCurrency(h.average_cost)}</td>
                                    <td className="numeric">{h.currentPrice !== undefined ? formatCurrency(h.currentPrice) : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                    <td className="numeric">{h.marketValue !== undefined ? formatCurrency(h.marketValue) : '—'}</td>
                                    <td className="numeric">{formatPct(h.weight)}</td>
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
