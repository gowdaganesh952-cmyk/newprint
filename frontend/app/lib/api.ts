"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useMemo } from "react";

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

/*
 * Convert body correctly:
 * FormData → send directly
 * JSON/object → JSON.stringify()
 * 
 * Moved outside the hook so it doesn't recreate on every render
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

export function useApi() {
  const { getToken } = useAuth();

  // 1. Make the core request function stable using useCallback
  const request = useCallback(
    async <T>(path: string, options: RequestInit = {}): Promise<T> => {
      const token = await getToken();
      const headers = new Headers(options.headers);

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
    },
    [getToken]
  );

  // 2. Memoize the returned methods so they never trigger unnecessary re-renders in components
  return useMemo(
    () => ({
      get: <T = unknown>(path: string, options?: RequestInit) =>
        request<T>(path, { ...options, method: "GET" }),

      post: <T = unknown>(path: string, body?: unknown, options?: RequestInit) =>
        request<T>(path, { ...options, method: "POST", body: prepareBody(body) }),

      put: <T = unknown>(path: string, body?: unknown, options?: RequestInit) =>
        request<T>(path, { ...options, method: "PUT", body: prepareBody(body) }),

      patch: <T = unknown>(path: string, body?: unknown, options?: RequestInit) =>
        request<T>(path, { ...options, method: "PATCH", body: prepareBody(body) }),

      delete: <T = unknown>(path: string, options?: RequestInit) =>
        request<T>(path, { ...options, method: "DELETE" }),
    }),
    [request]
  );
}