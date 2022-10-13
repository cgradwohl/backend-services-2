import { ListObjectsV2Request } from "aws-sdk/clients/s3";
import { promisify } from "util";

import { NotFound } from "~/lib/http-errors";
import AWS from "./aws-sdk";

const s3 = new AWS.S3();
const createPresignedPost = promisify(s3.createPresignedPost);

export default function <T>(bucket: string) {
  return {
    delete: async (key: string): Promise<void> => {
      await s3
        .deleteObject({
          Bucket: bucket,
          Key: key,
        })
        .promise()
        .catch((err) => {
          if (err.code === "NoSuchKey") {
            throw new NotFound("Object not found");
          }
          throw err;
        });
    },

    deleteObjects: async (keys: string[]): Promise<void> => {
      await s3
        .deleteObjects({
          Bucket: bucket,
          Delete: {
            Objects: keys.map((key) => ({
              Key: key,
            })),
          },
        })
        .promise();
    },

    get: async (key: string): Promise<T | null> => {
      const res = await s3
        .getObject({
          Bucket: bucket,
          Key: key,
        })
        .promise()
        .catch((err) => {
          if (err.code === "NoSuchKey") {
            throw new NotFound("Object not found");
          }
          if (err.code === "SlowDown") {
            // tslint:disable-next-line: no-console
            console.error("s3 read throttling", bucket, key);
          }
          throw err;
        });
      if (res && res.Body) {
        return JSON.parse(res.Body.toString());
      } else {
        return null;
      }
    },

    getByVersionId: async (
      key: string,
      versionId: string
    ): Promise<T | null> => {
      const res = await s3
        .getObject({
          Bucket: bucket,
          Key: key,
          VersionId: versionId,
        })
        .promise()
        .catch((err) => {
          if (err.code === "NoSuchKey") {
            throw new NotFound("Object not found");
          }
          throw err;
        });
      if (res && res.Body) {
        return JSON.parse(res.Body.toString());
      } else {
        return null;
      }
    },

    getWithVersionId: async (
      key: string
    ): Promise<{ versionId: string; response: T } | null> => {
      const res = await s3
        .getObject({
          Bucket: bucket,
          Key: key,
        })
        .promise()
        .catch((err) => {
          if (err.code === "NoSuchKey") {
            throw new NotFound("Object not found");
          }
          throw err;
        });
      if (res && res.Body) {
        return {
          versionId: res.VersionId,
          response: JSON.parse(res.Body.toString()),
        };
      } else {
        return null;
      }
    },

    list: async (options: {
      after?: string;
      limit?: number;
      next?: string;
      prefix?: string;
    }): Promise<{
      after: string;
      next: string;
      items: Array<{
        key?: string;
        lastModified?: Date;
        owner?: string;
        ownerId?: string;
        size?: number;
      }>;
    }> => {
      const params: ListObjectsV2Request = {
        Bucket: bucket,
        MaxKeys: options.limit ?? 25,
      };

      if (options.prefix) {
        params.Prefix = options.prefix;
      }

      if (options.after) {
        params.StartAfter = options.after;
      }

      if (options.next) {
        params.ContinuationToken = options.next;
      }

      const res = await s3
        .listObjectsV2(params)
        .promise()
        .catch((err) => {
          if (err.code === "NoSuchKey") {
            throw new NotFound("Object not found");
          }
          throw err;
        });

      return {
        after: res.StartAfter,
        items: res.Contents.map((item) => ({
          key: item.Key,
          lastModified: item.LastModified,
          owner: item.Owner?.DisplayName,
          ownerId: item.Owner?.ID,
          size: item.Size,
        })),
        next: res.NextContinuationToken,
      };
    },

    put: async (key: string, json: T) => {
      return s3
        .putObject({
          Body: JSON.stringify(json),
          Bucket: bucket,
          ContentType: "application/json",
          Key: key,
        })
        .promise()
        .catch((err) => {
          if (err.code === "SlowDown") {
            // tslint:disable-next-line: no-console
            console.error("s3 write throttling", bucket, key);
          }
          throw err;
        });
    },

    putImage: async (file: { buffer: Buffer; type: string; name: string }) => {
      return s3
        .putObject({
          ACL: "public-read",
          Body: file.buffer,
          Bucket: bucket,
          ContentEncoding: "base64",
          ContentType: file.type,
          Key: file.name,
        })
        .promise();
    },

    createPresignedPost: async ({ key, contentType }) => {
      const params = {
        Bucket: bucket,
        Conditions: [
          { bucket },
          ["eq", "$key", key],
          ["content-length-range", 100, 10000000], // 100Byte - 10MB
        ],
        Expires: 60,
        Fields: {
          "Content-Type": contentType,
          key,
        },
      };

      return createPresignedPost.apply(s3, [params]);
    },

    copy: async (originalKey: string, newKey: string) => {
      const params = {
        Bucket: bucket,
        Key: newKey,
        CopySource: `${bucket}/${originalKey}`,
      };

      const res = await s3
        .copyObject(params)
        .promise()
        .catch((err) => {
          if (err.code === "NoSuchKey") {
            throw new NotFound("Object not found");
          }
          throw err;
        });

      if (res && res.CopyObjectResult) {
        return res.CopyObjectResult;
      } else {
        return null;
      }
    },
  };
}
