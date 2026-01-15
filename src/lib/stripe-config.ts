// Stripe subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name_en: 'Monthly',
    name_pt: 'Mensal',
    price_id: 'price_1So8r2PehJsCTE4Bzchea82b',
    product_id: 'prod_TlgDOnbYrmPU6q',
    price: 49,
    currency: 'CAD',
    interval: 'month',
    interval_count: 1,
    description_en: 'Full access to Ecosystem Hub with monthly billing',
    description_pt: 'Acesso completo ao Ecosystem Hub com cobrança mensal',
    savings: null,
  },
  quarterly: {
    id: 'quarterly',
    name_en: 'Quarterly',
    name_pt: 'Trimestral',
    price_id: 'price_1So8tvPehJsCTE4BBB3qxwOO',
    product_id: 'prod_TlgGUEVaafH6Q9',
    price: 129,
    currency: 'CAD',
    interval: 'month',
    interval_count: 3,
    description_en: 'Save 12% with quarterly billing',
    description_pt: 'Economize 12% com cobrança trimestral',
    savings: 12,
  },
  annual: {
    id: 'annual',
    name_en: 'Annual',
    name_pt: 'Anual',
    price_id: 'price_1So8vHPehJsCTE4BgNjnzj5O',
    product_id: 'prod_TlgH8YbOb8Lcoe',
    price: 399,
    currency: 'CAD',
    interval: 'year',
    interval_count: 1,
    description_en: 'Best value! Save 32% with annual billing',
    description_pt: 'Melhor valor! Economize 32% com cobrança anual',
    savings: 32,
  },
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;
export type Plan = typeof SUBSCRIPTION_PLANS[PlanId];

export function getPlanByPriceId(priceId: string) {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.price_id === priceId);
}

export function getPlanByProductId(productId: string) {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.product_id === productId);
}

export function formatPrice(price: number, currency: string = 'CAD') {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
  }).format(price);
}

export function getPlanName(plan: Plan, isPt: boolean) {
  return isPt ? plan.name_pt : plan.name_en;
}

export function getPlanDescription(plan: Plan, isPt: boolean) {
  return isPt ? plan.description_pt : plan.description_en;
}
