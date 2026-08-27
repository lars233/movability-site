export type PublicItem = {
  id: number;
  name: string;
  slug: string;
  date: string;
  categories: string;
  feature_image: string;
  excerpt: string;
  /** Set when the piece lives on another site (e.g. Zag Daily). */
  external_url?: string;
};

export type PublicDetail = Omit<PublicItem, "excerpt"> & {
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  more: PublicItem[];
};

export type ListResponse = {
  items: PublicItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  categories: string[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: res.statusText }))) as {
      error?: string;
    };
    throw new Error(body.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

function buildQuery(params?: {
  search?: string;
  category?: string;
  page?: number;
}): string {
  if (!params) return "";
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.category) q.set("category", params.category);
  if (params.page && params.page > 1) q.set("page", String(params.page));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export type PublicReport = {
  id: number;
  title: string;
  slug: string;
  subtitle: string;
  image: string;
  download_url: string;
  date: string;
};

export const publicApi = {
  listBlog: (params?: { search?: string; category?: string; page?: number }) =>
    fetchJson<ListResponse>(`/api/blog${buildQuery(params)}`),

  getBlog: (slug: string) => fetchJson<PublicDetail>(`/api/blog/${slug}`),

  listArticles: (params?: {
    search?: string;
    category?: string;
    page?: number;
  }) => fetchJson<ListResponse>(`/api/articles${buildQuery(params)}`),

  getArticle: (slug: string) =>
    fetchJson<PublicDetail>(`/api/articles/${slug}`),

  listCaseStudies: (params?: {
    search?: string;
    category?: string;
    page?: number;
  }) => fetchJson<ListResponse>(`/api/case-studies${buildQuery(params)}`),

  getCaseStudy: (slug: string) =>
    fetchJson<PublicDetail>(`/api/case-studies/${slug}`),

  listReports: () => fetchJson<PublicReport[]>(`/api/reports`),
};
