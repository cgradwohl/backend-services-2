import { getFailoverRouteNode } from "../get-failover-node";
import { getRouteNode } from "../lib";
import { complexSmsAndEmailTree } from "../__mocks__/trees";

describe("get failover node address", () => {
  it("should return the correct failover node if twilio fails", () => {
    expect(
      getFailoverRouteNode({
        failedAddress: [0, 0],
        allFailedNodes: [[0, 0]],
        tree: complexSmsAndEmailTree,
      })
    ).toBe(getRouteNode([0, "failover"], complexSmsAndEmailTree));
  });

  it("should rewind the tree and failover to email branch if all sms nodes have failed", () => {
    expect(
      getFailoverRouteNode({
        failedAddress: [0, "failover", "failover", 1, "failover", 0],
        allFailedNodes: [
          [0, "failover", "failover", 1, "failover", 0],
          // To make this extra tricky we have a send to "all" strategy within the failover tree
          [0, "failover", "failover", 0],
        ],
        tree: complexSmsAndEmailTree,
      })
    ).toBe(getRouteNode(["failover"], complexSmsAndEmailTree));
  });

  it("should return the correct failover branch if vonage fails", () => {
    expect(
      getFailoverRouteNode({
        failedAddress: [0, "failover", 0],
        allFailedNodes: [[0, "failover", 0]],
        tree: complexSmsAndEmailTree,
      })
    ).toBe(getRouteNode([0, "failover", "failover"], complexSmsAndEmailTree));
  });

  it("should return the correct failover branch if mailjet fails", () => {
    expect(
      getFailoverRouteNode({
        failedAddress: ["failover", 0, 0],
        allFailedNodes: [["failover", 0, 0]],
        tree: complexSmsAndEmailTree,
      })
    ).toBe(getRouteNode(["failover", 0, "failover"], complexSmsAndEmailTree));
  });

  it("should return sibling-routes-may-not-have-failed", () => {
    expect(
      getFailoverRouteNode({
        failedAddress: [0, "failover", "failover", 0],
        allFailedNodes: [[0, "failover", "failover", 0]],
        tree: complexSmsAndEmailTree,
      })
    ).toEqual("sibling-routes-may-not-have-failed");
  });

  it("should return failover-strategies-exhausted", () => {
    expect(
      getFailoverRouteNode({
        failedAddress: ["failover", 0, "failover"],
        allFailedNodes: [["failover", 0, "failover"]],
        tree: complexSmsAndEmailTree,
      })
    ).toEqual("failover-strategies-exhausted");
  });

  it("should handle situations like timeouts where a failover strategy may no longer be valid", () => {
    // In this test SMS channel has timed out. So we should fail over to email channel
    expect(
      getFailoverRouteNode({
        failedAddress: [0, 0],
        allFailedNodes: [
          [0, 0],
          [0, "failover", 0],
          [0, "failover", "failover", 0],
          [0, "failover", "failover", 1, 0],
          [0, "failover", "failover", 1, "failover", 0],
        ],
        tree: complexSmsAndEmailTree,
      })
    ).toEqual(getRouteNode(["failover"], complexSmsAndEmailTree));
  });
});
