import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Logo } from '../components/brand/Logo';
import {
    FileSearch, BarChart2, FileText, Search, PieChart, History,
    CheckCircle2, Server, Brain, Database, Layout, Shield, Blocks,
    Sun, Moon, ArrowRight, Zap, Lock, GitBranch, Menu, X, ArrowUpRight
} from 'lucide-react';

export const LandingPage: React.FC = () => {
    const { session } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const ctaHref = session ? '/dashboard' : '/auth';

    const closeMobileMenu = () => setMobileMenuOpen(false);

    useEffect(() => {
        const pathToId: Record<string, string> = {
            '/features': 'features',
            '/how-it-works': 'how-it-works',
            '/technology': 'technology',
            '/architecture': 'architecture',
            '/about': 'about',
        };
        const targetId = pathToId[location.pathname] || (location.hash ? location.hash.replace('#', '') : null);
        if (targetId) {
            const el = document.getElementById(targetId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [location.pathname, location.hash]);

    return (
        <div className="lp-container">

            {/* ── Navigation ─────────────────────────────────────── */}
            <header className="lp-nav">
                <div className="lp-nav-inner">
                    <Link to="/" style={{ textDecoration: 'none' }} aria-label="Alpha Terminal Home">
                        <Logo variant="full" size={32} />
                    </Link>

                    <nav className="lp-nav-links" aria-label="Desktop navigation">
                        <a href="#features" className="lp-nav-item">Features</a>
                        <a href="#how-it-works" className="lp-nav-item">How It Works</a>
                        <a href="#technology" className="lp-nav-item">Technology</a>
                        <a href="#architecture" className="lp-nav-item">Architecture</a>
                        <a href="#product-areas" className="lp-nav-item">Workspaces</a>
                        <a href="#about" className="lp-nav-item">About</a>
                    </nav>

                    <div className="lp-nav-actions">
                        <button
                            className="action-btn"
                            onClick={toggleTheme}
                            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        <div className="lp-nav-cta-desktop">
                            {session ? (
                                <Link to="/dashboard" className="btn btn-primary btn-sm">Explore Dashboard</Link>
                            ) : (
                                <>
                                    <Link to="/auth" className="btn btn-ghost btn-sm">Sign In</Link>
                                    <Link to="/auth" className="btn btn-primary btn-sm">Get Started</Link>
                                </>
                            )}
                        </div>

                        <button
                            className="lp-mobile-menu-btn"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                {mobileMenuOpen && (
                    <nav className="lp-mobile-drawer" aria-label="Mobile navigation">
                        <a href="#features" className="lp-nav-item" onClick={closeMobileMenu}>Features</a>
                        <a href="#how-it-works" className="lp-nav-item" onClick={closeMobileMenu}>How It Works</a>
                        <a href="#technology" className="lp-nav-item" onClick={closeMobileMenu}>Technology</a>
                        <a href="#architecture" className="lp-nav-item" onClick={closeMobileMenu}>Architecture</a>
                        <a href="#product-areas" className="lp-nav-item" onClick={closeMobileMenu}>Workspaces</a>
                        <a href="#about" className="lp-nav-item" onClick={closeMobileMenu}>About</a>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {session ? (
                                <Link to="/dashboard" className="btn btn-primary btn-sm btn-full" onClick={closeMobileMenu}>Explore Dashboard</Link>
                            ) : (
                                <>
                                    <Link to="/auth" className="btn btn-outline btn-sm btn-full" onClick={closeMobileMenu}>Sign In</Link>
                                    <Link to="/auth" className="btn btn-primary btn-sm btn-full" onClick={closeMobileMenu}>Get Started</Link>
                                </>
                            )}
                        </div>
                    </nav>
                )}
            </header>

            {/* ── Hero ───────────────────────────────────────────── */}
            <section className="lp-section-outer" aria-labelledby="hero-title">
                <div className="lp-hero">
                    {/* Left: Copy strictly following requirements */}
                    <div>
                        <span className="lp-hero-eyebrow">AI-POWERED INVESTMENT RESEARCH</span>

                        <h1 id="hero-title" className="lp-hero-title">
                            Smarter Stock Research,<br />Built with AI.
                        </h1>

                        <p className="lp-hero-subtitle">
                            Alpha Terminal combines market data, financial filings, multi-agent analysis, and portfolio tools into one focused research workspace.
                        </p>

                        <ul className="lp-hero-features" aria-label="Project features">
                            <li className="lp-hero-feature-item">
                                <CheckCircle2 size={16} aria-hidden="true" />
                                <span>AI-powered research workflows</span>
                            </li>
                            <li className="lp-hero-feature-item">
                                <CheckCircle2 size={16} aria-hidden="true" />
                                <span>Market and financial data analysis</span>
                            </li>
                            <li className="lp-hero-feature-item">
                                <CheckCircle2 size={16} aria-hidden="true" />
                                <span>SEC filing insights</span>
                            </li>
                            <li className="lp-hero-feature-item">
                                <CheckCircle2 size={16} aria-hidden="true" />
                                <span>Multi-agent investment analysis</span>
                            </li>
                            <li className="lp-hero-feature-item">
                                <CheckCircle2 size={16} aria-hidden="true" />
                                <span>Stock screening and portfolio tracking</span>
                            </li>
                            <li className="lp-hero-feature-item">
                                <CheckCircle2 size={16} aria-hidden="true" />
                                <span>Persistent research history and watchlists</span>
                            </li>
                        </ul>

                        <div className="lp-hero-cta">
                            <Link to={ctaHref} className="btn btn-primary btn-lg" style={{ gap: '0.5rem' }}>
                                Explore Alpha Terminal <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                            <a href="#features" className="btn btn-outline btn-lg">View Features</a>
                        </div>

                        <p className="lp-hero-note">A full-stack AI engineering project by Hemant Vyas.</p>
                    </div>

                    {/* Right: Polished Abstract Product Visual with Zero Fabricated Numbers */}
                    <div className="lp-hero-visual" aria-label="Alpha Terminal Research Workspace Preview">
                        <div className="lp-hero-visual-bar">
                            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                                <div className="lp-hero-visual-dot" style={{ background: 'var(--danger)' }} />
                                <div className="lp-hero-visual-dot" style={{ background: 'var(--warning)' }} />
                                <div className="lp-hero-visual-dot" style={{ background: 'var(--success)' }} />
                            </div>
                            <span className="lp-preview-pill">ILLUSTRATIVE UI PREVIEW</span>
                            <span className="lp-hero-visual-title">terminal.alpha/workspace</span>
                        </div>

                        <div className="lp-hero-visual-body">
                            {/* Research Session Status Header */}
                            <div className="lp-preview-session-header">
                                <div>
                                    <div className="lp-preview-target-label">ACTIVE RESEARCH PIPELINE</div>
                                    <div className="lp-preview-target-name">EQUITY ANALYSIS ENGINE</div>
                                </div>
                                <div className="lp-preview-status-tag">
                                    <span className="lp-status-dot" aria-hidden="true" />
                                    <span>RESEARCH STATUS: COMPLETED</span>
                                </div>
                            </div>

                            {/* Abstract Module Preview Grid - Labels Only, No Fabricated Metrics */}
                            <div className="lp-preview-grid">
                                <div className="lp-preview-card">
                                    <div className="lp-preview-card-header">
                                        <span className="lp-mock-label">DATA MODULE</span>
                                        <span className="lp-badge-subtle">NORMALIZED</span>
                                    </div>
                                    <div className="lp-mock-label-title">MARKET DATA</div>
                                    <div className="lp-mock-subtext">Prices · Volume · Profiles</div>
                                </div>

                                <div className="lp-preview-card">
                                    <div className="lp-preview-card-header">
                                        <span className="lp-mock-label">FILINGS ENGINE</span>
                                        <span className="lp-badge-subtle">EDGAR</span>
                                    </div>
                                    <div className="lp-mock-label-title">SEC 10-K / 10-Q</div>
                                    <div className="lp-mock-subtext">Item 1A · Item 7 MD&A</div>
                                </div>

                                <div className="lp-preview-card">
                                    <div className="lp-preview-card-header">
                                        <span className="lp-mock-label">CALCULATIONS</span>
                                        <span className="lp-badge-subtle">OUTSIDE LLM</span>
                                    </div>
                                    <div className="lp-mock-label-title">FINANCIAL ANALYSIS</div>
                                    <div className="lp-mock-subtext">Deterministic Ratios</div>
                                </div>
                            </div>

                            {/* Multi-Agent Synthesis Preview */}
                            <div className="lp-preview-thesis-block">
                                <div className="lp-preview-thesis-header">
                                    <span className="lp-mock-label" style={{ color: 'var(--accent)' }}>INVESTMENT THESIS</span>
                                    <span className="lp-preview-agents-count">5 SPECIALISTS COMBINED</span>
                                </div>
                                <div className="lp-mock-text-line" style={{ width: '100%' }} />
                                <div className="lp-mock-text-line" style={{ width: '92%' }} />
                                <div className="lp-mock-text-line" style={{ width: '76%' }} />
                            </div>

                            {/* Specialist Agents Involved */}
                            <div className="lp-preview-specialists-row">
                                <div className="lp-preview-spec-item">
                                    <span className="lp-spec-dot" aria-hidden="true" />
                                    <span>Financial Analyst</span>
                                </div>
                                <div className="lp-preview-spec-item">
                                    <span className="lp-spec-dot" aria-hidden="true" />
                                    <span>Market & Sentiment</span>
                                </div>
                                <div className="lp-preview-spec-item">
                                    <span className="lp-spec-dot" aria-hidden="true" />
                                    <span>Valuation Specialist</span>
                                </div>
                                <div className="lp-preview-spec-item">
                                    <span className="lp-spec-dot" aria-hidden="true" />
                                    <span>Risk Synthesis</span>
                                </div>
                            </div>

                            {/* Evidence Registry Bar */}
                            <div className="lp-preview-footer-bar">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className="badge badge-accent">EVIDENCE REGISTRY</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                                        Cross-Checked Sources
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                                    FINAL STRATEGY REPORT
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features ───────────────────────────────────────── */}
            <section className="lp-section-outer alt" id="features" aria-labelledby="features-title">
                <div className="lp-section">
                    <div className="lp-section-header">
                        <span className="lp-eyebrow">Capabilities</span>
                        <h2 id="features-title" className="lp-section-title">Everything in One Research Workspace</h2>
                        <p className="lp-section-desc">
                            Alpha Terminal combines market data, financial filings, multi-agent analysis, and portfolio tools into one focused research workspace.
                        </p>
                    </div>

                    <div className="lp-grid">
                        <div className="lp-card">
                            <div className="lp-card-icon"><FileSearch size={20} aria-hidden="true" /></div>
                            <h3 className="lp-card-title">AI-Powered Research Workflows</h3>
                            <p className="lp-card-desc">Execute multi-stage background research pipelines powered by CrewAI and Google Gemini with persistent job tracking.</p>
                        </div>
                        <div className="lp-card">
                            <div className="lp-card-icon"><BarChart2 size={20} aria-hidden="true" /></div>
                            <h3 className="lp-card-title">Market & Financial Data Analysis</h3>
                            <p className="lp-card-desc">Collect real-time quotes, company metrics, and historical series — running all mathematical calculations deterministically.</p>
                        </div>
                        <div className="lp-card">
                            <div className="lp-card-icon"><FileText size={20} aria-hidden="true" /></div>
                            <h3 className="lp-card-title">SEC Filing Insights</h3>
                            <p className="lp-card-desc">Ingest official EDGAR 10-K annual and 10-Q quarterly reports to extract Risk Factors (Item 1A) and MD&A (Item 7).</p>
                        </div>
                        <div className="lp-card">
                            <div className="lp-card-icon"><Brain size={20} aria-hidden="true" /></div>
                            <h3 className="lp-card-title">Multi-Agent Investment Analysis</h3>
                            <p className="lp-card-desc">Dedicated specialist agents examine fundamentals, sentiment, valuation, and risks before synthesizing a strategy report.</p>
                        </div>
                        <div className="lp-card">
                            <div className="lp-card-icon"><Search size={20} aria-hidden="true" /></div>
                            <h3 className="lp-card-title">Stock Screening</h3>
                            <p className="lp-card-desc">Filter equities by market cap, share price, valuation multiples, and dividend yield with server-side validation.</p>
                        </div>
                        <div className="lp-card">
                            <div className="lp-card-icon"><PieChart size={20} aria-hidden="true" /></div>
                            <h3 className="lp-card-title">Portfolio Tracking</h3>
                            <p className="lp-card-desc">Simulate holdings, cost basis, unrealized gain/loss, and portfolio asset allocation breakdown in real time.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── How It Works ───────────────────────────────────── */}
            <section className="lp-section-outer" id="how-it-works" aria-labelledby="how-title">
                <div className="lp-section">
                    <div className="lp-section-header">
                        <span className="lp-eyebrow">Research Pipeline</span>
                        <h2 id="how-title" className="lp-section-title">How It Works</h2>
                        <p className="lp-section-desc">The internal background workflow powering asynchronous investment analysis.</p>
                    </div>

                    <div className="lp-pipeline">
                        {[
                            { num: '01', title: 'Data Retrieval', desc: 'Market quotes, financial metrics, and news are fetched from Yahoo Finance, SEC EDGAR, and Marketaux.' },
                            { num: '02', title: 'Validation & Preparation', desc: 'Payloads are validated and deterministic financial ratios are computed outside the LLM context.' },
                            { num: '03', title: 'Multi-Agent Analysis', desc: 'Specialist CrewAI agents analyze fundamentals, market sentiment, valuation, and risk in parallel.' },
                            { num: '04', title: 'Evidence & Consistency Check', desc: 'Outputs are cross-referenced against raw data and recorded in the evidence registry.' },
                            { num: '05', title: 'Investment Strategy Report', desc: 'The strategy agent reconciles signals into a structured report with thesis, catalysts, and scenarios.' },
                        ].map((step, i, arr) => (
                            <React.Fragment key={step.num}>
                                <div className="lp-step">
                                    <div className="lp-step-num">{step.num}</div>
                                    <div>
                                        <div className="lp-step-title">{step.title}</div>
                                        <div className="lp-step-desc">{step.desc}</div>
                                    </div>
                                </div>
                                {i < arr.length - 1 && <div className="lp-pipeline-connector" aria-hidden="true" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Technology ─────────────────────────────────────── */}
            <section className="lp-section-outer alt" id="technology" aria-labelledby="tech-title">
                <div className="lp-section">
                    <div className="lp-section-header">
                        <span className="lp-eyebrow">Engineering</span>
                        <h2 id="tech-title" className="lp-section-title">Technology Stack</h2>
                        <p className="lp-section-desc">
                            A full-stack implementation across infrastructure, backend services, AI agents, data sources, and frontend presentation.
                        </p>
                    </div>

                    <div className="lp-tech-grid">
                        <div className="lp-tech-card">
                            <div className="lp-tech-card-icon"><Server size={18} aria-hidden="true" /></div>
                            <div className="lp-tech-card-title">Backend Architecture</div>
                            <div className="lp-tech-tags">
                                {['FastAPI', 'Python', 'SQLAlchemy', 'BackgroundTasks', 'Pydantic v2', 'REST API'].map(t => <span key={t} className="lp-tech-tag">{t}</span>)}
                            </div>
                        </div>
                        <div className="lp-tech-card">
                            <div className="lp-tech-card-icon"><Brain size={18} aria-hidden="true" /></div>
                            <div className="lp-tech-card-title">AI & Multi-Agent</div>
                            <div className="lp-tech-tags">
                                {['CrewAI', 'Google Gemini', 'Multi-Agent', 'Evidence Registry', 'Structured Prompts'].map(t => <span key={t} className="lp-tech-tag">{t}</span>)}
                            </div>
                        </div>
                        <div className="lp-tech-card">
                            <div className="lp-tech-card-icon"><Database size={18} aria-hidden="true" /></div>
                            <div className="lp-tech-card-title">Data Ingestion</div>
                            <div className="lp-tech-tags">
                                {['Yahoo Finance', 'SEC EDGAR API', 'Marketaux News', 'Deterministic Calcs'].map(t => <span key={t} className="lp-tech-tag">{t}</span>)}
                            </div>
                        </div>
                        <div className="lp-tech-card">
                            <div className="lp-tech-card-icon"><Shield size={18} aria-hidden="true" /></div>
                            <div className="lp-tech-card-title">Persistence & Auth</div>
                            <div className="lp-tech-tags">
                                {['Supabase Auth', 'SQLite Backend', 'JWT Verification', 'Row Level Security'].map(t => <span key={t} className="lp-tech-tag">{t}</span>)}
                            </div>
                        </div>
                        <div className="lp-tech-card">
                            <div className="lp-tech-card-icon"><Layout size={18} aria-hidden="true" /></div>
                            <div className="lp-tech-card-title">Frontend Engineering</div>
                            <div className="lp-tech-tags">
                                {['React 19', 'TypeScript', 'Vite', 'Recharts', 'Vanilla CSS', 'Lucide Icons'].map(t => <span key={t} className="lp-tech-tag">{t}</span>)}
                            </div>
                        </div>
                        <div className="lp-tech-card">
                            <div className="lp-tech-card-icon"><Blocks size={18} aria-hidden="true" /></div>
                            <div className="lp-tech-card-title">DevOps & CI/CD</div>
                            <div className="lp-tech-tags">
                                {['Docker Multi-Stage', 'docker-compose', 'GitHub Actions', 'pytest', 'ESLint'].map(t => <span key={t} className="lp-tech-tag">{t}</span>)}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Architecture Visual Flow ───────────────────────── */}
            <section className="lp-section-outer" id="architecture" aria-labelledby="arch-title">
                <div className="lp-section">
                    <div className="lp-section-header">
                        <span className="lp-eyebrow">System Design</span>
                        <h2 id="arch-title" className="lp-section-title">System Architecture</h2>
                        <p className="lp-section-desc">
                            The complete conceptual data flow from user dispatch to final strategy report.
                        </p>
                    </div>

                    <div className="lp-arch-container">
                        {/* 1. User Request */}
                        <div className="lp-arch-node">
                            <div className="lp-arch-node-tag">ENTRYPOINT</div>
                            <div className="lp-arch-node-title">User Request</div>
                            <div className="lp-arch-node-desc">Ticker submission via React frontend or FastAPI REST endpoint</div>
                        </div>

                        <div className="lp-arch-arrow" aria-hidden="true">↓</div>

                        {/* 2. Data Retrieval */}
                        <div className="lp-arch-node">
                            <div className="lp-arch-node-tag">DATA SOURCES</div>
                            <div className="lp-arch-node-title">Data Retrieval</div>
                            <div className="lp-arch-node-desc">Yahoo Finance · SEC EDGAR · Marketaux News Feed</div>
                        </div>

                        <div className="lp-arch-arrow" aria-hidden="true">↓</div>

                        {/* 3. Validation & Calculations */}
                        <div className="lp-arch-node">
                            <div className="lp-arch-node-tag">DETERMINISTIC PROCESSING</div>
                            <div className="lp-arch-node-title">Validation & Calculations</div>
                            <div className="lp-arch-node-desc">Financial ratios & sanity checks calculated deterministically outside LLM</div>
                        </div>

                        <div className="lp-arch-arrow" aria-hidden="true">↓</div>

                        {/* 4. Specialist Analysis */}
                        <div className="lp-arch-specialists-group">
                            <div className="lp-arch-spec-header">SPECIALIST ANALYSIS (PARALLEL EXECUTION)</div>
                            <div className="lp-arch-specialists-grid">
                                <div className="lp-arch-subnode">
                                    <div className="lp-arch-subnode-title">Financial Analyst</div>
                                    <div className="lp-arch-subnode-desc">10-K / 10-Q statements & balance sheet health</div>
                                </div>
                                <div className="lp-arch-subnode">
                                    <div className="lp-arch-subnode-title">Market Analyst</div>
                                    <div className="lp-arch-subnode-desc">Market sentiment, momentum & news headlines</div>
                                </div>
                                <div className="lp-arch-subnode">
                                    <div className="lp-arch-subnode-title">Valuation Analyst</div>
                                    <div className="lp-arch-subnode-desc">Multiples, peer benchmarking & historical bands</div>
                                </div>
                            </div>
                        </div>

                        <div className="lp-arch-arrow" aria-hidden="true">↓</div>

                        {/* 5. Risk Analysis */}
                        <div className="lp-arch-node">
                            <div className="lp-arch-node-tag">RISK ASSESSMENT</div>
                            <div className="lp-arch-node-title">Risk Analysis</div>
                            <div className="lp-arch-node-desc">Downside scenarios, debt covenants, regulatory & macro headwinds</div>
                        </div>

                        <div className="lp-arch-arrow" aria-hidden="true">↓</div>

                        {/* 6. Strategy Agent */}
                        <div className="lp-arch-node">
                            <div className="lp-arch-node-tag">SYNTHESIS AGENT</div>
                            <div className="lp-arch-node-title">Strategy Agent</div>
                            <div className="lp-arch-node-desc">Reconciles all specialist outputs into a unified investment perspective</div>
                        </div>

                        <div className="lp-arch-arrow" aria-hidden="true">↓</div>

                        {/* 7. Research Report */}
                        <div className="lp-arch-node lp-arch-node--final">
                            <div className="lp-arch-node-tag">STRUCTURED OUTPUT</div>
                            <div className="lp-arch-node-title">Research Report</div>
                            <div className="lp-arch-node-desc">Investment thesis, catalysts, bear/bull scenarios & cited evidence registry</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Product Workspaces Showcase ────────────────────── */}
            <section className="lp-section-outer alt" id="product-areas" aria-labelledby="product-title">
                <div className="lp-section">
                    <div className="lp-section-header">
                        <span className="lp-eyebrow">Application Structure</span>
                        <h2 id="product-title" className="lp-section-title">Built-in Application Workspaces</h2>
                        <p className="lp-section-desc">
                            Alpha Terminal provides seven functional workspaces supporting the complete equity analysis lifecycle.
                        </p>
                    </div>

                    <div className="lp-workspaces-grid">
                        {/* 1. Dashboard */}
                        <div className="lp-workspace-card">
                            <div className="lp-workspace-header">
                                <div className="lp-workspace-icon"><Layout size={18} aria-hidden="true" /></div>
                                <span className="lp-workspace-badge">/dashboard</span>
                            </div>
                            <h3 className="lp-workspace-title">Executive Dashboard</h3>
                            <p className="lp-workspace-desc">
                                Centralized workspace providing system overview, recent research status, quick launch triggers, and market snapshots.
                            </p>
                            <div className="lp-workspace-preview-ui">
                                <span>Recent Jobs · Queue Stats</span>
                                <ArrowUpRight size={14} />
                            </div>
                        </div>

                        {/* 2. Research Report */}
                        <div className="lp-workspace-card">
                            <div className="lp-workspace-header">
                                <div className="lp-workspace-icon"><FileSearch size={18} aria-hidden="true" /></div>
                                <span className="lp-workspace-badge">/research</span>
                            </div>
                            <h3 className="lp-workspace-title">Research Report</h3>
                            <p className="lp-workspace-desc">
                                Asynchronous analysis view rendering multi-agent investment theses, scenario matrices, and cited evidence registry quotes.
                            </p>
                            <div className="lp-workspace-preview-ui">
                                <span>Thesis · Catalysts · Evidence</span>
                                <ArrowUpRight size={14} />
                            </div>
                        </div>

                        {/* 3. Markets */}
                        <div className="lp-workspace-card">
                            <div className="lp-workspace-header">
                                <div className="lp-workspace-icon"><BarChart2 size={18} aria-hidden="true" /></div>
                                <span className="lp-workspace-badge">/markets</span>
                            </div>
                            <h3 className="lp-workspace-title">Market Overview</h3>
                            <p className="lp-workspace-desc">
                                Broad market context tracking benchmark indices, sector performance, day gainers and losers from real-time feeds.
                            </p>
                            <div className="lp-workspace-preview-ui">
                                <span>Indices · Day Movers · Sectors</span>
                                <ArrowUpRight size={14} />
                            </div>
                        </div>

                        {/* 4. Stock Screener */}
                        <div className="lp-workspace-card">
                            <div className="lp-workspace-header">
                                <div className="lp-workspace-icon"><Search size={18} aria-hidden="true" /></div>
                                <span className="lp-workspace-badge">/screeners</span>
                            </div>
                            <h3 className="lp-workspace-title">Stock Screener</h3>
                            <p className="lp-workspace-desc">
                                Multi-factor equities screener filtering stocks by market cap, share price, valuation multiples, and dividend yield.
                            </p>
                            <div className="lp-workspace-preview-ui">
                                <span>Filters · Sort · Direct Research</span>
                                <ArrowUpRight size={14} />
                            </div>
                        </div>

                        {/* 5. Paper Portfolio */}
                        <div className="lp-workspace-card">
                            <div className="lp-workspace-header">
                                <div className="lp-workspace-icon"><PieChart size={18} aria-hidden="true" /></div>
                                <span className="lp-workspace-badge">/portfolio</span>
                            </div>
                            <h3 className="lp-workspace-title">Portfolio Tracking</h3>
                            <p className="lp-workspace-desc">
                                Simulated paper portfolio tracking equity holdings, cost basis, unrealized P/L, and allocation pie visualization.
                            </p>
                            <div className="lp-workspace-preview-ui">
                                <span>Positions · Cost Basis · Allocation</span>
                                <ArrowUpRight size={14} />
                            </div>
                        </div>

                        {/* 6. Watchlist */}
                        <div className="lp-workspace-card">
                            <div className="lp-workspace-header">
                                <div className="lp-workspace-icon"><History size={18} aria-hidden="true" /></div>
                                <span className="lp-workspace-badge">/watchlist</span>
                            </div>
                            <h3 className="lp-workspace-title">Watchlist Workspace</h3>
                            <p className="lp-workspace-desc">
                                Persistent user equities watchlist with quick status indicators, notes, and direct launch into research pipelines.
                            </p>
                            <div className="lp-workspace-preview-ui">
                                <span>Saved Tickers · Quick Research</span>
                                <ArrowUpRight size={14} />
                            </div>
                        </div>

                        {/* 7. Research History */}
                        <div className="lp-workspace-card" style={{ gridColumn: 'span 1' }}>
                            <div className="lp-workspace-header">
                                <div className="lp-workspace-icon"><FileText size={18} aria-hidden="true" /></div>
                                <span className="lp-workspace-badge">/history</span>
                            </div>
                            <h3 className="lp-workspace-title">Research History</h3>
                            <p className="lp-workspace-desc">
                                Audit trail and search log for completed, running, and queued research jobs with full reports review across sessions.
                            </p>
                            <div className="lp-workspace-preview-ui">
                                <span>Audit Log · Status Filters</span>
                                <ArrowUpRight size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Engineering Highlights ─────────────────────────── */}
            <section className="lp-section-outer" aria-labelledby="highlights-title">
                <div className="lp-section">
                    <div className="lp-section-header">
                        <span className="lp-eyebrow">Technical Architecture</span>
                        <h2 id="highlights-title" className="lp-section-title">Engineering Highlights</h2>
                        <p className="lp-section-desc">Key architectural decisions and engineering implementations across the codebase.</p>
                    </div>

                    <div className="lp-highlight-grid">
                        {[
                            { icon: <Zap size={15} aria-hidden="true" />,       text: 'Asynchronous research background job execution' },
                            { icon: <GitBranch size={15} aria-hidden="true" />, text: 'Job state lifecycle: queued → running → completed / failed' },
                            { icon: <Zap size={15} aria-hidden="true" />,       text: 'Stale job recovery on backend process restart' },
                            { icon: <Brain size={15} aria-hidden="true" />,     text: 'Parallel specialist CrewAI agent analysis' },
                            { icon: <Database size={15} aria-hidden="true" />,  text: 'Deterministic financial calculations outside LLM runtime' },
                            { icon: <Lock size={15} aria-hidden="true" />,      text: 'User data isolation via Supabase Row Level Security' },
                            { icon: <Shield size={15} aria-hidden="true" />,    text: 'Multi-backend database abstraction (SQLite / Supabase / Mock)' },
                            { icon: <Blocks size={15} aria-hidden="true" />,    text: 'Multi-stage Docker deployment & automated GitHub Actions CI' },
                        ].map((item, i) => (
                            <div key={i} className="lp-highlight-item">
                                {item.icon}
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── About ──────────────────────────────────────────── */}
            <section className="lp-section-outer alt" id="about" aria-labelledby="about-title">
                <div className="lp-section">
                    <div className="lp-section-header">
                        <span className="lp-eyebrow">Project Context</span>
                        <h2 id="about-title" className="lp-section-title">Why I Built Alpha Terminal</h2>
                    </div>

                    <div className="lp-about-card">
                        <blockquote className="lp-quote">
                            Alpha Terminal is a personal engineering project exploring the intersection of AI, financial data, and full-stack software engineering.
                            I built it to investigate how multi-agent AI systems can work alongside structured financial information, official SEC filings,
                            user persistence, authentication, and a production-grade web interface.
                        </blockquote>
                        <p className="lp-byline">A full-stack AI engineering project by Hemant Vyas.</p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a
                                href="https://github.com/vyashemant/CrewAI-AiAgent"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline"
                            >
                                View on GitHub
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA Band ───────────────────────────────────────── */}
            <section className="lp-cta-band" aria-labelledby="cta-title">
                <span className="lp-eyebrow">Get Started</span>
                <h2 id="cta-title" className="lp-section-title" style={{ marginBottom: '1rem' }}>Explore Alpha Terminal</h2>
                <p className="lp-section-desc" style={{ marginBottom: '2.5rem' }}>
                    Experience the research workspace, launch a multi-agent equity workflow, and inspect the underlying system architecture.
                </p>
                <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to={ctaHref} className="btn btn-primary btn-xl">
                        Explore Alpha Terminal <ArrowRight size={17} aria-hidden="true" />
                    </Link>
                    <a href="https://github.com/vyashemant/CrewAI-AiAgent" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-xl">
                        View on GitHub
                    </a>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────── */}
            <footer className="lp-footer">
                <div className="lp-footer-inner">
                    <div>
                        <Link to="/" style={{ textDecoration: 'none' }} aria-label="Alpha Terminal Home">
                            <Logo variant="full" size={28} />
                        </Link>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.75rem', maxWidth: '280px', lineHeight: 1.6 }}>
                            A full-stack AI investment research engineering project by Hemant Vyas.
                        </p>
                    </div>

                    <nav className="lp-footer-links" aria-label="Footer navigation">
                        <a href="#" className="lp-nav-item">Home</a>
                        <a href="#features" className="lp-nav-item">Features</a>
                        <a href="#how-it-works" className="lp-nav-item">How It Works</a>
                        <a href="#technology" className="lp-nav-item">Technology</a>
                        <a href="#architecture" className="lp-nav-item">Architecture</a>
                        <a href="#product-areas" className="lp-nav-item">Workspaces</a>
                        <a href="#about" className="lp-nav-item">About</a>
                        <a href="https://github.com/vyashemant/CrewAI-AiAgent" target="_blank" rel="noopener noreferrer" className="lp-nav-item">GitHub</a>
                    </nav>

                    <div className="lp-footer-copy">
                        <p>© 2026 Hemant Vyas</p>
                        <p style={{ marginTop: '0.25rem' }}>All research is illustrative. Not financial advice.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
