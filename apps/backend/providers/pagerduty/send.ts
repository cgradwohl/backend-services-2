import axios from "axios";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

/*
  Cannot support acknowledge and resolve because the send endpoint would need the dedup key,
  but the message endpoint does not return the details of the response from hitting the Provider.
*/
const EVENT_ACTIONS = ["trigger"];
const SEVERITY = ["info", "warning", "error", "critical"];

const send: DeliveryHandler = async (params, template) => {
  const { eventAction, routingKey, source, severity } =
    params.config as unknown as {
      eventAction: string;
      routingKey: string;
      source: string;
      severity: string;
    };

  if (!eventAction || !EVENT_ACTIONS.includes(eventAction)) {
    throw new ProviderConfigurationError(
      "Invalid Event Action specified. Valid Event Actions are trigger."
    );
  }

  if (!routingKey || !routingKey.length) {
    throw new ProviderConfigurationError("No Routing Key specified.");
  }

  if (!source || !source.length) {
    throw new ProviderConfigurationError("No Source specified.");
  }

  if (!severity || !SEVERITY.includes(severity)) {
    throw new ProviderConfigurationError(
      "Invalid Severity specified. Valid Severities are info, warning, error, and critical."
    );
  }

  try {
    const initialData = {
      event_action: eventAction,
      images: [],
      links: [],
      payload: {
        severity,
        source,
        summary: template.plain,
      },
      routing_key: params.profile?.pagerduty?.["routing_key"] ?? routingKey,
    };

    const data =
      params.override && params.override.body
        ? jsonMerger.mergeObjects([initialData, params.override.body])
        : initialData;

    const res = await axios({
      data,
      headers: {
        "Content-Type": "application/json",
      },
      method: "post",
      timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
      timeoutErrorMessage: "PagerDuty API request timed out.",
      url: `https://events.pagerduty.com/v2/enqueue`,
    });
    return {
      data: res.data,
      headers: res.headers,
      status: res.status,
      statusText: res.statusText,
    };
  } catch (err) {
    handleSendError(err);
  }
};

export default send;
