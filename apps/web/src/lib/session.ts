import { api } from "./api";

export interface Session {
  address: string;
  admin: boolean;
}

export async function readSession(): Promise<Session | null> {
  try {
    return await api<Session>("/v1/session");
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await api("/v1/auth/logout", { method: "POST" });
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("kab_session");
    sessionStorage.removeItem("kab_address");
  }
}
