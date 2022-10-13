const parseTaxonomy = (
  taxonomy: string
): {
  channel: string;
  class?: string;
  provider?: string;
} => {
  const [channel, ...rest] = taxonomy.split(":");
  const provider = rest.pop();
  const channelClass = rest.pop();

  return {
    channel,
    class: channelClass,
    provider,
  };
};

export default parseTaxonomy;
