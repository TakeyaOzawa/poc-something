/**
 * Unit Tests: ChromeHttpClient
 */

import { ChromeHttpClient } from '../ChromeHttpClient';
import { Logger } from '@domain/types/logger.types';
import { HttpRequest } from '@domain/types/http-client.types';

// Mock fetch
global.fetch = jest.fn();

describe('ChromeHttpClient', () => {
  let client: ChromeHttpClient;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    client = new ChromeHttpClient(mockLogger);
  });

  describe('request - GET', () => {
    it('should execute GET request successfully', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        text: jest.fn().mockResolvedValue('{"data": "test"}'),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request: HttpRequest = {
        method: 'GET',
        url: 'https://api.example.com/data',
        headers: { Authorization: 'Bearer token' },
      };

      const response = await client.request(request);

      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(response.body).toBe('{"data": "test"}');
      expect(response.headers['content-type']).toBe('application/json');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: 'Bearer token' },
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'HTTP GET request to https://api.example.com/data'
      );
      expect(mockLogger.info).toHaveBeenCalledWith('HTTP GET response: 200 OK');
    });

    it('should handle 404 response', async () => {
      const mockResponse = {
        status: 404,
        statusText: 'Not Found',
        headers: new Map([]),
        text: jest.fn().mockResolvedValue('Not Found'),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request: HttpRequest = {
        method: 'GET',
        url: 'https://api.example.com/notfound',
      };

      const response = await client.request(request);

      expect(response.status).toBe(404);
      expect(response.statusText).toBe('Not Found');
      expect(response.body).toBe('Not Found');
    });
  });

  describe('request - POST', () => {
    it('should execute POST request with body', async () => {
      const mockResponse = {
        status: 201,
        statusText: 'Created',
        headers: new Map([['content-type', 'application/json']]),
        text: jest.fn().mockResolvedValue('{"id": "123"}'),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request: HttpRequest = {
        method: 'POST',
        url: 'https://api.example.com/data',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name": "test"}',
      };

      const response = await client.request(request);

      expect(response.status).toBe(201);
      expect(response.body).toBe('{"id": "123"}');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          method: 'POST',
          body: '{"name": "test"}',
        })
      );
    });
  });

  describe('request - PUT', () => {
    it('should execute PUT request', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: new Map([]),
        text: jest.fn().mockResolvedValue('{"updated": true}'),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request: HttpRequest = {
        method: 'PUT',
        url: 'https://api.example.com/data/123',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name": "updated"}',
      };

      const response = await client.request(request);

      expect(response.status).toBe(200);
      expect(response.body).toBe('{"updated": true}');
    });
  });

  describe('request - DELETE', () => {
    it('should execute DELETE request', async () => {
      const mockResponse = {
        status: 204,
        statusText: 'No Content',
        headers: new Map([]),
        text: jest.fn().mockResolvedValue(''),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request: HttpRequest = {
        method: 'DELETE',
        url: 'https://api.example.com/data/123',
      };

      const response = await client.request(request);

      expect(response.status).toBe(204);
      expect(response.body).toBe('');
    });
  });

  describe('timeout handling', () => {
    it('should timeout after specified duration', async () => {
      // Mock fetch to return a promise that respects abort signal
      (global.fetch as jest.Mock).mockImplementation(
        (url: string, options: any) =>
          new Promise((resolve, reject) => {
            // Listen for abort signal
            options.signal.addEventListener('abort', () => {
              const error = new Error('The operation was aborted');
              error.name = 'AbortError';
              reject(error);
            });

            // Simulate a slow response (never resolves)
            setTimeout(() => {
              resolve({
                status: 200,
                statusText: 'OK',
                headers: new Map([]),
                text: jest.fn().mockResolvedValue('response'),
              });
            }, 5000);
          })
      );

      const request: HttpRequest = {
        method: 'GET',
        url: 'https://api.example.com/slow',
        timeout: 1000,
      };

      await expect(client.request(request)).rejects.toThrow('Request timeout after 1000ms');
    });

    it('should use default timeout of 30000ms', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: new Map([]),
        text: jest.fn().mockResolvedValue('ok'),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request: HttpRequest = {
        method: 'GET',
        url: 'https://api.example.com/data',
      };

      await client.request(request);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should throw error if fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const request: HttpRequest = {
        method: 'GET',
        url: 'https://api.example.com/data',
      };

      await expect(client.request(request)).rejects.toThrow('Network error');

      expect(mockLogger.error).toHaveBeenCalledWith('HTTP GET request failed', expect.any(Error));
    });

    it('should throw error if response body reading fails', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: new Map([]),
        text: jest.fn().mockRejectedValue(new Error('Body read error')),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request: HttpRequest = {
        method: 'GET',
        url: 'https://api.example.com/data',
      };

      await expect(client.request(request)).rejects.toThrow('Body read error');
    });

    it('should handle non-Error exceptions', async () => {
      (global.fetch as jest.Mock).mockRejectedValue('Unknown error');

      const request: HttpRequest = {
        method: 'GET',
        url: 'https://api.example.com/data',
      };

      await expect(client.request(request)).rejects.toThrow('HTTP request failed');
    });
  });

  describe('headers handling', () => {
    it('should convert response headers to plain object', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: new Map([
          ['content-type', 'application/json'],
          ['content-length', '123'],
          ['x-custom-header', 'value'],
        ]),
        text: jest.fn().mockResolvedValue('{}'),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request: HttpRequest = {
        method: 'GET',
        url: 'https://api.example.com/data',
      };

      const response = await client.request(request);

      expect(response.headers).toEqual({
        'content-type': 'application/json',
        'content-length': '123',
        'x-custom-header': 'value',
      });
    });

    it('should handle empty headers', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: new Map([]),
        text: jest.fn().mockResolvedValue('ok'),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request: HttpRequest = {
        method: 'GET',
        url: 'https://api.example.com/data',
      };

      const response = await client.request(request);

      expect(response.headers).toEqual({});
    });
  });
});
