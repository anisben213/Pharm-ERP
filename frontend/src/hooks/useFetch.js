import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * useFetch — generic data fetching hook.
 * @param {Function} fn  Async function that returns data. Will be called on mount + on refetch().
 * @param {Array}    deps Dependency array (like useEffect).
 */
export default function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fnRef.current();
      setData(res);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: run, setData };
}
