const { callProviderHandles: actualCallProviderHandles } = jest.requireActual(
  "~/lib/send-routing/lib/call-provider-handles"
);
export const callProviderHandles = jest.fn(actualCallProviderHandles);
