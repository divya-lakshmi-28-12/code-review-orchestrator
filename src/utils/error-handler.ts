/**
 * Error Handler Utilities
 *
 * Provides retry logic with exponential backoff and timeout wrappers
 * for handling transient failures and API rate limits.
 */

import { logger } from './logger.js';

/**
 * Error codes for review system errors
 */
export enum ReviewErrorCode {
  RETRY_EXHAUSTED = 'RETRY_EXHAUSTED',
  TIMEOUT = 'TIMEOUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

/**
 * Custom error class for review system
 */
export class ReviewError extends Error {
  constructor(
    message: string,
    public code: ReviewErrorCode,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ReviewError';
  }
}

/**
 * Options for retry logic
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds before first retry
   * @default 1000
   */
  delayMs?: number;

  /**
   * Maximum delay in milliseconds between retries
   * @default 30000
   */
  maxDelayMs?: number;

  /**
   * Whether to add jitter to retry delays
   * @default true
   */
  useJitter?: boolean;

  /**
   * Callback called on each retry attempt
   */
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Wraps a function with retry logic using exponential backoff
 *
 * Algorithm:
 * 1. Try to execute the function
 * 2. If it succeeds, return the result
 * 3. If it fails and retries remain:
 *    - Calculate backoff delay: delayMs * 2^(attempt - 1)
 *    - Add jitter (random 0-100ms) to prevent thundering herd
 *    - Wait for the calculated duration
 *    - Retry
 * 4. If all retries exhausted, throw ReviewError with RETRY_EXHAUSTED code
 *
 * @param fn Function to retry
 * @param options Retry configuration options
 * @returns Result of the function
 * @throws ReviewError if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    maxDelayMs = 30000,
    useJitter = true,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Try to execute the function
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, throw
      if (attempt > maxRetries) {
        logger.error('All retry attempts exhausted', {
          attempts: attempt,
          error: lastError.message,
        });
        throw new ReviewError(
          `Failed after ${maxRetries} retries: ${lastError.message}`,
          ReviewErrorCode.RETRY_EXHAUSTED,
          lastError
        );
      }

      // Calculate exponential backoff delay: delayMs * 2^(attempt - 1)
      let backoffDelay = delayMs * Math.pow(2, attempt - 1);

      // Cap at maxDelayMs
      backoffDelay = Math.min(backoffDelay, maxDelayMs);

      // Add jitter (random 0-100ms) to prevent thundering herd
      if (useJitter) {
        const jitter = Math.random() * 100;
        backoffDelay += jitter;
      }

      logger.warn('Retry attempt', {
        attempt,
        maxRetries,
        delayMs: Math.round(backoffDelay),
        error: lastError.message,
      });

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait for the calculated duration (wrap setTimeout in Promise)
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  // TypeScript exhaustiveness check - should never reach here
  throw new ReviewError(
    'Unexpected retry loop exit',
    ReviewErrorCode.RETRY_EXHAUSTED,
    lastError!
  );
}

/**
 * Wraps a function with a timeout using Promise.race
 *
 * Algorithm:
 * 1. Race the provided function against a timeout promise
 * 2. The timeout promise should reject after timeoutMs milliseconds
 * 3. Whichever completes first wins
 *
 * @param fn Function to execute with timeout
 * @param timeoutMs Timeout in milliseconds
 * @returns Result of the function
 * @throws ReviewError with TIMEOUT code if timeout is reached
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  // Create a promise that rejects after timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new ReviewError(
          `Operation timed out after ${timeoutMs}ms`,
          ReviewErrorCode.TIMEOUT
        )
      );
    }, timeoutMs);
  });

  // Race the function against the timeout
  try {
    return await Promise.race([fn(), timeoutPromise]);
  } catch (error) {
    if (error instanceof ReviewError && error.code === ReviewErrorCode.TIMEOUT) {
      logger.error('Operation timed out', { timeoutMs });
      throw error;
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Wraps a function with both retry logic and timeout
 *
 * @param fn Function to execute
 * @param timeoutMs Timeout in milliseconds
 * @param retryOptions Retry configuration options
 * @returns Result of the function
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  retryOptions: RetryOptions = {}
): Promise<T> {
  return withRetry(() => withTimeout(fn, timeoutMs), retryOptions);
}

/**
 * Helper to determine if an error is retryable
 *
 * @param error Error to check
 * @returns true if the error should be retried
 */
export function isRetryableError(error: Error): boolean {
  // Network errors are retryable
  if (error.message.includes('ECONNRESET') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND')) {
    return true;
  }

  // Rate limit errors are retryable
  if (error.message.includes('rate limit') ||
      error.message.includes('429')) {
    return true;
  }

  // Service unavailable errors are retryable
  if (error.message.includes('503') ||
      error.message.includes('502') ||
      error.message.includes('504')) {
    return true;
  }

  // Timeout errors are retryable
  if (error instanceof ReviewError && error.code === ReviewErrorCode.TIMEOUT) {
    return true;
  }

  return false;
}

/**
 * Wraps a function with conditional retry based on error type
 *
 * @param fn Function to execute
 * @param options Retry options
 * @returns Result of the function
 */
export async function withConditionalRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(fn, {
    ...options,
    onRetry: (attempt, error) => {
      if (!isRetryableError(error)) {
        throw error; // Don't retry non-retryable errors
      }
      if (options.onRetry) {
        options.onRetry(attempt, error);
      }
    },
  });
}
