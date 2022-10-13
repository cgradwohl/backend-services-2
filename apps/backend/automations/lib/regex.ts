// match any digit "(\d+)"
// followed by a space(s) "\s+"
// followed by interval with optional "s" characters
export const humanReadableDelay = new RegExp(
  /(\d*\.?\d+)\s+(days?|hours?|minutes?|months?|weeks?|years?)/
);

// /refs - captures ref literal
// (?!\.) - negative lookahead to capture the following token before the next .
export const validRefNames = new RegExp(/refs\.((?:(?!\.).)*)/gm);
