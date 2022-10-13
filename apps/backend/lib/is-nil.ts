type IsNilFn = <T>(input: T) => boolean;
const isNil: IsNilFn = (input) => input === undefined || input === null;

export default isNil;
