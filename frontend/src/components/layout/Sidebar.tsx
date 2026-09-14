import { Activity, Clock, Compass, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
    currentTab: string;
}

export function Sidebar({ currentTab }: SidebarProps) {
    const navigate = useNavigate();
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="brand-title">Alpha Terminal</div>
                <div className="brand-subtitle">AI Research</div>
            </div>
            
            <nav className="sidebar-nav">
                <div 
                    className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => navigate('/dashboard')}
                >
                    <Activity size={18} />
                    <span>Dashboard</span>
                </div>
                <div 
                    className={`nav-item ${currentTab === 'new' ? 'active' : ''}`}
                    onClick={() => navigate('/research')}
                >
                    <Compass size={18} />
                    <span>New Research</span>
                </div>
                <div 
                    className={`nav-item ${currentTab === 'history' ? 'active' : ''}`}
                    onClick={() => navigate('/history')}
                >
                    <Clock size={18} />
                    <span>History</span>
                </div>
                <div 
                    className={`nav-item ${currentTab === 'watchlist' ? 'active' : ''}`}
                    onClick={() => navigate('/watchlist')}
                >
                    <Eye size={18} />
                    <span>Watchlist</span>
                </div>
            </nav>
        </aside>
    );
}
