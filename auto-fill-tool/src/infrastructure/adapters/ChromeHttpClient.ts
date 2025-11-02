/**
 * Infrastructure Service: Chrome HTTP Client
 * Implements HTTP client using Fetch API
 */

import { HttpClient, HttpRequest, HttpResponse } from '@domain/types/http-client.types';
import { Logger } from '@domain/types/logger.types';

export class ChromeHttpClient implements HttpClient {
  constructor(private logger: Logger) {}

  async request(request: HttpRequest): Promise<HttpResponse> {
    const { method, url, headers, body, timeout = 30000 } = request;

    try {
      this.logger.info(`HTTP ${method} request to ${url}`);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const fetchOptions: RequestInit = {
          method,
          signal: controller.signal,
        };

        if (headers) {
          fetchOptions.headers = headers;
        }

        if (body) {
          fetchOptions.body = body;
        }

        const response = await fetch(url, fetchOptions);

        clearTimeout(timeoutId);

        // Read response body as text
        const responseBody = await response.text();

        // Convert Headers to plain object
        const responseHeaders: { [key: string]: string } = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        const httpResponse: HttpResponse = {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: responseBody,
        };

        this.logger.info(`HTTP ${method} response: ${response.status} ${response.statusText}`);

        return httpResponse;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }

        throw error;
      }
    } catch (error) {
      this.logger.error(`HTTP ${method} request failed`, error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('HTTP request failed');
    }
  }
}
