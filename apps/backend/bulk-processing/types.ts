import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Message, UserRecipient } from "~/api/send/types";
import { ApiRequestContext } from "~/lib/lambda-response";
import { ApiVersion } from "~/send/types";
import { IProfile } from "~/types.api";
import { TenantRouting, TenantScope } from "~/types.internal";
import { ApiSendRequest, IProfilePreferences } from "~/types.public";

type InboundBulkMessageApiV1 = Omit<
  ApiSendRequest,
  "preferences" | "profile" | "recipient"
>;

type InboundBulkMessageApiV2 = Omit<Message, "to">;

interface IInboundBulkMessage extends InboundBulkMessageApiV1 {
  message?: InboundBulkMessageApiV2;
}

export type InboundBulkMessage = IInboundBulkMessage;

export type BulkJobStatus = "CREATED" | "PROCESSING" | "COMPLETED" | "ERROR";
export type BulkMessageUserStatus = "PENDING" | "ENQUEUED" | "ERROR";
export interface IBulkJob {
  jobId: string;
  payloadPtr: string; // s3 key
  created: string;
  updated?: string;
  status: BulkJobStatus;
  enqueued: number;
  failures: number;
  received: number;
  workspaceId: string;
  scope: TenantScope;
  dryRunKey?: TenantRouting;
  apiVersion: ApiVersion;
}

export interface IDynamoBulkJob extends IBulkJob {
  pk: string;
  gsi1pk: string; // list by workspace
  gsi1sk: string; // enable sorting
}

export interface IBulkMessageUser {
  userId: string;
  created: string;
  updated?: string;
  payloadPtr: string; // s3 key
  status: BulkMessageUserStatus;
  messageId?: string;
}

export interface IDynamoBulkMessageUser extends IBulkMessageUser {
  pk: string;
  gsi1pk: string; // list by bulk job by workspace
}

export interface IInboundBulkMessageUser {
  preferences?: IProfilePreferences;
  profile?: IProfile;
  recipient?: string;
  data?: any; // takes precedence over message.data
  to?: UserRecipient;
}

export type InboundBulkMessageUser = IInboundBulkMessageUser;

export interface ISqsBulkJob {
  apiVersion: ApiVersion;
  jobId: string;
  dryRunKey?: TenantRouting;
  jobPayloadPtr: string;
  pageSize: number;
  scope: TenantScope;
  workspaceId: string;
}

export interface ISqsBulkJobPage {
  apiVersion: ApiVersion;
  jobId: string;
  dryRunKey?: TenantRouting;
  jobPayloadPtr: string;
  lastProcessedRecordPtr?: LastProcessedRecordPtr;
  pageSize: number;
  scope: TenantScope;
  shard: number;
  workspaceId: string;
}

export type LastProcessedRecordPtr = DocumentClient.Key;

export interface IRequestContext {
  apiVersion: ApiVersion;
  dryRunKey?: TenantRouting;
  scope: TenantScope;
}

export interface IBulkProcessingService {
  createJob: (
    message: InboundBulkMessage,
    context: IRequestContext
  ) => Promise<string>;
  ingest: (
    jobId: string,
    users: InboundBulkMessageUser[],
    context: IRequestContext
  ) => Promise<IPostBulkJobIngestResponse>;
  run: (jobId: string, context: IRequestContext) => Promise<boolean>;
  processJob: (
    jobId: string,
    jobPayloadPtr: string,
    pageSize: number,
    context: IRequestContext
  ) => Promise<void>;
  processJobPage: (
    jobId: string,
    jobPayloadPtr: string,
    pageSize: number,
    shard: number,
    context: IRequestContext,
    lastProcessedRecordPtr?: LastProcessedRecordPtr
  ) => Promise<void>;
  getJob: (jobId: string, scope: TenantScope) => Promise<IGetBulkJobResponse>;
  getJobUsers: (
    jobId: string,
    scope: TenantScope,
    cursor?: string
  ) => Promise<IGetBulkMessageUsersResponse>;
}

// move to types.public.d.ts?

export interface IGetBulkJobResponse {
  job: {
    definition: InboundBulkMessage;
    enqueued: number;
    failures: number;
    received: number;
    status: BulkJobStatus;
  };
}

export interface IBulkMessageUserResponse extends InboundBulkMessageUser {
  status: BulkMessageUserStatus;
  messageId?: string;
}

export interface IGetBulkMessageUsersResponse {
  items: IBulkMessageUserResponse[];
  paging: {
    cursor?: string;
    more: boolean;
  };
}

export interface IIngestError {
  user: any;
  error: any;
}

export interface IPostBulkJobIngestResponse {
  total: number;
  errors?: IIngestError[];
}

export interface IPostBulkJobCreateResponse {
  jobId: string;
}

export type PostBulkJob = (
  context: ApiRequestContext
) => Promise<{ body: IPostBulkJobCreateResponse; status: number }>;

export type PostBulkJobIngest = (context: ApiRequestContext) => Promise<{
  body: IPostBulkJobIngestResponse;
}>;

export type PostBulkJobRun = (context: ApiRequestContext) => Promise<{
  status: number;
}>;

export type GetBulkJob = (context: ApiRequestContext) => Promise<{
  body: IGetBulkJobResponse;
}>;

export type GetBulkJobUsers = (context: ApiRequestContext) => Promise<{
  body: IGetBulkMessageUsersResponse;
}>;
