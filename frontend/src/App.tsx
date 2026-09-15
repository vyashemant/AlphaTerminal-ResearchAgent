import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Research } from './pages/Research';
import { History } from './pages/History';
import { Watchlist } from './pages/Watchlist';
import { AuthPage } from './pages/AuthPage';
import { Markets } from './pages/Markets';
import { Screeners } from './pages/Screeners';
import { Portfolio } from './pages/Portfolio';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { ProtectedRoute } from './components/ProtectedRoute';
import './index.css';

function App() {
  const location = useLocation();
  const path = location.pathname;
  let currentTab = '';
  if (path === '/dashboard') currentTab = 'dashboard';
  else if (path === '/research') currentTab = 'new';
  else if (path === '/history') currentTab = 'history';
  else if (path === '/watchlist') currentTab = 'watchlist';

  // If the user is on /auth but they are already logged in, they shouldn't see Sidebar.
  // Actually, we can just render AuthPage standalone when on /auth.
  if (path === '/auth') {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar currentTab={currentTab} />
      
      <main className="main-content-wrapper">
        <TopNav />
        
        <div className="main-scroll-area">
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/research" element={<Research />} />
              <Route path="/research/:jobId" element={<Research />} />
              <Route path="/history" element={<History />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/screeners" element={<Screeners />} />
              <Route path="/portfolio" element={<Portfolio />} />
            </Route>
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
