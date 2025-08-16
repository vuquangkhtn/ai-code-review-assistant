import * as vscode from 'vscode';
import { ReviewResult, UserPreferences } from '../types';

export class StorageManager {
    private globalState: vscode.Memento;
    private readonly REVIEW_RESULTS_KEY = 'aiCodeReview.results';
    private readonly USER_PREFERENCES_KEY = 'aiCodeReview.preferences';
    private readonly CACHE_KEY = 'aiCodeReview.cache';

    constructor(globalState: vscode.Memento) {
        this.globalState = globalState;
    }

    public async saveReviewResult(result: ReviewResult): Promise<void> {
        try {
            const existingResults = this.getReviewResults();
            
            // Serialize the result to handle Date objects properly
            const serializedResult = this.serializeReviewResult(result);
            existingResults.push(serializedResult);
            
            // Keep only the last 50 results to prevent storage bloat
            if (existingResults.length > 50) {
                existingResults.splice(0, existingResults.length - 50);
            }
            
            await this.globalState.update(this.REVIEW_RESULTS_KEY, existingResults);
            console.log('StorageManager: Saved review result with', result.issues?.length || 0, 'issues');
        } catch (error) {
            console.error('Failed to save review result:', error);
        }
    }

    public getReviewResults(): ReviewResult[] {
        try {
            const storedResults = this.globalState.get<any[]>(this.REVIEW_RESULTS_KEY, []);
            const deserializedResults = storedResults.map(result => this.deserializeReviewResult(result));
            console.log('StorageManager: Retrieved', deserializedResults.length, 'review results from storage');
            return deserializedResults;
        } catch (error) {
            console.error('Failed to get review results:', error);
            return [];
        }
    }

    public async getReviewResultById(id: string): Promise<ReviewResult | undefined> {
        const results = this.getReviewResults();
        return results.find(result => 
            result.issues.some(issue => issue.id === id) ||
            result.metadata.timestamp.getTime().toString() === id
        );
    }

    public async deleteReviewResult(timestamp: Date): Promise<void> {
        try {
            const existingResults = this.getReviewResults();
            const filteredResults = existingResults.filter(result => 
                result.metadata.timestamp.getTime() !== timestamp.getTime()
            );
            
            await this.globalState.update(this.REVIEW_RESULTS_KEY, filteredResults);
        } catch (error) {
            console.error('Failed to delete review result:', error);
        }
    }

    public async clearAllReviewResults(): Promise<void> {
        try {
            await this.globalState.update(this.REVIEW_RESULTS_KEY, []);
        } catch (error) {
            console.error('Failed to clear review results:', error);
        }
    }

    public async saveUserPreferences(preferences: UserPreferences): Promise<void> {
        try {
            await this.globalState.update(this.USER_PREFERENCES_KEY, preferences);
        } catch (error) {
            console.error('Failed to save user preferences:', error);
        }
    }

    public async getUserPreferences(): Promise<UserPreferences | undefined> {
        return this.globalState.get<UserPreferences>(this.USER_PREFERENCES_KEY);
    }

    public async updateUserPreferences(updates: Partial<UserPreferences>): Promise<void> {
        try {
            const existing = await this.getUserPreferences();
            const updated = { ...existing, ...updates };
            await this.saveUserPreferences(updated as UserPreferences);
        } catch (error) {
            console.error('Failed to update user preferences:', error);
        }
    }

    public async saveToCache(key: string, data: any, ttl: number = 3600000): Promise<void> {
        try {
            const cache = this.getCache();
            cache[key] = {
                data,
                timestamp: Date.now(),
                ttl
            };
            
            // Clean up expired cache entries
            this.cleanupCache(cache);
            
            await this.globalState.update(this.CACHE_KEY, cache);
        } catch (error) {
            console.error('Failed to save to cache:', error);
        }
    }

    public getFromCache<T>(key: string): T | undefined {
        try {
            const cache = this.getCache();
            const entry = cache[key];
            
            if (!entry) {
                return undefined;
            }
            
            // Check if cache entry has expired
            if (Date.now() - entry.timestamp > entry.ttl) {
                delete cache[key];
                this.globalState.update(this.CACHE_KEY, cache);
                return undefined;
            }
            
            return entry.data as T;
        } catch (error) {
            console.error('Failed to get from cache:', error);
            return undefined;
        }
    }

    public async clearCache(): Promise<void> {
        try {
            await this.globalState.update(this.CACHE_KEY, {});
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }

    public async clearExpiredCache(): Promise<void> {
        try {
            const cache = this.getCache();
            this.cleanupCache(cache);
            await this.globalState.update(this.CACHE_KEY, cache);
        } catch (error) {
            console.error('Failed to clear expired cache:', error);
        }
    }

    private getCache(): Record<string, { data: any; timestamp: number; ttl: number }> {
        return this.globalState.get<Record<string, { data: any; timestamp: number; ttl: number }>>(this.CACHE_KEY, {});
    }

    private cleanupCache(cache: Record<string, { data: any; timestamp: number; ttl: number }>): void {
        const now = Date.now();
        Object.keys(cache).forEach(key => {
            const entry = cache[key];
            if (now - entry.timestamp > entry.ttl) {
                delete cache[key];
            }
        });
    }

    public async exportData(): Promise<string> {
        try {
            const data = {
                reviewResults: this.getReviewResults(),
                userPreferences: await this.getUserPreferences(),
                cache: this.getCache(),
                exportTimestamp: new Date().toISOString()
            };
            
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Failed to export data:', error);
            throw new Error('Failed to export data');
        }
    }

    public async importData(jsonData: string): Promise<void> {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.reviewResults) {
                await this.globalState.update(this.REVIEW_RESULTS_KEY, data.reviewResults);
            }
            
            if (data.userPreferences) {
                await this.saveUserPreferences(data.userPreferences);
            }
            
            if (data.cache) {
                await this.globalState.update(this.CACHE_KEY, data.cache);
            }
        } catch (error) {
            console.error('Failed to import data:', error);
            throw new Error('Failed to import data: Invalid format');
        }
    }

    public getStorageStats(): { reviewResults: number; cacheEntries: number; totalSize: number } {
        const reviewResults = this.getReviewResults().length;
        const cache = this.getCache();
        const cacheEntries = Object.keys(cache).length;
        
        // Estimate total size (rough calculation)
        const totalSize = JSON.stringify({
            reviewResults: this.getReviewResults(),
            cache
        }).length;
        
        return {
            reviewResults,
            cacheEntries,
            totalSize
        };
    }

    private serializeReviewResult(result: ReviewResult): any {
        return {
            ...result,
            metadata: {
                ...result.metadata,
                timestamp: result.metadata.timestamp.toISOString()
            },
            issues: result.issues.map(issue => ({
                ...issue,
                timestamp: issue.timestamp.toISOString()
            }))
        };
    }

    private deserializeReviewResult(data: any): ReviewResult {
        return {
            ...data,
            metadata: {
                ...data.metadata,
                timestamp: new Date(data.metadata.timestamp)
            },
            issues: data.issues.map((issue: any) => ({
                ...issue,
                timestamp: new Date(issue.timestamp)
            }))
        };
    }
}
