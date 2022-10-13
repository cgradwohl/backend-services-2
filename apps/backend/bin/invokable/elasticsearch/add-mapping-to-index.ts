import elasticsearch from "~/lib/elastic-search";
import log from "~/lib/log";

interface IAddMappingEvent {
  index: string;
  properties: {
    [property: string]: {
      type: string;
      // ...other elasticsearch mapping properties
    };
  };
}

/*
To Invoke:

yarn serverless invoke -f BinAddMappingToElasticSearchIndex -p ./debug.EXAMPLE.json

Expects a file input like:

{
  "index": "messages",
  "properties": {
    "provider": {
      "type": "keyword"
    }
  }
}

*/

const elasticSearchEndpoint = process.env.ELASTIC_SEARCH_ENDPOINT;

export const handle = async (event: IAddMappingEvent) => {
  const { index, properties } = event;

  if (!index) {
    throw new Error("Must supply an `index` property on the event");
  }

  if (!properties) {
    throw new Error("Must supply `properties` on the event");
  }

  log(`updating elastic search index ${index} with properties`, properties);

  const client = elasticsearch(elasticSearchEndpoint, index);
  await client.updateIndex({ properties });
};
