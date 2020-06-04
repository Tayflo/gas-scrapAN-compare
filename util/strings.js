// ESLint global variables
/* global */

/**
 * Normalize string.
 * * Normalize hyphen
 * * Normalize apostrophe and quotation marks
 * * Normalize unicode chars encoding
 * * Trim
 * @param {string} string
 * @returns {string}
 */
function normalizeString(string) {
  if (string.constructor !== String) return string;

  // Normalize - hypen chars.
  string = string.replace(/[\u00AD\u002D\u2010\u2011\u2212]/g, '\u002D');

  // Normalize ' apostrophe and single quotation mark chars.
  // Single pointing angle quotation mark, left: \u2039 \u276E
  // Single pointing angle quotation mark, right: \u203A \u276F
  // For each OR subgroup in thereafter regex: central, left, right
  string = string.replace(/([\u0027\uFF07]|[\u07F5\u275B\u2018\u201B]|[\u07F4\u275C\u2019\u201A\u02BC\u055A\u275F])/g, '\u0027');

  // Normalize " (double) quotation mark char.
  // For each OR subgroup in thereafter regex: double apostrophe, central, left, right, left + space, space + right
  // rq: Is the 'u' flag supported?
  string = string.replace(/(''|[\u0022\uFF02\u301D\u301E\u301F]|[\u201C\u201F\u275D\u{1F676}]|[\u201D\u201E\u275E\u{1F678}\u2760\u{1F677}\u2E42]|(<<|[\u00AB]) ?| ?(>>|[\u00BB]))/gu, '\u0022');

  string = string.normalize(); // useful ?
  string = string.trim();
  return string;
}

/**
 * Supprime les espaces multiples, tabulations et retours à la ligne.
 * @param {string}
 * @returns {string}
 */
function trimString(string) {
  if (string.constructor !== String) {
    throw("typeError", "The object is not a string");
  }
  string = string.replace(/\s+/g, " ").trim();
  return string;
}