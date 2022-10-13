import { gql } from "apollo-server-lambda";

export default gql`
  directive @authorize(scope: String!) on FIELD_DEFINITION | OBJECT
`;
