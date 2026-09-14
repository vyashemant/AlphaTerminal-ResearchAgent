import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, RefreshCw, Plus } from 'lucide-react';
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

    useEffect(() => {
        const fetchMovers = async () => {
            if (tickerQuery) return; // Don't fetch movers if searching for a specific quote
            try {
                setLoading(true);
                const data = await ApiClient.getMarketMovers();
                setMovers(data);
            } catch (err: any) {
                console.error("Failed to fetch movers", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchQuote = async () => {
            if (!tickerQuery) {
                setQuote(null);
                return;
            }
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

        if (tickerQuery) {
            fetchQuote();
        } else {
            fetchMovers();
        }
    }, [tickerQuery]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const t = formData.get('ticker') as string;
        if (t) navigate(`/markets?ticker=${encodeURIComponent(t)}`);
    };

    const formatCurrency = (val: any) => {
        if (val === null || val === undefined) return '-';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val));
    };

    const formatNumber = (val: any) => {
        if (val === null || val === undefined) return '-';
        if (val >= 1e12) return (val / 1e12).toFixed(2) + 'T';
        if (val >= 1e9) return (val / 1e9).toFixed(2) + 'B';
        if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M';
        return Number(val).toLocaleString();
    };

    return (
        <div className="research-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Markets</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Overview and Stock Quotes</p>
                </div>
                
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
                    <div className="search-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', background: 'var(--bg-panel)', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        <Search size={16} />
                        <input 
                            type="text" 
                            name="ticker"
                            defaultValue={tickerQuery || ''}
                            placeholder="Enter ticker (e.g. AAPL)" 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '200px' }}
                        />
                    </div>
                    <button type="submit" className="trade-btn">Quote</button>
                </form>
            </div>

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <RefreshCw className="spinner" size={24} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            )}

            {error && (
                <div className="badge badge-danger" style={{ padding: '1rem', marginBottom: '2rem' }}>
                    {error}
                </div>
            )}

            {!loading && !error && tickerQuery && quote && (
                <div className="panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{quote.company} ({quote.ticker})</h2>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginTop: '0.5rem' }}>
                                <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {formatCurrency(quote.market_data?.current_price)}
                                </span>
                                {quote.market_data?.current_price && quote.market_data?.previous_close && (
                                    (() => {
                                        const diff = quote.market_data.current_price - quote.market_data.previous_close;
                                        const pct = (diff / quote.market_data.previous_close) * 100;
                                        const isPos = diff >= 0;
                                        return (
                                            <span style={{ color: isPos ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                {isPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                {isPos ? '+' : ''}{diff.toFixed(2)} ({pct.toFixed(2)}%)
                                            </span>
                                        );
                                    })()
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="action-btn" onClick={() => navigate('/portfolio')} title="Add to Portfolio"><Plus size={18} /></button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="stat-card" style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Day Range</div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginTop: '0.25rem' }}>
                                {formatCurrency(quote.market_data?.day_low)} - {formatCurrency(quote.market_data?.day_high)}
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>52W Range</div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginTop: '0.25rem' }}>
                                {formatCurrency(quote.market_data?.['52_week_low'])} - {formatCurrency(quote.market_data?.['52_week_high'])}
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Volume</div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginTop: '0.25rem' }}>
                                {formatNumber(quote.market_data?.volume)}
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Market Cap</div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginTop: '0.25rem' }}>
                                {formatNumber(quote.market_data?.market_cap)}
                            </div>
                        </div>
                    </div>

                    {quote.recent_history && quote.recent_history.length > 0 && (
                        <div style={{ height: '300px', width: '100%', marginTop: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>1-Month History</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={quote.recent_history}>
                                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickFormatter={(str) => str.substring(5)} />
                                    <YAxis domain={['auto', 'auto']} stroke="var(--text-secondary)" fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '4px' }}
                                        itemStyle={{ color: 'var(--accent-light)' }}
                                    />
                                    <Line type="monotone" dataKey="close" stroke="var(--accent)" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {!loading && !tickerQuery && movers && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className="panel">
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={20} /> Top Gainers
                        </h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.75rem', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem' }}>Ticker</th>
                                    <th style={{ padding: '0.75rem' }}>Price</th>
                                    <th style={{ padding: '0.75rem' }}>Change</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movers.gainers.map((m: any) => (
                                    <tr key={m.ticker} style={{ borderBottom: '1px solid var(--border)' }} onClick={() => navigate(`/markets?ticker=${m.ticker}`)}>
                                        <td style={{ padding: '0.75rem', cursor: 'pointer' }}><span style={{ color: 'var(--accent-light)', fontWeight: 500 }}>{m.ticker}</span><br/><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.company}</span></td>
                                        <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>${m.price?.toFixed(2)}</td>
                                        <td style={{ padding: '0.75rem', color: 'var(--success)' }}>+{m.day_change_pct?.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="panel">
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingDown size={20} /> Top Losers
                        </h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.75rem', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem' }}>Ticker</th>
                                    <th style={{ padding: '0.75rem' }}>Price</th>
                                    <th style={{ padding: '0.75rem' }}>Change</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movers.losers.map((m: any) => (
                                    <tr key={m.ticker} style={{ borderBottom: '1px solid var(--border)' }} onClick={() => navigate(`/markets?ticker=${m.ticker}`)}>
                                        <td style={{ padding: '0.75rem', cursor: 'pointer' }}><span style={{ color: 'var(--accent-light)', fontWeight: 500 }}>{m.ticker}</span><br/><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.company}</span></td>
                                        <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>${m.price?.toFixed(2)}</td>
                                        <td style={{ padding: '0.75rem', color: 'var(--danger)' }}>{m.day_change_pct?.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
