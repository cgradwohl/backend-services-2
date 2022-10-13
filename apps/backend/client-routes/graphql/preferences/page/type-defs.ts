import { gql } from "apollo-server-lambda";

export const PreferencePage = gql`
  type PreferencePage implements Node {
    showCourierFooter: Boolean!
    id: ID!
  }
  extend type Query {
    preferencePage: PreferencePage
  }
`;
