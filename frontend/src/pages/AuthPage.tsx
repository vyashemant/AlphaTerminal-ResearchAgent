import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/brand/Logo';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const AuthPage: React.FC = () => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert('Check your email for the confirmation link.');
            }
        } catch (err: any) {
            if (err.message === 'Invalid login credentials') {
                setError('Invalid email or password. Please try again.');
            } else {
                setError(err.message || 'An error occurred during authentication.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            backgroundColor: 'var(--bg-primary)',
        }}>
            {/* Left panel — branding */}
            <div style={{
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border)',
                flexDirection: 'column',
                padding: '3rem',
            }} className="auth-brand-panel">
                <Link to="/" style={{ display: 'inline-flex' }}>
                    <Logo variant="full" size={32} />
                </Link>

                <div style={{ marginTop: 'auto', marginBottom: 'auto', paddingTop: '4rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                        AI-powered investment research, in one workspace.
                    </h2>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: '380px' }}>
                        Sign in to access the research terminal — run multi-agent analysis, screen equities, and track your paper portfolio.
                    </p>

                    <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            'Multi-stage AI research workflow',
                            'Deterministic financial calculations',
                            'Persistent watchlist & history',
                            'Paper portfolio with real-time P/L',
                        ].map(feat => (
                            <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent)', flexShrink: 0 }} />
                                {feat}
                            </div>
                        ))}
                    </div>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
                    A full-stack AI engineering project. Not financial advice.
                </p>
            </div>

            {/* Right panel — form */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
            }} className="auth-form-panel">
                {/* Mobile Logo top-left */}
                <Link to="/" className="auth-mobile-logo">
                    <Logo variant="full" size={32} />
                </Link>

                {/* Theme toggle top-right */}
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                    <button
                        className="action-btn"
                        onClick={toggleTheme}
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>

                <div style={{ width: '100%', maxWidth: '360px' }}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            {isLogin ? 'Welcome back' : 'Create your account'}
                        </h1>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {isLogin
                                ? 'Sign in to continue to Alpha Terminal.'
                                : 'Start your AI-powered research workspace.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {error && (
                            <div className="error-banner" role="alert" style={{ margin: 0 }}>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="auth-email" className="form-label">Email address</label>
                            <input
                                id="auth-email"
                                type="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="auth-password" className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="auth-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                    style={{ paddingRight: '2.75rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{
                                        position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                                        background: 'transparent', border: 'none', color: 'var(--text-muted)',
                                        cursor: 'pointer', padding: '0.25rem', display: 'flex', lineHeight: 0,
                                    }}
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary btn-full"
                            style={{ marginTop: '0.5rem', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 600 }}
                        >
                            {loading
                                ? (isLogin ? 'Signing in…' : 'Creating account…')
                                : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        </span>
                        <button
                            type="button"
                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
                            style={{
                                background: 'transparent', border: 'none',
                                color: 'var(--accent)', fontSize: '0.875rem',
                                fontWeight: 600, cursor: 'pointer', padding: 0,
                                textDecoration: 'underline', textUnderlineOffset: '3px',
                            }}
                        >
                            {isLogin ? 'Create account' : 'Sign in'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
