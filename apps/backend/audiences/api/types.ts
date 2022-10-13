import { ApiRequestContext } from "~/lib/lambda-response";
import { FilterConfig } from "~/audiences/stores/dynamo/types";

export type Resource =
  | "/audiences"
  | "/audiences/{audience_id}"
  | "/audiences/{audience_id}/members"
  | "/audiences/{audience_id}/members/{member_id}";

export type MemberResource = "/members/{member_id}/audiences";

export type BaseAudienceResponse = {};

export interface AudienceHandler<T extends BaseAudienceResponse> {
  (context: ApiRequestContext): Promise<T>;
}

export type Audience = {
  created_at: string;
  description: string;
  id: string;
  name: string;
  // TODO: https://linear.app/trycourier/issue/C-5533/rule-engine-ux-for-allowing-people-to-create-audiences-rule
  // rules will never be null, but until we have a UI for creating audiences, we need to allow it to be null
  filter: FilterConfig | null;
  updated_at: string;
};

export type AudienceMember = {
  added_at: string;
  audience_id: string;
  audience_version: number;
  member_id: string;
  reason: string;
};

export interface AudienceListResponse extends BaseAudienceResponse {
  body: {
    paging: {
      cursor: string;
      more: boolean;
    };
    items: Audience[];
  };
}

export interface AudienceDeleteResponse extends BaseAudienceResponse {
  status: 204;
}

export interface AudienceGetResponse extends BaseAudienceResponse {
  status: 200;
  body: Audience;
}

export interface AudienceMemberGetResponse extends BaseAudienceResponse {
  status: 200;
  body: AudienceMember;
}

export interface AudienceMemberListResponse extends BaseAudienceResponse {
  status: 200;
  body: {
    items: AudienceMember[];
    paging: {
      cursor: string;
      more: boolean;
    };
  };
}

export interface AudiencePutResponse extends BaseAudienceResponse {
  status: 200;
  body: {
    audience: Audience;
  };
}

export interface AudienceMemberPutResponse extends BaseAudienceResponse {
  status: 200;
  body: {
    audience_member: AudienceMember;
  };
}

export type Method = "get" | "put" | "delete";

export type UserMethod = "get";
