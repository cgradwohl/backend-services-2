import { IApiDataSourceConfig } from "~/types.public";
import { InvalidDataSourceConfigError } from "./errors";

export const assertValidDataSourceConfig = (
  dataSource: IApiDataSourceConfig
) => {
  const { method, url } = dataSource.webhook;

  if (method !== "GET" && method !== "POST") {
    throw new InvalidDataSourceConfigError(
      "Webhook method must be either 'GET' or 'POST'"
    );
  }

  if (typeof url !== "string") {
    throw new InvalidDataSourceConfigError("Webhook url must be a string.");
  }

  if (!url.includes("https://")) {
    throw new InvalidDataSourceConfigError(
      "Webhook url must be a valid https url."
    );
  }

  if (!dataSource.merge_strategy) {
    throw new InvalidDataSourceConfigError(
      "Webhook merge_strategy must be defined."
    );
  }

  if (
    !["replace", "none", "overwrite", "soft-merge"].includes(
      dataSource.merge_strategy
    )
  ) {
    throw new InvalidDataSourceConfigError(
      "A valid webhook merge_strategy must be defined."
    );
  }
};
