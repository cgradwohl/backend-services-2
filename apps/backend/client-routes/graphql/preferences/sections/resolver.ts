import { IContext, IResolver } from "~/client-routes/graphql/types";
import { PreferencesPage } from "~/preferences/studio/graphql/page/data-source";
import { IPreferenceTemplate } from "~/preferences/types";
import createEncodedId from "~/studio/graphql/lib/create-encoded-id";
import toConnection from "~/studio/graphql/lib/to-connection";
import { ChannelClassification } from "~/types.public";

export type PreferenceSection = {
  hasCustomRouting: boolean;
  id: string;
  routingOptions: ChannelClassification;
  sectionId: string;
  sectionName: string;
  topics: IPreferenceTemplate[];
};

const getPreferenceSections: IResolver<
  PreferencesPage & { sections: Array<{ section: PreferenceSection }> },
  IContext
> = (source) =>
  toConnection<PreferenceSection>(
    source.sections.map(({ section }) => ({
      ...section,
      id: createEncodedId(section.sectionId, "preference-section"),
      name: section.sectionName,
    }))
  );

export const preferenceSections = {
  Query: {
    preferenceSections: getPreferenceSections,
  },
  PreferencePage: {
    sections: getPreferenceSections,
  },
};
