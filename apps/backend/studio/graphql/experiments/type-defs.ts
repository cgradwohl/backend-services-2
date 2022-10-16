import { gql } from "apollo-server-lambda";

export default gql`
  extend type Mutation {
    saveExperimentEvaluation(
      event: ExperimentEventType!
    ): SaveExperimentEvaluationResponse!
  }

  input ExperimentEventType {
    experiment: String
    linkedExperiments: [String]
    featureFlag: String
    variation: String
  }

  type SaveExperimentEvaluationResponse {
    experimentKey: String
    featureFlag: String
    variation: String
  }
`;
