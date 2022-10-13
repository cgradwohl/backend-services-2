import dynamoObjectService from "../dynamo/object-service";

const objtype = "settings";
const envSettingsService = dynamoObjectService<{
  value: any;
}>(objtype, {
  useScopedId: true,
});

export const get = async <T>(params) => {
  const response = await envSettingsService.get(params);
  return response?.json?.value as T;
};

export const update = async <T>(params, value: T) => {
  try {
    await envSettingsService.replace(params, { json: { value } });
  } catch (ex) {
    await envSettingsService.create(params, { json: { value } });
  }
};
