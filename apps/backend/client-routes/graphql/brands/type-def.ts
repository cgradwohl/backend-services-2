import { gql } from "apollo-server-lambda";

export default gql`
  type BrandColors {
    primary: String
    secondary: String
    tertiary: String
  }

  type Logo {
    href: String
    image: String
  }

  type CssProps {
    backgroundColor: String
    color: String
  }

  type InAppIcons {
    message: String
    bell: String
  }

  type InAppToast {
    borderRadius: String
    timerAutoClose: Int
  }

  type InAppColors {
    invertButtons: Boolean
    invertHeader: Boolean
  }

  type InAppEmptyState {
    text: String
    textColor: String
  }

  type InAppWidgetBackground {
    topColor: String
    bottomColor: String
  }

  type BrandInApp {
    borderRadius: String
    colors: InAppColors
    emptyState: InAppEmptyState
    widgetBackground: InAppWidgetBackground
    disableMessageIcon: Boolean
    disableCourierFooter: Boolean
    fontFamily: String
    icons: InAppIcons
    placement: String
    toast: InAppToast
  }

  type BrandSettings {
    colors: BrandColors
    inapp: BrandInApp
  }

  type Brand implements Node {
    brandId: String!
    created: DateTime! @iso8601
    id: ID!
    settings: BrandSettings
    links: JSON
    logo: Logo
  }

  extend type PreferencePage {
    brand: Brand
  }

  extend type Query {
    defaultBrand: Brand
    brand(brandId: String!, version: String): Brand
    inAppBrand: Brand
  }
`;
