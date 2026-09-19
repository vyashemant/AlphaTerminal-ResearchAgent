import { Activity, Clock, Compass, Eye, Filter, PieChart, LayoutDashboard, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '../brand/Logo';

interface SidebarProps {
    currentTab: string;
    mobileOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ currentTab, mobileOpen = false, onClose }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (tab: string) => currentTab === tab;
    const isPath = (path: string) => location.pathname.startsWith(path);

    const handleNavigate = (path: string) => {
        navigate(path);
        onClose?.();
    };

    return (
        <>
            {mobileOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={onClose}
                    aria-label="Close navigation drawer"
                />
            )}
            <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Logo variant="full" size={28} />
                    <button
                        className="action-btn sidebar-mobile-close"
                        onClick={onClose}
                        title="Close navigation"
                        aria-label="Close navigation"
                        style={{ display: 'none', padding: '0.25rem', color: 'var(--text-muted)' }}
                    >
                        <X size={18} />
                    </button>
                </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Workspace</div>

                <div
                    className={`nav-item ${isActive('dashboard') ? 'active' : ''}`}
                    onClick={() => handleNavigate('/dashboard')}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/dashboard')}
                >
                    <LayoutDashboard size={16} />
                    <span>Dashboard</span>
                </div>

                <div
                    className={`nav-item ${isActive('new') ? 'active' : ''}`}
                    onClick={() => handleNavigate('/research')}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/research')}
                >
                    <Compass size={16} />
                    <span>New Research</span>
                </div>

                <div
                    className={`nav-item ${isActive('history') ? 'active' : ''}`}
                    onClick={() => handleNavigate('/history')}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/history')}
                >
                    <Clock size={16} />
                    <span>History</span>
                </div>

                <div
                    className={`nav-item ${isActive('watchlist') ? 'active' : ''}`}
                    onClick={() => handleNavigate('/watchlist')}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/watchlist')}
                >
                    <Eye size={16} />
                    <span>Watchlist</span>
                </div>

                <div className="sidebar-divider" />

                <div className="sidebar-section-label">Markets</div>

                <div
                    className={`nav-item ${isPath('/markets') ? 'active' : ''}`}
                    onClick={() => handleNavigate('/markets')}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/markets')}
                >
                    <Activity size={16} />
                    <span>Markets</span>
                </div>

                <div
                    className={`nav-item ${isPath('/screeners') ? 'active' : ''}`}
                    onClick={() => handleNavigate('/screeners')}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/screeners')}
                >
                    <Filter size={16} />
                    <span>Screeners</span>
                </div>

                <div className="sidebar-divider" />

                <div className="sidebar-section-label">Portfolio</div>

                <div
                    className={`nav-item ${isPath('/portfolio') ? 'active' : ''}`}
                    onClick={() => handleNavigate('/portfolio')}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/portfolio')}
                >
                    <PieChart size={16} />
                    <span>Paper Portfolio</span>
                </div>
            </nav>
        </aside>
    </>
    );
}
