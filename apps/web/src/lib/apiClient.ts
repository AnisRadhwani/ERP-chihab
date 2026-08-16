const LOCALHOST_PATTERN = /localhost|127\.0\.0\.1/i;

/** Production uses same-origin /api/...; dev uses Vite proxy when empty. */
function resolveApiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_URL ?? "")
    .trim()
    .replace(/\/+$/, "");

  if (import.meta.env.PROD) {
    if (!configured || LOCALHOST_PATTERN.test(configured)) {
      return "";
    }
    return configured;
  }

  return configured;
}

/** Join base + path without producing /api/api/... */
function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = resolveApiBaseUrl();

  if (!base) {
    return normalizedPath;
  }

  if (base.endsWith("/api") && normalizedPath.startsWith("/api")) {
    return `${base}${normalizedPath.slice(4)}`;
  }

  return `${base}${normalizedPath}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  let json: { success?: boolean; data?: T; error?: string };

  try {
    json = await response.json();
  } catch {
    throw new Error(
      response.ok ? "Réponse API invalide" : `API error: ${response.status}`
    );
  }

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? `API error: ${response.status}`);
  }
  return json.data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(buildApiUrl(path));
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(buildApiUrl(path), {
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

export async function fetchHealth(): Promise<HealthStatus> {
  const response = await fetch(buildApiUrl("/api/health"));

  let json: {
    success?: boolean;
    data?: HealthStatus;
    error?: string;
  };

  try {
    json = await response.json();
  } catch {
    throw new Error(
      response.ok ? "Réponse API invalide" : `API error: ${response.status}`
    );
  }

  if (!response.ok || !json.success || json.data?.status !== "ok") {
    throw new Error(json.error ?? `API error: ${response.status}`);
  }

  return json.data;
}

export function getApiBaseUrl(): string {
  return resolveApiBaseUrl();
}

export function getApiUrl(path: string): string {
  return buildApiUrl(path);
}
