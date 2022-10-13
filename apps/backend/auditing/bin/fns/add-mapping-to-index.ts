import { updateIndex } from "~/auditing/stores/elasticsearch/audit-events";
import { IAuditEventAddIndexMapping } from "~/auditing/stores/elasticsearch/types";

interface IEvent {
  properties: IAuditEventAddIndexMapping;
}

/*
To Invoke:

yarn serverless invoke -f BinAddMappingToElasticSearchIndex -p ./debug.EXAMPLE.json

Expects a file input like:

{
  "properties": {
    "username": {
      "type": "keyword"
    }
  }
}

*/

export const handle = async (event: IEvent) => {
  if (!event.properties) {
    throw new Error("Must supply `properties` on the event");
  }

  await updateIndex(event.properties);
};
