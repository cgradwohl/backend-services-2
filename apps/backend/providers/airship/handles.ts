import { ProviderResponseError } from "../errors";
import { HandlesFn } from "../types";

const handles: HandlesFn = ({ profile }) => {
  try {
    if (!profile.airship) {
      return false;
    }

    if (typeof profile.airship !== "object") {
      throw new Error("profile.airship must be an object");
    }

    const { airship } = profile as any;
    return airship.audience !== "";
  } catch (err) {
    throw new ProviderResponseError(err);
  }
};

export default handles;
