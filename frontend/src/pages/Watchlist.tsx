import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, Trash2, AlertCircle, Terminal } from 'lucide-react';
import { ApiClient } from '../api/client';
import type { WatchlistItem } from '../types/api';
import { formatDate } from '../utils/formatters';

export function Watchlist() {
    const navigate = useNavigate();
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newTicker, setNewTicker] = useState('');
    const [newCompany, setNewCompany] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const fetchWatchlist = async () => {
        try {
            setLoading(true);
            const response = await ApiClient.getWatchlist();
            setWatchlist(response.watchlist);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch watchlist');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWatchlist();
    }, []);

    const handleAddStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTicker.trim()) return;
        try {
            setIsAdding(true);
            const added = await ApiClient.addWatchlistItem({
                ticker: newTicker.trim().toUpperCase(),
                company_name: newCompany.trim() || undefined,
            });
            setWatchlist(prev => [added, ...prev]);
            setNewTicker('');
            setNewCompany('');
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to add stock');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveStock = async (itemId: string) => {
        if (!confirm('Remove this stock from your watchlist?')) return;
        try {
            await ApiClient.removeWatchlistItem(itemId);
            setWatchlist(prev => prev.filter(item => item.id !== itemId));
        } catch (err: any) {
            setError(err.message || 'Failed to remove stock');
        }
    };

    return (
        <div className="page-content">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Eye size={20} style={{ color: 'var(--accent)' }} /> Watchlist
                    </h1>
                    {!loading && !error && (
                        <p className="page-subtitle">Tracking {watchlist.length} {watchlist.length === 1 ? 'stock' : 'stocks'}</p>
                    )}
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="error-banner">
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{error}</span>
                </div>
            )}

            {/* Add stock form */}
            <div className="panel" style={{ marginBottom: '1.5rem' }}>
                <div className="panel-header">
                    <div className="panel-title"><Plus size={13} /> Add Stock to Watchlist</div>
                </div>
                <form onSubmit={handleAddStock} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ minWidth: 160 }}>
                        <label htmlFor="wl-ticker" className="form-label">Ticker Symbol</label>
                        <input
                            id="wl-ticker"
                            type="text"
                            placeholder="e.g. AAPL"
                            value={newTicker}
                            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                            required
                            className="form-input"
                            style={{ fontFamily: 'var(--mono)', fontWeight: 600, letterSpacing: '0.04em' }}
                        />
                    </div>
                    <div className="form-group" style={{ minWidth: 260, flex: 1 }}>
                        <label htmlFor="wl-company" className="form-label">Company Name <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                        <input
                            id="wl-company"
                            type="text"
                            placeholder="e.g. Apple Inc."
                            value={newCompany}
                            onChange={(e) => setNewCompany(e.target.value)}
                            className="form-input"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isAdding || !newTicker.trim()}
                        className="btn btn-primary"
                        style={{ gap: '0.375rem', alignSelf: 'flex-end', marginBottom: '0' }}
                    >
                        <Plus size={15} /> {isAdding ? 'Adding…' : 'Add Stock'}
                    </button>
                </form>
            </div>

            {/* Watchlist table */}
            {loading ? (
                <div className="loading-state">
                    <Eye size={18} style={{ color: 'var(--accent)' }} />
                    Loading watchlist…
                </div>
            ) : watchlist.length === 0 ? (
                <div className="panel">
                    <div className="empty-state">
                        <div className="empty-state-icon"><Eye size={24} /></div>
                        <div className="empty-state-title">Your Watchlist is Empty</div>
                        <p className="empty-state-desc">Use the form above to add your first stock to track.</p>
                    </div>
                </div>
            ) : (
                <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                        <table className="terminal-table" style={{ width: '100%', minWidth: '540px' }}>
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Company</th>
                                <th>Added On</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {watchlist.map((item) => (
                                <tr key={item.id} className="history-row">
                                    <td>
                                        <span className="badge badge-accent" style={{ fontSize: '0.8125rem', letterSpacing: '0.04em' }}>
                                            {item.ticker}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                        {item.company_name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400 }}>—</span>}
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                                        {formatDate(item.created_at)}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={() => navigate(`/research?ticker=${encodeURIComponent(item.ticker)}&company=${encodeURIComponent(item.company_name || '')}`)}
                                                aria-label={`Research ${item.ticker}`}
                                                style={{ gap: '0.25rem' }}
                                            >
                                                <Terminal size={12} /> Research
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleRemoveStock(item.id)}
                                                aria-label={`Remove ${item.ticker}`}
                                                style={{ gap: '0.25rem' }}
                                            >
                                                <Trash2 size={12} /> Remove
                                            </button>
                                        </div>
                                    </td>
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
