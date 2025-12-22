/**
 * 

Challenge: Smart Data Cache with Automatic Invalidation
Difficulty: Medium

The Problem
Build a custom React hook called useCachedAPI that fetches data from an API and intelligently caches it with the following features:

Cache Layer: Store fetched data in memory with a unique key
Time-based Invalidation: Cached data expires after a configurable TTL (time-to-live)
Stale-While-Revalidate: Return stale data immediately while fetching fresh data in the background
Deduplication: If multiple components request the same data simultaneously, make only one network request
Manual Invalidation: Provide a way to manually clear cache entries

Requirements
javascript
const { data, loading, error, invalidate } = useCachedAPI(url, options);
Options should support:

ttl: Time in milliseconds before cache expires (default: 5 minutes)
staleWhileRevalidate: Boolean to enable background refresh (default: true)
cacheKey: Custom cache key (default: url)

Test Scenarios
First request fetches from API and caches result
Second request within TTL returns cached data instantly
Request after TTL expires fetches fresh data
Multiple simultaneous requests to same endpoint make only one network call
invalidate() forces fresh fetch on next request


Bonus Points
Add cache size limits (LRU eviction)
Persist cache to localStorage
Add request cancellation for unmounted components
TypeScript implementation
Example Usage
javascript
function UserProfile({ userId }) {
  const { data, loading, error, invalidate } = useCachedAPI(
    `https://api.example.com/users/${userId}`,
    { ttl: 60000, staleWhileRevalidate: true }
  );

  if (loading && !data) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={invalidate}>Refresh</button>
    </div>
  );
}

 */


import { useEffect, useState } from "react";

type Options = {
    ttl?: number;
    cacheKey?: string;
    staleWhileRevalidate: boolean;
};

const cache = new Map();
export const clearCache = () => cache.clear();
const inflightRequests = new Map();

export const useCachedAPI = (url: string, options?: Options) => {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [shouldRefresh, setShouldRefresh] = useState<boolean>(false)

  const invalidate = () => {
    setShouldRefresh(true);
  }

  const getData = async () => {
    const cacheKey = options?.cacheKey || url
    try{
        if (!inflightRequests.has(cacheKey)) {
            const fetchPromise = fetch(url).then(res => {
                if(res.ok){
                    return res.json()
                } else {
                    throw new Error(res.status+': '+res.statusText)
                }
            });
            inflightRequests.set(cacheKey, fetchPromise);
        }

        const res = await inflightRequests.get(cacheKey);
        setData(res)
        cache.set(cacheKey, res)
    } catch(e: any) {
        setError(new Error(e.message))
    } finally {
        setLoading(false)
        inflightRequests.delete(cacheKey)
    }
}
  
  useEffect(() => {
    setLoading(true)
    const cacheKey = options?.cacheKey || url
    const cacheData = cache.get(cacheKey)
    const cachedTtl = +(cache.get(cacheKey+':ttl') || Date.now())
    const ttl = Date.now() + (options?.ttl || 60 * 5 * 1000)
    const isCacheExpired = cachedTtl <= Date.now()

    if(!cacheData || isCacheExpired || shouldRefresh) {
        if(cacheData && isCacheExpired && options?.staleWhileRevalidate) {
            setData(cacheData);
        }
        getData()
        cache.set(cacheKey+':ttl', ttl)
    } else {
        setData(cacheData)
        setLoading(false)
    }

    if(shouldRefresh){
        setShouldRefresh(false)
    }
  }, [url, shouldRefresh]);
  
  return { data, loading, error, invalidate };
};