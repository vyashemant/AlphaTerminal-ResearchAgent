import { Activity, Clock, Compass, Eye, BarChart2, Filter, PieChart, LayoutDashboard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '../brand/Logo';

interface SidebarProps {
    currentTab: string;
}

export function Sidebar({ currentTab }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (tab: string) => currentTab === tab;
    const isPath = (path: string) => location.pathname.startsWith(path);

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Logo variant="full" size={28} />
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Workspace</div>

                <div
                    className={`nav-item ${isActive('dashboard') ? 'active' : ''}`}
                    onClick={() => navigate('/dashboard')}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard')}
                >
                    <LayoutDashboard size={16} />
                    <span>Dashboard</span>
                </div>

                <div
                    className={`nav-item ${isActive('new') ? 'active' : ''}`}
                    onClick={() => navigate('/research')}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/research')}
                >
                    <Compass size={16} />
                    <span>New Research</span>
                </div>

                <div
                    className={`nav-item ${isActive('history') ? 'active' : ''}`}
                    onClick={() => navigate('/history')}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/history')}
                >
                    <Clock size={16} />
                    <span>History</span>
                </div>

                <div
                    className={`nav-item ${isActive('watchlist') ? 'active' : ''}`}
                    onClick={() => navigate('/watchlist')}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/watchlist')}
                >
                    <Eye size={16} />
                    <span>Watchlist</span>
                </div>

                <div className="sidebar-divider" />

                <div className="sidebar-section-label">Markets</div>

                <div
                    className={`nav-item ${isPath('/markets') ? 'active' : ''}`}
                    onClick={() => navigate('/markets')}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/markets')}
                >
                    <Activity size={16} />
                    <span>Markets</span>
                </div>

                <div
                    className={`nav-item ${isPath('/screeners') ? 'active' : ''}`}
                    onClick={() => navigate('/screeners')}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/screeners')}
                >
                    <Filter size={16} />
                    <span>Screeners</span>
                </div>

                <div className="sidebar-divider" />

                <div className="sidebar-section-label">Portfolio</div>

                <div
                    className={`nav-item ${isPath('/portfolio') ? 'active' : ''}`}
                    onClick={() => navigate('/portfolio')}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/portfolio')}
                >
                    <PieChart size={16} />
                    <span>Paper Portfolio</span>
                </div>

                <div
                    className={`nav-item ${false ? 'active' : ''}`}
                    onClick={() => navigate('/markets')}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/markets')}
                    style={{ paddingTop: '0.375rem', paddingBottom: '0.375rem' }}
                >
                    <BarChart2 size={16} />
                    <span>Market Data</span>
                </div>
            </nav>
        </aside>
    );
}
