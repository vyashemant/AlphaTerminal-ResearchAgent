import { Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Research } from './pages/Research';
import { History } from './pages/History';
import { Watchlist } from './pages/Watchlist';
import { AuthPage } from './pages/AuthPage';
import { Markets } from './pages/Markets';
import { Screeners } from './pages/Screeners';
import { Portfolio } from './pages/Portfolio';
import { LandingPage } from './pages/LandingPage';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { ProtectedRoute } from './components/ProtectedRoute';
import './index.css';

function DashboardLayout() {
    const location = useLocation();
    const path = location.pathname;

    let currentTab = '';
    if (path === '/dashboard')           currentTab = 'dashboard';
    else if (path.startsWith('/research')) currentTab = 'new';
    else if (path.startsWith('/history')) currentTab = 'history';
    else if (path.startsWith('/watchlist')) currentTab = 'watchlist';
    else if (path.startsWith('/markets')) currentTab = 'markets';
    else if (path.startsWith('/screeners')) currentTab = 'screeners';
    else if (path.startsWith('/portfolio')) currentTab = 'portfolio';

    return (
        <div className="app-shell">
            <Sidebar currentTab={currentTab} />
            <main className="main-content-wrapper">
                <TopNav />
                <div className="main-scroll-area">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function App() {
    return (
        <Routes>
            <Route path="/"             element={<LandingPage />} />
            <Route path="/features"     element={<LandingPage />} />
            <Route path="/how-it-works" element={<LandingPage />} />
            <Route path="/technology"   element={<LandingPage />} />
            <Route path="/architecture" element={<LandingPage />} />
            <Route path="/about"        element={<LandingPage />} />
            <Route path="/auth"         element={<AuthPage />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                    <Route path="/dashboard"         element={<Dashboard />} />
                    <Route path="/research"          element={<Research />} />
                    <Route path="/research/:jobId"   element={<Research />} />
                    <Route path="/history"           element={<History />} />
                    <Route path="/watchlist"         element={<Watchlist />} />
                    <Route path="/markets"           element={<Markets />} />
                    <Route path="/screeners"         element={<Screeners />} />
                    <Route path="/portfolio"         element={<Portfolio />} />
                </Route>
            </Route>
        </Routes>
    );
}

export default App;
