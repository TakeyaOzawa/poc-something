/**
 * Domain Port: HTTP Client
 * Provides HTTP request functionality
 */

// Re-export from types for now to avoid breaking changes
export { HttpClient, HttpRequest, HttpResponse } from '@domain/types/http-client.types';

// Alias for Port naming convention
export type HttpClientPort = HttpClient;
