import React, { useState, useEffect } from 'react';
import { Filter, RefreshCw, X } from 'lucide-react';
import { ApiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';
import type { ScreenerItem } from '../types/api';

export const Screeners: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<ScreenerItem[]>([]);
    
    // Filter state
    const [filters, setFilters] = useState<Record<string, string>>({
        min_price: '', max_price: '',
        min_pe: '', max_pe: '',
        min_market_cap: '', max_market_cap: '',
        min_yield: '', max_yield: ''
    });

    const fetchScreeners = async () => {
        setLoading(true);
        setError(null);
        try {
            // Convert to numbers or undefined
            const parsedFilters: Record<string, number | undefined> = {};
            for (const [key, val] of Object.entries(filters)) {
                if (val.trim() !== '') {
                    parsedFilters[key] = Number(val);
                }
            }
            const data = await ApiClient.getScreenerResults(parsedFilters);
            setResults(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch screener results');
        } finally {
            setLoading(false);
        }
    };

    // Fetch on initial mount
    useEffect(() => {
        fetchScreeners();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApply = (e: React.FormEvent) => {
        e.preventDefault();
        fetchScreeners();
    };

    const handleReset = () => {
        setFilters({
            min_price: '', max_price: '',
            min_pe: '', max_pe: '',
            min_market_cap: '', max_market_cap: '',
            min_yield: '', max_yield: ''
        });
        setTimeout(() => fetchScreeners(), 0);
    };

    const formatCurrency = (val: any) => val ? `$${val.toFixed(2)}` : '-';
    const formatPct = (val: any) => val ? `${val.toFixed(2)}%` : '-';
    const formatNumber = (val: any) => {
        if (!val) return '-';
        if (val >= 1e12) return (val / 1e12).toFixed(2) + 'T';
        if (val >= 1e9) return (val / 1e9).toFixed(2) + 'B';
        if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M';
        return val.toLocaleString();
    };

    return (
        <div className="research-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Stock Screener</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Filter major US equities by fundamentals</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
                <div className="panel" style={{ alignSelf: 'start', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Filter size={16} /> Filters</h3>
                        <button className="action-btn" onClick={handleReset} title="Reset Filters"><X size={16} /></button>
                    </div>

                    <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Price ($)</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input className="settings-input" placeholder="Min" value={filters.min_price} onChange={e => handleFilterChange('min_price', e.target.value)} type="number" step="0.01" />
                                <input className="settings-input" placeholder="Max" value={filters.max_price} onChange={e => handleFilterChange('max_price', e.target.value)} type="number" step="0.01" />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>P/E Ratio</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input className="settings-input" placeholder="Min" value={filters.min_pe} onChange={e => handleFilterChange('min_pe', e.target.value)} type="number" step="0.1" />
                                <input className="settings-input" placeholder="Max" value={filters.max_pe} onChange={e => handleFilterChange('max_pe', e.target.value)} type="number" step="0.1" />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Market Cap ($)</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input className="settings-input" placeholder="Min" value={filters.min_market_cap} onChange={e => handleFilterChange('min_market_cap', e.target.value)} type="number" />
                                <input className="settings-input" placeholder="Max" value={filters.max_market_cap} onChange={e => handleFilterChange('max_market_cap', e.target.value)} type="number" />
                            </div>
                        </div>
                        
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Dividend Yield (%)</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input className="settings-input" placeholder="Min" value={filters.min_yield} onChange={e => handleFilterChange('min_yield', e.target.value)} type="number" step="0.1" />
                                <input className="settings-input" placeholder="Max" value={filters.max_yield} onChange={e => handleFilterChange('max_yield', e.target.value)} type="number" step="0.1" />
                            </div>
                        </div>

                        <button type="submit" className="trade-btn" style={{ marginTop: '1rem', width: '100%' }}>Apply Filters</button>
                    </form>
                </div>

                <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                    {error && (
                        <div className="badge badge-danger" style={{ margin: '1rem' }}>
                            {error}
                        </div>
                    )}
                    
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{results.length} Matches Found</span>
                        {loading && <RefreshCw className="spinner" size={16} style={{ color: 'var(--text-secondary)', animation: 'spin 1s linear infinite' }} />}
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Ticker</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Price</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Change</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Market Cap</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>P/E</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Div Yield</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            No stocks matched your criteria.
                                        </td>
                                    </tr>
                                )}
                                {results.map(item => (
                                    <tr key={item.ticker} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/markets?ticker=${item.ticker}`)} className="table-row-hover">
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ color: 'var(--accent-light)', fontWeight: 500 }}>{item.ticker}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.company}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-primary)' }}>{formatCurrency(item.price)}</td>
                                        <td style={{ padding: '1rem 1.5rem', color: (item.day_change_pct || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                            {(item.day_change_pct || 0) > 0 ? '+' : ''}{formatPct(item.day_change_pct)}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{formatNumber(item.market_cap)}</td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{item.pe ? item.pe.toFixed(2) : '-'}</td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{formatPct(item.dividend_yield)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <style>{`
                .settings-input {
                    background: var(--bg-primary);
                    border: 1px solid var(--border);
                    color: var(--text-primary);
                    border-radius: 4px;
                    padding: 0.5rem;
                    width: 100%;
                    outline: none;
                    font-size: 0.875rem;
                }
                .settings-input:focus {
                    border-color: var(--accent);
                }
                .table-row-hover:hover {
                    background-color: rgba(255, 255, 255, 0.02);
                }
            `}</style>
        </div>
    );
};
