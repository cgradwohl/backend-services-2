interface ITimedoutRecord {
  tenantId: string;
  messageId: string;
}

export function logBeforeTimeout(
  functionName: string,
  remainingTimeInMillis: number
) {
  const _context: ITimedoutRecord[] = [];

  const logContext = {
    updateContext: (tenantId: string, messageId: string) => {
      _context.push({ tenantId, messageId });
    },
    flushContext: () => {
      // remove all the entries in the context
      _context.splice(0, _context.length);
    },
  };

  const timeoutLogHandler = async () => {
    const timeoutDetails: string = _context
      .map(
        ({ messageId, tenantId }) =>
          `tenantId#messageId:- ${tenantId}/${messageId}`
      )
      .join("\n");
    console.warn(`${functionName} is timing out:- ${timeoutDetails}`);
  };

  const timeoutId = setTimeout(timeoutLogHandler, remainingTimeInMillis - 2000);

  return { logContext, timeoutId };
}
