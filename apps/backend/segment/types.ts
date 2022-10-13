import { IAutomationTemplate } from "~/automations/types";
import { ApiRequestContext } from "~/lib/lambda-response";
import { ISegmentEventItem } from "./services/incoming-events";

export type InboundSegmentRequestTypes = "identify" | "group" | "track";

export enum InboundSegmentRequestTypesEnum {
  IDENTIFY = "identify",
  GROUP = "group",
  TRACK = "track",
}

export interface IInboundSegmentIdentifyRequest {
  anonymousId?: string;
  event: string;
  messageId: string;
  traits: {
    [key: string]: any;
  };
  type: InboundSegmentRequestTypesEnum.IDENTIFY;
  userId?: string;
}

export interface IInboundSegmentGroupRequest {
  anonymousId?: string;
  event: string;
  groupId: string;
  traits: {
    [key: string]: any;
  };
  type: InboundSegmentRequestTypesEnum.GROUP;
  userId?: string;
}

export interface IInboundSegmentTrackRequest {
  anonymousId?: string;
  event: string;
  messageId: string;
  properties: {
    courier?: {
      list?: string;
      pattern?: string;
    };
    [key: string]: any;
  };
  type: InboundSegmentRequestTypesEnum.TRACK;
  userId?: string;
}

export interface IInboundSegmentPostRequest {
  type: InboundSegmentRequestTypes;
  [key: string]: any;
}

export interface IInboundSegmentPostResponse {
  body?: {
    message?: string;
  };
  status: number;
}

export interface IInboundSegmentMessage {
  dryRunKey: ApiRequestContext["dryRunKey"];
  scope: ApiRequestContext["scope"];
  body: IInboundSegmentPostRequest;
}

export interface ISegmentItemWithMappings {
  item: ISegmentEventItem;
  automationTemplateMappings?: IAutomationTemplate[];
}
