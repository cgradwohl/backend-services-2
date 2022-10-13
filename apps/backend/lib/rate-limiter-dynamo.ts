import { RateLimiterRes } from "rate-limiter-flexible";
// Used CJS import because it's only accessible here:
// https://github.com/animir/node-rate-limiter-flexible/blob/master/lib/RateLimiterStoreAbstract.js
// tslint:disable-next-line: no-var-requires
const RateLimiterStoreAbstract = require("rate-limiter-flexible/lib/RateLimiterStoreAbstract");
import { IRateLimit, IRateLimitsService } from "./rate-limits-service/types";

// Creates a Dynamo based store to keep track of rate limits.
// Suggested practice by author: https://github.com/animir/node-rate-limiter-flexible#contribution
class RateLimiterDynamo extends RateLimiterStoreAbstract {
  private client: IRateLimitsService;
  private tenantId: string;
  private userId: string;

  constructor(opts) {
    super(opts);

    this.client = opts.storeClient;
    this.tenantId = opts.tenantId;
    this.userId = opts.userId;
  }

  /**
   * Get RateLimiterRes object filled depending on storeResult, which specific for exact store
   *
   * @param rlKey
   * @param changedPoints
   * @param storeResult
   * @private
   */
  protected _getRateLimiterRes(
    _: string,
    changedPoints: number,
    storeResult: IRateLimit
  ) {
    const isFirstInDuration = changedPoints === storeResult.points;
    const consumedPoints = isFirstInDuration
      ? changedPoints
      : storeResult.points;
    const remainingPoints = Math.max(this.points - consumedPoints, 0);
    const msBeforeNext = storeResult.expires
      ? Math.max(storeResult.expires - Date.now(), 0)
      : -1;

    const res = new RateLimiterRes(
      remainingPoints,
      msBeforeNext,
      consumedPoints,
      isFirstInDuration
    );

    return res;
  }

  /**
   * Have to be implemented in every limiter
   * Resolve with raw result from Store OR null if rlKey is not set
   * or Reject with error
   *
   * @param rlKey
   * @param {Object} options
   * @private
   *
   * @return Promise<any>
   */
  protected async _get(rlKey: string) {
    if (!this.client) {
      throw new Error("Dynamo store required.");
    }

    if (!this.tenantId) {
      throw new Error("Tenant ID required");
    }

    const { json } = await this.client.get({
      id: rlKey,
      tenantId: this.tenantId,
    });

    return json;
  }

  /**
   * Have to be implemented
   * Resolve with true OR false if rlKey doesn't exist
   * or Reject with error
   *
   * @param rlKey
   * @param {Object} options
   * @private
   *
   * @return Promise<any>
   */
  protected async _delete(rlKey: string, options: object = {}) {
    if (!this.client) {
      throw new Error("Dynamo store required.");
    }

    if (!this.tenantId) {
      throw new Error("Tenant ID required");
    }

    await this.client.remove({ id: rlKey, tenantId: this.tenantId });

    return true;
  }

  /**
   * Adds or updates the rate limit state for a given key.
   * Resolves with RateLimitService.ICourierObject.
   *
   * @param rlKey
   * @param points
   * @param msDuration
   * @param forceExpire
   */
  protected async _upsert(
    rlKey: string,
    points: number,
    msDuration: number,
    forceExpire = false
  ) {
    if (!this.client) {
      throw new Error("Dynamo store required.");
    }

    if (!this.tenantId) {
      throw new Error("Tenant ID required");
    }

    const newExpire = msDuration > 0 ? Date.now() + msDuration : null;

    return await this.client.upsert(
      { id: rlKey, tenantId: this.tenantId, userId: this.userId },
      { points, newExpire, forceExpire }
    );
  }
}

export default RateLimiterDynamo;
