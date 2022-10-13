import { SqsTestNotificationMessage } from "../../../../types.internal";

export default (body: SqsTestNotificationMessage) => ({
  Records: [
    {
      messageId: "70aab895-346d-4414-bbda-e352cfeffc29",
      receiptHandle:
        "AQEBscLJ1Aebsid5/o4ouytxH6BhLr9ZkiZwkx86hJfjfnCmi9hqwZpwPp/i8QbouCC0cUf19ud8xHBuoccM9JBdGWRmkC8dgVRPRMuJRxrbFf42umv1YQHCFA89d0jx4sdErGbLuN6RtWMAuesPUlsxrfPVVGo2qau1U6S5ZIzY8wA57DXB2+6rcGYA3lNOFmsJ3Xm4ZmaE1MlxjV+piLXsa0wws+uDdXuNqVjDMc2rg2vgZDymdwCCNgtIFZ8tByrNQxBNwNaZf1ao2nfqfLh4AmUdjH/brQDsAFvZLrBjpzElMCDF9EsAGL9KgmacNOaxuKRKIndFoNc1Sz1uu3AhcQS3gYUHw5PddFOSzT9mLr2yOgm1nPDLJpOsXCZIF9LadslJj/CRg16oh9M8F70HEg==",
      body: JSON.stringify(body),
      attributes: {
        ApproximateReceiveCount: "1",
        SentTimestamp: "1578067190993",
        SenderId: "AROAZEVQJGIN722LDCLYQ:backend-dev-Studio",
        ApproximateFirstReceiveTimestamp: "1578067191001",
      },
      messageAttributes: {},
      md5OfBody: "87464d97c49b6b676e41a40bc07b425c",
      eventSource: "aws:sqs",
      eventSourceARN:
        "arn:aws:sqs:us-east-1:628508668443:dev_backend-sqs-prepare",
      awsRegion: "us-east-1",
    },
  ],
});
