import { CognitoIdentityServiceProvider } from "aws-sdk";

const userFactory = (user: CognitoIdentityServiceProvider.UserType) => {
  return {
    create: () => {
      const attributes: Record<string, any> = (user.Attributes ?? []).reduce(
        (acc, attr) => ({
          ...acc,
          [attr.Name]: attr.Value,
        }),
        {}
      );

      return {
        created_at: user.UserCreateDate?.toISOString(),
        enabled: user.Enabled,
        id: user.Username,
        updated_at: user.UserLastModifiedDate?.toISOString(),
        ...attributes,
      };
    },
  };
};

export default userFactory;
