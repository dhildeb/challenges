import { renderHook, waitFor } from '@testing-library/react';
import { useCachedAPI } from '../challenges/Cache';

// Mock fetch
global.fetch = jest.fn();

describe('useCachedAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const mockSuccessResponse = { id: 1, name: 'John Doe' };

  test('fetches data on initial render', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    });

    const { result } = renderHook(() => 
      useCachedAPI('https://api.example.com/user/1')
    );

    console.log(result)

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSuccessResponse);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('returns cached data on subsequent requests within TTL', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockSuccessResponse,
    });

    // First render
    const { result: result1, unmount: unmount1 } = renderHook(() =>
      useCachedAPI('https://api.example.com/user/1', { ttl: 60000 })
    );

    await waitFor(() => expect(result1.current.loading).toBe(false));
    expect(fetch).toHaveBeenCalledTimes(1);
    unmount1();

    // Second render within TTL - should use cache
    const { result: result2 } = renderHook(() =>
      useCachedAPI('https://api.example.com/user/1', { ttl: 60000 })
    );

    // Should return cached data immediately
    await waitFor(() => expect(result2.current.loading).toBe(false));
    expect(result2.current.data).toEqual(mockSuccessResponse);
    expect(fetch).toHaveBeenCalledTimes(1); // No additional fetch
  });

  test('fetches fresh data after TTL expires', async () => {
    const freshData = { id: 1, name: 'Jane Doe' };
    
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => freshData,
      });

    // First request
    const { result: result1, unmount: unmount1 } = renderHook(() =>
      useCachedAPI('https://api.example.com/user/1', { ttl: 5000 })
    );

    await waitFor(() => expect(result1.current.loading).toBe(false));
    expect(result1.current.data).toEqual(mockSuccessResponse);
    unmount1();

    // Advance time past TTL
    jest.advanceTimersByTime(6000);

    // Second request after TTL
    const { result: result2 } = renderHook(() =>
      useCachedAPI('https://api.example.com/user/1', { ttl: 5000 })
    );

    await waitFor(() => expect(result2.current.loading).toBe(false));
    expect(result2.current.data).toEqual(freshData);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('handles fetch errors correctly', async () => {
    const errorMessage = 'Network error';
    fetch.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() =>
      useCachedAPI('https://api.example.com/user/1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(new Error(errorMessage));
  });

  test('deduplicates simultaneous requests to same endpoint', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockSuccessResponse,
    });

    // Render multiple hooks simultaneously
    const { result: result1 } = renderHook(() =>
      useCachedAPI('https://api.example.com/user/1')
    );
    const { result: result2 } = renderHook(() =>
      useCachedAPI('https://api.example.com/user/1')
    );
    const { result: result3 } = renderHook(() =>
      useCachedAPI('https://api.example.com/user/1')
    );

    await waitFor(() => {
      expect(result1.current.loading).toBe(false);
      expect(result2.current.loading).toBe(false);
      expect(result3.current.loading).toBe(false);
    });

    // All hooks should have the same data
    expect(result1.current.data).toEqual(mockSuccessResponse);
    expect(result2.current.data).toEqual(mockSuccessResponse);
    expect(result3.current.data).toEqual(mockSuccessResponse);

    // But fetch should only be called once
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('invalidate forces fresh fetch', async () => {
    const freshData = { id: 1, name: 'Updated Name' };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => freshData,
      });

    const { result } = renderHook(() =>
      useCachedAPI('https://api.example.com/user/1', { ttl: 60000 })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(mockSuccessResponse);
    expect(fetch).toHaveBeenCalledTimes(1);

    // Call invalidate
    result.current.invalidate();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(freshData);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('stale-while-revalidate returns cached data while fetching', async () => {
    const freshData = { id: 1, name: 'Fresh Data' };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => freshData,
      });

    // Initial fetch
    const { result, unmount } = renderHook(() =>
      useCachedAPI('https://api.example.com/user/1', { 
        ttl: 5000,
        staleWhileRevalidate: true 
      })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(mockSuccessResponse);
    unmount();

    // Advance past TTL
    jest.advanceTimersByTime(6000);

    // Second render should return stale data immediately
    const { result: result2 } = renderHook(() =>
      useCachedAPI('https://api.example.com/user/1', {
        ttl: 5000,
        staleWhileRevalidate: true
      })
    );

    // Should have stale data immediately
    expect(result2.current.data).toEqual(mockSuccessResponse);
    expect(result2.current.loading).toBe(true); // But still loading fresh data

    // Wait for fresh data
    await waitFor(() => expect(result2.current.loading).toBe(false));
    expect(result2.current.data).toEqual(freshData);
  });

  test('uses custom cache key when provided', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockSuccessResponse,
    });

    // Two different URLs but same cache key
    const { result: result1, unmount: unmount1 } = renderHook(() =>
      useCachedAPI('https://api.example.com/user/1?v=1', {
        cacheKey: 'user-1'
      })
    );

    await waitFor(() => expect(result1.current.loading).toBe(false));
    expect(fetch).toHaveBeenCalledTimes(1);
    unmount1();

    // Different URL but same cache key should use cache
    const { result: result2 } = renderHook(() =>
      useCachedAPI('https://api.example.com/user/1?v=2', {
        cacheKey: 'user-1'
      })
    );

    await waitFor(() => expect(result2.current.loading).toBe(false));
    expect(result2.current.data).toEqual(mockSuccessResponse);
    expect(fetch).toHaveBeenCalledTimes(1); // No additional fetch
  });

  test('handles non-ok HTTP responses', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const { result } = renderHook(() =>
      useCachedAPI('https://api.example.com/user/999')
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeTruthy();
    expect(result.current.error.message).toContain('404');
  });
});