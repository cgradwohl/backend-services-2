import { IProviderConfiguration } from "~/send/types";

export type MatchingProvidersByChannel = {
  [channel: string]: IProviderConfiguration[];
};
