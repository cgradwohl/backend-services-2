export interface IReprocessorService {
  save: (payload: IReprocessorPayloadInput) => Promise<void>;
}

export interface IReprocessorPayloadInput {
  tenantId: string;
}

// Metadata is indended for reprocessor's internal use
export interface IReprocessorPayloadMetadata {
  type: ReprocessorType;
  retryCount: number;
  lastUpdatedAt: string;
}

export interface IReprocessorPayload {
  input: IReprocessorPayloadInput;
  metadata: IReprocessorPayloadMetadata;
}

export type ReprocessorType = "event";
