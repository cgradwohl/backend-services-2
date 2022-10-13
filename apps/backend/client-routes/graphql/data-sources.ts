import PreferenceSectionDataSource from "~/preferences/studio/graphql/sections/data-source";
import PreferencesDataSources from "~/preferences/studio/graphql/templates/data-source";
import PreferencePageDataSource from "./preferences/page/data-source";
import BrandSource from "./brands/data-source";
import MessagesDataSource from "./messages/data-source";

export default () => {
  return {
    brands: new BrandSource(),
    messages: new MessagesDataSource(),
    preferenceTemplates: new PreferencesDataSources(),
    preferenceSections: new PreferenceSectionDataSource(),
    preferencePage: new PreferencePageDataSource(),
  };
};
