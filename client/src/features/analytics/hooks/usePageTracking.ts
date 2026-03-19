import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsTracker } from '../services/analytics.tracker';

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    analyticsTracker.trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
}
