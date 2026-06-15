import {Request, Response} from "express";

/**
 * Storage interface - users must implement this for their chosen storage (Redis, In-Memory, etc.)
 */
export interface RateLimitStorage {
  /**
   * Get the current state for a key
   * @returns { tokens: number, lastRefill: number } or null if key doesn't exist
   */
  get(key: string): Promise;

  /**
   * Set the state for a key
   */
  set(key: string, value: {tokens: number; lastRefill: number}): Promise;

  /**
   * Delete a key (optional - for cleanup)
   */
  delete?(key: string): Promise;
}

/**
 * Configuration options for the rate limiter
 */
export interface RateLimitOptions {
  /**
   * Maximum number of tokens in the bucket
   */
  capacity: number;

  /**
   * Number of tokens to refill per interval
   */
  refillRate: number;

  /**
   * Refill interval in milliseconds
   */
  refillInterval: number;

  /**
   * Storage adapter implementation
   */
  storage: RateLimitStorage;

  /**
   * Key generation strategy (default: IP address)
   */
  keyGenerator?: (req: Request) => string;

  /**
   * Custom response handler when rate limit is exceeded
   */
  onLimitReached?: (req: Request, res: Response) => void;

  /**
   * Include rate limit headers in response (default: true)
   */
  includeHeaders?: boolean;

  /**
   * Custom header names
   */
  headers?: {
    limit?: string;
    remaining?: string;
    reset?: string;
  };

  /**
   * Skip rate limiting based on condition
   */
  skip?: (req: Request) => boolean;
}

/**
 * Token Bucket state
 */
export interface BucketState {
  tokens: number;
  lastRefill: number;
}

/**
 * Rate limit info returned to user
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}
