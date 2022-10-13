import { GetDeliveredTimestamp } from "../types";

/*
This grabs the timestamp of the latest event, which could delivered or a different status.
This could be changing if people clicked on the message after it was delivered.

The endpoint used doesn't give delivered timestamp separately,
but the one that goes against the their message ID does. 
The problem is we can't use that one until we get their message ID
either from the API endpoint I'm using today or via webhooks.
*/
const getDeliveredTimestamp: GetDeliveredTimestamp = providerResponse => {
  const {
    data: {
      messages: [response],
    },
  } =
    typeof providerResponse === "string"
      ? JSON.parse(providerResponse)
      : providerResponse;

  return new Date(response.last_event_time).getTime();
};

export default getDeliveredTimestamp;
