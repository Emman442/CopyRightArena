import React, { createContext, useContext, useState, useEffect } from 'react';
import { Work, Dispute } from '../lib/contracts/types'

export type RouteType = 
  | 'landing' 
  | 'registry' 
  | 'registry-detail' 
  | 'disputes' 
  | 'dispute-detail' 
  | 'file-dispute' 
  | 'register-work' 
  | 'my-works';

export interface Toast {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface AppContextType {
 

  currentRoute: RouteType;
  routeParams: { workId?: string; disputeId?: string };
  toasts: Toast[];
  navigateTo: (route: RouteType, params?: { workId?: string; disputeId?: string }) => void;
  addToast: (title: string, description: string, type: 'info' | 'success' | 'error' | 'warning') => void;
  removeToast: (id: string) => void;

}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState<RouteType>('landing');
  const [routeParams, setRouteParams] = useState<{ workId?: string; disputeId?: string }>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // Load initial wallet and route from localStorage / URL hash
  useEffect(() => {
    

    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (!hash) {
        setCurrentRoute('landing');
        setRouteParams({});
        return;
      }

      if (hash.startsWith('registry/')) {
        const id = hash.split('/')[1];
        setCurrentRoute('registry-detail');
        setRouteParams({ workId: id });
      } else if (hash.startsWith('disputes/')) {
        const id = hash.split('/')[1];
        if (id === 'new') {
          setCurrentRoute('file-dispute');
          setRouteParams({});
        } else {
          setCurrentRoute('dispute-detail');
          setRouteParams({ disputeId: id });
        }
      } else if (hash === 'registry') {
        setCurrentRoute('registry');
        setRouteParams({});
      } else if (hash === 'disputes') {
        setCurrentRoute('disputes');
        setRouteParams({});
      } else if (hash === 'register') {
        setCurrentRoute('register-work');
        setRouteParams({});
      } else if (hash === 'my-works') {
        setCurrentRoute('my-works');
        setRouteParams({});
      } else {
        setCurrentRoute('landing');
        setRouteParams({});
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // trigger on initial load

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);



  const navigateTo = (route: RouteType, params?: { workId?: string; disputeId?: string }) => {
    setCurrentRoute(route);
    setRouteParams(params || {});
    
    // Sync with hash
    if (route === 'landing') window.location.hash = '';
    else if (route === 'registry') window.location.hash = 'registry';
    else if (route === 'registry-detail') window.location.hash = `registry/${params?.workId}`;
    else if (route === 'disputes') window.location.hash = 'disputes';
    else if (route === 'dispute-detail') window.location.hash = `disputes/${params?.disputeId}`;
    else if (route === 'file-dispute') window.location.hash = 'disputes/new';
    else if (route === 'register-work') window.location.hash = 'register';
    else if (route === 'my-works') window.location.hash = 'my-works';
  };

  const addToast = (title: string, description: string, type: 'info' | 'success' | 'error' | 'warning') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  
  return (
    <AppContext.Provider
      value={{
        currentRoute,
        routeParams,
        toasts,
        navigateTo,
        addToast,
        removeToast,
     
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
