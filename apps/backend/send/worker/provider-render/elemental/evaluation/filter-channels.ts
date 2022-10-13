import { ElementalIR, ElementalChannelNodeIR } from "~/api/send/types";
import { ElementalError } from "../errors";

/**
 * Evaluates channel requirements of an element and filters the ir based on the results.
 * Must be done before other evaluation. Does not update visibility of refs.
 */
export function filterChannels({
  ir,
  channel,
}: {
  ir: ElementalIR;
  channel?: string;
}): ElementalIR {
  // Handle top level channel elements
  if (ir.some((element) => element.type === "channel")) {
    return filterTopLevelChannelElements({ ir, channel });
  }

  return filterChannelSpecificElements({ ir, channel });
}

export function filterChannelSpecificElements({
  ir,
  channel,
}: {
  ir: ElementalIR;
  channel?: string;
}): ElementalIR {
  return ir
    .filter((element) => {
      if ("channels" in element) {
        return element.channels.includes(channel);
      }

      return true;
    })
    .map((element) => {
      if ("elements" in element) {
        element.elements = filterChannelSpecificElements({
          ir: element.elements,
          channel,
        });
      }

      return element;
    });
}

export function filterTopLevelChannelElements({
  ir,
  channel = "default",
}: {
  ir: ElementalIR;
  channel?: string;
}): ElementalIR {
  if (!ir.every((element) => element.type === "channel")) {
    throw new ElementalError(
      "All top level elements must be channels unless no channel element is present."
    );
  }

  const exactChannelMatch = ir.find(
    (element: ElementalChannelNodeIR) => element.channel === channel
  ) as ElementalChannelNodeIR;

  if (exactChannelMatch) {
    return [exactChannelMatch];
  }

  const defaultChannelMatch = ir.find(
    (element: ElementalChannelNodeIR) => element.channel === "default"
  ) as ElementalChannelNodeIR;

  if (defaultChannelMatch) {
    return [defaultChannelMatch];
  }

  throw new ElementalError(
    `No channel element found for taxonomy: ${channel}. Consider specifying a default.`
  );
}
