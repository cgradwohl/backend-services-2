import { HandlesFn } from "../types";

export interface CourierProfile {
  courier?:
    | string
    | {
        channel?: string;
      };
}

const handles: HandlesFn = ({ profile }: any) => {
  const courierProfile = profile as CourierProfile;
  if (typeof courierProfile?.courier === "string") {
    return true;
  }

  return Boolean(courierProfile?.courier?.channel);
};

export default handles;
