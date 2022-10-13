const excludeActionPatterns = [
  [
    "kinesis:GetRecords",
    "kinesis:GetShardIterator",
    "kinesis:DescribeStream",
    "kinesis:ListStreams",
  ],
  [
    "kinesis:GetRecords",
    "kinesis:GetShardIterator",
    "kinesis:DescribeStreamSummary",
    "kinesis:ListShards",
  ],
  ["kinesis:SubscribeToShard"],
];

const arrayEquals = (array1, array2) => {
  return (
    Array.isArray(array1) &&
    Array.isArray(array2) &&
    array1.length === array2.length &&
    array1.every((val, index) => val === array2[index])
  );
};

const shouldExcludeStatement = (statement) => {
  for (const pattern of excludeActionPatterns) {
    if (arrayEquals(pattern, statement.Action)) {
      return true;
    }
  }
  return false;
};

class CourierPolicyPlugin {
  constructor(serverless) {
    this.serverless = serverless;

    if (this.serverless.service.provider.name !== "aws") {
      throw new this.serverless.classes.Error("Plugin supports only AWS");
    }

    this.hooks = {
      "package:compileEvents": this.compileEvents.bind(this),
    };
  }

  compileEvents() {
    const { providers, service } = this.serverless;
    const resources = service.provider.compiledCloudFormationTemplate.Resources;
    const globalRoleName = providers.aws.naming.getRoleLogicalId();
    const globalIamRole = resources[globalRoleName];
    const policies = globalIamRole?.Properties?.Policies ?? [];

    const statements = policies[0]?.PolicyDocument?.Statement?.filter(
      (statement) => !shouldExcludeStatement(statement)
    );

    globalIamRole.Properties.Policies[0].PolicyDocument.Statement = statements;
  }
}

module.exports = CourierPolicyPlugin;
