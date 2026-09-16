import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, RefreshCw, Plus, Activity } from 'lucide-react';
import { ApiClient } from '../api/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { MarketMoversResponse } from '../types/api';

export const Markets: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tickerQuery = searchParams.get('ticker');

    const [movers, setMovers] = useState<MarketMoversResponse | null>(null);
    const [quote, setQuote] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [moversError, setMoversError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMovers = async () => {
            if (tickerQuery) return;
            try {
                setLoading(true);
                setMoversError(null);
                const data = await ApiClient.getMarketMovers();
                setMovers(data);
            } catch (err: any) {
                setMoversError(err.message || 'Failed to load market movers');
            } finally {
                setLoading(false);
            }
        };

        const fetchQuote = async () => {
            if (!tickerQuery) { setQuote(null); return; }
            try {
                setLoading(true);
                setError(null);
                const data = await ApiClient.getMarketQuote(tickerQuery);
                setQuote(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch quote');
            } finally {
                setLoading(false);
            }
        };

        if (tickerQuery) fetchQuote();
        else fetchMovers();
    }, [tickerQuery]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const t = formData.get('ticker') as string;
        if (t.trim()) navigate(`/markets?ticker=${encodeURIComponent(t.trim())}`);
    };

    const formatCurrency = (val: any) => {
        if (val === null || val === undefined) return '—';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val));
    };

    const formatNumber = (val: any) => {
        if (val === null || val === undefined) return '—';
        if (val >= 1e12) return (val / 1e12).toFixed(2) + 'T';
        if (val >= 1e9) return (val / 1e9).toFixed(2) + 'B';
        if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M';
        return Number(val).toLocaleString();
    };

    return (
        <div className="page-content">
            {/* Header */}
            <div className="page-header" style={{ flexWrap: 'wrap' }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} style={{ color: 'var(--accent)' }} />
                        {tickerQuery ? `Quote · ${tickerQuery}` : 'Markets'}
                    </h1>
                    <p className="page-subtitle">{tickerQuery ? 'Real-time quote data' : 'Market movers overview'}</p>
                </div>

                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            name="ticker"
                            defaultValue={tickerQuery || ''}
                            placeholder="Enter ticker (e.g. AAPL)"
                            className="form-input"
                            style={{ paddingLeft: '2.25rem', width: '220px', fontFamily: 'var(--mono)', fontWeight: 500, letterSpacing: '0.02em' }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm">Get Quote</button>
                    {tickerQuery && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/markets')}>
                            ← Back to Markets
                        </button>
                    )}
                </form>
            </div>

            {/* Loading */}
            {loading && (
                <div className="loading-state">
                    <RefreshCw size={18} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                    Loading market data…
                </div>
            )}

            {/* Error */}
            {error && <div className="error-banner">{error}</div>}

            {/* Quote view */}
            {!loading && !error && tickerQuery && quote && (
                <div className="panel">
                    {/* Quote header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                                    {quote.company}
                                </h2>
                                <span className="badge badge-neutral" style={{ fontSize: '0.875rem', letterSpacing: '0.04em' }}>{quote.ticker}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                                <span style={{ fontSize: '2.25rem', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                                    {formatCurrency(quote.market_data?.current_price)}
                                </span>
                                {quote.market_data?.current_price && quote.market_data?.previous_close && (() => {
                                    const diff = quote.market_data.current_price - quote.market_data.previous_close;
                                    const pct = (diff / quote.market_data.previous_close) * 100;
                                    const isPos = diff >= 0;
                                    return (
                                        <span style={{ fontSize: '1.125rem', fontWeight: 600, color: isPos ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            {isPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                            {isPos ? '+' : ''}{diff.toFixed(2)} ({pct.toFixed(2)}%)
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate('/portfolio')} style={{ gap: '0.375rem' }}>
                            <Plus size={13} /> Add to Portfolio
                        </button>
                    </div>

                    {/* Stats grid */}
                    <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: '1.5rem' }}>
                        {[
                            { label: 'Day Range', value: `${formatCurrency(quote.market_data?.day_low)} — ${formatCurrency(quote.market_data?.day_high)}` },
                            { label: '52W Range', value: `${formatCurrency(quote.market_data?.['52_week_low'])} — ${formatCurrency(quote.market_data?.['52_week_high'])}` },
                            { label: 'Volume', value: formatNumber(quote.market_data?.volume) },
                            { label: 'Market Cap', value: formatNumber(quote.market_data?.market_cap) },
                            { label: 'Avg Volume', value: formatNumber(quote.market_data?.average_volume) },
                            { label: 'Beta', value: quote.market_data?.beta?.toFixed(2) ?? '—' },
                        ].map(stat => (
                            <div key={stat.label} className="stat-card">
                                <div className="stat-label">{stat.label}</div>
                                <div style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--text-primary)', marginTop: '0.375rem' }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Price chart */}
                    {quote.recent_history && quote.recent_history.length > 0 && (
                        <div>
                            <div className="panel-title" style={{ marginBottom: '1rem' }}>1-Month Price History</div>
                            <div style={{ height: '260px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={quote.recent_history}>
                                        <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickFormatter={(s: string) => s.substring(5)} />
                                        <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={11} tickFormatter={(v: number) => `$${v}`} />
                                        <Tooltip
                                            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}
                                            itemStyle={{ color: 'var(--accent)' }}
                                            labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600 }}
                                        />
                                        <Line type="monotone" dataKey="close" stroke="var(--accent)" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Movers error */}
            {!loading && !tickerQuery && moversError && (
                <div className="error-banner">{moversError}</div>
            )}

            {/* Market movers */}
            {!loading && !tickerQuery && movers && !moversError && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                    {/* Gainers */}
                    <div className="panel" style={{ padding: 0 }}>
                        <div className="panel-header" style={{ padding: '1rem 1.25rem' }}>
                            <div className="panel-title" style={{ color: 'var(--success)' }}>
                                <TrendingUp size={14} /> Top Gainers
                            </div>
                        </div>
                        <table className="terminal-table">
                            <thead>
                                <tr>
                                    <th>Ticker</th>
                                    <th className="numeric">Price</th>
                                    <th className="numeric">Change</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movers.gainers.map((m) => (
                                    <tr key={m.ticker} className="history-row" onClick={() => navigate(`/markets?ticker=${m.ticker}`)}>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: '0.875rem' }}>{m.ticker}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.company}</div>
                                        </td>
                                        <td className="numeric">${m.price?.toFixed(2)}</td>
                                        <td className="numeric" style={{ color: 'var(--success)', fontWeight: 600 }}>+{m.day_change_pct?.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Losers */}
                    <div className="panel" style={{ padding: 0 }}>
                        <div className="panel-header" style={{ padding: '1rem 1.25rem' }}>
                            <div className="panel-title" style={{ color: 'var(--danger)' }}>
                                <TrendingDown size={14} /> Top Losers
                            </div>
                        </div>
                        <table className="terminal-table">
                            <thead>
                                <tr>
                                    <th>Ticker</th>
                                    <th className="numeric">Price</th>
                                    <th className="numeric">Change</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movers.losers.map((m) => (
                                    <tr key={m.ticker} className="history-row" onClick={() => navigate(`/markets?ticker=${m.ticker}`)}>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: '0.875rem' }}>{m.ticker}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.company}</div>
                                        </td>
                                        <td className="numeric">${m.price?.toFixed(2)}</td>
                                        <td className="numeric" style={{ color: 'var(--danger)', fontWeight: 600 }}>{m.day_change_pct?.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
