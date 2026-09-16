import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Activity, Clock, CheckCircle, AlertCircle, Eye, ArrowRight } from 'lucide-react';
import { ApiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { ResearchHistoryItem } from '../types/api';
import { formatDate } from '../utils/formatters';

export function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
    const [watchlistCount, setWatchlistCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const historyResponse = await ApiClient.getResearchHistory(100);
            setHistory(historyResponse.research);

            const watchlistResponse = await ApiClient.getWatchlist();
            setWatchlistCount(watchlistResponse.watchlist.length);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const completedCount = history.filter(h => h.status === 'completed').length;
    const failedCount    = history.filter(h => h.status === 'failed').length;
    const runningCount   = history.filter(h => h.status === 'running' || h.status === 'queued').length;
    const totalCount     = history.length;
    const recentJobs     = history.slice(0, 5);

    const emailName = user?.email?.split('@')[0] ?? 'Researcher';

    return (
        <div className="page-content">
            {/* Page header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Good day, {emailName}.</h1>
                    <p className="page-subtitle">Your AI-powered investment research workspace.</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={() => navigate('/research')}>
                        <Plus size={15} /> New Research
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <Activity size={18} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                    Loading workspace…
                </div>
            ) : error ? (
                <div className="error-banner">
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Unable to load dashboard</div>
                        <div style={{ fontSize: '0.8125rem', opacity: 0.85 }}>{error}</div>
                        <button className="btn btn-outline btn-sm" onClick={fetchDashboardData} style={{ marginTop: '0.75rem' }}>
                            Retry
                        </button>
                    </div>
                </div>
            ) : history.length === 0 ? (
                /* Empty state */
                <div className="panel">
                    <div className="empty-state">
                        <div className="empty-state-icon"><Activity size={24} /></div>
                        <div className="empty-state-title">No Research Yet</div>
                        <p className="empty-state-desc">
                            Start your first AI-driven company research to generate insights and populate your workspace.
                        </p>
                        <button className="btn btn-primary" onClick={() => navigate('/research')}>
                            <Plus size={15} /> Start Your First Research
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Main: Recent Research */}
                    <div className="panel" style={{ flex: '1 1 580px', padding: 0 }}>
                        <div className="panel-header" style={{ padding: '1rem 1.25rem' }}>
                            <div className="panel-title"><Clock size={14} /> Recent Research</div>
                            {history.length > 5 && (
                                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
                                    View all <ArrowRight size={12} />
                                </button>
                            )}
                        </div>
                        <table className="terminal-table">
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Ticker</th>
                                    <th>Date</th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentJobs.map((item) => (
                                    <tr key={item.job_id} className="history-row" onClick={() => navigate(`/research/${item.job_id}`)}>
                                        <td style={{ fontWeight: 600 }}>{item.company}</td>
                                        <td><span className="badge badge-neutral">{item.ticker}</span></td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{formatDate(item.created_at)}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`badge ${
                                                item.status === 'completed' ? 'badge-success' :
                                                item.status === 'failed'    ? 'badge-danger'  : 'badge-warning'
                                            }`}>
                                                {item.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/research/${item.job_id}`); }}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Sidebar: Stats + Watchlist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: '1 1 260px', minWidth: 220 }}>
                        {/* Stats */}
                        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                            <div className="stat-card">
                                <div className="stat-label"><Activity size={12} /> Total Jobs</div>
                                <div className="stat-value">{totalCount}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label" style={{ color: 'var(--success)' }}><CheckCircle size={12} /> Completed</div>
                                <div className="stat-value positive">{completedCount}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label" style={{ color: 'var(--warning)' }}><Activity size={12} /> Running</div>
                                <div className="stat-value" style={{ color: 'var(--warning)' }}>{runningCount}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label" style={{ color: 'var(--danger)' }}><AlertCircle size={12} /> Failed</div>
                                <div className="stat-value negative">{failedCount}</div>
                            </div>
                        </div>

                        {/* Watchlist summary */}
                        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="panel-header" style={{ marginBottom: 0, paddingBottom: '0.75rem' }}>
                                <div className="panel-title"><Eye size={14} /> Watchlist</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Tracking</span>
                                <span style={{ fontFamily: 'var(--mono)', fontSize: '1.5rem', fontWeight: 700 }}>{watchlistCount}</span>
                            </div>
                            <button className="btn btn-outline btn-full btn-sm" onClick={() => navigate('/watchlist')}>
                                View Watchlist <ArrowRight size={13} />
                            </button>
                        </div>

                        {/* Quick actions */}
                        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            <div className="panel-title" style={{ marginBottom: '0.5rem' }}>Quick Actions</div>
                            <button className="btn btn-outline btn-full btn-sm" style={{ justifyContent: 'flex-start', gap: '0.5rem' }} onClick={() => navigate('/markets')}>
                                <Activity size={13} /> Markets
                            </button>
                            <button className="btn btn-outline btn-full btn-sm" style={{ justifyContent: 'flex-start', gap: '0.5rem' }} onClick={() => navigate('/screeners')}>
                                View Screeners
                            </button>
                            <button className="btn btn-outline btn-full btn-sm" style={{ justifyContent: 'flex-start', gap: '0.5rem' }} onClick={() => navigate('/portfolio')}>
                                Paper Portfolio
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
