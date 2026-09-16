import type { 
    ResearchRequest, ResearchJobResponse, ResearchHistoryResponse, 
    WatchlistItemRequest, WatchlistItem, WatchlistResponse,
    PortfolioItemRequest, PortfolioItemUpdate, PortfolioItem, PortfolioResponse,
    MarketMoversResponse, ScreenerItem
} from '../types/api';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
    console.error('CRITICAL: VITE_API_BASE_URL is not set in production environment variables.');
}

export class ApiClient {
    private static async fetchWithHandling(url: string, options?: RequestInit) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...options?.headers as Record<string, string>,
            };

            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
                (error as any).status = response.status;
                throw error;
            }

            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async checkHealth(): Promise<{ status: string }> {
        return this.fetchWithHandling('/health');
    }

    static async submitResearch(data: ResearchRequest): Promise<ResearchJobResponse> {
        return this.fetchWithHandling('/api/v1/research', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async getResearchStatus(jobId: string): Promise<ResearchJobResponse> {
        return this.fetchWithHandling(`/api/v1/research/${jobId}`);
    }

    static async getResearchHistory(limit: number = 20): Promise<ResearchHistoryResponse> {
        return this.fetchWithHandling(`/api/v1/research/history?limit=${limit}`);
    }

    static async getWatchlist(): Promise<WatchlistResponse> {
        return this.fetchWithHandling('/api/v1/watchlist');
    }

    static async addWatchlistItem(data: WatchlistItemRequest): Promise<WatchlistItem> {
        return this.fetchWithHandling('/api/v1/watchlist', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async removeWatchlistItem(itemId: string): Promise<void> {
        return this.fetchWithHandling(`/api/v1/watchlist/${itemId}`, {
            method: 'DELETE',
        });
    }

    // --- PORTFOLIO ---
    static async getPortfolio(): Promise<PortfolioResponse> {
        return this.fetchWithHandling('/api/v1/portfolio');
    }

    static async addPortfolioItem(data: PortfolioItemRequest): Promise<PortfolioItem> {
        return this.fetchWithHandling('/api/v1/portfolio', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async updatePortfolioItem(itemId: string, data: PortfolioItemUpdate): Promise<PortfolioItem> {
        return this.fetchWithHandling(`/api/v1/portfolio/${itemId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    static async deletePortfolioItem(itemId: string): Promise<void> {
        return this.fetchWithHandling(`/api/v1/portfolio/${itemId}`, {
            method: 'DELETE',
        });
    }

    // --- MARKETS ---
    static async getMarketQuote(ticker: string): Promise<any> {
        return this.fetchWithHandling(`/api/v1/markets/quote?ticker=${encodeURIComponent(ticker)}`);
    }

    static async getMarketMovers(): Promise<MarketMoversResponse> {
        return this.fetchWithHandling('/api/v1/markets/movers');
    }

    static async getScreenerResults(filters: Record<string, number | undefined>): Promise<ScreenerItem[]> {
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined) {
                queryParams.append(key, value.toString());
            }
        }
        const qs = queryParams.toString();
        const url = `/api/v1/markets/screener${qs ? '?' + qs : ''}`;
        return this.fetchWithHandling(url);
    }
}
