import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Search, Filter, X, ArrowRight } from 'lucide-react';
import { ApiClient } from '../api/client';
import type { ResearchHistoryItem } from '../types/api';
import { formatDate } from '../utils/formatters';

export function History() {
    const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [limit, setLimit] = useState(20);
    const [hasMore, setHasMore] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const response = await ApiClient.getResearchHistory(limit);
                setHistory(response.research);
                setHasMore(response.research.length >= limit && limit < 100);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch history');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [limit]);

    const filteredHistory = history.filter(item => {
        const matchesSearch = item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.ticker.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const completedCount = history.filter(h => h.status === 'completed').length;
    const failedCount    = history.filter(h => h.status === 'failed').length;
    const runningCount   = history.filter(h => h.status === 'running' || h.status === 'queued').length;

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
    };

    const hasFilters = searchQuery !== '' || statusFilter !== 'all';

    return (
        <div className="page-content">
            {/* Header */}
            <div className="page-header" style={{ flexWrap: 'wrap' }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={20} style={{ color: 'var(--accent)' }} /> Research History
                    </h1>
                    {!error && history.length > 0 && (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                            <span className="page-subtitle">{history.length} total</span>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--success)' }}>{completedCount} completed</span>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>{failedCount} failed</span>
                            {runningCount > 0 && <span style={{ fontSize: '0.8125rem', color: 'var(--warning)' }}>{runningCount} running</span>}
                        </div>
                    )}
                </div>

                {history.length > 0 && (
                    <div className="page-header-actions" style={{ flexWrap: 'wrap' }}>
                        {/* Search */}
                        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '140px' }}>
                            <Search size={13} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                placeholder="Search company or ticker…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="form-input"
                                style={{ paddingLeft: '2.25rem', paddingRight: searchQuery ? '2.25rem' : '0.875rem', width: '100%', boxSizing: 'border-box' }}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', lineHeight: 0 }}>
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {/* Status filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Filter size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="form-input"
                                style={{ cursor: 'pointer', minWidth: '130px' }}
                            >
                                <option value="all">All Statuses</option>
                                <option value="completed">Completed</option>
                                <option value="running">Running</option>
                                <option value="queued">Queued</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>

                        {hasFilters && (
                            <button className="btn btn-ghost btn-sm" onClick={handleClearFilters}>
                                <X size={12} /> Clear
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            {loading && history.length === 0 ? (
                <div className="loading-state">
                    <Clock size={18} style={{ color: 'var(--accent)' }} />
                    Loading research history…
                </div>
            ) : error ? (
                <div className="error-banner">{error}</div>
            ) : history.length === 0 ? (
                <div className="panel">
                    <div className="empty-state">
                        <div className="empty-state-icon"><Clock size={24} /></div>
                        <div className="empty-state-title">No Research History</div>
                        <p className="empty-state-desc">Start your first company research to populate this workspace.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/research')}>Start Research</button>
                    </div>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="panel">
                    <div className="empty-state">
                        <div className="empty-state-icon"><Search size={22} /></div>
                        <div className="empty-state-title">No Matches</div>
                        <p className="empty-state-desc">No research matches your current filters.</p>
                        <button className="btn btn-outline btn-sm" onClick={handleClearFilters}>Clear Filters</button>
                    </div>
                </div>
            ) : (
                <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                        <table className="terminal-table" style={{ width: '100%', minWidth: '600px' }}>
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Ticker</th>
                                    <th>Created</th>
                                    <th>Completed</th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                    <th style={{ fontFamily: 'var(--mono)' }}>Job ID</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                        <tbody>
                            {filteredHistory.map((item) => (
                                <tr key={item.job_id} className="history-row" onClick={() => navigate(`/research/${item.job_id}`)}>
                                    <td style={{ fontWeight: 600 }}>{item.company}</td>
                                    <td><span className="badge badge-neutral">{item.ticker}</span></td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{formatDate(item.created_at)}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                                        {item.completed_at ? formatDate(item.completed_at) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`badge ${
                                            item.status === 'completed' ? 'badge-success' :
                                            item.status === 'failed'    ? 'badge-danger'  : 'badge-warning'
                                        }`}>
                                            {item.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {item.job_id.slice(0, 12)}…
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/research/${item.job_id}`); }}
                                            aria-label={`View research for ${item.company}`}
                                            style={{ gap: '0.25rem' }}
                                        >
                                            View <ArrowRight size={11} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {hasMore && history.length > 0 && !loading && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button className="btn btn-outline" onClick={() => setLimit(prev => Math.min(prev + 20, 100))}>
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
}
