const API_URL = import.meta.env.VITE_API_URL || "";

async function handleResponse<T>(response: Response): Promise<T> {
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error ?? `API error: ${response.status}`);
  }
  return json.data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    body: form,
  });
  return handleResponse<T>(response);
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  environment: string;
  mockMode: boolean;
  firebaseConfigured: boolean;
}

export function fetchHealth(): Promise<HealthStatus> {
  return apiGet<HealthStatus>("/api/health");
}
