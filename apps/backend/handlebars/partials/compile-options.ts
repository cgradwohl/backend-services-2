// was not exported from handlebars
interface IHandlebarsCompileOptions {
  data?: boolean;
  compat?: boolean;
  knownHelpers?: { [helper: string]: boolean };
  knownHelpersOnly?: boolean;
  noEscape?: boolean;
  strict?: boolean;
  assumeObjects?: boolean;
  preventIndent?: boolean;
  ignoreStandalone?: boolean;
  explicitPartialContext?: boolean;
}

export default IHandlebarsCompileOptions;
