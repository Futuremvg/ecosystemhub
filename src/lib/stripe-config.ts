// Stripe subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Mensal',
    price_id: 'price_1So8r2PehJsCTE4Bzchea82b',
    product_id: 'prod_TlgDOnbYrmPU6q',
    price: 49,
    currency: 'CAD',
    interval: 'month',
    interval_count: 1,
    description: 'Acesso completo ao Ecosystem Hub com cobrança mensal',
    savings: null,
  },
  quarterly: {
    id: 'quarterly',
    name: 'Trimestral',
    price_id: 'price_1So8tvPehJsCTE4BBB3qxwOO',
    product_id: 'prod_TlgGUEVaafH6Q9',
    price: 129,
    currency: 'CAD',
    interval: 'month',
    interval_count: 3,
    description: 'Economize 12% com cobrança trimestral',
    savings: 12,
  },
  annual: {
    id: 'annual',
    name: 'Anual',
    price_id: 'price_1So8vHPehJsCTE4BgNjnzj5O',
    product_id: 'prod_TlgH8YbOb8Lcoe',
    price: 399,
    currency: 'CAD',
    interval: 'year',
    interval_count: 1,
    description: 'Melhor valor! Economize 32% com cobrança anual',
    savings: 32,
  },
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;

export function getPlanByPriceId(priceId: string) {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.price_id === priceId);
}

export function getPlanByProductId(productId: string) {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.product_id === productId);
}

export function formatPrice(price: number, currency: string = 'CAD') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(price);
}
