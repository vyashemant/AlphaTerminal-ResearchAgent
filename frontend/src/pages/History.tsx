import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Search, Filter, X } from 'lucide-react';
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
                if (response.research.length < limit || limit >= 100) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
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
    const failedCount = history.filter(h => h.status === 'failed').length;
    const runningCount = history.filter(h => h.status === 'running' || h.status === 'queued').length;

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            <div className="terminal-header" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div className="panel-title" style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={20} />
                        RESEARCH HISTORY
                    </div>
                    {!error && history.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', fontFamily: 'var(--mono)' }}>
                            <span>{history.length} total jobs loaded</span>
                            <span style={{ color: 'var(--success)' }}>{completedCount} completed</span>
                            <span style={{ color: 'var(--danger)' }}>{failedCount} failed</span>
                            <span style={{ color: 'var(--warning)' }}>{runningCount} running</span>
                        </div>
                    )}
                </div>
                
                {history.length > 0 && (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                placeholder="Search company or ticker..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-primary)',
                                    padding: '0.5rem 0.5rem 0.5rem 2rem',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    fontFamily: 'var(--mono)',
                                    width: '250px'
                                }}
                            />
                            {searchQuery && (
                                <X 
                                    size={14} 
                                    onClick={() => setSearchQuery('')}
                                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', cursor: 'pointer' }} 
                                />
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-primary)',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    fontFamily: 'var(--mono)',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="all">All Statuses</option>
                                <option value="completed">Completed</option>
                                <option value="running">Running</option>
                                <option value="queued">Queued</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {loading && history.length === 0 ? (
                <div className="panel" style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.875rem' }}>Loading history data...</div>
                </div>
            ) : error ? (
                <div className="panel" style={{ color: 'var(--danger)', borderLeft: '2px solid var(--danger)', padding: '1rem' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.875rem' }}>ERROR: {error}</div>
                </div>
            ) : history.length === 0 ? (
                <div className="panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Your research history is empty.</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Start your first company research to populate this workspace.</div>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No research matches your current filters.</div>
                    <button 
                        onClick={handleClearFilters}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            marginTop: '1rem'
                        }}
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="panel" style={{ padding: 0, overflowX: 'auto', marginBottom: '1rem' }}>
                    <table className="terminal-table history-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '16%', textAlign: 'left' }}>Created</th>
                                <th style={{ width: '18%', textAlign: 'left' }}>Company</th>
                                <th style={{ width: '10%', textAlign: 'left' }}>Ticker</th>
                                <th style={{ width: '12%', textAlign: 'center' }}>Status</th>
                                <th style={{ width: '16%', textAlign: 'left' }}>Completed</th>
                                <th style={{ width: '18%', textAlign: 'left' }}>Job ID</th>
                                <th style={{ width: '10%', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map((item) => (
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
                                    <td style={{ fontSize: '0.875rem', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                        {item.completed_at ? formatDate(item.completed_at) : '-'}
                                    </td>
                                    <td style={{ fontFamily: 'var(--mono)', fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.job_id.slice(0, 12)}...
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
                                                cursor: 'pointer',
                                                background: 'transparent'
                                            }}
                                            aria-label={`View research for ${item.company}`}
                                        >
                                            VIEW →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {hasMore && history.length > 0 && !loading && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button
                        onClick={() => setLimit(prev => Math.min(prev + 20, 100))}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                    >
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
}

