// pattern used to find variables in a string
const variablePattern = /(?<=(?<!{)){([^{}]*)}(?!})/;

export const oldPattern = /\{([^\}]*)\}/;

export default variablePattern;
