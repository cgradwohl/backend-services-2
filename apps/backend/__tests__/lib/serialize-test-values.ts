import { Value } from "slate";

interface ITestValues {
  [test: string]: Value;
}

const SlateValue = (strings): Value => {
  return Value.fromJSON(JSON.parse(strings[0]));
};

const serializeTestValues: ITestValues = {
  bold: SlateValue`{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"This is a ","marks":[]},{"object":"text","text":"bold","marks":[{"object":"mark","type":"bold","data":{}}]},{"object":"text","text":" value.","marks":[]}]}]}}`,
  italic: SlateValue`{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"This is an ","marks":[]},{"object":"text","text":"italic","marks":[{"object":"mark","type":"italic","data":{}}]},{"object":"text","text":" value.","marks":[]}]}]}}`,
  link: SlateValue`{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"This is a ","marks":[]},{"object":"inline","type":"link","data":{"href":"https://example.com"},"nodes":[{"object":"text","text":"link","marks":[]}]},{"object":"text","text":" value.","marks":[]}]}]}}`,
  multiline: SlateValue`{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"First line.\\nSecond line.","marks":[]}]}]}}`,
  text: SlateValue`{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"plain text","marks":[]}]}]}}`,
  underline: SlateValue`{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"This is an ","marks":[]},{"object":"text","text":"underlined","marks":[{"object":"mark","type":"underlined","data":{}}]},{"object":"text","text":" value.","marks":[]}]}]}}`,
};

export default serializeTestValues;
