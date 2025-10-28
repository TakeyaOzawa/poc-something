/**
 * Domain Service Interface: HTTP Client
 */

export interface HttpRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: { [key: string]: string };
  body?: string;
  timeout?: number; // milliseconds
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: { [key: string]: string };
  body: string;
}

export interface HttpClient {
  /**
   * Execute HTTP request
   * @param request HTTP request configuration
   * @returns HTTP response
   * @throws Error if request fails
   */
  request(request: HttpRequest): Promise<HttpResponse>;
}
