import { useState } from 'react';
import { Bell, HelpCircle, Search, Settings, User, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export function TopNav() {
    const { user, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [searchQuery, setSearchQuery] = useState('');
    
    // Minimal panels for dead buttons
    const [activePanel, setActivePanel] = useState<string | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/markets?ticker=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    const togglePanel = (panelName: string) => {
        setActivePanel(prev => prev === panelName ? null : panelName);
    };

    return (
        <header className="top-bar" style={{ position: 'relative' }}>
            <form onSubmit={handleSearch} role="search" className="search-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '0.375rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <button type="submit" aria-label="Search" style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer', display: 'flex', outline: 'none' }}>
                    <Search size={16} />
                </button>
                <input 
                    type="search" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tickers, companies..." 
                    aria-label="Search query"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem', width: '200px' }}
                />
            </form>

            <nav className="top-nav">
                <Link to="/markets" className={`top-nav-item ${location.pathname.startsWith('/markets') ? 'active' : ''}`} style={{textDecoration: 'none'}}>Markets</Link>
                <Link to="/screeners" className={`top-nav-item ${location.pathname.startsWith('/screeners') ? 'active' : ''}`} style={{textDecoration: 'none'}}>Screeners</Link>
                <Link to="/portfolio" className={`top-nav-item ${location.pathname.startsWith('/portfolio') ? 'active' : ''}`} style={{textDecoration: 'none'}}>Portfolio</Link>
                <Link to="/dashboard" className={`top-nav-item ${(location.pathname === '/dashboard' || location.pathname === '/' || location.pathname.startsWith('/research') || location.pathname.startsWith('/history') || location.pathname.startsWith('/watchlist')) ? 'active' : ''}`} style={{textDecoration: 'none'}}>Analysis</Link>
            </nav>

            <div className="top-actions">
                <button 
                    className="action-btn" 
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button className="trade-btn" onClick={() => navigate('/portfolio')}>Paper Trade</button>
                
                <div style={{ position: 'relative' }}>
                    <button className="action-btn" onClick={() => togglePanel('bell')}><Bell size={18} /></button>
                    {activePanel === 'bell' && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'var(--bg-panel)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border)', zIndex: 10, width: '200px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            No new notifications.
                        </div>
                    )}
                </div>
                
                <div style={{ position: 'relative' }}>
                    <button className="action-btn" onClick={() => togglePanel('settings')}><Settings size={18} /></button>
                    {activePanel === 'settings' && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'var(--bg-panel)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border)', zIndex: 10, width: '250px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            <strong style={{color: 'var(--text-primary)'}}>Settings</strong><br/><br/>
                            Account: {user?.email}<br/>
                            Backend: Supabase
                        </div>
                    )}
                </div>
                
                <div style={{ position: 'relative' }}>
                    <button className="action-btn" onClick={() => togglePanel('help')}><HelpCircle size={18} /></button>
                    {activePanel === 'help' && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'var(--bg-panel)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border)', zIndex: 10, width: '300px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            <strong style={{color: 'var(--text-primary)'}}>Help & About</strong><br/><br/>
                            Alpha Terminal is a paper-trading and research platform.<br/><br/>
                            <em>Disclaimer: All trades are simulated. Not real financial advice.</em>
                        </div>
                    )}
                </div>
                
                <button className="action-btn" title="Profile" style={{ marginLeft: '0.5rem' }} onClick={() => togglePanel('settings')}><User size={18} /></button>
                {user && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user.email}</span>
                        <button className="action-btn" onClick={signOut} title="Sign Out"><LogOut size={18} /></button>
                    </div>
                )}
            </div>
        </header>
    );
}
