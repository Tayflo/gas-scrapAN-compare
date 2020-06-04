// ESLint global variables
/* global initMatrice Difference */

/**
 * Compute the edit distance between the two given strings (Levenshtein distance).
 * @param {string} a First string
 * @param {string} b Second string
 * @returns {number} Edit distance
 * @src https://gist.github.com/andrei-m/982927
 * @copyright Copyright (c) 2011 Andrei Mackenzie
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
function getEditDistance(a, b) {
  if (a.length == 0) return b.length;
  if (b.length == 0) return a.length;

  const matrix = [];

  // Increment along the first column of each row
  let i;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Increment each column in the first row
  let j;
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      }
      else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1)); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Get diffs of two arrays.
 * @param {array} a The first sequence to compute.
 * @param {array} b The second sequence to compute.
 * @returns {Difference[]} Array of difference objects.
 * @see wikipedia Built from https://en.wikipedia.org/wiki/Longest_common_subsequence_problem
 * @see also if needed a node module https://github.com/kpdecker/jsdiff
 */
function getDiff(a, b) {
  // Avoid beginnings and ends of array, to compute less data possible.
  // TODO:

  // Necessary for using a zeroth index for the common subsequences table.
  a.unshift(undefined);
  b.unshift(undefined);
  const l = a.length;
  const m = b.length;

  // Initialize table of common subsequences.
  const csTable = initMatrice(l, m);
  for (let i = 0; i < l; i++) {
    csTable[i][0] = 0;
  }
  for (let j = 0; j < m; j++) {
    csTable[0][j] = 0;
  }

  // Computing common subsequence length for each combination.
  for (let i = 1; i < l; i++) {
    for (let j = 1; j < m; j++) {
      // If elements are the same, we point back at the previous subsequence that did not contain any of these (up left) and add one to the path length.
      if (a[i] === b[j]) {
        csTable[i][j] = csTable[i - 1][j - 1] + 1;
      }
      // Else, we point back to the biggest neighbouring common subsequence length with one or the other element (top or left).
      else {
        csTable[i][j] = Math.max(csTable[i][j - 1], csTable[i - 1][j]);
      }
    }
  }

  // Backtrack the table to get the path of the longest common subsequence.
  const res = [];
  for (let i = l - 1, j = m - 1; i > 0 || j > 0;) {
    const diff = new Difference();
    // Same
    if (a[i] === b[j]) {
      diff.type = 'same';
      diff.value = a[i];
      i--;
      j--;
    }
    // rq: Arbitrarly choosen to shift j and not i when equality (should be rare for the use case)
    // Addition
    else if (j > 0 && (i === 0 || csTable[i][j - 1] >= csTable[i - 1][j])) {
      diff.type = 'add';
      diff.value = b[j];
      j--;
    }
    // Deletion
    else if (i > 0 && (j === 0 || csTable[i][j - 1] < csTable[i - 1][j])) {
      diff.type = 'del';
      diff.value = a[i];
      i--;
    }
    res.push(diff);
  }

  return res.reverse();
}

/**
 * @param {Difference[]} diffs Difference objects to regroup.
 * @param {string} separator Separator to use to regroup values (default: ' ').
 * @returns {Difference[]} Copy of diffs with values regrouped.
 */
function regroupDiffType(diffs, separator = ' ') {
  const res = [];
  for (let i = 0, j = -1, l = diffs.length; i < l; i++) {
    const diff = diffs[i];
    // If it's the same type as precedent, append to precedent
    if (i > 0 && diff.type == res[j].type) {
      res[j].value += separator + diff.value;
    }
    // Else, add element to array
    else {
      const newDiff = new Difference(diff.type, diff.value);
      res.push(newDiff);
      j++;
    }
  }
  return res;
}

/**
 * TODO:
 * @private
 * @param {array} a First array.
 * @param {array} b Second array.
 */
function _matchRow(a, b) {
  // For each consecutive versions
  // because each is derived from the previous one
  // we can compare them two by two

  // For each article.

  // For each paragraph.
  // Compare with corresponding paragraph at the next version: is it the same (with/without changed), an add, a del?
  // if same in next: i = i;
  // if del in next: i--; (shift this paragraph up (compared to all the other, so that is insert this paragraph))
  // if add in next: i++; (shift this paragraph down)
  // TODO: To make sure we understand it correctly, we should play a bit with the getDiff() matrice

  // Evaluate difference with getEditDistance(p1, p2)
  // which threshold to be considered "same"? a third... ? no threshold?
  // take into account "(supprimé)"

  // To find the best path, could be useful to use an algorithm inspired by the Longest Common Subsequent used above
  // making a matrice of possible combination, each storing cumulative editDistance() value (and then, the lower the path value, the better)

  // Sample of arrays to compare.
  // [abc, ifj]
  // [ab, ifj, yxz]
  // [ifj, yxx]

  // rq: Sometimes, by paragraph comparison doesn't fit:
  // ex: paragraph content can be split to different subsequent paragraph (article 8 bis)
  // ex: paragraph content moved/dispatched elsewhere (maybe first version of article 9?)
}