"use client";

import { useAuth } from "@clerk/nextjs";

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function useApi() {
  const { getToken } = useAuth();

  async function request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await getToken();

    const headers = new Headers(options.headers);

    /*
     * IMPORTANT:
     * Do NOT set Content-Type for FormData.
     * The browser automatically sets:
     *
     * multipart/form-data; boundary=...
     *
     * For normal JSON requests, set application/json.
     */
    if (options.body && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let message = `Request failed (${response.status})`;

      try {
        const data = await response.json();

        if (data && typeof data.message === "string") {
          message = data.message;
        }
      } catch {
        // Ignore invalid/empty JSON response
      }

      throw new ApiError(response.status, message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /*
   * Convert body correctly:
   *
   * FormData → send directly
   * JSON/object → JSON.stringify()
   */
  const prepareBody = (body?: unknown): BodyInit | undefined => {
    if (body === undefined) {
      return undefined;
    }

    if (body instanceof FormData) {
      return body;
    }

    return JSON.stringify(body);
  };

  return {
    get: <T = unknown>(path: string) =>
      request<T>(path, {
        method: "GET",
      }),

    post: <T = unknown>(path: string, body?: unknown) =>
      request<T>(path, {
        method: "POST",
        body: prepareBody(body),
      }),

    put: <T = unknown>(path: string, body?: unknown) =>
      request<T>(path, {
        method: "PUT",
        body: prepareBody(body),
      }),

    patch: <T = unknown>(path: string, body?: unknown) =>
      request<T>(path, {
        method: "PATCH",
        body: prepareBody(body),
      }),

    delete: <T = unknown>(path: string) =>
      request<T>(path, {
        method: "DELETE",
      }),
  };
}