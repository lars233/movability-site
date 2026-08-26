import { useEffect, useMemo, useState } from "react";
import {
  mergeCollection,
  mergeSection,
  type CollectionKey,
  type Item,
  type SectionKey,
  type SiteContentResponse,
  DEFAULT_SECTIONS,
} from "@/content/homepage-content";

/**
 * Loads CMS overrides for the landing page.
 *
 * Renders immediately from the built-in defaults, then re-renders once the API
 * responds. A failed request is deliberately swallowed — the page simply keeps
 * the defaults rather than showing an error.
 */
export function useHomepageContent() {
  const [stored, setStored] = useState<SiteContentResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-content")
      .then((res) => (res.ok ? (res.json() as Promise<SiteContentResponse>) : null))
      .then((data) => {
        if (!cancelled && data) setStored(data);
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(
    () => ({
      section: <K extends SectionKey>(key: K): (typeof DEFAULT_SECTIONS)[K] =>
        mergeSection(key, stored?.content?.[key]),
      items: (key: CollectionKey): Item[] => mergeCollection(key, stored?.items),
    }),
    [stored],
  );
}
