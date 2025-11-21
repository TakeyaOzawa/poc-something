/**
 * Infrastructure Layer: Axios HTTP Client
 * Implements HttpClient interface using Axios library
 *
 * @coverage >=90%
 * @reason HTTP client implementation with retry logic, timeout handling, and logging
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { HttpClient, HttpRequest, HttpResponse } from '@domain/types/http-client.types';
import { Logger } from '@domain/types/logger.types';

export class AxiosHttpClient implements HttpClient {
  private axiosInstance: AxiosInstance;

  constructor(private logger: Logger) {
    this.logger.info('Initializing AxiosHttpClient');

    // Create Axios instance with default config
    this.axiosInstance = axios.create({
      timeout: 10000, // 10 seconds default timeout
      headers: {
        'Content-Type': 'application/json',
      },
      // Use default validateStatus (only 2xx are considered successful)
    });

    // Setup interceptors for logging and error handling
    this.setupInterceptors();

    // Setup retry logic
    this.setupRetryLogic();

    this.logger.info('AxiosHttpClient initialized successfully');
  }

  /**
   * Execute HTTP request
   */
  async request(request: HttpRequest): Promise<HttpResponse> {
    this.logger.info('Executing HTTP request', {
      method: request.method,
      url: request.url,
      hasBody: !!request.body,
      timeout: request.timeout,
    });

    try {
      const axiosConfig: AxiosRequestConfig = {
        method: request.method,
        url: request.url,
        timeout: request.timeout || 10000,
      };

      if (request.headers) {
        axiosConfig.headers = request.headers;
      }

      if (request.body) {
        axiosConfig.data = request.body;
      }

      const response = await this.axiosInstance.request(axiosConfig);

      const httpResponse: HttpResponse = {
        status: response.status,
        statusText: response.statusText || 'OK', // Default to 'OK' if not provided by mock
        headers: response.headers as { [key: string]: string },
        // Always JSON.stringify the response data to ensure consistent string format
        body: JSON.stringify(response.data),
      };

      this.logger.info('HTTP request completed successfully', {
        method: request.method,
        url: request.url,
        status: response.status,
        statusText: response.statusText,
      });

      return httpResponse;
    } catch (error) {
      this.logger.error('HTTP request failed', error, {
        method: request.method,
        url: request.url,
      });

      if (axios.isAxiosError(error)) {
        throw this.convertAxiosError(error);
      }

      throw error;
    }
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger.debug('Axios request interceptor', {
          method: config.method,
          url: config.url,
          hasData: !!config.data,
        });
        return config;
      },
      (error) => {
        this.logger.error('Axios request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.debug('Axios response interceptor', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        this.logger.debug('Axios response interceptor error', {
          message: error.message,
          url: error.config?.url,
          status: error.response?.status,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Setup retry logic using axios-retry
   */
  private setupRetryLogic(): void {
    axiosRetry(this.axiosInstance, {
      retries: 3, // Retry up to 3 times
      retryDelay: axiosRetry.exponentialDelay, // Exponential backoff
      retryCondition: (error: AxiosError) => {
        // Retry on network errors or 5xx errors
        if (axiosRetry.isNetworkOrIdempotentRequestError(error)) {
          this.logger.warn('Retrying request due to network error', {
            url: error.config?.url,
            message: error.message,
          });
          return true;
        }

        // Retry on rate limit (429) or service unavailable (503)
        if (error.response?.status === 429 || error.response?.status === 503) {
          this.logger.warn('Retrying request due to rate limit or service unavailable', {
            url: error.config?.url,
            status: error.response.status,
          });
          return true;
        }

        return false;
      },
      onRetry: (retryCount, error, requestConfig) => {
        this.logger.info('Retrying HTTP request', {
          retryCount,
          url: requestConfig.url,
          method: requestConfig.method,
          errorMessage: error.message,
        });
      },
    });
  }

  /**
   * Convert Axios error to standard Error with useful information
   */
  private convertAxiosError(error: AxiosError): Error {
    if (error.response) {
      // Server responded with error status
      const message = `HTTP ${error.response.status}: ${error.response.statusText} - ${error.config?.url}`;
      const convertedError = new Error(message) as Error & {
        status?: number;
        statusText?: string;
        responseBody?: unknown;
      };
      convertedError.status = error.response.status;
      convertedError.statusText = error.response.statusText;
      convertedError.responseBody = error.response.data;
      return convertedError;
    } else if (
      error.request ||
      error.code === 'ECONNABORTED' ||
      error.message.includes('Network Error')
    ) {
      // Request was made but no response received (network error, timeout, etc.)
      const message = `No response received from ${error.config?.url}: ${error.message}`;
      const convertedError = new Error(message) as Error & { code?: string };
      convertedError.code = error.code;
      return convertedError;
    } else {
      // Error setting up the request
      const message = `Request setup failed: ${error.message}`;
      return new Error(message);
    }
  }
}
