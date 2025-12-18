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

type Options = {
    ttl?: number;
    staleWhileRevalidate: boolean;
};

export const useCachedAPI = async (url: string, options: Options) => {
    let data = localStorage.getItem(url)
    let ttlTime = +(localStorage.getItem(url+':ttl') || Date.now())
    const ttl = Date.now() + (options?.ttl || 60 * 60 * 5)
    let loading = true
    let error

    console.log(ttl)

    const invalidate = async () => {
        const res = await fetch(url)
        return res.json()
    }

    if(ttlTime <= ttl) {
        data = null
    }

    if(!data){
        try{
            data = await invalidate()
        } catch(e) {
            error = e
        } finally {
            loading = false
        }
        localStorage.setItem(url, JSON.stringify(data))
        localStorage.setItem(url+':ttl', JSON.stringify(ttl))
    } else {
        loading = false
    }




    return {data, loading, error, invalidate}
}