import { useAuthStore } from "@/lib/store/auth";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const BASE = process.env.NEXT_PUBLIC_HTTP_URL ?? "";
// In mock mode (no real backend URL), route through Next.js /api/* handlers
const MOCK_MODE = !BASE;

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const userId = useAuthStore.getState().userId;
  const fullPath = MOCK_MODE ? `/api${path}` : path;
  const url = `${BASE}${fullPath}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(userId ? { "x-user-id": userId } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
