import Plugin from "~/serverless-plugins/courier-policy-plugin";

interface IStatement {
  Action: string | string[];
  Resource: string | string[];
  Effect: "Allow" | "Deny";
}

interface IOptions {
  logicalRoleId?: string;
  provider?: string;
}

const createMockServerlessContext = (
  statements: IStatement[],
  options?: IOptions
) => {
  const logicalRoleId = options?.logicalRoleId ?? "logical-role-id";
  const provider = options?.provider ?? "aws";

  return {
    classes: {
      Error,
    },
    service: {
      provider: {
        compiledCloudFormationTemplate: {
          Resources: {
            [logicalRoleId]: {
              Properties: {
                Policies: [
                  {
                    PolicyDocument: {
                      Version: "2012-10-17",
                      Statement: statements,
                    },
                  },
                ],
              },
            },
          },
        },
        name: provider,
      },
    },
    providers: {
      aws: {
        naming: {
          getRoleLogicalId: jest.fn().mockReturnValue(logicalRoleId),
        },
      },
    },
  };
};

it("should throw an error is a non-aws provider is used", () => {
  const mock = createMockServerlessContext([], { provider: "gcp" });
  expect(() => {
    new Plugin(mock);
  }).toThrowError("Plugin supports only AWS");
});

it("leaves dynamo unchanged", () => {
  const statements: IStatement[] = [
    {
      Action: [
        "dynamodb:GetRecords",
        "dynamodb:GetShardIterator",
        "dynamodb:DescribeStream",
        "dynamodb:ListStreams",
      ],
      Resource: [
        "arn:aws:dynamodb:us-east-1:628508668443:table/backend-dev-AutomationDelayTable-1UN62IA2ESPJN/stream/2021-09-18T21:25:13.653",
      ],
      Effect: "Allow",
    },
  ];
  const mock = createMockServerlessContext(statements);
  const plugin = new Plugin(mock);
  plugin.compileEvents();

  expect(
    mock.service.provider.compiledCloudFormationTemplate.Resources[
      "logical-role-id"
    ].Properties.Policies[0].PolicyDocument.Statement
  ).toStrictEqual(statements);
});

it("should remove kinesis (with stream summary) statement", () => {
  const mock = createMockServerlessContext([
    {
      Action: [
        "kinesis:GetRecords",
        "kinesis:GetShardIterator",
        "kinesis:DescribeStreamSummary",
        "kinesis:ListShards",
      ],
      Resource: ["arn:aws:kinesis:us-east-1:628508668443:stream/*"],
      Effect: "Allow",
    },
  ]);
  const plugin = new Plugin(mock);
  plugin.compileEvents();

  expect(
    mock.service.provider.compiledCloudFormationTemplate.Resources[
      "logical-role-id"
    ].Properties.Policies[0].PolicyDocument.Statement
  ).toStrictEqual([]);
});

it("should remove kinesis (without stream summary) statement", () => {
  const mock = createMockServerlessContext([
    {
      Action: [
        "kinesis:GetRecords",
        "kinesis:GetShardIterator",
        "kinesis:DescribeStream",
        "kinesis:ListStreams",
      ],
      Resource: ["arn:aws:kinesis:us-east-1:628508668443:stream/*"],
      Effect: "Allow",
    },
  ]);
  const plugin = new Plugin(mock);
  plugin.compileEvents();

  expect(
    mock.service.provider.compiledCloudFormationTemplate.Resources[
      "logical-role-id"
    ].Properties.Policies[0].PolicyDocument.Statement
  ).toStrictEqual([]);
});

it("should remove kinesis shard subscriber", () => {
  const mock = createMockServerlessContext([
    {
      Action: ["kinesis:SubscribeToShard"],
      Resource: ["arn:aws:kinesis:us-east-1:628508668443:stream/*"],
      Effect: "Allow",
    },
  ]);
  const plugin = new Plugin(mock);
  plugin.compileEvents();

  expect(
    mock.service.provider.compiledCloudFormationTemplate.Resources[
      "logical-role-id"
    ].Properties.Policies[0].PolicyDocument.Statement
  ).toStrictEqual([]);
});
