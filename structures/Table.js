// ESLint global variables
/* global columnValues clone transposeMatrice */

/**
 * TODO:
 * = READ
 * # Get frozen row (ok)
 * # Get headers (ok)
 * # Get last populated row (ok)
 *
 * # Handle formulas
 * # Handle notes
 *
 * # Select <col> where <col> is <val>
 * # Select <row> where <col> is <val>
 *
 * = WRITE
 * # Handle undefined (should be ok in v8)
 * # A way to process by line (so each column for a defined row, to handle a specific item)
 */

/**
 * @see sheetfu If needed https://github.com/socialpoint-labs/sheetfu-apps-script
 * It's a Table class with useful functionalities.
 */

/**
 * A Table as database built from a sheet.
 * Headers must be on the last (lower) frozen row.
 */
class Table {
  /**
   * @param {Sheet} sheet
   * @param {boolean} byColumn If true, headers are in line and elements in columns.
   */
  constructor(sheet, byColumn = false) {
    // Check param validity
    // @ref https://stackoverflow.com/questions/15325301/type-checking-on-google-apps-script-platform/19018406
    if (sheet.toString() !== "Sheet") {
      throw new TypeError("Unable to construct Table: Table constructor requires a Sheet object");
    }

    const dataRange = sheet.getDataRange();

    let dataValues = dataRange.getValues();
    // TODO:
    let richTextValues = dataRange.getRichTextValues();
    const initialDataFormulas = dataRange.getFormulas();
    const initialDataNotes = dataRange.getNotes();

    const frozenColumns = sheet.getFrozenColumns();
    const frozenRows = sheet.getFrozenRows();

    let dataFirstIdx;
    if (byColumn) {
      dataValues = transposeMatrice(dataValues);
      richTextValues = transposeMatrice(richTextValues);
      dataFirstIdx = frozenColumns;
      if (dataFirstIdx === 0) throw new Error("Unable to construct Table: No headers detected due to absence of frozen columns");
    }
    else {
      dataFirstIdx = frozenRows;
      if (dataFirstIdx === 0) throw new Error("Unable to construct Table: No headers detected due to absence of frozen rows");
    }

    const dataLastIdx = Table.getLastNonEmptyIdx(dataValues);
    const dataHeadersIdx = dataFirstIdx - 1;

    const dataHeaders = dataValues[dataHeadersIdx];

    // On récupère les index des en-têtes sous forme d'objet pour accéder facilement à la colonne voulue.
    const headersEnum = {};
    for (let i = 0; i < dataHeaders.length; i++) {
      const headerName = dataHeaders[i].toString(); // .toUpperCase();
      headersEnum[headerName] = i;
    }

    /**
     * If true, headers are retrieved from rows and elements from columns.
     * But Table.values are still with the same syntax (grid array with elements in i and attribues in j).
     * @type {boolean}
     */
    this.byColumn = byColumn;

    /**
     * The sheet the Table has been extracted from.
     * @type {Sheet}
     */
    this.sheet = sheet;

    /**
     * The row in wich the header are (not the index).
     * @type {number}
     */
    this.headersRow = dataHeadersIdx + 1;

    /**
     * Array of headers name. Index of the header matches his column index.
     * @type {string[]}
     */
    this.headers = dataHeaders;

    /**
     * Enumeration Object for columns indexes.
     * @type {Object.<string, number>}
     */
    this.enums = headersEnum;

    /**
     * Index of the first column in which to push data (after the last frozen one, equals number of frozen columns).
     * @type {number}
     */
    this.firstDataColIdx = byColumn ? frozenRows : frozenColumns;

    /**
     * Values of items.
     * @type {array[]}
     */
    this.values = dataValues.slice(dataFirstIdx, dataLastIdx + 1);

    /**
     * Values of items.
     * @type {array[]}
     */
    this.richTextValues = richTextValues.slice(dataFirstIdx, dataLastIdx + 1);

    /**
     * @private Useless
     * Initial values of items (to cope with shifting).
     * @type {array[]}
     */
    this._initialValues = clone(this.values);

    /**
     * @private Not used for now
     * Formulas for formula-generated attributes.
     * <warn>Does not handle formulas edit!</warn>
     * @type {array[]}
     */
    this._initialFormulas = initialDataFormulas.slice(dataFirstIdx, dataLastIdx + 1);

    /**
     * @private Useless
     * Shifting value compared to initial range.
     * @type {number}
     */
    this._shift = 0;
  }

  /**
   * From bottom to top, return the first non-empty row.
   * Useful to avoid taking empty arrayformula-generated values into account.
   * Formerly getLastPopulatedRow().
   * @param {array[]} values
   */
  static getLastNonEmptyIdx(values) {
    for (let i = values.length - 1; i > 0; i--) {
      for (let j = 0; j < values[0].length; j++) {
        if (values[i][j]) return i;
      }
    }
    return 0;
  }

  /**
   * Generate empty array, with lenght of values matrice width.
   * This is a new row, with as much columns as this Table.
   * @returns {array}
   */
  generateLine() {
    const array = [];
    for (let i = 0, l = this.values[0].length; i < l; i++) {
      array[i] = undefined;
    }
    return array;
  }

  /**
   * Get array of value for a given column.
   * @param {string} columnName The name of the column to get.
   * @returns {array} Values of the given column as an array.
   */
  getColumnValues(columnName) {
    const columnIdx = this.enums[columnName];
    return columnValues(this.values, columnIdx);
  }

  /**
   * @private
   * @param {Object} element
   * @param {number} index
   * @param {boolean} filling
   */
  _insert(element, index, filling = false) {
    if (filling) {
      //
    }
    this.shift++;
  }

  /**
   * Get parameters for setValues() functions.
   * @returns {array} [row, col, height, width]
   */
  getPushParams() {
    let row;
    let col;
    if (this.byColumn) {
      row = 1;
      col = this.headersRow + 1;
      this.values = transposeMatrice(this.values);
      this.richTextValues = transposeMatrice(this.richTextValues);
    }
    else {
      row = this.headersRow + 1;
      col = 1;
    }
    const height = this.values.length;
    const width = this.values[0].length;
    return [row, col, height, width];
  }

  /**
   * Push values into sheet.
   */
  pushValues() {
    const params = this.getPushParams();
    const range = this.sheet.getRange(...params);
    range.setValues(this.values);
    this.values = transposeMatrice(this.values); // If subsequent actions needed.
  }

  /**
   * Push RichTextValues into sheet.
   */
  pushRichTextValues() {
    const params = this.getPushParams();
    const range = this.sheet.getRange(...params);

    // WARNING: setRichTextValues() doesn't work if sheet contains frozen rows
    // even if we apply it only to unfrozen rows (and unfrozen cols), by slicing data we push
    // even if we .setFrozenRows(0);
    // no workaround found other than manualy remove the frozen row manually before execution (so diffs are calculating for them too)

    range.setRichTextValues(this.richTextValues);
    this.richTextValues = transposeMatrice(this.richTextValues); // If subsequent actions needed.

    /* / No need to set up wrap stretegies
    const wrapStrategies = initMatrice(height, width, SpreadsheetApp.WrapStrategy.OVERFLOW);
    range.setWrapStrategies(wrapStrategies); /*/
  }

  /**
   * @private
   * Push values into sheet.
   * @param {string} [columnName] The name of the column to push (optional).
   */
  _pushColumnValues(columnName) {
    let columnIdx = undefined;
    if (columnName) {
      columnIdx = this.enums[columnName];
    }

    // TODO: Handle shifting.
    for (const i in this.initialFormulas) {
      for (const j in this.initialFormulas[i]) {
        const formula = this.initialFormulas[i][j];
        if (formula != "") {
          this.values[i][j] = formula;
        }
      }
    }

    const range = this.sheet.getRange(this.headersRow + 1, 1, this.values.length, this.values[0].length);
    range.setValues(this.values);

    // Reinitialize table.
    this.shift = 0;
    this.initialFormulas = 0;

    return 1;
  }

  /**
   * Apply a function to every values elements of this table.
   * @param {function} callback
   * @param  {...any} args
   */
  apply(callback, ...args) {
    for (let i = 0, l = this.values.length; i < l; i++) {
      for (let j = 0, m = this.values[i].length; j < m; j++) {
        if (this.values[i][j]) {
          this.values[i][j] = callback(this.values[i][j], ...args);
        }
      }
    }
    this.pushValues();
  }
}