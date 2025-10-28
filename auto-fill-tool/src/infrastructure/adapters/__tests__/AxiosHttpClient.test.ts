/**
 * Tests for AxiosHttpClient
 */

import axios, { AxiosError } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { AxiosHttpClient } from '../AxiosHttpClient';
import { HttpRequest } from '@domain/types/http-client.types';
import { Logger } from '@domain/types/logger.types';

// Mock Logger
const createMockLogger = (): jest.Mocked<Logger> => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  setLevel: jest.fn(),
  getLevel: jest.fn(),
  createChild: jest.fn(),
});

describe('AxiosHttpClient', () => {
  let client: AxiosHttpClient;
  let mockLogger: jest.Mocked<Logger>;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockLogger = createMockLogger();
    client = new AxiosHttpClient(mockLogger);
    // Access the private axiosInstance for mocking
    mockAxios = new MockAdapter((client as any).axiosInstance);
  });

  afterEach(() => {
    mockAxios.reset();
  });

  describe('constructor', () => {
    it('should initialize with logger', () => {
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing AxiosHttpClient');
      expect(mockLogger.info).toHaveBeenCalledWith('AxiosHttpClient initialized successfully');
    });
  });

  describe('request - GET', () => {
    it('should execute successful GET request', async () => {
      const url = 'https://api.example.com/data';
      const responseData = { message: 'success', data: [1, 2, 3] };

      mockAxios.onGet(url).reply(200, responseData);

      const request: HttpRequest = {
        method: 'GET',
        url,
      };

      const response = await client.request(request);

      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(response.body).toBe(JSON.stringify(responseData));
      expect(mockLogger.info).toHaveBeenLastCalledWith(
        'HTTP request completed successfully',
        expect.objectContaining({
          method: 'GET',
          url,
          status: 200,
        })
      );
    });

    it('should execute GET request with custom headers', async () => {
      const url = 'https://api.example.com/data';
      const headers = { Authorization: 'Bearer token123', 'X-Custom': 'value' };
      const responseData = { result: 'ok' };

      mockAxios.onGet(url).reply(200, responseData);

      const request: HttpRequest = {
        method: 'GET',
        url,
        headers,
      };

      const response = await client.request(request);

      expect(response.status).toBe(200);
      expect(JSON.parse(response.body)).toEqual(responseData);
    });

    it('should execute GET request with custom timeout', async () => {
      const url = 'https://api.example.com/data';
      const responseData = { result: 'ok' };

      mockAxios.onGet(url).reply(200, responseData);

      const request: HttpRequest = {
        method: 'GET',
        url,
        timeout: 5000,
      };

      const response = await client.request(request);

      expect(response.status).toBe(200);
    });
  });

  describe('request - POST', () => {
    it('should execute successful POST request with body', async () => {
      const url = 'https://api.example.com/users';
      const requestBody = JSON.stringify({ name: 'Alice', email: 'alice@example.com' });
      const responseData = { id: '123', name: 'Alice', email: 'alice@example.com' };

      mockAxios.onPost(url).reply(201, responseData);

      const request: HttpRequest = {
        method: 'POST',
        url,
        body: requestBody,
      };

      const response = await client.request(request);

      expect(response.status).toBe(201);
      expect(JSON.parse(response.body)).toEqual(responseData);
    });
  });

  describe('request - PUT', () => {
    it('should execute successful PUT request', async () => {
      const url = 'https://api.example.com/users/123';
      const requestBody = JSON.stringify({ name: 'Alice Updated' });
      const responseData = { id: '123', name: 'Alice Updated' };

      mockAxios.onPut(url).reply(200, responseData);

      const request: HttpRequest = {
        method: 'PUT',
        url,
        body: requestBody,
      };

      const response = await client.request(request);

      expect(response.status).toBe(200);
      expect(JSON.parse(response.body)).toEqual(responseData);
    });
  });

  describe('request - DELETE', () => {
    it('should execute successful DELETE request', async () => {
      const url = 'https://api.example.com/users/123';

      mockAxios.onDelete(url).reply(204);

      const request: HttpRequest = {
        method: 'DELETE',
        url,
      };

      const response = await client.request(request);

      expect(response.status).toBe(204);
    });
  });

  describe('request - PATCH', () => {
    it('should execute successful PATCH request', async () => {
      const url = 'https://api.example.com/users/123';
      const requestBody = JSON.stringify({ email: 'newemail@example.com' });
      const responseData = { id: '123', email: 'newemail@example.com' };

      mockAxios.onPatch(url).reply(200, responseData);

      const request: HttpRequest = {
        method: 'PATCH',
        url,
        body: requestBody,
      };

      const response = await client.request(request);

      expect(response.status).toBe(200);
      expect(JSON.parse(response.body)).toEqual(responseData);
    });
  });

  describe('error handling', () => {
    it('should handle 404 Not Found error', async () => {
      const url = 'https://api.example.com/not-found';

      mockAxios.onGet(url).reply(404, { error: 'Not found' });

      const request: HttpRequest = {
        method: 'GET',
        url,
      };

      await expect(client.request(request)).rejects.toThrow('HTTP 404');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'HTTP request failed',
        expect.any(Error),
        expect.objectContaining({
          method: 'GET',
          url,
        })
      );
    });

    it('should handle 500 Internal Server Error', async () => {
      const url = 'https://api.example.com/server-error';

      mockAxios.onGet(url).reply(500, { error: 'Internal server error' });

      const request: HttpRequest = {
        method: 'GET',
        url,
      };

      await expect(client.request(request)).rejects.toThrow('HTTP 500');
    });

    it('should handle network error (no response)', async () => {
      const url = 'https://api.example.com/network-error';

      mockAxios.onGet(url).networkError();

      const request: HttpRequest = {
        method: 'GET',
        url,
      };

      await expect(client.request(request)).rejects.toThrow('No response received');
    });

    it('should handle timeout error', async () => {
      const url = 'https://api.example.com/timeout';

      mockAxios.onGet(url).timeout();

      const request: HttpRequest = {
        method: 'GET',
        url,
      };

      await expect(client.request(request)).rejects.toThrow();
    });

    it('should handle 401 Unauthorized error', async () => {
      const url = 'https://api.example.com/unauthorized';

      mockAxios.onGet(url).reply(401, { error: 'Unauthorized' });

      const request: HttpRequest = {
        method: 'GET',
        url,
      };

      await expect(client.request(request)).rejects.toThrow('HTTP 401');
    });

    it('should handle 403 Forbidden error', async () => {
      const url = 'https://api.example.com/forbidden';

      mockAxios.onGet(url).reply(403, { error: 'Forbidden' });

      const request: HttpRequest = {
        method: 'GET',
        url,
      };

      await expect(client.request(request)).rejects.toThrow('HTTP 403');
    });
  });

  describe('response body handling', () => {
    it('should handle string response body', async () => {
      const url = 'https://api.example.com/text';
      const responseText = 'Plain text response';

      mockAxios.onGet(url).reply(200, responseText);

      const request: HttpRequest = {
        method: 'GET',
        url,
      };

      const response = await client.request(request);

      expect(response.body).toBe(JSON.stringify(responseText));
    });

    it('should handle JSON response body', async () => {
      const url = 'https://api.example.com/json';
      const responseData = { key: 'value', nested: { data: 123 } };

      mockAxios.onGet(url).reply(200, responseData);

      const request: HttpRequest = {
        method: 'GET',
        url,
      };

      const response = await client.request(request);

      expect(JSON.parse(response.body)).toEqual(responseData);
    });

    it('should handle empty response body', async () => {
      const url = 'https://api.example.com/empty';

      mockAxios.onGet(url).reply(204);

      const request: HttpRequest = {
        method: 'GET',
        url,
      };

      const response = await client.request(request);

      expect(response.status).toBe(204);
    });
  });

  describe('headers', () => {
    it('should include response headers', async () => {
      const url = 'https://api.example.com/headers';
      const responseHeaders = {
        'content-type': 'application/json',
        'x-request-id': 'abc123',
      };

      mockAxios.onGet(url).reply(200, { data: 'test' }, responseHeaders);

      const request: HttpRequest = {
        method: 'GET',
        url,
      };

      const response = await client.request(request);

      expect(response.headers['content-type']).toBe('application/json');
      expect(response.headers['x-request-id']).toBe('abc123');
    });
  });
});
