import { BlockType, ICheck, IProfile } from "./types.api.d";
import { Operation } from "fast-json-patch";
import { IBrand, ICreatableBrand, IReplaceableBrand } from "~/lib/brands/types";

import {
  IMessageLog,
  IMessageLogList,
  IMessageHistory,
  MessageHistoryType,
} from "~/lib/message-service/types";
import { INotificationConfig, JSONObject } from "~/types.api";
import { IWriteListItem } from "./lib/lists/types";
import {
  IPreferenceTemplate,
  PreferenceValue,
  Rule,
} from "./preferences/types";
import { ISlackMessage } from "./providers/slack/send";
import { TaxonomyChannel } from "./providers/types";

interface IApiRequest<T> {
  body: T;
}

interface IApiResponse<T> {
  body: T;
  status?: number;
}

interface IApiEmptyResponse {
  status: 204;
}

interface IApiPagedResponse<T>
  extends IApiResponse<{
    paging: {
      cursor?: string;
      more: boolean;
    };
    items: T[];
  }> {}

export { Operation };

export type DebugResponse = any;

export interface IApiError {
  body: ApiErrorResponse;
  status?: number;
}

export type ApiErrorResponse = {
  status?: number;
  message: string;
};

export type ApiSendRequestOverrideAttachment = {
  filename: string;
  contentType: string;
  data: string;
};

export type ApiSendRequestOverrideEmailTracking = {
  open: boolean;
};

export type ApiSendRequestCourierOverrideInstance = {
  data?: {
    [key: string]: any;
  };
  body?: string;
  title?: string;
  headers?: {
    [header: string]: boolean | number | string;
  };
  method?: "put" | "post";
  url?: string;
};

export type ApiSendRequestOverrideInstance = {
  attachments?: ApiSendRequestOverrideAttachment[];
  blocks?: ISlackMessage["blocks"];
  data?: {
    [key: string]: any;
  };
  body?: {
    [key: string]: any;
  };
  title?: string;
  config?: {
    [key: string]: any;
  };
  headers?: {
    [header: string]: boolean | number | string;
  };
  method?: "put" | "post";
  url?: string;
};

export type ApiSendRequestOverrideBrand = {
  brand?: Partial<IBrand>;
};
export type ApiSendRequestOverrideChannel = {
  channel?: {
    email?: {
      attachments?: ApiSendRequestOverrideAttachment[];
      bcc?: string;
      cc?: string;
      from?: string;
      html?: string;
      replyTo?: string;
      subject?: string;
      text?: string;
      tracking?: ApiSendRequestOverrideEmailTracking;
    };
    push?: {
      icon?: string;
      title?: string;
      body?: string;
      clickAction?: string;
      data?: {
        [key: string]: any;
      };
    };
  };
};
export type ApiSendRequestOverrideProvider = {
  [provider: string]: ApiSendRequestOverrideInstance;
};

export type ApiSendRequestOverrideBlocks = {
  blocks: {
    [blockId: string]: {
      type: BlockType;
      content: string;
    };
  };
};

export type ApiSendRequestOverride = ApiSendRequestOverrideBrand &
  ApiSendRequestOverrideChannel &
  ApiSendRequestOverrideProvider;

export type ChannelClassification = "direct_message" | "email" | "push";

export type PreferenceStatus = "OPTED_IN" | "OPTED_OUT" | "REQUIRED";

export interface IPreference {
  status: PreferenceStatus;
  rules?: Rule[];
  channel_preferences?: Array<{
    channel: ChannelClassification;
  }>;
  routingPreferences?: ChannelClassification[];
  hasCustomRouting?: boolean;
  source?: "subscription" | "list" | "recipient";
}

export type RecipientPreferences = Pick<
  IPreferenceTemplate,
  "id" | "templateId" | "templateName"
>;

export interface IPreferences {
  [id: string]: IPreference;
}

export interface IProfilePreferences {
  categories?: IPreferences;
  notifications: IPreferences;
  templateId?: string;
}

export type IApiNotificationBlock = {
  alias?: string;
  context?: string;
  id: string;
  type: BlockType;
  content?: string | { parent?: string; children?: string };
  locales?: {
    [locale: string]:
      | string
      | {
          parent?: string;
          children?: string;
        };
  };
  checksum?: string;
};

export interface IApiTemplateLocales {
  blocks: Array<IApiNotificationBlock>;
  channels?: Array<IApiNotificationChannel>;
  checksum?: string;
}

export interface IApiNotificationChannel {
  id: string;
  type?: string;
  content?: {
    subject?: string;
    title?: string;
  };
  checksum?: string;
  locales?: {
    [locale: string]: {
      subject?: string;
      title?: string;
    };
  };
}
export interface IApiNotificationPostLocalesRequest {
  blocks?: Array<IApiNotificationBlock>;
  channels?: Array<IApiNotificationChannel>;
}

export type IApiNotificationPutBlockLocales = {
  [locale: string]:
    | string
    | {
        parent?: string;
        children?: string;
      };
};

export type IApiNotificationPutChannelLocales = {
  [locale: string]: string;
};

export type IApiNotificationPutLocaleBlock = {
  id: string;
  content:
    | string
    | {
        parent?: string;
        children?: string;
      };
};

export type IApiNotificationPutLocaleChannel = {
  id: string;
  content: string;
};

export interface IApiNotificationPutLocaleRequest {
  blocks?: Array<IApiNotificationPutLocaleBlock>;
  channels?: Array<IApiNotificationPutLocaleChannel>;
}

export interface IApiNotificationGetResponse extends IApiTemplateLocales {}

export interface IApiNotificationListResponse {
  paging: {
    cursor?: string;
    more: boolean;
  };
  results: Array<{
    id: string;
    title: string;
  }>;
}

export interface IApiBrandItem {
  created: IBrand["created"];
  id: IBrand["id"];
  name: IBrand["name"];
  published?: IBrand["published"];
  settings: IBrand["settings"];
  snippets?: IBrand["snippets"];
  updated: IBrand["updated"];
  version: IBrand["version"];
}

export interface IApiBrandsGetResponse extends IApiBrandItem {}

export interface IApiBrandsListResponse {
  paging: {
    cursor?: string;
    more: boolean;
  };
  results: IApiBrandItem[];
}
export interface IApiBrandsPostRequest extends ICreatableBrand {}
export interface IApiBrandsPutRequest extends IReplaceableBrand {}
export interface IApiBrandsPostResponse extends IApiBrandItem {}
export interface IApiBrandsPutResponse extends IApiBrandItem {}

export interface IApiEvent {
  event: string;
  id: string;
  type: "notification";
}

export interface IApiEventsGetResponse {
  id: IApiEvent["id"];
  type: IApiEvent["type"];
}

export interface IApiEventsListResponse {
  results: IApiEvent[];
}

export interface IApiEventsPutRequest extends IApiEvent {}
export interface IApiEventsPutResponse extends IApiEvent {}

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

export type Strategy = Array<TaxonomyChannel | RoutingTree>;
interface $All {
  $all: Strategy;
  $single?: never;
}
interface $Single {
  $all?: never;
  $single: Strategy;
}

export type RoutingTree = XOR<$All, $Single>;

export type ApiSendRequest = {
  brand?: string;
  routing?: RoutingTree;
  data?: any;
  event: string;
  locale?: string;
  override?: ApiSendRequestOverride;
  preferences?: IProfilePreferences;
  profile?: IProfile;
  recipient: string;
  translated?: boolean;
  v1TranslationErrorFallback?: boolean;
};

export type RoutingRecipient = Omit<
  ApiSendRequest,
  "brand" | "event" | "override"
>;

export type ApiSendRoutingRequest = {
  recipients: RoutingRecipient[];
};

export type ApiV1SendResponse = {
  messageId: string;
};

export type APIV2SendResponse = {
  requestId: string;
};

export type ApiSendResponse = ApiV1SendResponse | APIV2SendResponse;

/**
 * replace - overwrite all properties in B from A; remove in properties in B that do not exist in A
 * soft merge - only overwrite properties in B from A that do not yet exist in B
 * overwrite - overwrite all properties in B from A
 * none - do not make any changes to B if B already exists; other B = A
 */
export type MergeStrategy = "replace" | "none" | "overwrite" | "soft-merge";

export interface IApiDataSourceConfig {
  webhook: IApiWebhookConfig;
  merge_strategy: MergeStrategy;
}

export interface IApiWebhookConfig {
  body?: JSONObject; //
  headers?: JSONObject;
  params?: JSONObject;
  method?: "GET" | "POST";
  url: string;
}

export interface IApiWebhookResponse {
  data?: JSONObject;
}

export type ApiSendListOrPatternRequest = {
  brand?: string;
  data: any;
  data_source?: IApiDataSourceConfig;
  event: string;
  list?: string;
  override?: ApiSendRequestOverride;
  pattern?: string;
  preferences?: IProfilePreferences;
};

export interface IMessageLogResponse extends IMessageLog {}

export interface IMessageHistoryResponse {
  results: Array<IMessageHistory<MessageHistoryType>>;
}

export interface IMessageLogListResponse extends IMessageLogList {}

export interface IMessageOutputResponse {}

export type ApiPreferencesGetResponse = IProfilePreferences;
export type ApiPreferencesPutRequest = IProfilePreferences;
export type ApiPreferencesListResponse = {
  uncategorized: Array<{
    id: string;
    title: string;
    categoryId: string;
    config: INotificationConfig;
  }>;
  categories: Array<{
    id: string;
    title: string;
    config: INotificationConfig;
    notifications: Array<{
      id: string;
      title: string;
      config: INotificationConfig;
    }>;
  }>;
};
export type ApiPreferenceTemplateGetResponse = Omit<
  IPreferenceTemplate,
  "id" | "linkedNotifications"
>;

export interface ApiPreferenceTemplatesGetResponse
  extends IApiPagedResponse<
    Omit<IPreferenceTemplate, "id" | "linkedNotifications">
  > {}

export type ApiPreferencesPatchRequest = {
  patch: Operation[];
};

export type ApiPreferencesPutResponse = {
  status: "SUCCESS";
};

export type ApiPreferencesPatchResponse = {
  status: "SUCCESS";
};

export type ApiProfilesAddToListsRequest = {
  lists: Array<{ listId: string; preferences: IProfilePreferences }>;
};

export type ApiProfilesAddToListsResponse = {
  status: "SUCCESS";
};

export type ApiProfilesPostRequest = {
  profile: any;
};

export type ApiProfilesPostResponse = {
  status: "SUCCESS";
};

export type ApiProfilesPutRequest = {
  profile: any;
};
export type ApiProfilesPutResponse = {
  status: "SUCCESS";
};

export type ApiProfilesPatchRequest = {
  patch: Operation[];
};

export type ApiProfilesPatchResponse = {
  status: "SUCCESS";
};
export type ApiProfilesGetResponse = {
  profile: any;
};

export type ApiProfilesGetListsResponse = {
  paging: {
    cursor?: string;
    more: boolean;
  };
  results: IApiListItem[];
};

export type IndentWebhookResponse = "ok";

export interface IStripeWebhookResponse {
  received: boolean;
}

// ### lists
export interface IApiListItem {
  created: string;
  id: string;
  name?: string;
  preferences?: IProfilePreferences;
  updated?: string;
}

export interface IApiListItemSubscription {
  created: string;
  recipientId: string;
  preferences: IProfilePreferences;
}

export interface IApiWriteListItem {
  id: string;
  name?: string;
}

export interface IApiGetListItemSubscriptionsResponse
  extends IApiPagedResponse<IApiListItemSubscription> {}

export interface IApiGetSubscriptionResponse
  extends IApiResponse<IApiListItemSubscription> {}

export interface IApiPutListItemSubscriptionsRequest
  extends IApiRequest<{
    recipients: { recipientId: string; preferences?: IProfilePreferences }[];
  }> {}

export interface IApiPutRecipientSubscriptionRequest
  extends IApiRequest<{
    preferences: IProfilePreferences;
  }> {}

export interface IApiPutListItemSubscriptionsResponse
  extends IApiEmptyResponse {}

export interface IApiDeleteListItemResponse extends IApiEmptyResponse {}

export interface IApiGetListItemResponse extends IApiResponse<IApiListItem> {}

export interface IApiGetListItemsResponse
  extends IApiPagedResponse<IApiListItem> {}

export interface IApiListItemSubscribeResponse extends IApiEmptyResponse {}
export interface IApiListItemUnsubscribeResponse extends IApiEmptyResponse {}

export interface IApiPutListItemRequest extends IApiRequest<IWriteListItem> {}
export interface IApiPutListItemResponse extends IApiEmptyResponse {}

export interface IApiRestoreListItemResponse extends IApiEmptyResponse {}
// ### end_lists

export interface IApiNotificationGetSubmissionChecksResponse {
  checks: ICheck[];
}
export interface IApiNotificationPutSubmissionChecksRequest {
  checks: Omit<ICheck, "id" | "type" | "updated">[];
}
export interface IApiNotificationPutSubmissionChecksResponse {
  checks: ICheck[];
}

export interface IApiMessageGetOutputResponse {
  results: Array<IApiMessageOutputItem>;
}
export interface IApiMessageOutputItem {
  channel: string;
  channel_id: string;
  content: {
    html?: string;
    title?: string;
    blocks?: Array<any>;
    body?: string;
    subject?: string;
    text?: string;
  };
}

export interface IUsersTokenData {
  token: string;
  last_used?: string;
  properties?: { [key: string]: any };
  provider_key: string;
  status: "unknown" | "active" | "failed" | "revoked";
  status_reason?: string;
  /** ISO 8601 date of expiration. Set to false to disable */
  expiry_date?: string | false;
  device?: {
    app_id?: string;
    ad_id?: string;
    device_id?: string;
    platform?: string;
    manufacturer?: string;
    model?: string;
  };
  tracking?: {
    os_version?: string;
    ip?: string;
    lat?: string;
    long?: string;
  };
}

export type IUsersPutTokenData = Omit<
  IUsersTokenData,
  "last_used" | "status" | "token"
> & {
  token?: string;
  status?: IUsersTokenData["status"];
};

export type IUsersPutTokensData = {
  tokens: (IUsersPutTokenData & { token: string })[];
};

export type IUsersPatchTokenData = {
  patch: {
    op: "replace" | "add" | "remove" | "test";
    value?: string | { [key: string]: any };
  }[];
};

export interface IPutTokenItemRequest extends IApiRequest<IUsersPutTokenData> {}

export interface IUsersPutTokensRequest
  extends IApiRequest<IUsersPutTokensData> {}

export interface IUsersPatchTokenItemRequest
  extends IApiRequest<IUsersPatchTokenData> {}

export interface IApiUsersGetTokenResponse
  extends IApiResponse<IUsersTokenData> {}

export interface IApiUsersGetTokensResponse
  extends IApiResponse<{ tokens: IUsersTokenData[] }> {}

export interface IApiUsersPutTokenResponse extends IApiEmptyResponse {}

export interface IApiUsersPutTokensResponse extends IApiEmptyResponse {}

export interface IApiUsersPatchTokenResponse extends IApiEmptyResponse {}

export interface IApiUsersDeleteTokenResponse extends IApiEmptyResponse {}

type IAuthIssueTokenData = {
  token: string;
};

export interface IApiAuthPostIssueTokenResponse
  extends IApiResponse<IAuthIssueTokenData> {}
