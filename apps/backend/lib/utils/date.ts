// Authors Note. At the time of writing there is an issue in our version of jest that
// prevents use of jest.useFakeTimers(). Attempting to use that function throws an
// error due to a conflict with another package. This module helps makes it easier to
// get around this by replicating some of the date primitives in a more mockable way.

/** Returns current time as unix epoch ms */
export const currentTimeMs = () => Date.now();

export const currentTimeIso = () => new Date().toISOString();
