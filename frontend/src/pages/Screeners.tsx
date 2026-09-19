import React, { useState, useEffect } from 'react';
import { Filter, RefreshCw, X } from 'lucide-react';
import { ApiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';
import type { ScreenerItem } from '../types/api';

interface FilterRowProps {
    label: string;
    minKey: string;
    maxKey: string;
    step?: string;
    filters: Record<string, string>;
    onFilterChange: (key: string, value: string) => void;
}

function FilterRow({ label, minKey, maxKey, step, filters, onFilterChange }: FilterRowProps) {
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="number"
                    placeholder="Min"
                    value={filters[minKey]}
                    onChange={e => onFilterChange(minKey, e.target.value)}
                    className="form-input"
                    step={step}
                    style={{ width: '50%', minWidth: 0 }}
                />
                <input
                    type="number"
                    placeholder="Max"
                    value={filters[maxKey]}
                    onChange={e => onFilterChange(maxKey, e.target.value)}
                    className="form-input"
                    step={step}
                    style={{ width: '50%', minWidth: 0 }}
                />
            </div>
        </div>
    );
}

export const Screeners: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<ScreenerItem[]>([]);

    const [filters, setFilters] = useState<Record<string, string>>({
        min_price: '', max_price: '',
        min_pe: '', max_pe: '',
        min_market_cap: '', max_market_cap: '',
        min_yield: '', max_yield: '',
    });

    const fetchScreeners = async () => {
        setLoading(true);
        setError(null);
        try {
            const parsedFilters: Record<string, number | undefined> = {};
            for (const [key, val] of Object.entries(filters)) {
                if (val.trim() !== '') parsedFilters[key] = Number(val);
            }
            const data = await ApiClient.getScreenerResults(parsedFilters);
            setResults(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch screener results');
        } finally {
            setLoading(false);
        }
    };

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
        const empty = { min_price: '', max_price: '', min_pe: '', max_pe: '', min_market_cap: '', max_market_cap: '', min_yield: '', max_yield: '' };
        setFilters(empty);
        setTimeout(() => fetchScreeners(), 0);
    };

    const formatCurrency = (val: any) => {
        if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        return `$${Number(val).toFixed(2)}`;
    };
    const formatPct = (val: any) => {
        if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>N/A</span>;
        return `${Number(val).toFixed(2)}%`;
    };
    const formatPe = (val: any) => {
        if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>N/A</span>;
        return Number(val).toFixed(2);
    };
    const formatNumber = (val: any) => {
        if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        if (val >= 1e12) return (val / 1e12).toFixed(2) + 'T';
        if (val >= 1e9)  return (val / 1e9).toFixed(2)  + 'B';
        if (val >= 1e6)  return (val / 1e6).toFixed(2)  + 'M';
        return Number(val).toLocaleString();
    };

    const hasUnavailableFundamentals = results.length > 0 && results.some(r => r.pe === null || r.pe === undefined);

    return (
        <div className="page-content">
            {/* Header */}
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={20} style={{ color: 'var(--accent)' }} /> Stock Screener
                    </h1>
                    <p className="page-subtitle">Filter major US equities by fundamentals</p>
                </div>
            </div>

            {hasUnavailableFundamentals && (
                <div className="panel" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Upstream Status:</strong> Quote fundamentals (P/E and Dividend Yield) marked <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>N/A</span> are temporarily restricted by upstream provider crumb authentication. Price, Change %, and Market Cap remain live.
                    </div>
                </div>
            )}

            <div className="screeners-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                {/* Filter sidebar */}
                <div className="panel screeners-filter-panel" style={{ width: '100%', boxSizing: 'border-box' }}>
                    <div className="panel-header" style={{ paddingBottom: '0.75rem' }}>
                        <div className="panel-title"><Filter size={13} /> Filters</div>
                        <button className="btn btn-ghost btn-sm" onClick={handleReset} title="Reset all filters" style={{ gap: '0.25rem', padding: '0.25rem 0.5rem' }}>
                            <X size={12} /> Reset
                        </button>
                    </div>

                    <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <FilterRow label="Price ($)" minKey="min_price" maxKey="max_price" step="0.01" filters={filters} onFilterChange={handleFilterChange} />
                        <FilterRow label="P/E Ratio" minKey="min_pe" maxKey="max_pe" step="0.1" filters={filters} onFilterChange={handleFilterChange} />
                        <FilterRow label="Market Cap ($)" minKey="min_market_cap" maxKey="max_market_cap" filters={filters} onFilterChange={handleFilterChange} />
                        <FilterRow label="Div. Yield (%)" minKey="min_yield" maxKey="max_yield" step="0.1" filters={filters} onFilterChange={handleFilterChange} />
                        <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '0.5rem', gap: '0.375rem' }}>
                            {loading ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Applying…</> : 'Apply Filters'}
                        </button>
                    </form>
                </div>

                {/* Results */}
                <div className="panel" style={{ padding: 0, overflow: 'hidden', minWidth: 0, width: '100%' }}>
                    <div className="panel-header" style={{ padding: '0.875rem 1.25rem' }}>
                        <div className="panel-title">
                            {loading ? 'Screening…' : `${results.length} result${results.length !== 1 ? 's' : ''}`}
                        </div>
                        {loading && <RefreshCw size={14} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />}
                    </div>

                    {error && <div className="error-banner" style={{ margin: '1rem' }}>{error}</div>}

                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxHeight: '600px', overflowY: 'auto', width: '100%' }}>
                        <table className="terminal-table" style={{ width: '100%', minWidth: '600px', tableLayout: 'fixed' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '26%' }}>Ticker</th>
                                    <th className="numeric" style={{ width: '15%' }}>Price</th>
                                    <th className="numeric" style={{ width: '14%' }}>Change</th>
                                    <th className="numeric" style={{ width: '17%' }}>Mkt Cap</th>
                                    <th className="numeric" style={{ width: '14%' }}>P/E</th>
                                    <th className="numeric" style={{ width: '14%' }}>Div Yield</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            No stocks match your criteria.
                                        </td>
                                    </tr>
                                )}
                                {results.map(item => (
                                    <tr
                                        key={item.ticker}
                                        className="history-row"
                                        onClick={() => navigate(`/markets?ticker=${item.ticker}`)}
                                    >
                                        <td>
                                            <div style={{ fontWeight: 700, fontFamily: 'var(--mono)', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.ticker}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.company}</div>
                                        </td>
                                        <td className="numeric">{formatCurrency(item.price)}</td>
                                        <td className="numeric" style={{ color: (item.day_change_pct || 0) >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                                            {(item.day_change_pct || 0) > 0 ? '+' : ''}{formatPct(item.day_change_pct)}
                                        </td>
                                        <td className="numeric">{formatNumber(item.market_cap)}</td>
                                        <td className="numeric">{formatPe(item.pe)}</td>
                                        <td className="numeric">{formatPct(item.dividend_yield)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
