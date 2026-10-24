import { useEffect, useState } from 'react';
import type { OfficialEvent } from '../officialContent';
import { EVENTS_LIST } from '../officialContent';

// Sanity trial: events are read from Sanity's public CDN API (no SDK, no token).
// The dataset must be public for anonymous reads. Writes happen only in Sanity Studio.
const PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID as string | undefined;
const DATASET = (import.meta.env.VITE_SANITY_DATASET as string | undefined) || 'production';
const API_VERSION = '2024-01-01';

export const isSanityConfigured = Boolean(PROJECT_ID);

// `...` keeps every stored field (including `id`); image fields are resolved to CDN URLs.
// `sortOrder` mirrors the array order that the local data uses today.
const EVENTS_QUERY = `*[_type == "event"] | order(sortOrder asc) {
  ...,
  "image": image.asset->url,
  "posterImage": posterImage.asset->url,
  "photoImage": photoImage.asset->url
}`;

export const fetchSanityEvents = async (signal?: AbortSignal): Promise<OfficialEvent[]> => {
  if (!PROJECT_ID) throw new Error('VITE_SANITY_PROJECT_ID is not set');
  const url =
    `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}` +
    `?query=${encodeURIComponent(EVENTS_QUERY)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status}`);
  const json = (await res.json()) as { result: OfficialEvent[] };
  return json.result;
};

export interface SanityEventsState {
  events: OfficialEvent[];
  loading: boolean;
  error: string | null;
}

// Only fetches when `enabled` is true, so the original pages never hit the network.
export const useSanityEvents = (enabled: boolean): SanityEventsState => {
  const [state, setState] = useState<SanityEventsState>({
    events: [],
    loading: enabled,
    error: null,
  });

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState({ events: [], loading: true, error: null });
    fetchSanityEvents(controller.signal)
      .then((events) => setState({ events, loading: false, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        setState({ events: [], loading: false, error: message });
      });
    return () => controller.abort();
  }, [enabled]);

  return state;
};

// Local fallback so the trial pages still render when Sanity is not configured yet.
export const LOCAL_EVENTS = EVENTS_LIST;
