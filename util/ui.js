/**
 * @private
 * @see https://developers.google.com/apps-script/reference/html
 */
function _openDialogue() {
  // To close dialogue after success. Note: User closing the dialogue won't stop script execution.
  const html = "<script>google.script.run.withSuccessHandler(google.script.host.close).fnToRun();</script>";
  // const html = "<script>google.script.run.withSuccessHandler(google.script.run.fnToRunAfterSuccess).fnToRun();</script>";
  const h = HtmlService.createHtmlOutput(html);
  SpreadsheetApp.getUi().showModalDialog(h, "Executing");
}