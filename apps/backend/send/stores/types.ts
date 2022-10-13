export type FilePathGenerator = ({
  requestId,
  messageId,
}: {
  requestId?: string;
  messageId?: string;
}) => string;

export type S3Get<T> = (payload: { filePath: string }) => Promise<T>;
export type S3Put<T> = (payload: {
  requestId?: string;
  messageId?: string;
  json: T;
}) => Promise<{ filePath: string }>;
