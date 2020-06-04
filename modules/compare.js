// ESLint global variables
/* global Table getDiff regroupDiffType unchangedTextStyle deletedTextStyle addedTextStyle */

function generateDiffs() {
  const sheet = SpreadsheetApp.getActiveSheet(); // .getActiveSpreadsheet().getSheetByName("articles");
  const table = new Table(sheet, true);

  // For each version.
  // rq: No need to generate diff for the last one (already done with the pre-last)
  for (let i = 0; i < table.values.length - 1; i += 2) {
    // On génère une nouvelle entrée pour chaque comparaison.
    table.values.splice(i + 1, 0, table.generateLine());
    table.richTextValues.splice(i + 1, 0, table.generateLine());

    const version = table.values[i];
    const nextVersion = table.values[i + 2];
    const comparison = table.richTextValues[i + 1];

    // For each paragraph.
    for (let j = table.firstDataColIdx; j < version.length; j++) {
      comparison[j] = getDiffText(version[j], nextVersion[j]);
    }
  }
  table.pushRichTextValues();
}

/**
 * Push text into array to treat them.
 * TODO: Dans l'idéal : découper le texte en unités grammaticales emboîtées, puis établir le diff en partant de la plus profonde unité
 * (on regarde si le différentiel est au sein de l'unité, sinon on remonte à l'échellon supérieur)
 * Permettrait également de regarder au sein même d'un mot (ex: si ajout d'un accord en genre ou en nombre, d'une majuscule, d'un accent...)
 * @param {string} text
 * @returns {array}
 */
function splitText(text) {
  const appendToPrevious = []; // ["de", "du"]; // Trop hasardeux de supprimer "de" en amont
  const appendToNext = ["le", "la", "les", "un", "des", "de", "du"];

  //  Treat punctuation signs as plain words.
  const string = text.toString().replace(/([,.])/g, " $1");
  const array = string.split(" ");

  // Join determinants to ignore too common words.
  let i = 0;
  do {
    const word = array[i];
    if (appendToPrevious.includes(word.toLowerCase())) {
      const insert = `${array[i - 1]} ${word}`;
      array.splice(i - 1, 2, insert);
      i--;
    }
    else if (appendToNext.includes(word.toLowerCase())) {
      const insert = `${word} ${array[i + 1]}`;
      array.splice(i, 2, insert);
    }
    i++;
  } while (i < array.length);

  return array;
}

/**
 *
 * @param {string} firstText
 * @param {string} secondText
 * @returns {RichTextValue}
 */
function getDiffText(firstText, secondText) {
  // Push text into array to treat them.
  const firstParagraph = splitText(firstText);
  const secondParagraph = splitText(secondText);

  // Get diffs.
  let diffs = getDiff(firstParagraph, secondParagraph);
  diffs = regroupDiffType(diffs);
  const diffText = diffs.map(e => e.value).join(" ").replace(/ ([,.])/g, "$1"); // Delete space before punctuation.
  diffs.forEach(diff => diff.value = diff.value.replace(/ ([,.])/g, "$1")); // Assure homogeneity.
  diffs = diffs.filter(diff => diff.value !== ''); // Delete empty values (spaces that we just removed).
  diffs.forEach((diff, i, a) => diff.idx = diffText.indexOf(diff.value, i ? (a[i - 1].idx + a[i - 1].value.length) : 0)); // Get start idx of diff text substrings. IndexOf from end idx of previous value, to avoid miss indexing same values (frequent for 'de', 'et'...).

  // Render diffs.
  return renderRichText(diffText, diffs);
}

/**
 * @param {string} diffText
 * @param {Difference[]} differences Differences substrings.
 * @returns {RichTextValue} RichTextValue
 */
function renderRichText(diffText, differences) {
  const richTextValueBuilder = SpreadsheetApp.newRichTextValue();
  richTextValueBuilder.setText(diffText);
  for (const [i, difference] of differences.entries()) {
    let style;
    switch (difference.type) {
      case 'del':
        style = deletedTextStyle;
        break;
      case 'add':
        style = addedTextStyle;
        break;
      default:
        style = unchangedTextStyle;
        break;
    }
    difference.end = difference.idx + difference.value.length; // rq: Doesn't take the space used to join substrings into account
    if (difference.end > diffText.length) throw new Error(`Cannot set TextStyle: Substring out of range (from ${difference.idx} to ${difference.end} when Text is only ${diffText.length} chars)`);
    richTextValueBuilder.setTextStyle(difference.idx, difference.end, style);
  }
  const richText = richTextValueBuilder.build();

  return richText;
}