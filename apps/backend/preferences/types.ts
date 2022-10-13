import { ChannelClassification, PreferenceStatus } from "~/types.public";

export type RuleType = "snooze" | "channel_preferences" | "status";

export interface IRule<T extends RuleType> {
  type: T;
}

export interface ISnoozeRule extends IRule<"snooze"> {
  start?: string;
  until: string;
}

export type Rule = ISnoozeRule;

export type ResourceType =
  | "templates"
  | "notifications"
  | "lists"
  | "subscriptions"
  | "recipients";

export type PreferenceValue = {
  status: PreferenceStatus;
  channel_preferences?: ChannelClassification[];
  snooze?: Rule[];
};

export interface IPreferenceTemplateAttachment {
  publishedVersion?: string;
  resourceId: string;
  resourceType: ResourceType;
  templateId: string;
  value?: PreferenceValue;
}

export type IPreferenceAttachmentResponse = Omit<
  IPreferenceTemplateAttachment,
  "templateId"
> & {
  lastUpdated: string;
  lastUpdatedBy: string;
};

interface ISnoozeItem extends Pick<IRule<"snooze">, "type"> {
  itemName: string;
}

export interface IChannelPreferenceItem {
  type: "channel_preferences";
  itemName: string;
}

export interface IStatusPreferenceItem {
  type: "status";
  itemName: string;
  itemValue?: PreferenceStatus;
}

export type PreferenceTemplateItems = Array<
  ISnoozeItem | IChannelPreferenceItem | IStatusPreferenceItem
>;

export type AllowedPreferences = Array<"snooze" | "channel_preferences">;

export interface IPreferenceTemplate {
  allowedPreferences: AllowedPreferences;
  created: string;
  creatorId: string;
  // @deprecated
  defaultStatus: "OPTED_IN" | "OPTED_OUT" | "REQUIRED";
  hasCustomRouting?: boolean;
  id: string;
  isArchived?: boolean;
  isPublished?: boolean;
  linkedNotifications: number;
  publishedAt?: string;
  publishedVersion?: string;
  // @deprecated
  routingOptions: ChannelClassification[];
  // This is used to store user specified routing preferences. If we see user specified routing preferences, we will use that in send pipeline.
  routingPreferences?: ChannelClassification[];
  templateId: string;
  templateName: string;
  updated: string;
  updaterId: string;
}

export interface IPreferenceSection {
  hasCustomRouting?: boolean;
  id: string;
  isPublished?: boolean;
  name: string;
  routingOptions: ChannelClassification[];
  sectionId: string;
  updated?: string;
  preferenceGroups?: {
    nodes: Array<IPreferenceTemplate>;
  };
  // This is only used for publishing purposes
  publishedVersion?: string;
  publishedAt?: string;
  /*
    Only used internally to flag if the section is created by Courier
    "migrated" section is created by Courier to migrate the existing preferences categories
    "default" section is created by Courier to give a default section "Notification" to the workspace
  */
  _meta?:
    | "default"
    | "migrated-categories"
    | "migrated-preference-templates"
    | "migrated-notifications";
}

export type IPreferenceSectionDataInput = Partial<
  Omit<IPreferenceSection, "preferenceGroups">
>;
