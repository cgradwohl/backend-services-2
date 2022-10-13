const resolveOverrides = (
  bcc,
  cc,
  fromName,
  replyTo,
  subject,
  text,
  overrides
) => {
  return {
    bcc: overrides?.bcc ?? bcc,
    cc: overrides?.cc ?? cc,
    fromName: overrides?.fromName ?? fromName,
    replyTo: overrides?.replyTo ?? replyTo,
    subject: overrides?.subject ?? subject,
    text: overrides?.text ?? text,
  };
};

export default resolveOverrides;
