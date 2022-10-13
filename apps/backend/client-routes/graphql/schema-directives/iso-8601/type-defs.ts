import { gql } from "apollo-server-lambda";

export default gql`
  directive @iso8601 on FIELD_DEFINITION
`;
