module.exports = (resourceId, logicalId) => {
  if (
    logicalId.indexOf("CognitoTriggers") > -1 ||
    logicalId.indexOf("StreamConsumer") > -1
  ) {
    return false;
  }
};
