import { getSsoUserByEmail } from "~/lib/cognito";

const listUsersPromiseMock = jest.fn();
jest.mock("aws-sdk", () => ({
  CognitoIdentityServiceProvider: jest.fn().mockImplementation(() => ({
    listUsers: () => ({ promise: listUsersPromiseMock }),
  })),
}));

describe("get users by email", () => {
  beforeEach(jest.resetAllMocks);

  it("should find sso users by email", async () => {
    const Username = "OktaDrewDev_drew@drew-dev.com";

    listUsersPromiseMock.mockResolvedValue({
      Users: [
        {
          Username,
          Attributes: [],
        },
      ],
    });

    const user = await getSsoUserByEmail("drew@drew-dev.com");
    expect(user.id).toEqual(Username);
  });
});
