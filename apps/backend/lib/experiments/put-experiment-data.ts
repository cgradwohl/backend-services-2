import AWS from "aws-sdk";

const firehose = new AWS.Firehose();
import getEnvVar from "~/lib/get-environment-variable";

const firehoseDeliveryStreamName = getEnvVar("EXPERIMENTS_FIREHOSE_STREAM");

const putExperimentData = async (
  experiment: string,
  feature_flag: string,
  tenantId: string,
  timestamp: string,
  user_id: string,
  variation: string
) => {
  const formattedData = {
    event_name: experiment,
    event_params: {
      experiment,
      feature_flag,
      tenantId,
      timestamp,
      user_id,
      variation,
    },
  };

  await firehose
    .putRecord({
      DeliveryStreamName: firehoseDeliveryStreamName,
      Record: {
        Data: JSON.stringify(formattedData),
      },
    })
    .promise();
};

export default putExperimentData;
