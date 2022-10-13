// -----------------
// base definitions
// -----------------

import Analytics from "analytics-node";
import { IBrand } from "~/types.api";

export interface IAnalyticsEvent {
  body?: object;
  gaClientId?: string;
  key: string;
  tenantId: string;
  userId: string;
}

export interface IAnalyticsEventResponse {
  context?: {
    groupId: string;
  };
  event: string;
  integrations?: {
    "Google Analytics"?: {
      clientId: string;
    };
  };
  properties?: {
    [key: string]: any;
  };
  type: string;
  userId: string;
}

// ----------------------------
// individual event extensions
// ----------------------------

export interface IAccountAddedUserAnalyticsEvent extends IAnalyticsEvent {
  body: {
    addedUserId: string;
  };
}

export interface IAccountCreatedAnalyticsEvent extends IAnalyticsEvent {
  body: {
    tenantName: string;
  };
}

export interface IAccountRemovedUserAnalyticsEvent extends IAnalyticsEvent {
  body: {
    removedUserId: string;
  };
}

export interface IBrandCreatedAnalyticsEvent extends IAnalyticsEvent {
  body: {
    brand: IBrand;
  };
}

export interface IExperimentAnalyticsEvent extends IAnalyticsEvent {
  body: {
    experiment: string;
    variation: string;
  };
}
export interface IIntegrationAddedAnalyticsEvent extends IAnalyticsEvent {
  body: {
    created: string;
    creator: string;
    json: {
      provider: string;
    };
    title: string;
  };
}

export interface IInviteSentAnalyticsEvent extends IAnalyticsEvent {
  body: {
    inviteeEmail: string;
  };
}

export interface IListCreatedAnalyticsEvent extends IAnalyticsEvent {
  body: {
    created: string;
    creator: string;
    name: string;
    id: string;
  };
}

export interface INotificationCreatedAnalyticsEvent extends IAnalyticsEvent {
  body: {
    created: string;
    creator: string;
    id: string;
    title: string;
  };
}

export interface INotificationPreviewedAnalyticsEvent extends IAnalyticsEvent {
  body: {
    brandId: string;
    draftId: string;
    messageId: string;
    provider: string;
    templateId: string;
  };
}

export interface INotificationPublishedAnalyticsEvent extends IAnalyticsEvent {
  body: {
    id: string;
    message?: string;
    published: string;
    title: string;
  };
}

export interface INotificationTestSentAnalyticsEvent extends IAnalyticsEvent {
  body: {
    brandId: string;
    draftId: string;
    messageId: string;
    notificationId: string;
    templateId: string;
    recipientId: string;
  };
}

export interface ITenantOwnershipTransferredAnalyticsEvent
  extends IAnalyticsEvent {
  body: {
    ownerId: string;
  };
}

export interface IUserSignedUpAnalyticsEvent extends IAnalyticsEvent {
  body: {
    email: string;
  };
}

// -------------------------------------------
// worker types for sending events to segment
// -------------------------------------------

export type AsyncTrack = (data: IAnalyticsEventResponse) => Promise<void>;

export type Group = Parameters<Analytics["group"]>[0];

export interface ITrack {
  body?: {
    [key: string]: any;
  };
  gaClientId?: string;
  key: string;
  tenantId: string;
  userId: string;
}

export interface ISqsSegmentEvent {
  event: Group | ITrack;
  path: string;
  type: "group" | "track";
}
