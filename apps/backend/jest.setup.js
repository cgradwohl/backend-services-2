const { TextDecoder, TextEncoder } = require("util");
const uuid = require("uuid/v4");

process.env.COURIER_AUTH_TOKEN = "MOCK_TOKEN";
process.env.AWS_LAMBDA_FUNCTION_NAME = "backend-dev-SOME_LAMBDA_FUNCTION_TEST";
process.env._X_AMZN_TRACE_ID = `Root=${uuid()};Parent=1f2d5dc20314a848;Sampled=0`;

// Fixes dependency conflict with JEST and DOMPurify https://github.com/kkomelin/isomorphic-dompurify/issues/91
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
