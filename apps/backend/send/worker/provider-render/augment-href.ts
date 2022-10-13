import { ElementalNodeIR, UTMMap, UTM } from "~/api/send/types";
import { CourierLogger } from "~/lib/logger";
import { Block } from "~/types.api";

type AugmentHref = {
  ir: Block[];
  utm: UTM;
};

type BuildUtmParams = {
  blockObj: Array<Record<any, any>>;
  utm: UTM;
  key?: "href" | "imageHref";
};

export function augmentBlockHref({
  ir,
  utm = {},
}: AugmentHref): (ElementalNodeIR | Block)[] {
  if (Object.keys(utm).length === 0) {
    return ir;
  }
  return ir.map((element) => addUtmToBlockHref(element, utm));
}

export const addUtmToElementalHref = (
  element: ElementalNodeIR,
  utm?: UTM
): ElementalNodeIR => {
  if ("href" in element && utm) {
    const copy = { ...element };
    buildUtmParams({ blockObj: copy as any, utm });
    return copy;
  }

  return element;
};

const addUtmToBlockHref = (block: Block, utm: UTM): Block => {
  const copy = { ...block };

  let key: BuildUtmParams["key"] = "href";
  if (copy.type === "image") {
    key = "imageHref";
  }

  if (copy.config[key]) {
    buildUtmParams({ blockObj: copy.config as any, utm, key });
  }

  return copy;
};

function buildUtmParams({
  utm,
  blockObj,
  key: hrefKey = "href",
}: BuildUtmParams) {
  try {
    const url = new URL(blockObj[hrefKey]);
    Object.entries(utm).forEach(([key, value]) =>
      url.searchParams.set(`utm_${key}`, value)
    );
    blockObj[hrefKey] = url.href;
  } catch (e) {
    const { logger } = new CourierLogger("augmentHref");
    logger.warn(e);
    // Do nothing for invalid urls as modifications may cause issues
  }
}

export function buildUtmMap({ message }): UTMMap {
  return {
    message: {
      ...message?.metadata?.utm,
    },
    ...getUtmFromProps(message?.channels, "channels"),
    ...getUtmFromProps(message?.providers, "providers"),
  };
}

function getUtmFromProps(obj = {}, prop: string): UTM | {} {
  let utm = {
    [prop]: {},
  };

  const keys = Object.keys(obj);

  if (keys.length) {
    keys.forEach((key) => {
      Object.assign(utm[prop], {
        [key]: obj[key]?.metadata?.utm,
      });
    });
  }

  return utm;
}

export function composeUtm({
  utmMap,
  channel = "",
  provider = "",
}: {
  utmMap: UTMMap;
  channel: string;
  provider: string;
}) {
  return {
    ...utmMap?.message,
    ...utmMap?.channels[channel],
    ...utmMap?.providers[provider],
  };
}
