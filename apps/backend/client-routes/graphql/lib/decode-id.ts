import base64 from "base64url";

const decodeId = <T = { id: string; objtype: string }>(id: string): T => {
  if (!id) {
    return;
  }

  const decoded = base64.decode(id);
  return JSON.parse(decoded) as T;
};

export default decodeId;
