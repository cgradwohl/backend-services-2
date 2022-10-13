import dynamoObjectService from "~/lib/dynamo/object-service";
import {
  IDynamoListItemJson,
  IDynamoListPatternJson,
  IDynamoListSubscriptionJson,
} from "./types";

const objtype = "list";

export const listItemStore = dynamoObjectService<IDynamoListItemJson>(objtype, {
  idScope: objtype,
  useScopedId: true,
});

export const patternStore = dynamoObjectService<IDynamoListPatternJson>(
  `${objtype}:pattern`,
  { useScopedId: true }
);

export const subscriptionStore = dynamoObjectService<
  IDynamoListSubscriptionJson
>(`${objtype}:subscription`, { idScope: objtype, useScopedId: true });
