import { gql } from "apollo-server-lambda";

export default gql`
  directive @authorize(capability: String!) on FIELD_DEFINITION | OBJECT
`;
