import * as alwaysWithoutBestOfJson from "./always-without-best-of-json";
import * as brandOverrideJson from "./brand-override-json";
import * as channelOverrideJson from "./channel-override-json";
import * as disabledChannelJson from "./disabled-channel-json";
import * as filteredChannelJson from "./filtered-channel-json";
import * as filteredChannelShowJson from "./filtered-channel-json-show";
import * as filteredProviderJson from "./filtered-provider-json";
import * as filteredProviderShowJson from "./filtered-provider-json-show";
import * as filteredProviderShowSecondJson from "./filtered-provider-json-show-second";
import * as incompleteProfile from "./incomplete-profile-json";
import * as noValidDeliveryChannelJson from "./no-valid-delivery-channel-json";
import * as preferencesCategoryDisabled from "./preferences-category-disabled";
import * as preferencesCategoryRequired from "./preferences-category-required";
import * as preferencesNotificationDisabled from "./preferences-notification-disabled";
import * as preferencesNotificationRequired from "./preferences-notification-required";
import * as providerMissingConfigId from "./provider-missing-config-id-json";
import * as providerMissingConfiguration from "./provider-missing-configuration-json";
import * as pushProviderJson from "./push-provider-json";
import * as routableJson from "./routable-json";
import * as unknownProvider from "./unknown-provider-json";

export default {
  json: {
    alwaysWithoutBestOf: alwaysWithoutBestOfJson,
    brandOverride: brandOverrideJson,
    channelOverride: channelOverrideJson,
    disabledChannel: disabledChannelJson,
    filteredChannel: filteredChannelJson,
    filteredChannelShow: filteredChannelShowJson,
    filteredProvider: filteredProviderJson,
    filteredProviderShow: filteredProviderShowJson,
    filteredProviderShowSecond: filteredProviderShowSecondJson,
    incompleteProfile,
    noValidDeliveryChannel: noValidDeliveryChannelJson,
    preferencesCategoryDisabled,
    preferencesCategoryRequired,
    preferencesNotificationDisabled,
    preferencesNotificationRequired,
    providerMissingConfigId,
    providerMissingConfiguration,
    pushProvider: pushProviderJson,
    routable: routableJson,
    unknownProvider,
  },
};
