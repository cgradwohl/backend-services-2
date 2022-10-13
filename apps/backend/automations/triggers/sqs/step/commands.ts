import { Commands } from "~/automations/types";
import cancel from "./cancel-automation";
import delay from "./delay";
import fetchData from "./fetch-data";
import invoke from "./invoke";
import send from "./send";
import sendList from "./send-list";
import subscribe from "./subscribe";
import updateProfile from "./update-profile";

const commands: Commands = {
  cancel,
  delay,
  "fetch-data": fetchData,
  invoke,
  send,
  "send-list": sendList,
  subscribe: subscribe,
  "update-profile": updateProfile,
};

export default commands;
