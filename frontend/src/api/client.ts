import type { ResearchRequest, ResearchJobResponse, ResearchHistoryResponse, WatchlistItemRequest, WatchlistItem, WatchlistResponse } from '../types/api';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
}
