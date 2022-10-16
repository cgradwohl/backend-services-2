import signedRequest from "aws-signed-axios";
import { join as joinPath } from "path";
import logger from "~/lib/logger";

const includeHttps = (endpoint: string): string => {
  const hasScheme = /[a-zA-Z0-9+.-]+:/.test(endpoint);
  if (!hasScheme) {
    // assume a domain was given. Prefix with https://
    return `https://${endpoint}`;
  }
  return endpoint;
};

const elasticSearch = (endpoint: string, index?: string) => {
  // Fn::GetAtt [ , "DomainEndpoint"] doesn't include https://
  endpoint = includeHttps(endpoint);

  // remove trailing slashes
  endpoint = endpoint.replace(/\/+$/, "");

  const count = async (query: any) => {
    const path = joinPath("/", index, "_doc", "_count");

    return request("GET", path, query);
  };

  /**
   * Remove a document.
   * @param id - document id
   */
  const del = async (id: string) => {
    const path = joinPath("/", index, "_doc", encodeURIComponent(id));
    return request("DELETE", path);
  };

  const deleteIndex = async () => {
    const path = joinPath("/", index);
    return request("DELETE", path);
  };

  /**
   * Return the mappings for this index.
   */
  const getIndex = async () => {
    const path = joinPath("/", index, "_mapping");
    return request("GET", path);
  };

  /**
   * Create or replace a document.
   * @param id - document id
   * @param doc - document data
   */
  const put = async (id: string, doc: any) => {
    const path = joinPath("/", index, "_doc", encodeURIComponent(id));
    return request("PUT", path, doc);
  };

  /**
   * Get a document.
   * @param id - document id
   */
  const get = async (id: string) => {
    const path = joinPath("/", index, "_source", encodeURIComponent(id));
    return request("GET", path);
  };

  /**
   * Search for documents
   * @param query - Elasticsearch query
   */
  const search = async (query: any) => {
    const path = joinPath(
      "/",
      index,
      "_doc",
      // only want the _source and sort values for now
      "_search?filter_path=hits.hits._source,hits.hits.sort,hits.total.value"
    );
    const response = await request("POST", path, query);

    return {
      hits: response?.hits?.hits ?? [],
      total: response?.hits?.total?.value,
    };
  };

  const raw = async (query: any) => {
    const path = joinPath(
      "/",
      index,
      "_doc",
      // only want the _source and sort values for now
      "_search"
    );
    const response = await request("POST", path, query);
    return response;
  };

  /**
   * Create or update an index
   * @param data - Elasticsearch index data
   */
  const setIndex = async (data: any) => {
    const path = joinPath("/", index);
    return request("PUT", path, data);
  };

  /**
   * Add fields to an elastic search index
   * @param data - Elasticsearch index data
   */
  const updateIndex = async (data: any) => {
    const path = joinPath("/", index, "_mapping");
    return request("PUT", path, data);
  };

  /**
   * @internal Make the request. This handles common stuff like setting the Content-Type header
   * that is needed for all requests.
   */
  const request = async (method: string, path: string, body?: any) => {
    const url = endpoint + path;
    const requestData = {
      data: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
      method,
      url,
    };

    let res;

    try {
      res = await signedRequest(requestData);
    } catch (err) {
      if (err.response) {
        logger.error(err.response);
      }
      throw err;
    }

    return res.data;
  };

  return {
    count,
    delete: del,
    deleteIndex,
    get,
    getIndex,
    put,
    raw,
    search,
    setIndex,
    updateIndex,
  };
};

export default elasticSearch;
