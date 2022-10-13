import { NotFoundSendError, FailedPreconditionSendError } from "../index";
import { SendErrorType } from "../types";
describe("Send Error", () => {
  it("should have a type and retryable property of true", () => {
    const error = new NotFoundSendError("The property was not found.");

    expect(error.type).toBeDefined();
    expect(error.type).toEqual(SendErrorType.NOT_FOUND);
    expect(error.retryable).toBeDefined();
    expect(error.retryable).toBe(true);
  });

  it("should have a type and retryable property of false", () => {
    const e = new Error("oops");
    const error = new FailedPreconditionSendError(e);

    expect(error.type).toBeDefined();
    expect(error.type).toEqual(SendErrorType.FAILED_PRECONDITION);
    expect(error.retryable).toBeDefined();
    expect(error.retryable).toBe(false);
  });

  it("should have an error detail property", () => {
    const e = new Error("oops");
    const error = new FailedPreconditionSendError(e, { tenantId: "foo" });

    expect(error.detail).toBeDefined();
    expect(error.detail.tenantId).toEqual("foo");
  });

  it("should pass along the error detail property", () => {
    const e = new NotFoundSendError("Foo not found.", {
      tenantId: "foo",
      messageId: "123",
    });

    const error = new FailedPreconditionSendError(e);

    expect(error.detail).toBeDefined();
    expect(error.detail.tenantId).toEqual("foo");
    expect(error.detail.messageId).toEqual("123");
  });

  it("should extend the error detail property", () => {
    const e = new NotFoundSendError("Foo not found.", {
      tenantId: "foo",
      messageId: "123",
    });

    const error = new FailedPreconditionSendError(e, { runId: "789" });

    expect(error.detail).toBeDefined();
    expect(error.detail.tenantId).toEqual("foo");
    expect(error.detail.messageId).toEqual("123");
    expect(error.detail.runId).toEqual("789");
  });

  it("should extend the error detail property, with the last error to throw taking precedence", () => {
    const e = new NotFoundSendError("Foo not found.", {
      tenantId: "lower precedence",
      messageId: "lower precedence",
    });

    // this should take precedence since its the last error to throw in the call stack
    const error = new FailedPreconditionSendError(e, {
      messageId: "higher precedence",
      runId: "higher precedence",
    });

    expect(error.detail).toBeDefined();
    expect(error.detail.tenantId).toEqual("lower precedence");
    expect(error.detail.messageId).toEqual("higher precedence");
    expect(error.detail.runId).toEqual("higher precedence");
  });
});
