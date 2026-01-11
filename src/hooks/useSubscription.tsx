import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SubscriptionTier = 'solo' | 'professional' | 'firm';

interface SubscriptionLimits {
  maxCases: number;
  hasAdvancedAIDrafting: boolean;
  hasPriorityReminders: boolean;
  hasClientPortal: boolean;
  hasMultiUserAccess: boolean;
  hasCustomTemplates: boolean;
}

interface SubscriptionContextType {
  tier: SubscriptionTier;
  limits: SubscriptionLimits;
  loading: boolean;
  currentCaseCount: number;
  canCreateCase: boolean;
  trialEndsAt: Date | null;
  isInTrial: boolean;
  upgradeTier: (newTier: SubscriptionTier) => Promise<void>;
}

const tierLimits: Record<SubscriptionTier, SubscriptionLimits> = {
  solo: {
    maxCases: 25,
    hasAdvancedAIDrafting: false,
    hasPriorityReminders: false,
    hasClientPortal: false,
    hasMultiUserAccess: false,
    hasCustomTemplates: false,
  },
  professional: {
    maxCases: 100,
    hasAdvancedAIDrafting: true,
    hasPriorityReminders: true,
    hasClientPortal: true,
    hasMultiUserAccess: false,
    hasCustomTemplates: false,
  },
  firm: {
    maxCases: Infinity,
    hasAdvancedAIDrafting: true,
    hasPriorityReminders: true,
    hasClientPortal: true,
    hasMultiUserAccess: true,
    hasCustomTemplates: true,
  },
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('solo');
  const [loading, setLoading] = useState(true);
  const [currentCaseCount, setCurrentCaseCount] = useState(0);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    if (!user) return;

    try {
      // Fetch profile with subscription tier
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, trial_ends_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        setTier((profile.subscription_tier as SubscriptionTier) || 'solo');
        if (profile.trial_ends_at) {
          setTrialEndsAt(new Date(profile.trial_ends_at));
        }
      }

      // Get current case count
      const { count } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['intake', 'active', 'pending']);

      setCurrentCaseCount(count || 0);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeTier = async (newTier: SubscriptionTier) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ subscription_tier: newTier })
      .eq('user_id', user.id);

    if (!error) {
      setTier(newTier);
    }
  };

  const limits = tierLimits[tier];
  const canCreateCase = currentCaseCount < limits.maxCases;
  const isInTrial = trialEndsAt ? new Date() < trialEndsAt : false;

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        limits,
        loading,
        currentCaseCount,
        canCreateCase,
        trialEndsAt,
        isInTrial,
        upgradeTier,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
