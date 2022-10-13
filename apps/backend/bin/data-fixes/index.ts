import updateStripePriceId from "./20201230-update-stripe-price-id";
import updateEmptyRoles from "./20210104-update-empty-roles";
import loadProfilesIntoEs from "./20210115-load-profiles-into-es";
import subscribeInapp from "./20210201-subscribe-inapp";
import fixTestDefaultBrands from "./20210308-fix-test-default-brands";
import fixCourierList from "./20210324-fix-courier-list";
import archiveInAppLists from "./20210325-archive-in-app-list";
import updateTenantDiscoverability from "./20210616-update-tenant-discoverability";
import updateUserProfileEmails from "./20210831-add-email-to-user-profile";
import reEnqueueMessagesToPrepare from "./20210913-reenqueue-messages-to-prepare-between-ts-range";
import reEnqueueUndeliverableMessages from "./20210913-reprocess-undeliverable-messages";
import forceRetryFailedMessages from "./20210918-force-retry-messages";
import fixProfileParsingErrors from "./20210930-fix-profile-parsing-errors";
import fixProfileParsingErrorsExclusiveProfileIds from "./20211006-fix-profile-parsing-errors-exclusive-profile-ids";
import mapDirectoryIdToTenant from "./20211021-map-directory-id-to-tenant";
import materializeObjects from "./20211029-materialize-objects";
import unsubscribeRecipientFromList from "./20211105-unsubscribe-recipient-from-list";
import updateTenantRequireSso from "./20211110-update-tenant-require-sso";
import idempotentRequestsMigrateToV2 from "./20211214-idempotent-requests-migrate-to-v2";
import reSendV2MessagesOnV1 from "./20220114-re-send-v2-pipeline-messages-on-v1";
import updateTenantDomainsTable from "./20220203-update-domains-table";
import streamExistingListsToElasticSearchRecipients from "./20220218-stream-existing-lists-to-elasticsearch-recipients_2022_01_28";
import deleteUsagePlanApiKeys from "./20220226-delete-usage-plan-api-keys";
import reEnqueueUndeliverableMessagesApr2022 from "./20220413-reenqueue-undeliverable-messages";
import reEnqueueUndeliverableMessagesApr2022V2Pipeline from "./20220413-reenqueue-undeliverable-messages-v2-pipeline";
import updateDiscoverabilityForApprovedDomainWorkspace from "./20220415-workspace-discoverability-update";
import addApprovedDomainsToBusinessWorkspaces from "./20220502-approved-domains-to-business-workspaces";
import reprocessColorMessages from "./20220506-reprocess-one-of-color-messages";
import restoreCourierWorkspacesDiscoverability from "./20220511-restore-courier-workspaces-discoverability";
import updateListUsersCourierProfile from "./20220629-update-list-users-courier-profile";
import generateArchivedLogs from "./20220706-generate-archived-logs";
import multipleCourierProviders from "./20220721-multiple-courier-configurations";
import reprocessGlide from "./20220726-reprocess-glide";
import inactiveWorkspaceCleanup from "./20220811-inactive-workspace-cleanup";
import addDefaultPreferenceSections from "./20220824-add-default-prefection-section-to-existing-tenants";
import unarchiveWorkspaces from "./20220906-unarchive-workspaces";
import replayActionStreamCommand from "./20220907-re-play-action-stream-command";
import inactiveWorkspaceCleanupV2 from "./20220919-inactive-workspace-cleanup-v2";
import deleteElasticsearchIndex from "./20220927-delete-elasticsearch-index";
import categoryToTopic from "./20220928-category-to-topic";
import preferenceTemplatesToTopic from "./20220929-preference-template-to-topic";
import migrateUserPreferences from "./20221002-migrate-user-preferences";
import { findMessageById } from "./20221007-find-message-by-id";

import { Handler } from "./types";

interface IHandlers {
  [key: string]: Handler;
}

const handlers: IHandlers = {
  "20201230-update-stripe-price-id": updateStripePriceId,
  "20210104-update-empty-roles": updateEmptyRoles,
  "20210115-load-profiles-into-es": loadProfilesIntoEs,
  "20210201-subscribe-inapp": subscribeInapp,
  "20210308-fix-test-default-brands": fixTestDefaultBrands,
  "20210324-fix-courier-list": fixCourierList,
  "20210325-archive-in-app-list": archiveInAppLists,
  "20210616-update-tenant-discoverability": updateTenantDiscoverability,
  "20210831-add-email-to-user-profile": updateUserProfileEmails,
  "20210913-reenqueue-messages-to-prepare-between-ts-range":
    reEnqueueMessagesToPrepare,
  "20210913-reprocess-undeliverable-messages": reEnqueueUndeliverableMessages,
  "20210918-force-retry-messages": forceRetryFailedMessages,
  "20210930-fix-profile-parsing-errors": fixProfileParsingErrors,
  "20211006-fix-profile-parsing-errors-exclusive-profile-ids":
    fixProfileParsingErrorsExclusiveProfileIds,
  "20211021-map-directory-id-to-tenant": mapDirectoryIdToTenant,
  "20211029-materialize-objects": materializeObjects,
  "20211105-unsubscribe-recipient-from-list": unsubscribeRecipientFromList,
  "20211110-update-tenant-require-sso": updateTenantRequireSso,
  "20211214-idempotent-requests-migrate-to-v2": idempotentRequestsMigrateToV2, // defuct
  "20220114-re-send-v2-pipeline-messages-on-v1": reSendV2MessagesOnV1,
  "20220203-update-domains-table": updateTenantDomainsTable,
  "20220218-stream-existing-lists-to-elasticsearch-recipients_2022_01_28":
    streamExistingListsToElasticSearchRecipients,
  "20220226-delete-usage-plan-api-keys": deleteUsagePlanApiKeys,
  "20220413-reenqueue-undeliverable-messages":
    reEnqueueUndeliverableMessagesApr2022,
  "20220413-reenqueue-undeliverable-messages-v2-pipeline":
    reEnqueueUndeliverableMessagesApr2022V2Pipeline,
  "20220415-workspace-discoverability-update":
    updateDiscoverabilityForApprovedDomainWorkspace,
  "20220502-add-approved-domains-to-business-workspaces":
    addApprovedDomainsToBusinessWorkspaces,
  "20220506-reprocess-one-of-color-messages": reprocessColorMessages,
  "20220511-restore-courier-workspaces-discoverability":
    restoreCourierWorkspacesDiscoverability,
  "20220629-update-list-users-courier-profile": updateListUsersCourierProfile,
  "20220706-generate-archived-logs": generateArchivedLogs,
  "20220721-multiple-courier-providers": multipleCourierProviders,
  "20220726-reprocess-glide": reprocessGlide,
  "20220824-add-default-prefection-sections": addDefaultPreferenceSections,
  "20220811-inactive-workspace-cleanup": inactiveWorkspaceCleanup,
  "20220906-unarchive-workspaces": unarchiveWorkspaces,
  "20220907-re-play-action-stream-command": replayActionStreamCommand,
  "20220919-inactive-workspace-cleanup-v2": inactiveWorkspaceCleanupV2,
  "20220927-delete-elasticsearch-index": deleteElasticsearchIndex,
  "20220928-category-to-topic": categoryToTopic,
  "20220929-preference-templates-to-topic": preferenceTemplatesToTopic,
  "20221002-migrate-user-preferences": migrateUserPreferences,
  "20221007-find-message-by-id": findMessageById,
};

export default handlers;
