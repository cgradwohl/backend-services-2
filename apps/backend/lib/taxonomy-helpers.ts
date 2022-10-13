import providers from "~/providers";

export const getChannelsByProvider = (providerKey: string): string[] => {
  return providers[providerKey].taxonomy?.channels ?? [];
};

export const getChannelByProvider = (providerKey: string): string => {
  return providers[providerKey].taxonomy?.channel;
};

export const getClassByProvider = (providerKey: string): string | undefined => {
  return providers[providerKey].taxonomy?.class;
};

export const getTaxonomyFromProvider = (providerKey: string): string => {
  const provider = providers[providerKey];
  const { channel, class: className } = provider.taxonomy ?? {};
  return `${channel}:${className ? `${className}:` : ""}${providerKey}`;
};
