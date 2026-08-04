import { useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/dashboardService';

/**
 * useDashboard
 * Custom hook that fetches and manages dashboard overview data.
 *
 * Returns:
 *   overview    — { employees, projects, tasks, milestones } or null
 *   loading     — boolean
 *   error       — boolean
 *   refetch     — () => void — manually re-trigger the fetch
 */
const useDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await dashboardService.getOverview();
      setOverview(data);
    } catch (err) {
      console.error('[useDashboard] Failed to fetch overview:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { overview, loading, error, refetch: fetchOverview };
};

export default useDashboard;
