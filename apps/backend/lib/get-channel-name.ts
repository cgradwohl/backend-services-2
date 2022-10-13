const getChannelName = (channel: { taxonomy: string }) => {
  const taxSplit = channel.taxonomy?.split(":");

  if (taxSplit.length === 1) {
    return taxSplit[0];
  }

  if (taxSplit[taxSplit.length - 2] === "sms") {
    return "sms";
  }

  return taxSplit[0];
};

export default getChannelName;
