import { getErrorMessage, NotificationNotFoundError } from "../errors";

describe("send prepare errors", () => {
  describe("get error message", () => {
    it("Returns the message of an error if error is user facing", () => {
      const message = "Hello world!";
      const error = new NotificationNotFoundError(message);
      const errorMessage = getErrorMessage(error);
      expect(errorMessage).toEqual(message);
    });

    it("Returns a generic error message for non user facing errors", () => {
      const error = new Error("Hello");
      const errorMessage = getErrorMessage(error);
      expect(errorMessage).toEqual("Encountered an error preparing message.");
    });
  });
});
