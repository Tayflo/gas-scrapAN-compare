// ESLint global variables
/* global Table getDiffText*/

/**
 * The event handler triggered when opening the spreadsheet.
 * @param {Event} event The onOpen event.
 */
function onOpen(event) {

  // Add a custom menu to the spreadsheet.
  SpreadsheetApp.getUi()
    .createMenu("Fonctions personnalisées")

    // Test
    .addItem("Test", 'test')

    .addItem("diffTest", 'diffTest')

    .addItem("generateDiffs", 'generateDiffs')

    .addItem("It's scraping time!", 'fetchScrapAndPush')

    .addToUi();
}

function test() {
  // const sheet = SpreadsheetApp.getActiveSheet();
  // const rng = sheet.getActiveRange();

  // const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('articles');
  // const table = new Table(sheet);
  // table.apply(normalizeString);
}

function diffTest() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const rng1 = sheet.getRange('A4');
  const rng2 = sheet.getRange('A5');
  const rng3 = sheet.getRange('A6');
  const text = getDiffText(rng1.getValue(), rng2.getValue());
  rng3.setRichTextValue(text);
}