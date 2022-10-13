import { gql } from "apollo-server-lambda";

export default gql`
  type ProfileProvider {
    provider: String!
    installed: Boolean!
  }

  extend type Profile {
    providers: [ProfileProvider]!
  }
`;
