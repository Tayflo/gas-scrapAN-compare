// ESLint Global Variables
/* global Colors */

const unchangedTextStyle = SpreadsheetApp.newTextStyle()
  .setForegroundColor(Colors.DARK_GREY_2)
  .build();

const deletedTextStyle = SpreadsheetApp.newTextStyle()
  .setItalic(true)
  .setBold(true)
  .setForegroundColor(Colors.DARK_RED_1)
  .build();

const addedTextStyle = SpreadsheetApp.newTextStyle()
  .setItalic(true)
  .setBold(true)
  .setForegroundColor(Colors.DARK_GREEN_1)
  .build();