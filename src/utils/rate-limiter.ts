/**
 * Rate Limiter
 *
 * Implements token bucket algorithm with sliding window to prevent API throttling.
 * Tracks both request count and token usage over a 60-second sliding window.
 */

import { logger } from './logger.js';

/**
 * Configuration for rate limiter
 */
export interface RateLimiterConfig {
  /**
   * Maximum concurrent requests allowed
   * @default 5
   */
  maxConcurrentRequests?: number;

  /**
   * Maximum requests per minute
   * @default 60
   */
  requestsPerMinute?: number;

  /**
   * Maximum tokens per minute
   * @default 100000
   */
  tokensPerMinute?: number;
}

/**
 * Request record for tracking in sliding window
 */
interface RequestRecord {
  timestamp: number;
  tokens: number;
}

/**
 * Rate Limiter Class
 *
 * Uses sliding window algorithm to track requests and tokens over time.
 * Provides smooth rate limiting vs. fixed time buckets.
 */
export class RateLimiter {
  private maxConcurrentRequests: number;
  private requestsPerMinute: number;
  private tokensPerMinute: number;

  // Track active requests
  private activeRequests: number = 0;

  // Track request history for sliding window (last 60 seconds)
  private requestHistory: RequestRecord[] = [];

  // Queue for waiting concurrent requests
  private waitQueue: Array<() => void> = [];

  constructor(config: RateLimiterConfig = {}) {
    this.maxConcurrentRequests = config.maxConcurrentRequests ?? 5;
    this.requestsPerMinute = config.requestsPerMinute ?? 60;
    this.tokensPerMinute = config.tokensPerMinute ?? 100000;

    logger.info('Rate limiter initialized', {
      maxConcurrentRequests: this.maxConcurrentRequests,
      requestsPerMinute: this.requestsPerMinute,
      tokensPerMinute: this.tokensPerMinute,
    });
  }

  /**
   * Prune old records from the sliding window
   *
   * Algorithm:
   * - Filter requestHistory to keep only records from the last 60 seconds
   * - Use Array.filter() and timestamp comparison
   */
  private pruneOldRecords(): void {
    const now = Date.now();
    const windowStart = now - 60000; // 60 seconds ago

    // Filter to keep only records within the sliding window
    this.requestHistory = this.requestHistory.filter(
      (record) => record.timestamp > windowStart
    );
  }

  /**
   * Check if a request can proceed immediately
   *
   * Algorithm:
   * 1. Call pruneOldRecords() first
   * 2. Check three conditions:
   *    - concurrent requests < maxConcurrentRequests
   *    - requests in last 60s < requestsPerMinute
   *    - tokens in last 60s + estimatedTokens <= tokensPerMinute
   * 3. Return true only if all conditions are met
   *
   * @param estimatedTokens Estimated tokens for the request
   * @returns true if request can proceed immediately
   */
  private canProceed(estimatedTokens: number): boolean {
    // Prune old records first
    this.pruneOldRecords();

    // Check concurrent requests limit
    if (this.activeRequests >= this.maxConcurrentRequests) {
      return false;
    }

    // Check requests per minute limit
    if (this.requestHistory.length >= this.requestsPerMinute) {
      return false;
    }

    // Check tokens per minute limit
    const tokensUsed = this.requestHistory.reduce(
      (sum, record) => sum + record.tokens,
      0
    );

    if (tokensUsed + estimatedTokens > this.tokensPerMinute) {
      return false;
    }

    return true;
  }

  /**
   * Wait for a concurrent request slot
   *
   * Algorithm:
   * - Create a Promise and add its resolve function to waitQueue
   * - The resolve will be called later by release()
   *
   * @returns Promise that resolves when a slot is available
   */
  private async waitForSlot(): Promise<void> {
    if (this.activeRequests < this.maxConcurrentRequests) {
      return; // Slot available immediately
    }

    // Wait for a slot to become available
    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  /**
   * Wait until rate limits allow the request
   *
   * Algorithm:
   * 1. Loop while canProceed() returns false
   * 2. Calculate wait time based on when the oldest request expires
   * 3. Sleep and check again
   *
   * @param estimatedTokens Estimated tokens for the request
   */
  private async waitForRateLimit(estimatedTokens: number): Promise<void> {
    while (!this.canProceed(estimatedTokens)) {
      // Calculate how long to wait
      const now = Date.now();
      const windowStart = now - 60000;

      // Find oldest request in the window
      const oldestRecord = this.requestHistory[0];

      if (oldestRecord) {
        // Wait until the oldest request expires from the window
        const waitTime = Math.max(
          100, // Minimum 100ms
          oldestRecord.timestamp - windowStart + 100 // Add small buffer
        );

        logger.debug('Rate limit reached, waiting', {
          waitTimeMs: waitTime,
          activeRequests: this.activeRequests,
          requestsInWindow: this.requestHistory.length,
        });

        await new Promise((resolve) => setTimeout(resolve, waitTime));

        // Prune after waiting
        this.pruneOldRecords();
      } else {
        // No records but still can't proceed (concurrent limit)
        // Wait a short time and retry
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Acquire permission to make a request
   *
   * Main entry point for rate limiting. This method:
   * 1. Waits for a concurrent slot (use waitForSlot())
   * 2. Waits for rate limit (use waitForRateLimit())
   * 3. Increments activeRequests
   * 4. Adds record to requestHistory
   *
   * @param estimatedTokens Estimated tokens for the request
   */
  async acquire(estimatedTokens: number = 1000): Promise<void> {
    logger.debug('Acquiring rate limit slot', { estimatedTokens });

    // Step 1: Wait for a concurrent slot
    await this.waitForSlot();

    // Step 2: Wait for rate limits to allow the request
    await this.waitForRateLimit(estimatedTokens);

    // Step 3: Increment active requests
    this.activeRequests++;

    // Step 4: Add record to request history
    this.requestHistory.push({
      timestamp: Date.now(),
      tokens: estimatedTokens,
    });

    logger.debug('Rate limit slot acquired', {
      activeRequests: this.activeRequests,
      requestsInWindow: this.requestHistory.length,
    });
  }

  /**
   * Release a concurrent request slot
   *
   * Call this after a request completes to:
   * 1. Decrement activeRequests
   * 2. Process waitQueue to release next waiting request
   */
  release(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);

    logger.debug('Rate limit slot released', {
      activeRequests: this.activeRequests,
    });

    // Process wait queue
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift();
      if (resolve) {
        resolve();
      }
    }
  }

  /**
   * Execute a function with rate limiting
   *
   * @param fn Function to execute
   * @param estimatedTokens Estimated tokens for the request
   * @returns Result of the function
   */
  async execute<T>(
    fn: () => Promise<T>,
    estimatedTokens: number = 1000
  ): Promise<T> {
    await this.acquire(estimatedTokens);

    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  /**
   * Get current rate limiter statistics
   */
  getStats(): {
    activeRequests: number;
    requestsInWindow: number;
    tokensInWindow: number;
  } {
    this.pruneOldRecords();

    const tokensInWindow = this.requestHistory.reduce(
      (sum, record) => sum + record.tokens,
      0
    );

    return {
      activeRequests: this.activeRequests,
      requestsInWindow: this.requestHistory.length,
      tokensInWindow,
    };
  }

  /**
   * Reset the rate limiter state
   */
  reset(): void {
    this.activeRequests = 0;
    this.requestHistory = [];
    this.waitQueue = [];
    logger.info('Rate limiter reset');
  }
}

/**
 * Global rate limiter instance
 */
export const globalRateLimiter = new RateLimiter({
  maxConcurrentRequests: parseInt(process.env.RATE_LIMIT_CONCURRENT || '5'),
  requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
  tokensPerMinute: parseInt(process.env.RATE_LIMIT_TOKENS_PER_MINUTE || '100000'),
});
