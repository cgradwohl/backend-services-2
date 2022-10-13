import base64 from "base64url";

const createEncodedId = (id: string, objtype: string) =>
  base64.encode(JSON.stringify({ id, objtype }));

export default createEncodedId;
