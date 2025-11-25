import { useAuth } from './useAuth';

export const usePlanType = () => {
  const { userData } = useAuth();

  const planType = userData?.plan_type || null;
  const isAnnualPlan = planType === 'annual';
  const isMonthlyPlan = planType === 'monthly';
  const hasActivePlan = userData?.status_plano === 'ativo';

  return {
    planType,
    isAnnualPlan,
    isMonthlyPlan,
    hasActivePlan,
  };
};
