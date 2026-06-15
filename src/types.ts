export interface BucketState {
    tokens: number;
    lastRefill: number;
}

export interface RateLimitStorage {
    get(key: string): Promise<BucketState | null>;
    set(key: string, value: BucketState): Promise<void>;
    delete?(key: string): Promise<void>;
}

export interface RateLimitOptions {
    capacity: number;
    refillRate: number;
    refillInterval: number;
    storage: RateLimitStorage;
    keyGenerator?: (req: any) => string;
    onLimitReached?: (req: any, res: any) => void;
    includeHeaders?: boolean;
    headers?: {
        limit: string;
        remaining: string;
        reset: string;
    };
    skip?: (req: any) => boolean;
}
