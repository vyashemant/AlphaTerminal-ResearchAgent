import { useState } from 'react';
import { Search, Sun, Moon, LogOut, User, Plus, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface TopNavProps {
    onToggleMobileSidebar?: () => void;
}

export function TopNav({ onToggleMobileSidebar }: TopNavProps) {
    const { user, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/markets?ticker=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <header className="top-bar" style={{ position: 'relative' }}>
            <div className="top-bar-left">
                <button
                    type="button"
                    className="action-btn mobile-menu-toggle"
                    onClick={onToggleMobileSidebar}
                    aria-label="Toggle navigation menu"
                    title="Open menu"
                >
                    <Menu size={18} />
                </button>

                {/* Search */}
                <form onSubmit={handleSearch} role="search" className="search-container">
                    <button type="submit" aria-label="Search ticker" style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer', display: 'flex', lineHeight: 0 }}>
                        <Search size={14} />
                    </button>
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search ticker..."
                        aria-label="Search tickers"
                    />
                </form>
            </div>

            {/* Centre nav tabs */}
            <nav className="top-nav" aria-label="Main navigation">
                <Link to="/markets"   className={`top-nav-item ${isActive('/markets')   ? 'active' : ''}`}>Markets</Link>
                <Link to="/screeners" className={`top-nav-item ${isActive('/screeners') ? 'active' : ''}`}>Screeners</Link>
                <Link to="/portfolio" className={`top-nav-item ${isActive('/portfolio') ? 'active' : ''}`}>Portfolio</Link>
            </nav>

            {/* Right actions */}
            <div className="top-actions">
                {/* New Research CTA */}
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/research')} style={{ gap: '0.375rem' }}>
                    <Plus size={13} />
                    Research
                </button>

                {/* Theme toggle */}
                <button
                    className="action-btn"
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                {/* User menu */}
                {user && (
                    <div style={{ position: 'relative' }}>
                        <button
                            className="action-btn"
                            onClick={() => setShowUserMenu(v => !v)}
                            aria-label="User menu"
                            aria-expanded={showUserMenu}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                        >
                            <div style={{
                                width: 26, height: 26, borderRadius: '50%',
                                background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--accent)', flexShrink: 0
                            }}>
                                <User size={13} />
                            </div>
                        </button>

                        {showUserMenu && (
                            <>
                                {/* Dismiss backdrop */}
                                <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowUserMenu(false)} />
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                    background: 'var(--surface)', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)', zIndex: 50, minWidth: '200px',
                                    boxShadow: 'var(--shadow-md)', overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>Signed in as</div>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {user.email}
                                        </div>
                                    </div>
                                    <div style={{ padding: '0.5rem' }}>
                                        <button
                                            onClick={() => { signOut(); setShowUserMenu(false); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.625rem',
                                                width: '100%', padding: '0.5rem 0.75rem',
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 500,
                                                borderRadius: 'var(--radius-sm)', textAlign: 'left',
                                                transition: 'background-color 0.15s'
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--danger-bg)')}
                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            <LogOut size={14} />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
