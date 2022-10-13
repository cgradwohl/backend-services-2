import { assertEmailIsValid } from "~/lib/email-parser";
import { HandlesFn } from "../../types";

const handles: HandlesFn = ({ profile }) => {
  try {
    assertEmailIsValid((profile as any)?.email);
    return true;
  } catch (err) {
    return false;
  }
};

export default handles;
