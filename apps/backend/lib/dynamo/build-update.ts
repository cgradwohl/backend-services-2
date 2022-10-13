/**
 * Simple util to make building dynamo update objects easier.
 *
 * To use, simply pass an object with all the fields that you want to update.
 * Ex. { foo: "bar", baz: "qux" } will return
 * {
 *  UpdateExpression: "SET #foo = :foo, #baz = :baz",
 *  ExpressionAttributeNames: {
 *    "#foo": "foo",
 *    "#baz": "baz",
 *  },
 *  ExpressionAttributeValues: {
 *    ":foo": "bar",
 *    ":baz": "qux",
 *  }
 * }
 */
export function buildDynamoUpdate(updatedFields: { [key: string]: any }): {
  UpdateExpression: string;
  ExpressionAttributeNames: { [key: string]: string };
  ExpressionAttributeValues: { [key: string]: any };
} {
  const UpdateExpression = Object.keys(updatedFields)
    .map((key) => `#${key} = :${key}`)
    .join(", ");

  const ExpressionAttributeNames = Object.keys(updatedFields).reduce(
    (names, key) => {
      names[`#${key}`] = key;
      return names;
    },
    {} as { [key: string]: string }
  );

  const ExpressionAttributeValues = Object.keys(updatedFields).reduce(
    (values, key) => {
      values[`:${key}`] = updatedFields[key];
      return values;
    },
    {} as { [key: string]: any }
  );

  return {
    UpdateExpression: UpdateExpression.length ? `SET ${UpdateExpression}` : "",
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  };
}
