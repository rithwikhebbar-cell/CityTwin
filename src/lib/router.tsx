import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type AppRoute = '/' | '/login' | '/signup' | '/app' | '/simulator' | '/auth/callback';

interface RouterContextType {
  path: string;
  queryParams: URLSearchParams;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  redirectTo: (path: string) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<{ path: string; search: string }>(() => {
    if (typeof window !== 'undefined') {
      return {
        path: window.location.pathname || '/',
        search: window.location.search || '',
      };
    }
    return { path: '/', search: '' };
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentLocation({
        path: window.location.pathname || '/',
        search: window.location.search || '',
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (typeof window === 'undefined') return;

    // Split path and query
    const [pathname, search] = to.split('?');
    const fullSearch = search ? `?${search}` : '';

    if (options?.replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }

    setCurrentLocation({
      path: pathname || '/',
      search: fullSearch,
    });
    window.scrollTo(0, 0);
  }, []);

  const redirectTo = useCallback((targetPath: string) => {
    navigate(targetPath, { replace: true });
  }, [navigate]);

  const queryParams = useMemo(() => {
    return new URLSearchParams(currentLocation.search);
  }, [currentLocation.search]);

  const value = useMemo(
    () => ({
      path: currentLocation.path,
      queryParams,
      navigate,
      redirectTo,
    }),
    [currentLocation.path, queryParams, navigate, redirectTo]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export function useRouter(): RouterContextType {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}
