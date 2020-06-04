/**
 * Convert Object values to string, so it's printable in Ui.
 * Useful for debugging directly on Google Sheets.
 * @param {Object} object Object to print
 */
function printObjectProperties(object) {
  let string;
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      const element = object[key];
      string += `\n${key}: ${element},`;
    }
  }
  return string;
}

/**
 * Deep clone an array using .map() (to avoid referencing).
 * @param {array} array Array to clone.
 * @returns {array} Cloned array.
 * @ref https://dev.to/samanthaming/how-to-deep-clone-an-array-in-javascript-3cig
 */
function clone(array) {
  return array.map(item => Array.isArray(item) ? clone(item) : item);
}