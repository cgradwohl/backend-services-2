import { generate as generateName } from "project-name-generator";
import { getUser } from "../lib/cognito";

const blockList = ["minor"];

const intersects = (arr1: string[], arr2: string[]): boolean => {
  return arr1.filter((value) => arr2.includes(value)).length > 0;
};

export default async (userId: string): Promise<string> => {
  while (true) {
    const name = generateName({ alliterative: true, number: true });
    const user = await getUser(userId);
    if (user && user.email) {
      return user.email;
    } else if (!intersects(name.raw, blockList)) {
      return name.dashed;
    }
  }
};
