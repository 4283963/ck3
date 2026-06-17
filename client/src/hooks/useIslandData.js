import { useState, useEffect, useRef, useCallback } from 'react';

function useIslandData(pollingInterval = 5000) {
  const [summary, setSummary] = useState(null);
  const [inverters, setInverters] = useState([]);
  const [islands, setIslands] = useState([]);
  const [selectedIsland, setSelectedIsland] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [lowSocThreshold, setLowSocThreshold] = useState(20);
  const [savingThreshold, setSavingThreshold] = useState(false);

  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef(null);
  const selectedIslandRef = useRef(null);

  useEffect(() => {
    selectedIslandRef.current = selectedIsland;
  }, [selectedIsland]);

  const fetchIslands = useCallback(async () => {
    try {
      const res = await fetch('/api/data/islands');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setIslands(data.data);
        setSelectedIsland(data.data[0].id);
      }
    } catch (err) {
      console.error('获取海岛列表失败:', err);
    }
  }, []);

  const fetchThreshold = useCallback(async () => {
    try {
      const res = await fetch('/api/data/config/lowSocThreshold');
      const data = await res.json();
      if (data.success && data.data !== null) {
        setLowSocThreshold(data.data);
      }
    } catch (err) {
      console.error('获取阈值配置失败:', err);
    }
  }, []);

  const saveThreshold = useCallback(async (value) => {
    setSavingThreshold(true);
    try {
      const res = await fetch('/api/data/config/lowSocThreshold', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (data.success) {
        setLowSocThreshold(data.data.value);
        return true;
      }
      throw new Error(data.message || '保存失败');
    } catch (err) {
      console.error('保存阈值失败:', err);
      throw err;
    } finally {
      setSavingThreshold(false);
    }
  }, []);

  const unlockInverter = useCallback(async (inverterId) => {
    try {
      const res = await fetch(`/api/data/unlock/${encodeURIComponent(inverterId)}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setInverters(prev => prev.map(inv =>
          inv.inverterId === inverterId
            ? { ...inv, locked: false, controlSwitch: 'unlocked' }
            : inv
        ));
        setSummary(prev => prev ? {
          ...prev,
          lockedCount: Math.max(0, prev.lockedCount - 1)
        } : null);
        return true;
      }
      throw new Error(data.message || '解锁失败');
    } catch (err) {
      console.error('解锁逆变器失败:', err);
      throw err;
    }
  }, []);

  const fetchData = useCallback(async (islandId, requestId) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const params = new URLSearchParams();
    if (islandId) params.append('islandId', islandId);

    const summaryUrl = `/api/data/summary${params.toString() ? `?${params.toString()}` : ''}`;
    const latestUrl = `/api/data/latest${params.toString() ? `?${params.toString()}` : ''}`;

    try {
      const [summaryRes, latestRes] = await Promise.all([
        fetch(summaryUrl, { signal: controller.signal }),
        fetch(latestUrl, { signal: controller.signal }),
      ]);

      if (!summaryRes.ok || !latestRes.ok) {
        throw new Error('获取数据失败');
      }

      const summaryData = await summaryRes.json();
      const latestData = await latestRes.json();

      if (requestId !== requestIdRef.current) {
        console.log(`[请求 #${requestId}] 已过时，丢弃（当前最新请求 #${requestIdRef.current}）`);
        return;
      }

      if (summaryData.success && summaryData.data.islandId === (islandId || 'all')) {
        setSummary(summaryData.data);
      }
      if (latestData.success && latestData.islandId === (islandId || 'all')) {
        setInverters(latestData.data);
      }

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log(`[请求 #${requestId}] 被主动取消`);
        return;
      }
      if (requestId === requestIdRef.current) {
        setError(err.message);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const switchIsland = useCallback((islandId) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      requestIdRef.current += 1;
      const currentRequestId = requestIdRef.current;
      console.log(`→ 切换到海岛 ${islandId}，发送请求 #${currentRequestId}`);
      setSelectedIsland(islandId);
      setLoading(true);
      fetchData(islandId, currentRequestId);
    }, 150);
  }, [fetchData]);

  useEffect(() => {
    fetchIslands();
    fetchThreshold();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchIslands, fetchThreshold]);

  useEffect(() => {
    if (!selectedIsland) return;

    requestIdRef.current += 1;
    const initialRequestId = requestIdRef.current;
    fetchData(selectedIsland, initialRequestId);

    const interval = setInterval(() => {
      const currentIsland = selectedIslandRef.current;
      if (!currentIsland) return;

      requestIdRef.current += 1;
      const currentRequestId = requestIdRef.current;
      fetchData(currentIsland, currentRequestId);
    }, pollingInterval);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedIsland, pollingInterval, fetchData]);

  return {
    summary,
    inverters,
    islands,
    selectedIsland,
    loading,
    error,
    lastUpdate,
    lowSocThreshold,
    savingThreshold,
    switchIsland,
    saveThreshold,
    unlockInverter,
  };
}

export default useIslandData;
