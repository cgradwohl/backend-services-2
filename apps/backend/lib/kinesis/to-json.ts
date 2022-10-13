export default function kinesisToJson<T>(buffer: string): T {
  return JSON.parse(Buffer.from(buffer, "base64").toString()) as T;
}
