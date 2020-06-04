// ESLint global variables
/* global Paragraph Version Table parseHtml getElementsByClassName clone normalizeString*/

function fetchScrapAndPush() {
  const domain = /^https?:\/\/www\.assemblee-nationale\.fr/;

  // SpreadsheetApp.getUi().alert("Exécution...");

  // Fetch data from sheet.
  const readSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("list");
  const listTab = new Table(readSheet);

  // Get articles versions metadata.
  /**
   * @type {Versions[]}
   * @note Here, no need to store initial row index of version object.
   * But since it's filtered, it doesn't match index in the array.
   */
  const versions = [];
  for (const versionData of listTab.values) {
    const version = new Version();
    version.name = versionData[listTab.enums.name];
    version.url = versionData[listTab.enums.src];
    version.paragraphs = {};
    if (version.url.match(domain)) {
      versions.push(version);
    }
  }

  // Get articles version data: fetch their URLs and parse retrieved data.
  const urls = versions.map(v => v.url);
  const httpResponses = UrlFetchApp.fetchAll(urls);
  const pagesParagraphs = processHttpResponses(httpResponses);
  // Put paragraph into each version Object (indexes should match).
  versions.forEach((v, i) => v.paragraphs = pagesParagraphs[i]);

  // Set articles versions data in spreadsheet.
  const targetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("articles");
  const targetTab = new Table(targetSheet);

  for (const version of versions) {
    formatData(version, targetTab);
  }

  targetTab.pushValues();
}

/**
 * TODO: Fetch Articles names directly instead of having them preemptively
 * rq: No need to return anything, the Table object is directly edited.
 * @param {Version} version
 * @param {Table} targetTab
 * @returns {array[]}
 */
function formatData(version, targetTab) {
  // Get the col Idx of the version.
  const versionColIdx = targetTab.headers.indexOf(version.name);
  if (versionColIdx === -1) throw new Error("Column not found in target tab for specified article version.");

  // Iterating over each paragraph
  const paragraphs = version.paragraphs;
  const artNumColIdx = version.name.match("final") ? targetTab.enums.artNum_final : targetTab.enums.artNum_navette;
  let currentArticle = targetTab.values[0][artNumColIdx]; // Nom de l'article courant. On part du premier article.
  if (paragraphs[0].articleNumero !== currentArticle) throw new Error("The first article in the fetched version doesn't match the first article in the tab.");
  let rowIdx = 0;
  for (const paragraph of paragraphs) {
    // for (const [i, paragraph] of paragraphs.entries())
    // (for...of loop with destructuring array.entries() to get both index and value) @see: https://bitsofco.de/for-in-vs-for-of/

    // If we arrived at the end of the rows but we still got paragraphs to push,
    // we need to insert a new row. (rq: These lasts should match the article of the previous last row.)
    targetTab.values.push(targetTab.generateLine());

    // Get row to fill searching by article name.
    currentArticle = targetTab.values[rowIdx][artNumColIdx];
    let duplicate = false;

    // If the paragraph's article doesn't match the article in the current row...
    // console.log(paragraph.articleNumero);
    // console.log(currentArticle);
    if (paragraph.articleNumero !== currentArticle) {
      // 1. Check if previous row has the searched article. If so, mark the row to be duplicate.
      currentArticle = targetTab.values[rowIdx - 1][artNumColIdx];
      if (paragraph.articleNumero === currentArticle) {
        duplicate = true;
      }

      // 2. If not, we search for the next article that is present in this version.
      let loopCount;
      while (paragraph.articleNumero !== currentArticle) {
        rowIdx++;
        currentArticle = targetTab.values[rowIdx][artNumColIdx];
        // Avoid infinity loop.
        loopCount++;
        if (loopCount > 10000) throw new Error("Infinite loop: No article found with this name.");
      }
    }

    // We now are on the acurate row index, we can start to push in data.

    if (duplicate) {
      // We need to insert a new row.
      targetTab.values.splice(rowIdx, 0, targetTab.generateLine());

      // Fill the new row duplicating frozen values of previous row.
      for (let j = 0; j < targetTab.firstDataColIdx; j++) {
        targetTab.values[rowIdx][j] = targetTab.values[rowIdx - 1][j];
      }
    }

    targetTab.values[rowIdx][versionColIdx] = paragraph.text;

    rowIdx++;
  }
}

/**
 * @param {HTTPResponse[]} httpResponses httpResponses to extract data from
 * @returns {Paragraph[][]} Array of pages. For each page, an array of paragraphs Objects.
 */
function processHttpResponses(httpResponses) {
  const pagesParagraphs = [];
  for (let i = 0; i < httpResponses.length; i++) {
    // console.log(`Page #${i}`);
    const httpResponse = httpResponses[i];
    const content = httpResponse.getContentText(); // OR getContent() ?
    const xml = parseHtml(content);
    const pageParagraphs = parsePage(xml);
    pagesParagraphs.push(pageParagraphs);
  }
  return pagesParagraphs;
}

/**
 * TODO: Ignore details at the end (signature, ISSN reference...)
 * TODO: Ignore some blanks lines
 * TODO: Ignore (nouveau), (Supprimé), (Division et intitulé nouveaux), (Division et intitulé supprimés)
 * @param {XmlDocument} xml
 * @returns {Paragraph[]} Array of paragraph objects
 */
function parsePage(xml) {

  /* / temp: Get the ID of the document on the viewing page (that you get from the dynamic summary of the law).
  const iframe = getElementsByTagName(xml, 'iframe')[0];
  const src = iframe.getAttribute('src').getValue();
  console.log(src);
  return; /*/

  // On récupère le corps de la proposition de loi
  const section = getElementsByClassName(xml, "assnatSection2")[0]; // Should be only one
  const sectionText = section.getValue();
  let paragraphs = section.getChildren("p");

  // Le cas échéant, on ignore "EXPOSÉ DES MOTIFS"
  // console.log(`On commence avec ${paragraphs.length} éléments.`);
  if (sectionText.includes("EXPOSÉ DES MOTIFS")) {
    for (let i = 0; i < paragraphs.length; i++) {
      const element = paragraphs[i];
      if (element.getValue().includes("proposition de loi")) {
        break;
      }
      element.detach();
    }
  }

  // rq: It is needed to redefine paragraphs after detachs to update.
  paragraphs = section.getChildren("p");
  // console.log(`On finit avec ${paragraphs.length} éléments.`);

  // On récupère les paragraphes qu'on met en forme
  let articleNumero;
  let relativeNo = 1; // Numérotation en partant de 1 (inutile)
  let absoluteNo = 1; // (inutile)
  const data = [];

  // Nécessaire pour certaines pages cassées (absence de class)
  // ex: http://www.assemblee-nationale.fr/dyn/docs/PIONANR5L15B1219.raw
  const assnat4TitreNum_style = "margin-top:42pt; margin-bottom:12pt; text-align:center; page-break-after:avoid";
  const assnat4TitreIntit_style = "text-align:center; page-break-inside:avoid; page-break-after:avoid"; // okaou
  const assnat9ArticleNum_style = "margin-top:24pt; margin-bottom:12pt; text-align:center; page-break-after:avoid";
  const assnatLoiTexte_style = "margin-bottom:12pt; text-indent:25.5pt"; // okaou

  for (const element of paragraphs) {
    const paragraph = new Paragraph();
    // On met de côté les titres et articles ("Article 1er", "Titre Ier")
    // ils servent d'étiquette aux paragraphes qui suivent
    // rq: assnatLoiTexte className pour un paragraphe standard (pourrait être utile pour vérifier la validité des données)
    // rq: assnat4TitreIntit className pour le nom d'un titre
    let className = element.getAttribute('class');
    className = className ? className.getValue() : undefined; // rq: Pas de class pour "Mesdames, messieurs"
    let style = element.getAttribute('style');
    style = style ? style.getValue() : undefined;
    if (['assnat4TitreNum', 'assnat9ArticleNum'].includes(className)
      || [assnat4TitreNum_style, assnat9ArticleNum_style].includes(style)
    ) {
      articleNumero = element.getValue();
      if (className === 'assnat4TitreNum') articleNumero = articleNumero.replace(/titre/i, "TITRE"); // toUpperCase().replace("ER", "er").replace("BIS", "bis");
      relativeNo = 1;
      continue;
    }
    // On filtre les fioritures qui ne correspondent à aucun article ("proposition de loi" au début).
    if (!articleNumero) {
      continue;
    }
    paragraph.articleNumero = articleNumero.replace("(nouveau)", '').trim();
    paragraph.relativeNo = relativeNo++;
    paragraph.absoluteNo = absoluteNo++;

    // Clean the text
    const text = element.getValue();
    paragraph.text = normalizeString(text);

    data.push(paragraph);
  }
  return data;
}