import { useSubscription } from './useSubscription';
import { useState, useEffect } from 'react';

export interface SubscriptionLimits {
  maxCompanies: number;
  maxDocuments: number;
  maxTransactionsPerMonth: number;
  godModeEnabled: boolean;
  receiptScannerEnabled: boolean;
  bankStatementImportEnabled: boolean;
}

export const FREE_LIMITS: SubscriptionLimits = {
  maxCompanies: 1,
  maxDocuments: 5,
  maxTransactionsPerMonth: 20,
  godModeEnabled: false,
  receiptScannerEnabled: false,
  bankStatementImportEnabled: false,
};

export const PREMIUM_LIMITS: SubscriptionLimits = {
  maxCompanies: Infinity,
  maxDocuments: Infinity,
  maxTransactionsPerMonth: Infinity,
  godModeEnabled: true,
  receiptScannerEnabled: true,
  bankStatementImportEnabled: true,
};

export type RestrictedFeature = 
  | 'godMode' 
  | 'companies' 
  | 'documents' 
  | 'transactions' 
  | 'receiptScanner' 
  | 'bankStatementImport';

// Check if dev mode is active (for super admins testing)
const isDevModeActive = (): boolean => {
  try {
    const saved = localStorage.getItem('devModeActive');
    return saved ? JSON.parse(saved) : false;
  } catch {
    return false;
  }
};

export function useSubscriptionLimits() {
  const { subscription, loading } = useSubscription();
  const [devMode, setDevMode] = useState(isDevModeActive);
  
  // Listen for dev mode changes
  useEffect(() => {
    const handleStorageChange = () => {
      setDevMode(isDevModeActive());
    };
    
    // Check periodically for changes (since localStorage events don't fire in same tab)
    const interval = setInterval(handleStorageChange, 1000);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Dev mode grants full access
  const isSubscribed = devMode || (subscription?.subscribed ?? false);
  const limits = isSubscribed ? PREMIUM_LIMITS : FREE_LIMITS;

  const canUseFeature = (feature: RestrictedFeature): boolean => {
    if (devMode || isSubscribed) return true;
    
    switch (feature) {
      case 'godMode':
        return limits.godModeEnabled;
      case 'receiptScanner':
        return limits.receiptScannerEnabled;
      case 'bankStatementImport':
        return limits.bankStatementImportEnabled;
      default:
        return true; // For countable features, check separately
    }
  };

  const canAddMore = (feature: 'companies' | 'documents' | 'transactions', currentCount: number): boolean => {
    if (devMode || isSubscribed) return true;
    
    switch (feature) {
      case 'companies':
        return currentCount < limits.maxCompanies;
      case 'documents':
        return currentCount < limits.maxDocuments;
      case 'transactions':
        return currentCount < limits.maxTransactionsPerMonth;
      default:
        return true;
    }
  };

  const getFeatureLimit = (feature: 'companies' | 'documents' | 'transactions'): number => {
    switch (feature) {
      case 'companies':
        return limits.maxCompanies;
      case 'documents':
        return limits.maxDocuments;
      case 'transactions':
        return limits.maxTransactionsPerMonth;
    }
  };

  return {
    isSubscribed,
    isDevMode: devMode,
    limits,
    loading,
    canUseFeature,
    canAddMore,
    getFeatureLimit,
  };
}
