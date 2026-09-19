import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Terminal, Database, BrainCircuit, Activity, Star, StarOff, Plus, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { ApiClient } from '../api/client';
import { useResearchPolling } from '../hooks/useResearchPolling';
import { ResearchDashboard } from '../components/dashboard/ResearchDashboard';

export function Research() {
    const { jobId: urlJobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [company, setCompany] = useState(searchParams.get('company') || '');
    const [ticker, setTicker] = useState(searchParams.get('ticker') || '');
    const [submitting, setSubmitting] = useState(false);

    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [watchlistItemId, setWatchlistItemId] = useState<string | null>(null);
    const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
    const [watchlistActionError, setWatchlistActionError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    const { jobId, setJobId, status, result, error, setError } = useResearchPolling(urlJobId || null);

    useEffect(() => {
        if (urlJobId !== jobId) {
            setJobId(urlJobId || null);
        }
    }, [urlJobId, setJobId, jobId]);

    useEffect(() => {
        if (status === 'completed' && result?.result) {
            const t = result.result.ticker;
            if (!t || typeof t !== 'string' || t.trim() === '') return;

            const checkWatchlist = async () => {
                setIsWatchlistLoading(true);
                try {
                    const response = await ApiClient.getWatchlist();
                    const existing = response.watchlist.find(item => item.ticker.toUpperCase() === t.toUpperCase());
                    if (existing) {
                        setIsInWatchlist(true);
                        setWatchlistItemId(existing.id);
                    } else {
                        setIsInWatchlist(false);
                        setWatchlistItemId(null);
                    }
                } catch (err) {
                    console.error('Failed to check watchlist status', err);
                } finally {
                    setIsWatchlistLoading(false);
                }
            };
            checkWatchlist();
        }
    }, [status, result]);

    const handleWatchlistAction = async () => {
        if (!result?.result) return;
        const t = result.result.ticker;
        if (!t || typeof t !== 'string' || t.trim() === '') return;

        setWatchlistActionError(null);
        setIsWatchlistLoading(true);

        try {
            if (isInWatchlist && watchlistItemId) {
                await ApiClient.removeWatchlistItem(watchlistItemId);
                setIsInWatchlist(false);
                setWatchlistItemId(null);
            } else {
                const added = await ApiClient.addWatchlistItem({
                    ticker: t,
                    company_name: result.result.company || '',
                });
                setIsInWatchlist(true);
                setWatchlistItemId(added.id);
            }
        } catch (err: any) {
            if (err.status === 409) {
                try {
                    const response = await ApiClient.getWatchlist();
                    const existing = response.watchlist.find(item => item.ticker.toUpperCase() === t.toUpperCase());
                    if (existing) { setIsInWatchlist(true); setWatchlistItemId(existing.id); }
                    else { setIsInWatchlist(true); }
                } catch (fetchErr) {
                    console.warn('Could not refresh watchlist after conflict', fetchErr);
                    setIsInWatchlist(true);
                }
            } else {
                setWatchlistActionError(err.message || 'Watchlist action failed');
            }
        } finally {
            setIsWatchlistLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const response = await ApiClient.submitResearch({ company, ticker });
            navigate(`/research/${response.job_id}`);
        } catch (err: any) {
            setError(err.message || 'Failed to submit research request.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownload = async () => {
        if (!jobId || status !== 'completed') return;
        setDownloadError(null);
        setIsDownloading(true);
        try {
            const { blob, filename } = await ApiClient.downloadResearchReport(jobId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            if (err.status === 401) {
                setDownloadError("Please sign in again.");
            } else if (err.status === 404) {
                setDownloadError("Research report not found.");
            } else if (err.status === 409) {
                setDownloadError("Research report is not ready yet.");
            } else {
                setDownloadError("Unable to generate the research report. Please try again.");
            }
        } finally {
            setIsDownloading(false);
        }
    };

    // ── Research result view ─────────────────────────────────────
    if (jobId) {
        return (
            <div className="page-content">
                {/* Job header */}
                <div className="panel" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.06em' }}>
                                JOB ID · {jobId}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span className={`badge ${
                                    status === 'completed' ? 'badge-success' :
                                    status === 'failed'    ? 'badge-danger'  : 'badge-warning'
                                }`}>
                                    {status ? status.toUpperCase() : 'LOADING'}
                                </span>
                                {(status === 'queued' || status === 'running') && (
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        Research in progress. This may take a few minutes…
                                    </span>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                            {status === 'completed' && result?.result && result.result.ticker &&
                             typeof result.result.ticker === 'string' && result.result.ticker.trim() !== '' && (
                                <button
                                    className={`btn ${isInWatchlist ? 'btn-outline' : 'btn-primary'} btn-sm`}
                                    onClick={handleWatchlistAction}
                                    disabled={isWatchlistLoading}
                                    style={{ gap: '0.375rem' }}
                                >
                                    {isWatchlistLoading ? '…' : isInWatchlist
                                        ? <><StarOff size={13} /> Remove from Watchlist</>
                                        : <><Star size={13} /> Add to Watchlist</>
                                    }
                                </button>
                            )}
                            {status === 'completed' && (
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                    style={{ gap: '0.375rem' }}
                                >
                                    {isDownloading ? 'Generating PDF...' : <><Download size={13} /> Download Research</>}
                                </button>
                            )}
                            <button className="btn btn-outline btn-sm" onClick={() => navigate('/research')} style={{ gap: '0.375rem' }}>
                                <Plus size={13} /> New Research
                            </button>
                        </div>
                    </div>
                </div>

                {watchlistActionError && (
                    <div className="error-banner" style={{ marginBottom: '1.5rem' }}>{watchlistActionError}</div>
                )}
                {downloadError && (
                    <div className="error-banner" style={{ marginBottom: '1.5rem' }}>{downloadError}</div>
                )}
                {error && (
                    <div className="error-banner" style={{ marginBottom: '1.5rem' }}>{error}</div>
                )}
                {status === 'failed' && (() => {
                    const rawError = result?.error || error || '';
                    const isRateLimit = rawError.toLowerCase().includes('request limit')
                        || rawError.toLowerCase().includes('quota')
                        || rawError.toLowerCase().includes('429')
                        || rawError.toLowerCase().includes('resource_exhausted')
                        || rawError.toLowerCase().includes('temporarily unavailable');

                    const displayMessage = isRateLimit
                        ? "Research is temporarily unavailable because the AI provider has reached its request limit. Please try again shortly."
                        : (rawError || "Research sequence could not complete. Please initiate a new research run.");

                    return (
                        <div className="panel" style={{
                            padding: '1.75rem 1.5rem',
                            marginBottom: '1.5rem',
                            borderLeft: '4px solid var(--danger)',
                            background: 'var(--bg-panel)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: 'var(--danger-bg)', border: '1px solid var(--danger)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)',
                                    flexShrink: 0
                                }}>
                                    <AlertTriangle size={18} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                                        {isRateLimit ? 'AI Request Quota Limit Reached' : 'Research Execution Failed'}
                                    </h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                                        {displayMessage}
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/research')} style={{ gap: '0.375rem' }}>
                                            <RefreshCw size={13} /> Try New Research
                                        </button>
                                        <button className="btn btn-outline btn-sm" onClick={() => navigate('/history')}>
                                            View Past Research
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {status === 'completed' && result?.result && (
                    <ResearchDashboard report={result.result} />
                )}
            </div>
        );
    }

    // ── Research form ─────────────────────────────────────────────
    return (
        <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '3rem' }}>
            <div style={{ width: '100%', maxWidth: '520px' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                        <div style={{
                            width: 36, height: 36, background: 'var(--accent-bg)',
                            border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-sm)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)'
                        }}>
                            <Terminal size={18} />
                        </div>
                        <h1 className="page-title">New Research</h1>
                    </div>
                    <p className="page-subtitle">Initialize an AI-driven public company equity research sequence.</p>
                </div>

                {/* Form panel */}
                <div className="panel" style={{ padding: 0, marginBottom: '1.5rem' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                            <label htmlFor="research-company" className="form-label" style={{ marginBottom: '0.375rem', display: 'block' }}>
                                Company Name
                            </label>
                            <input
                                id="research-company"
                                type="text"
                                placeholder="e.g. Apple Inc."
                                value={company}
                                onChange={e => setCompany(e.target.value)}
                                required
                                style={{
                                    width: '100%', background: 'transparent', border: 'none',
                                    color: 'var(--text-primary)', fontSize: '1.0625rem', fontWeight: 500,
                                    outline: 'none', fontFamily: 'var(--sans)', padding: 0,
                                }}
                            />
                        </div>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                            <label htmlFor="research-ticker" className="form-label" style={{ marginBottom: '0.375rem', display: 'block' }}>
                                Ticker Symbol
                            </label>
                            <input
                                id="research-ticker"
                                type="text"
                                placeholder="e.g. AAPL"
                                value={ticker}
                                onChange={e => setTicker(e.target.value.toUpperCase())}
                                required
                                style={{
                                    width: '100%', background: 'transparent', border: 'none',
                                    color: 'var(--text-primary)', fontSize: '1.0625rem', fontWeight: 600,
                                    fontFamily: 'var(--mono)', outline: 'none', padding: 0, letterSpacing: '0.04em',
                                }}
                            />
                        </div>
                        <div style={{ padding: '1rem 1.25rem' }}>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="btn btn-primary btn-full"
                                style={{ padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 600 }}
                            >
                                {submitting ? 'Initializing Research…' : 'Start Research'}
                            </button>
                            {error && <div className="error-banner" style={{ marginTop: '1rem', marginBottom: 0 }}>{error}</div>}
                        </div>
                    </form>
                </div>

                {/* Data sources */}
                <div className="panel" style={{ padding: '1rem 1.25rem' }}>
                    <div className="panel-title" style={{ marginBottom: '1rem' }}>Data Sources</div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {[
                            { icon: <Activity size={15} />, label: 'Market Data', value: 'Yahoo Finance' },
                            { icon: <Database size={15} />, label: 'Filings', value: 'SEC EDGAR' },
                            { icon: <BrainCircuit size={15} />, label: 'AI Analysis', value: 'Google Gemini' },
                        ].map(src => (
                            <div key={src.label} style={{ flex: 1, minWidth: 110, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                    {src.icon} {src.label}
                                </div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{src.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
