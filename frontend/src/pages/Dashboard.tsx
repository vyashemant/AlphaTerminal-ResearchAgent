import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Activity, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';
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

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Request up to 100 items for accurate statistics
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

        fetchDashboardData();
    }, []);

    const completedCount = history.filter(h => h.status === 'completed').length;
    const failedCount = history.filter(h => h.status === 'failed').length;
    const runningCount = history.filter(h => h.status === 'running' || h.status === 'queued').length;
    const totalCount = history.length;
    
    // Get top 5 most recent
    const recentJobs = history.slice(0, 5);

    return (
        <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            {/* Header */}
            <div className="terminal-header" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                        Welcome back, {user?.email}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Your AI-powered investment research workspace.
                    </p>
                </div>
                <button 
                    className="action-btn"
                    onClick={() => navigate('/research')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'var(--accent)',
                        color: 'black',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={16} />
                    New Research
                </button>
            </div>

            {/* Content area */}
            {loading ? (
                <div className="panel" style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.875rem' }}>Loading dashboard data...</div>
                </div>
            ) : error ? (
                <div className="panel" style={{ color: 'var(--danger)', borderLeft: '2px solid var(--danger)', padding: '1rem' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.875rem' }}>ERROR: {error}</div>
                </div>
            ) : history.length === 0 ? (
                <div className="panel" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        No Research Yet
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px' }}>
                        Start your first AI-driven company research to generate insights and populate your workspace.
                    </div>
                    <button 
                        className="action-btn"
                        onClick={() => navigate('/research')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--accent)',
                            color: 'black',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={16} />
                        Start Your First Research
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
                    
                    {/* Recent Research List */}
                    <div className="panel" style={{ padding: '1.5rem', flex: '1 1 600px' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={18} />
                            Recent Research
                        </div>
                        <table className="terminal-table history-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '25%', textAlign: 'left' }}>Date</th>
                                    <th style={{ width: '25%', textAlign: 'left' }}>Company</th>
                                    <th style={{ width: '15%', textAlign: 'left' }}>Ticker</th>
                                    <th style={{ width: '15%', textAlign: 'center' }}>Status</th>
                                    <th style={{ width: '20%', textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentJobs.map((item) => (
                                    <tr key={item.job_id} className="history-row" style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ fontSize: '0.875rem', textAlign: 'left' }}>{formatDate(item.created_at)}</td>
                                        <td style={{ fontWeight: 600, textAlign: 'left', color: 'var(--text-primary)' }}>{item.company}</td>
                                        <td style={{ textAlign: 'left' }}>
                                            <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>{item.ticker}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`badge ${item.status === 'completed' ? 'badge-success' : item.status === 'failed' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.625rem' }}>
                                                {item.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button 
                                                className="action-btn" 
                                                onClick={() => navigate(`/research/${item.job_id}`)}
                                                style={{ 
                                                    fontSize: '0.75rem', 
                                                    fontWeight: 600, 
                                                    color: 'var(--accent-light)', 
                                                    border: '1px solid var(--border)', 
                                                    padding: '0.25rem 0.75rem', 
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                VIEW
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {history.length > 5 && (
                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                <button 
                                    className="action-btn" 
                                    onClick={() => navigate('/history')}
                                    style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}
                                >
                                    View all history →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Statistics and Watchlist Container */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: '1 1 300px' }}>
                        {/* Statistics */}
                        <div className="panel" style={{ padding: '1.5rem' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Activity size={18} />
                                Research Statistics
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Jobs</span>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 600 }}>{totalCount}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)', fontSize: '0.875rem' }}>
                                        <CheckCircle size={14} /> Completed
                                    </span>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 600 }}>{completedCount}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--warning)', fontSize: '0.875rem' }}>
                                        <Activity size={14} /> Running
                                    </span>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 600 }}>{runningCount}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
                                        <AlertCircle size={14} /> Failed
                                    </span>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 600 }}>{failedCount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Watchlist Summary */}
                        <div className="panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Eye size={18} />
                                Watchlist
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Tracking</span>
                                <span style={{ fontFamily: 'var(--mono)', fontSize: '1.25rem', fontWeight: 600 }}>{watchlistCount} stocks</span>
                            </div>
                            <button 
                                className="action-btn" 
                                onClick={() => navigate('/watchlist')}
                                style={{ 
                                    background: 'var(--bg-secondary)', 
                                    color: 'var(--text-primary)', 
                                    border: '1px solid var(--border)', 
                                    padding: '0.5rem', 
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600
                                }}
                            >
                                View Watchlist
                            </button>
                        </div>
                    </div>
                    
                </div>
            )}
        </div>
    );
}
