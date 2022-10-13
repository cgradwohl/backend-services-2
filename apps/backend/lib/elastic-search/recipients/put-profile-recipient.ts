import getUnixTime from "date-fns/getUnixTime";

import { IProfile, IRecipient, IRecipientFields } from "~/types.api";

import { IProfileObject } from "~/lib/dynamo/profiles";
import { recipientMappingDefaultValues_2022_01_28 as strictRecipient } from "~/lib/sample-recipient-fields";

import { isValid } from "date-fns";
import logger from "~/lib/logger";
import elasticSearch from "..";
import { encode } from "../../base64";
import { elasticSearchIndex } from "./recipients";

const endpoint = process.env.ELASTIC_SEARCH_ENDPOINT;
const index = process.env.ELASTIC_SEARCH_RECIPIENTS_INDEX ?? elasticSearchIndex;
const idAttribute = process.env.ELASTIC_SEARCH_ID_ATTRIBUTE ?? "id";

export const es = elasticSearch(endpoint, index);

const mapValue: {
  [key in keyof Partial<IRecipientFields>]: (
    v: number | string
  ) => number | string;
} = {
  updated_at: (value: number | string) =>
    value ? getUnixTime(new Date(value)) : undefined,
  birthdate: (value: number | string) => {
    const date = value ? new Date(value) : undefined;
    if (isValid(date)) {
      return date.toISOString();
    }
    throw new Error("Given birthdate is invalid");
  },
};

const shouldAddToDoc = (value: object | number | string | boolean) => {
  if (typeof value === "string" && (!value.length || value === "_")) {
    return false;
  }

  if (typeof value === "object" && value && !Object.keys(value).length) {
    return false;
  }

  return true;
};

const put = async (profile: IProfileObject) => {
  const id = profile[idAttribute];
  if (!id) {
    return;
  }

  const fullJson: IProfile =
    (typeof profile.json === "string"
      ? JSON.parse(profile.json)
      : profile.json) ?? {};

  const json = Object.entries(fullJson).reduce((acc, [k, v]) => {
    if (k in strictRecipient && typeof v === typeof strictRecipient[k]) {
      try {
        const mappedValue = mapValue[k]?.(v) ?? v;
        if (shouldAddToDoc(v)) {
          acc[k] = mappedValue;
        }
      } catch {
        // ignored
      }
    }

    return acc;
  }, {} as IRecipientFields);

  const esRecipientId = encode(`${profile.tenantId}/${id}`);

  logger.debug(`RecipientId for Index:- ${esRecipientId}`);

  const document: IRecipient = {
    id: esRecipientId,
    ...json,
    recipientId: id,
    tenantId: profile.tenantId,
    type: "user",
    updated_at: profile.updated,
  };
  await es.put(esRecipientId, document);
};

export default put;
