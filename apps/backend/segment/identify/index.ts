// tslint:disable-next-line: no-var-requires
import { handlePost } from "~/api/profiles/post";
import { assertBody } from "~/lib/lambda-response";
import { IInboundSegmentIdentifyRequest } from "../types";

export const identifyInbound = async (context) => {
  const body = assertBody<IInboundSegmentIdentifyRequest>(context);

  context.event.body = { profile: body.traits };
  const profileId = body.userId || body.anonymousId;
  await handlePost({ context, profileId });
};
