import { StrategyJson } from "../../types.api";
import dynamoObjectService from "./object-service";

const objtype = "strategy";

const strategy = dynamoObjectService<StrategyJson>(objtype);

export const get = strategy.get;
