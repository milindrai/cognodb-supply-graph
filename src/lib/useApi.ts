"use client";

import { useCallback, useEffect, useState } from "react";

interface ApiOk<T> {
  ok: true;
  data: T;
}
interface ApiErr {
  ok: false;
  error: string;
  code?: string;
}
type ApiResponse<T> = ApiOk<T> | ApiErr;

export interface UseApiResult<T> {
  data: T | null;
  error: string | null;
  code: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Small typed fetch hook with loading/error state and a manual reload().
 * Distinguishes DB-unavailable (code) so the UI can show a tailored message.
 */
export function useApi<T>(url: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCode(null);

    fetch(url)
      .then(async (res) => {
        const body = (await res.json()) as ApiResponse<T>;
        if (cancelled) return;
        if (body.ok) {
          setData(body.data);
        } else {
          setError(body.error);
          setCode(body.code ?? null);
          setData(null);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          "Could not reach the server. Check your network connection and try again.",
        );
        setCode("NETWORK");
        // eslint-disable-next-line no-console
        console.error(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url, nonce]);

  return { data, error, code, loading, reload };
}
