const API = "/api/admin";

async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = (await res
      .json()
      .catch(() => ({ error: res.statusText }))) as { error?: string };
    throw new Error(body.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export type CmsEntry = {
  name: string;
  slug: string;
  status: "published" | "draft";
  date: string;
  categories: string;
  content: string;
  feature_image: string;
  /** If set, the site links straight to this address instead of opening a
   *  detail page — for interviews published on Zag Daily and similar. */
  external_url: string;
};

export type CmsRow = CmsEntry & {
  id: number;
  created_at: string;
  updated_at: string;
};

export type CmsType = "blog" | "articles" | "case_studies";

export type ReportEntry = {
  title: string;
  slug: string;
  subtitle: string;
  image: string;
  download_url: string;
  status: "published" | "draft";
  date: string;
};

export type ReportRow = ReportEntry & {
  id: number;
  created_at: string;
  updated_at: string;
};

export type SiteContentPayload = {
  content: Record<string, Record<string, unknown>>;
  items: Record<string, { data: Record<string, unknown>; visible: boolean }[]>;
};

const body = (data: unknown) => JSON.stringify(data);

export const adminApi = {
  login: (username: string, password: string) =>
    apiFetch<{ ok: boolean; username: string }>(`${API}/login`, {
      method: "POST",
      body: body({ username, password }),
    }),

  logout: () =>
    apiFetch<{ ok: boolean }>(`${API}/logout`, { method: "POST" }),

  me: () => apiFetch<{ username: string }>(`${API}/me`),

  list: (type: CmsType) => apiFetch<CmsRow[]>(`${API}/${type}`),

  get: (type: CmsType, id: number) =>
    apiFetch<CmsRow>(`${API}/${type}/${id}`),

  create: (type: CmsType, data: CmsEntry) =>
    apiFetch<CmsRow>(`${API}/${type}`, {
      method: "POST",
      body: body(data),
    }),

  update: (type: CmsType, id: number, data: CmsEntry) =>
    apiFetch<CmsRow>(`${API}/${type}/${id}`, {
      method: "PUT",
      body: body(data),
    }),

  remove: (type: CmsType, id: number) =>
    apiFetch<{ ok: boolean }>(`${API}/${type}/${id}`, { method: "DELETE" }),

  upload: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API}/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
      // No Content-Type header — browser sets it with the boundary
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => ({ error: res.statusText }))) as {
        error?: string;
      };
      throw new Error(b.error ?? res.statusText);
    }
    const { url } = (await res.json()) as { url: string };
    return url;
  },

  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API}/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => ({ error: res.statusText }))) as {
        error?: string;
      };
      throw new Error(b.error ?? res.statusText);
    }
    const { url } = (await res.json()) as { url: string };
    return url;
  },

  importCsv: (type: CmsType) =>
    apiFetch<{ imported: number; skipped: number; total: number }>(
      `${API}/import`,
      { method: "POST", body: body({ type }) },
    ),

  listReports: () => apiFetch<ReportRow[]>(`${API}/reports`),
  getReport: (id: number) => apiFetch<ReportRow>(`${API}/reports/${id}`),
  createReport: (data: ReportEntry) =>
    apiFetch<ReportRow>(`${API}/reports`, { method: "POST", body: body(data) }),
  updateReport: (id: number, data: ReportEntry) =>
    apiFetch<ReportRow>(`${API}/reports/${id}`, { method: "PUT", body: body(data) }),
  removeReport: (id: number) =>
    apiFetch<{ ok: boolean }>(`${API}/reports/${id}`, { method: "DELETE" }),

  removeSubmission: (id: number) =>
    apiFetch<{ ok: boolean }>(`${API}/submissions/${id}`, { method: "DELETE" }),

  /* ── landing page content ─────────────────────────────────── */
  getSiteContent: () => apiFetch<SiteContentPayload>(`${API}/site-content`),

  saveSection: (key: string, data: Record<string, string>) =>
    apiFetch<{ ok: boolean }>(`${API}/site-content/${key}`, {
      method: "PUT",
      body: body({ data }),
    }),

  saveCollection: (
    collection: string,
    items: { data: Record<string, string>; visible: boolean }[],
  ) =>
    apiFetch<{ ok: boolean; count: number }>(`${API}/site-items/${collection}`, {
      method: "PUT",
      body: body({ items }),
    }),
};

