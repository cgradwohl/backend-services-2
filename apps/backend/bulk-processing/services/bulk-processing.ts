import { AWSError } from "aws-sdk";
import { nanoid } from "nanoid";
import { getPrepareFilePath, getScopedBrand } from "~/api/send";
import { Message, RequestV2 } from "~/api/send/types";
import {
  getBulkJob,
  getBulkMessageUser,
  putBulkJob,
  putBulkMessageUser,
} from "~/bulk-processing/stores/s3/bulk-processing";
import assertStateIsValid from "~/lib/assertions/is-valid-scope-state";
import chunkArray from "~/lib/chunk-array";
import { getItem, put, query, update } from "~/lib/dynamo";
import { create as createLogEntry, EntryTypes } from "~/lib/dynamo/event-logs";
import { create as createMessageItem } from "~/lib/dynamo/messages";
import { enqueueByQueueUrl } from "~/lib/enqueue";
import jsonStore from "~/lib/s3";
import createTraceId from "~/lib/x-ray/create-trace-id";
import { actionService, requestService } from "~/send/service";
import { IAcceptAction, IRequestAction } from "~/send/types";
import { IBrand, IProfile } from "~/types.api";
import {
  S3PrepareMessage,
  SqsPrepareMessage,
  TenantScope,
} from "~/types.internal";
import { ApiSendRequest } from "~/types.public";
import { transformRequest, transformResponse } from "../lib/cursor";
import {
  BulkJobAlreadySubmittedError,
  BulkJobApiVersionMismatchError,
  BulkJobDuplicateInvocationError,
  BulkJobScopeMismatchError,
} from "../lib/errors";
import { createBulkJobPk, fromBulkJob } from "../lib/job";
import { createUserGsiPk, toDynamoUser } from "../lib/user";
import {
  BulkJobStatus,
  BulkMessageUserStatus,
  IBulkJob,
  IBulkMessageUser,
  IBulkMessageUserResponse,
  IBulkProcessingService,
  IDynamoBulkJob,
  IDynamoBulkMessageUser,
  IInboundBulkMessageUser,
  IIngestError,
  InboundBulkMessage,
  InboundBulkMessageUser,
  IRequestContext,
  ISqsBulkJob,
  ISqsBulkJobPage,
  LastProcessedRecordPtr,
} from "../types";

export const PARTITION_SHARD_RANGE = 10;

export default (workspaceId: string): IBulkProcessingService => {
  const PAGE_SIZE = 100;
  const FETCH_LIMIT = 100;

  const enqueueJob = enqueueByQueueUrl<ISqsBulkJob>(
    process.env.SQS_BULK_JOB_QUEUE_URL
  );

  const enqueueJobPage = enqueueByQueueUrl<ISqsBulkJobPage>(
    process.env.SQS_BULK_JOB_PAGE_QUEUE_URL
  );

  const { put: putMessageObject } = jsonStore<S3PrepareMessage>(
    process.env.S3_MESSAGES_BUCKET
  );

  const enqueuePrepare = enqueueByQueueUrl<SqsPrepareMessage>(
    process.env.SQS_PREPARE_QUEUE_URL
  );

  return {
    createJob: async (
      message: InboundBulkMessage,
      context: IRequestContext
    ) => {
      const now = new Date().toISOString();
      const jobId = createTraceId();
      const payloadPtr = await putBulkJob(message);
      const { apiVersion, dryRunKey, scope } = context;

      const job: IBulkJob = {
        apiVersion,
        created: now,
        enqueued: 0,
        failures: 0,
        jobId,
        payloadPtr,
        received: 0,
        scope,
        status: "CREATED",
        updated: now,
        workspaceId,
        ...(dryRunKey && { dryRunKey }),
      };

      const item: IDynamoBulkJob = fromBulkJob(job);

      await put({
        Item: item,
        TableName: process.env.BULK_JOBS_TABLE_NAME,
      });

      return jobId;
    },

    ingest: async (
      jobId: string,
      users: InboundBulkMessageUser[],
      context: IRequestContext
    ) => {
      const bulkJobPk = createBulkJobPk(workspaceId, jobId);
      const jobs = await getItem({
        Key: { pk: bulkJobPk },
        TableName: process.env.BULK_JOBS_TABLE_NAME,
      });

      if (!jobs.Item) {
        return null;
      }

      const { apiVersion, scope } = context;

      const {
        apiVersion: existingApiVersion,
        scope: existingScope,
        status: existingStatus,
        received: existingReceived,
      } = jobs.Item as IDynamoBulkJob;

      if (scope !== existingScope) {
        throw new BulkJobScopeMismatchError();
      }

      if (apiVersion !== existingApiVersion) {
        throw new BulkJobApiVersionMismatchError();
      }

      if (existingStatus !== "CREATED") {
        throw new BulkJobAlreadySubmittedError();
      }

      let newReceived = 0;
      const errors: IIngestError[] = [];
      const chunks = chunkArray(users, 25);
      for (const chunk of chunks) {
        const responses = await Promise.allSettled(
          chunk.map(async (inboundUser) => {
            try {
              const now = new Date().toISOString();

              // use recipient if available
              // this would be useful for customers used to the v1 nomenclature
              const userId = inboundUser.recipient ?? nanoid();

              inboundUser = {
                ...inboundUser,
                recipient: userId,
              };
              const payloadPtr = await putBulkMessageUser(inboundUser);

              const user: IBulkMessageUser = {
                created: now,
                payloadPtr,
                status: "PENDING",
                updated: now,
                userId,
              };

              const item: IDynamoBulkMessageUser = toDynamoUser(
                workspaceId,
                jobId,
                user
              );

              await put({
                ConditionExpression: "attribute_not_exists(pk)",
                Item: item,
                TableName: process.env.BULK_JOB_USERS_TABLE_NAME,
              });

              return Promise.resolve();
            } catch (err) {
              if (
                (err as AWSError).code === "ConditionalCheckFailedException"
              ) {
                return Promise.reject({
                  error: "Duplicate user",
                  user: inboundUser,
                });
              }
              return Promise.reject({
                error: "Error occurred during ingestion",
                user: inboundUser,
              });
            }
          })
        );

        responses.map((response) => {
          if (response.status === "rejected") {
            errors.push(response.reason);
          } else {
            newReceived += 1;
          }
        });
      }

      const updated = new Date().toISOString();
      await update({
        ExpressionAttributeNames: {
          "#received": "received",
          "#updated": "updated",
        },
        ExpressionAttributeValues: {
          ":received": newReceived,
          ":updated": updated,
        },
        Key: {
          pk: bulkJobPk,
        },
        TableName: process.env.BULK_JOBS_TABLE_NAME,
        UpdateExpression: "ADD #received :received SET #updated = :updated",
      });

      return {
        errors,
        total: existingReceived + newReceived,
      };
    },

    run: async (jobId: string, context: IRequestContext) => {
      const bulkJobPk = createBulkJobPk(workspaceId, jobId);
      const record = await getItem({
        Key: { pk: bulkJobPk },
        TableName: process.env.BULK_JOBS_TABLE_NAME,
      });

      if (!record.Item) {
        return false;
      }

      const { apiVersion, scope } = context;

      const {
        apiVersion: existingApiVersion,
        payloadPtr,
        status: existingStatus,
        scope: existingScope,
        dryRunKey,
      } = record.Item as IDynamoBulkJob;

      if (scope !== existingScope) {
        throw new BulkJobScopeMismatchError();
      }

      if (apiVersion !== existingApiVersion) {
        throw new BulkJobApiVersionMismatchError();
      }

      if (existingStatus !== "CREATED") {
        throw new BulkJobDuplicateInvocationError();
      }

      await enqueueJob({
        apiVersion,
        jobId,
        jobPayloadPtr: payloadPtr,
        pageSize: PAGE_SIZE,
        scope,
        workspaceId,
        ...(dryRunKey && { dryRunKey }),
      });

      const updated = new Date().toISOString();
      const status: BulkJobStatus = "PROCESSING";

      await update({
        ExpressionAttributeNames: {
          "#status": "status",
          "#updated": "updated",
        },
        ExpressionAttributeValues: {
          ":status": status,
          ":updated": updated,
        },
        Key: {
          pk: bulkJobPk,
        },
        TableName: process.env.BULK_JOBS_TABLE_NAME,
        UpdateExpression: "SET #status = :status, #updated = :updated",
      });

      return true;
    },

    processJob: async (
      jobId: string,
      jobPayloadPtr: string,
      pageSize: number,
      context: IRequestContext
    ) => {
      const { apiVersion, dryRunKey, scope } = context;
      // enqueue all shards
      const shards = [...Array(PARTITION_SHARD_RANGE)].map((_, i) => i + 1);

      const responses = await Promise.allSettled(
        shards.map(async (shard) => {
          try {
            const result = await enqueueJobPage({
              apiVersion,
              jobId,
              jobPayloadPtr,
              pageSize,
              scope,
              shard,
              workspaceId,
              ...(dryRunKey && { dryRunKey }),
            });
            return result;
          } catch (error) {
            // tslint:disable-next-line: no-console
            console.error(error);
            // TODO: reprocessing?
          }
        })
      );

      responses.map((response) => {
        if (response.status === "rejected") {
          // tslint:disable-next-line: no-console
          console.error(response.reason);
          // TODO: reprocessing?
        }
      });
    },

    processJobPage: async (
      jobId: string,
      jobPayloadPtr: string,
      pageSize: number,
      shard: number,
      context: IRequestContext,
      lastProcessedRecordPtr?: LastProcessedRecordPtr
    ) => {
      const { apiVersion, dryRunKey, scope } = context;
      // process the shard
      const bulkMessage = await getBulkJob(jobPayloadPtr);
      const gsi1pk = createUserGsiPk(workspaceId, jobId, shard);
      const { Items: users, LastEvaluatedKey } = await query({
        ...(lastProcessedRecordPtr && {
          ExclusiveStartKey: lastProcessedRecordPtr,
        }),
        ExpressionAttributeNames: {
          "#gsi1pk": "gsi1pk",
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":gsi1pk": gsi1pk,
          ":status": "PENDING",
        },
        FilterExpression: "#status = :status",
        IndexName: "gsi1",
        KeyConditionExpression: "#gsi1pk = :gsi1pk",
        Limit: pageSize,
        ProjectionExpression: "pk, payloadPtr",
        TableName: process.env.BULK_JOB_USERS_TABLE_NAME,
      });

      let enqueued = 0;
      for (const user of users as Array<{ payloadPtr: string; pk: string }>) {
        const { pk, payloadPtr } = user;
        // TODO: extract into services
        try {
          const userObject: IInboundBulkMessageUser = await getBulkMessageUser(
            payloadPtr
          );

          const messageId = createTraceId();

          const translateMessage = (request: any) => {
            if (request.message) {
              return request;
            }

            return translate(request);
          };

          const message = translateMessage(bulkMessage);

          const { message: v2Message } = bulkMessage;
          const { to: v2Recipient } = userObject;

          // build a merged request
          const request: RequestV2 = {
            message: {
              ...v2Message,
              to: {
                ...v2Recipient,
                data: {
                  ...v2Message.data,
                  ...v2Recipient.data,
                },
              },
            } as Message,
          };

          // land onto newer send pipeline infra
          const { filePath } = await requestService(workspaceId).create({
            apiVersion: "2021-11-01",
            ...(dryRunKey && { dryRunKey }),
            idempotencyKey: undefined,
            jobId,
            request,
            requestId: messageId,
            scope,
            source: undefined,
          });

          // TODO: test BULK PROCESSING
          await actionService(workspaceId).emit<IRequestAction>({
            command: "request",
            apiVersion: "2021-11-01",
            dryRunKey,
            requestFilePath: filePath,
            requestId: messageId,
            scope,
            source: undefined,
            tenantId: workspaceId,
          });

          // logic borrowed from api/send/index
          // if (bulkMessage.message) {

          // } else {
          //   const {
          //     event,
          //     brand,
          //     data: messageData,
          //     locale: messageLocale,
          //     override,
          //     routing,
          //   } = bulkMessage;

          //   const {
          //     data: userData,
          //     profile: userProfile,
          //     preferences,
          //     recipient,
          //   } = userObject;

          //   const {
          //     locale: profileLocale,
          //     email,
          //     phone_number,
          //     ...rest
          //   } = userProfile ?? {};
          //   const locale = profileLocale ?? messageLocale;

          //   const profile: IProfile = {
          //     ...(locale && { locale }),
          //     ...(email && { email }),
          //     ...(phone_number && {
          //       phone_number,
          //     }),
          //     ...rest,
          //   };

          //   // build a merged request
          //   const request: ApiSendRequest = {
          //     ...(brand && { brand }),
          //     ...(routing && { routing }),
          //     ...((messageData || userData) && {
          //       data: { ...messageData, ...userData },
          //     }),
          //     event,
          //     ...(locale && { locale }),
          //     ...(override && { override }),
          //     ...(preferences && { preferences }),
          //     recipient,
          //     ...(Object.keys(profile).length !== 0 && { profile }),
          //   };

          //   const [state] = scope.split("/");
          //   assertStateIsValid(state);

          //   let brandObject: IBrand;
          //   if (brand) {
          //     brandObject = await getScopedBrand(
          //       workspaceId,
          //       brand,
          //       state,
          //       true
          //     );
          //   }

          //   // land onto older send pipeline infra
          //   const messageObject: S3PrepareMessage = {
          //     ...(brand && { brand: brandObject }),
          //     // Accept the input, in the form of declarative routing tree from the api user
          //     ...(routing && { routing }),
          //     dryRunKey,
          //     ...((messageData || userData) && {
          //       eventData: { ...messageData, ...userData },
          //     }),
          //     eventId: event,
          //     ...(preferences && { eventPreferences: preferences }),
          //     ...(Object.keys(profile).length !== 0 && {
          //       eventProfile: profile,
          //     }),
          //     ...(override && { override }),
          //     recipientId: recipient,
          //     scope,
          //   };

          //   await createMessageItem(
          //     workspaceId,
          //     messageObject.eventId,
          //     messageObject.recipientId,
          //     messageId,
          //     undefined, // pattern
          //     undefined, // listId
          //     undefined, // listMessageId
          //     {
          //       jobId,
          //     }
          //   );

          //   await putMessageObject(
          //     getPrepareFilePath(workspaceId, messageId),
          //     messageObject
          //   );

          //   await createLogEntry(
          //     workspaceId,
          //     messageId,
          //     EntryTypes.eventReceived,
          //     {
          //       body: request,
          //     }
          //   );

          //   await enqueuePrepare({
          //     messageId,
          //     messageLocation: {
          //       path: getPrepareFilePath(workspaceId, messageId),
          //       type: "S3",
          //     },
          //     tenantId: workspaceId,
          //     type: "prepare",
          //   });
          // }

          // mark as enqueued with messageId
          const status: BulkMessageUserStatus = "ENQUEUED";
          const updated = new Date().toISOString();
          await update({
            ExpressionAttributeNames: {
              "#messageId": "messageId",
              "#status": "status",
              "#updated": "updated",
            },
            ExpressionAttributeValues: {
              ":messageId": messageId,
              ":status": status,
              ":updated": updated,
            },
            Key: {
              pk,
            },
            TableName: process.env.BULK_JOB_USERS_TABLE_NAME,
            UpdateExpression:
              "SET #messageId = :messageId, #status = :status, #updated = :updated",
          });

          enqueued += 1;
        } catch (err) {
          // tslint:disable-next-line: no-console
          console.error(err);

          // mark as errored
          const status: BulkMessageUserStatus = "ERROR";
          const updated = new Date().toISOString();
          await update({
            ExpressionAttributeNames: {
              "#status": status,
              "#updated": "updated",
            },
            ExpressionAttributeValues: {
              ":status": "ERROR",
              ":updated": updated,
            },
            Key: {
              pk,
            },
            TableName: process.env.BULK_JOB_USERS_TABLE_NAME,
            UpdateExpression: "SET #status = :status, #updated = :updated",
          });
        }
      }

      const bulkJobPk = createBulkJobPk(workspaceId, jobId);
      // increment enqueued counter
      try {
        await update({
          ExpressionAttributeNames: {
            "#enqueued": "enqueued",
          },
          ExpressionAttributeValues: {
            ":incrementEnqueued": enqueued,
          },
          Key: {
            pk: bulkJobPk,
          },
          TableName: process.env.BULK_JOBS_TABLE_NAME,
          UpdateExpression: "ADD #enqueued :incrementEnqueued",
        });
      } catch (err) {
        // tslint:disable-next-line: no-console
        console.error(err);
      }

      // enqueue next page for the shard
      if (LastEvaluatedKey) {
        await enqueueJobPage({
          apiVersion,
          jobId,
          jobPayloadPtr,
          pageSize,
          scope,
          shard,
          workspaceId,
          ...(dryRunKey && { dryRunKey }),
          lastProcessedRecordPtr: LastEvaluatedKey,
        });
      } else {
        // all pages in the shard are enqueued
        const pk = createBulkJobPk(workspaceId, jobId);
        try {
          // bump enqueued shards by 1
          await update({
            ExpressionAttributeNames: {
              "#enqueuedShards": "enqueuedShards",
              "#updated": "updated",
            },
            ExpressionAttributeValues: {
              ":increment": 1,
              ":updated": new Date().toISOString(),
            },
            Key: {
              pk,
            },
            TableName: process.env.BULK_JOBS_TABLE_NAME,
            UpdateExpression:
              "SET #updated = :updated ADD #enqueuedShards :increment",
          });

          // attempt to mark as enqueued if all shards are done
          const status: BulkJobStatus = "COMPLETED";
          try {
            await update({
              ConditionExpression: "enqueuedShards = :maxShards",
              ExpressionAttributeNames: {
                "#status": "status",
                "#updated": "updated",
              },
              ExpressionAttributeValues: {
                ":maxShards": PARTITION_SHARD_RANGE,
                ":status": status,
                ":updated": new Date().toISOString(),
              },
              Key: {
                pk,
              },
              TableName: process.env.BULK_JOBS_TABLE_NAME,
              UpdateExpression: "SET #status = :status, #updated = :updated",
            });
          } catch (err) {
            if (err && err.code === "ConditionalCheckFailedException") {
              return;
            }
            // tslint:disable-next-line: no-console
            console.error(err);
          }
        } catch (err) {
          // tslint:disable-next-line: no-console
          console.error(err);
        }
      }
    },

    getJob: async (jobId: string, scope: TenantScope) => {
      const pk = createBulkJobPk(workspaceId, jobId);
      const record = await getItem({
        Key: { pk },
        TableName: process.env.BULK_JOBS_TABLE_NAME,
      });

      if (!record.Item) {
        return null;
      }

      const {
        payloadPtr,
        scope: existingScope,
        enqueued,
        failures,
        received,
        status,
      } = record.Item as IDynamoBulkJob;

      if (scope !== existingScope) {
        return null;
      }

      const definition = await getBulkJob(payloadPtr);

      return {
        job: {
          definition,
          enqueued,
          failures,
          received,
          status,
        },
      };
    },

    getJobUsers: async (jobId: string, scope: TenantScope, cursor?: string) => {
      const pk = createBulkJobPk(workspaceId, jobId);
      const record = await getItem({
        Key: { pk },
        TableName: process.env.BULK_JOBS_TABLE_NAME,
      });

      if (!record.Item) {
        return null;
      }

      const { scope: existingScope } = record.Item as IDynamoBulkJob;

      if (scope !== existingScope) {
        return null;
      }

      const searchKey = transformRequest(cursor);

      const users: IBulkMessageUserResponse[] = [];
      let limit = FETCH_LIMIT;
      let currentShard = searchKey?.shard ?? 1;
      let currentLastEvaluatedKey = searchKey?.lastEvaluatedKey;

      // run until we get desired number of records for the page
      // or until we have exhausted all the shards
      while (limit > 0) {
        const { Count, Items } = await query({
          ...(currentLastEvaluatedKey && {
            ExclusiveStartKey: currentLastEvaluatedKey,
          }),
          ExpressionAttributeNames: {
            "#gsi1pk": "gsi1pk",
          },
          ExpressionAttributeValues: {
            ":gsi1pk": createUserGsiPk(workspaceId, jobId, currentShard),
          },
          IndexName: "gsi1",
          KeyConditionExpression: "#gsi1pk = :gsi1pk",
          // ask for an additional item in order to check for a next page
          Limit: limit + 1,
          TableName: process.env.BULK_JOB_USERS_TABLE_NAME,
        });

        if (Count <= limit) {
          // current shard exhausted
          currentLastEvaluatedKey = undefined;
          // if all shards exhausted, set limit to 0
          if (currentShard === PARTITION_SHARD_RANGE) {
            limit = 0;
          } else {
            // go to next shard with updated limit
            currentShard += 1;
            limit = limit - Count;
          }
        } else {
          // got all + 1 records for the page
          limit = 0;
          // remove the extra item
          Items.pop();
          // update currentLastEvaluatedKey
          const last = Items[Items.length - 1];
          currentLastEvaluatedKey = {
            gsi1pk: last.gsi1pk,
            pk: last.pk,
          };
        }

        // parallelize calls to s3
        // chunkify if Limit is bumped
        await Promise.all(
          Items.map(async (item: IDynamoBulkMessageUser) => {
            const payload = await getBulkMessageUser(item.payloadPtr);

            const user: IBulkMessageUserResponse = {
              ...payload,
              messageId: item.messageId,
              status: item.status,
            };

            users.push({ ...user });
          })
        );
      }

      // paging data response
      let nextCursor = null;
      let more: boolean = true;

      if (
        currentShard === PARTITION_SHARD_RANGE &&
        currentLastEvaluatedKey === undefined
      ) {
        more = false;
      } else {
        nextCursor = transformResponse({
          lastEvaluatedKey: currentLastEvaluatedKey,
          shard: currentShard,
        });
      }

      return {
        items: users,
        paging: {
          cursor: nextCursor,
          more,
        },
      };
    },
  };
};
