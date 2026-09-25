const BASE = process.env.NEXT_PUBLIC_API_URL || "/api-backend";
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("kab_session") : null;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { "x-session": token } : {}),
      ...(init.headers || {})
    },
    credentials: "include"
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || res.statusText);
  return body as T;
}
