export const useStripeConnect = () => ({
  hasStripeAccount: false,
  stripeStatus: 'no_configurado' as const,
  loading: false,
  error: null as string | null,
  accountDetails: {},
  fetchStripeStatus: async () => {},
  iniciarOnboarding: async () => null,
  refetch: async () => {},
});