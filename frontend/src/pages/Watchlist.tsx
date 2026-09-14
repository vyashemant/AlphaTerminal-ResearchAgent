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
            const addedItem = await ApiClient.addWatchlistItem({
                ticker: newTicker.trim(),
                company_name: newCompany.trim() || undefined
            });
            
            // Optimistic update or refetch
            setWatchlist(prev => [addedItem, ...prev]);
            
            // Clear form
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
        if (!confirm('Are you sure you want to remove this stock from your watchlist?')) return;
        
        try {
            await ApiClient.removeWatchlistItem(itemId);
            setWatchlist(prev => prev.filter(item => item.id !== itemId));
        } catch (err: any) {
            setError(err.message || 'Failed to remove stock');
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            <div className="terminal-header" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div className="panel-title" style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Eye size={20} />
                        PERSONAL WATCHLIST
                    </div>
                    {!loading && !error && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--mono)' }}>
                            Tracking {watchlist.length} {watchlist.length === 1 ? 'stock' : 'stocks'}
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="panel" style={{ color: 'var(--danger)', borderLeft: '2px solid var(--danger)', padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.875rem' }}>ERROR: {error}</div>
                </div>
            )}

            <div className="panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>ADD STOCK TO WATCHLIST</div>
                <form onSubmit={handleAddStock} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <input
                            type="text"
                            placeholder="Ticker (e.g. AAPL)"
                            value={newTicker}
                            onChange={(e) => setNewTicker(e.target.value)}
                            required
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                fontFamily: 'var(--mono)',
                                width: '200px',
                                textTransform: 'uppercase'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <input
                            type="text"
                            placeholder="Company Name (Optional)"
                            value={newCompany}
                            onChange={(e) => setNewCompany(e.target.value)}
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                width: '300px'
                            }}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isAdding || !newTicker.trim()}
                        style={{
                            background: 'var(--accent-light)',
                            color: 'var(--bg-primary)',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: (isAdding || !newTicker.trim()) ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: (isAdding || !newTicker.trim()) ? 0.5 : 1
                        }}
                    >
                        {isAdding ? 'ADDING...' : <><Plus size={16} /> ADD</>}
                    </button>
                </form>
            </div>

            {loading ? (
                <div className="panel" style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.875rem' }}>Loading watchlist...</div>
                </div>
            ) : watchlist.length === 0 ? (
                <div className="panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Your watchlist is empty.</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Use the form above to track your first stock.</div>
                </div>
            ) : (
                <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
                    <table className="terminal-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '15%', textAlign: 'left' }}>Ticker</th>
                                <th style={{ width: '40%', textAlign: 'left' }}>Company</th>
                                <th style={{ width: '25%', textAlign: 'left' }}>Added On</th>
                                <th style={{ width: '20%', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {watchlist.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <td style={{ textAlign: 'left' }}>
                                        <span className="badge badge-neutral" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{item.ticker}</span>
                                    </td>
                                    <td style={{ fontWeight: 600, textAlign: 'left', color: 'var(--text-primary)' }}>
                                        {item.company_name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400 }}>Unknown</span>}
                                    </td>
                                    <td style={{ fontSize: '0.875rem', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                        {formatDate(item.created_at)}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => navigate(`/research?ticker=${encodeURIComponent(item.ticker)}&company=${encodeURIComponent(item.company_name || '')}`)}
                                                style={{ 
                                                    background: 'transparent',
                                                    border: '1px solid var(--accent-light)',
                                                    color: 'var(--accent-light)',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    fontSize: '0.75rem'
                                                }}
                                                aria-label={`Research ${item.ticker}`}
                                            >
                                                <Terminal size={12} />
                                                RESEARCH
                                            </button>
                                            <button 
                                                onClick={() => handleRemoveStock(item.id)}
                                                style={{ 
                                                    background: 'transparent',
                                                    border: '1px solid var(--danger)',
                                                    color: 'var(--danger)',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    fontSize: '0.75rem'
                                                }}
                                                aria-label={`Remove ${item.ticker}`}
                                            >
                                                <Trash2 size={12} />
                                                REMOVE
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
