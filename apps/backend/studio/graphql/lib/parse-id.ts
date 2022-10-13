const parseId = (input: string) => {
  const match = input.match(/^(tenant|user)\/(.*)$/);
  return match ? [match[1], match[2]] : [undefined, undefined];
};

export default parseId;

export const extractId = (input: string) => parseId(input)[1];
export const extractType = (input: string) => parseId(input)[0];
