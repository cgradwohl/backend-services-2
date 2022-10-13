"use strict";
import makeError from "make-error";
import * as libjsonnet from "./libjsonnet";

export const JsonnetEvalError = makeError("JsonnetEvalError");

const Jsonnet = function () {
  const jsonnetMake = libjsonnet.cwrap("jsonnet_make", "number", []);
  this.vm = jsonnetMake();
  this.jsonnet_evaluate_snippet = libjsonnet.cwrap(
    "jsonnet_evaluate_snippet",
    "number",
    ["number", "string", "string", "number"]
  );
  this.jsonnet_destroy = libjsonnet.cwrap("jsonnet_destroy", "number", [
    "number",
  ]);
};

Jsonnet.prototype.eval = function (code) {
  try {
    const errorPtr = libjsonnet._malloc(4);
    const outputPtr = this.jsonnet_evaluate_snippet(
      this.vm,
      "snippet",
      code,
      errorPtr
    );
    const error = libjsonnet.getValue(errorPtr, "i32*");
    libjsonnet._free(errorPtr);
    const result = libjsonnet.UTF8ToString(outputPtr);
    if (error) {
      throw new JsonnetEvalError(result);
    }
    return JSON.parse(result);
  } catch (err) {
    if (err instanceof JsonnetEvalError) {
      throw err;
    }

    console.log(err);
    throw new JsonnetEvalError("Invalid jsonnet template");
  }
};

Jsonnet.prototype.evalFile = function (filepath) {
  const code = libjsonnet.read(filepath);
  return this.eval(code);
};

Jsonnet.prototype.destroy = function () {
  this.jsonnet_destroy(this.vm);
};

export default Jsonnet;
