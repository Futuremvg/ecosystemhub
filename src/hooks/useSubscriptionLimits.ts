import { useSubscription } from './useSubscription';

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

export function useSubscriptionLimits() {
  const { subscription, loading } = useSubscription();
  
  const isSubscribed = subscription?.subscribed ?? false;
  const limits = isSubscribed ? PREMIUM_LIMITS : FREE_LIMITS;

  const canUseFeature = (feature: RestrictedFeature): boolean => {
    if (isSubscribed) return true;
    
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
    if (isSubscribed) return true;
    
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
    limits,
    loading,
    canUseFeature,
    canAddMore,
    getFeatureLimit,
  };
}
