export const oldJsonnetDefaultTemplate = `{
  "event": request("event"),
  "recipient": request("recipient"),
  "data": request("data"),
  "profile": request("profile"),
}`;

export default `{
  "brand": request("brand"),
  "message": request("message"),
  "event": request("event"),
  "recipient": request("recipient"),
  "data": request("data"),
  "profile": request("profile"),
}`;
