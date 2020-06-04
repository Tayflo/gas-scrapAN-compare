/**
 * Set every element of array in an array to match matrix syntax.
 * @example from [1,2,3] to  [[1],[2],[3]]
 * @param {array}
 * @returns {array[]}
 * @ref https://stackoverflow.com/questions/33665514/set-values-by-only-columns-in-google-apps-script
 */
function toColumnVector(array) {
  if (array.constructor !== Array) {
    throw("typeError", "The object is not an array");
  }
  const output = [];
  for (let i = 0; i < array.length; i++) {
    output.push([array[i]]);
  }
  return output;
}

/**
 * Extract column values of a matrice to an array.
 * @example from [[1],[2],[3]] to [1,2,3]
 * @param {array[]} matrice
 * @param {number} [columnIdx=0] Column index to extract (default: first one)
 * @returns {array}
 */
function columnValues(matrice, columnIdx = 0) {
  if (matrice.constructor !== Array) {
    throw new TypeError("The object is not an array");
  }
  const res = [];
  for (let i = 0, l = matrice.length; i < l; i++) {
    const value = matrice[i][columnIdx];
    res.push(value);
  }
  return res;
}

function transposeMatrice(matrice) {
  if (matrice.constructor !== Array) {
    throw new TypeError("The object is not an array");
  }
  const rows = matrice.length;
  const cols = matrice[0].length;
  const res = [];
  for (let j = 0; j < cols; j++) {
    res[j] = Array(rows);
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      res[j][i] = matrice[i][j];
    }
  }
  return res;
}

/**
 * @param {number} height Number of rows
 * @param {number} width Number of columns
 * @param {any} filling The element with which we should fill this initial matrice
 */
function initMatrice(height, width, filling = undefined) {
  const res = [];
  for (let i = 0; i < height; i++) {
    res[i] = [];
    for (let j = 0; j < width; j++) {
      res[i][j] = filling;
    }
  }
  return res;
}