// ESLint global variables
/* global trimString */

/**
 * @param {string} html
 * @returns {Element}
 */
function parseHtml(html) {
  html = clearHtmlForXml(html);
  const xmlDoc = XmlService.parse(html);
  const xmlRoot = xmlDoc.getRootElement();
  return xmlRoot;
}

/**
 * @param {string} html
 * @returns {string} Valid XML string. Data ready to be parsed through XmlService.parse()
 */
function clearHtmlForXml(html) {
  // Suppression nécessaire car ces balises doivent aller de pair en entrée du XML, bien que ce soit dispensable dans le site en HTML
  html = html.replace(/<\/?br.*?>/g, "")
    .replace(/<\/?img.*?>/g, "")
    .replace(/<\/?link.*?>/g, "")
    .replace(/<\/?meta.*?>/g, "")
    .replace(/<\/?input.*?>/g, "")
    .replace(/<\/?button.*?>/g, "")
    .replace(/<\/?hr.*?>/g, "");

  // Suppression des vidéos, dont les attributs ne conviennent pas au XML
  // (Attribute name "autoplay" associated with an element type "video" must be followed by the ' = ' character.)
  html = html.replace(/<video.*>[^]*?<\/video>/g, "");

  // Suppression de caractères spéciaux
  // (The entity "copy" was referenced, but not declared.)
  html = html.replace(/&copy;/g, "");

  // On supprime les balises HTML intermittentes, permet de copier-coller l'intégralité de codes sources à la suite
  html = html.replace(/<\/html>[^]*?<html.*?>/g, "");

  // Problème d'encodage sur les & : parfois des &amp; sont écrits & et dont confondus avec des spécificatifs de caractères spéciaux.
  html = html.replace(/(?!&#?[0-9A-Za-z]{1,6};)&/g, "&amp;");
  // Tentative de regex: &\w+=\d+\b[^;]
  // var specialCharRegex = /&#?[0-9A-Za-z]{1,6}/g; // https://www.ascii.cl/htmlcodes.htm
  // var ignoreSpecialCharRegex = /(?!&#?[0-9A-Za-z]{1,6};)&.+/g // Fonctionnel, mais (?!) non pris en charge par RE2. Qu'est-ce à dire ? Dépend visiblement des fonctions, fonctionne sur .replace mais pas .replaceText // https://stackoverflow.com/questions/30968419/replacetext-regex-not-followed-by // https://github.com/google/re2/blob/master/doc/syntax.txt
  // var outsideTagRegex = /(<.+?>[^<>]*?)(_mystring_)([^<>]*?<.+?>)/g; // https://stackoverflow.com/questions/958095/use-regex-to-find-specific-string-not-in-html-tag
  // var withinTagRegex = /(<[^<>]*?)(_mystring_)([^<>]*?>)/g;

  // Essais et remarques (osef)
  /* html = html.replace(/<script.*?>[^]*?<\/script>/g, "") // Non nécessaire
    .replace(/<noscript.*?>[^]*?<\/noscript>/g, "")
    .replace(/<head.*?>[^]*?<\/head>/g, "")
    .replace(/<body.*?>/g, "").replace(/<\/body>/g, "");*/
  //
  // html = html.replace(/<div class="example">Ex: 2019<\/div>/g, ""); // Bloc div (block-level) dans un élément span (inline), à éviter ?
  //
  // Suppression des balises qui ne sont pas closes, ex: <button>, xe: <div></div>
  // <(\w)[^]*?>(?![^]*?<\/\1>) // Non fonctionnel, pourquoi ?
  // <([a-z]+)[^]*?>(?![^]*?<\/\1>) // Non fonctionnel, pourquoi ?*

  return trimString(html);
}

/**
 * @src https://sites.google.com/site/scriptsexamples/learn-by-example/parsing-html
 */
function getElementById(element, idToFind) {
  const descendants = element.getDescendants();
  for (const i in descendants) {
    const elt = descendants[i].asElement();
    if (elt != null) {
      const id = elt.getAttribute('id');
      if (id != null && id.getValue() == idToFind) return elt;
    }
  }
}

/**
 * @src https://sites.google.com/site/scriptsexamples/learn-by-example/parsing-html
 */
function getElementsByClassName(element, classToFind) {
  const data = [];
  const descendants = element.getDescendants();
  descendants.push(element);
  for (const i in descendants) {
    const elt = descendants[i].asElement();
    if (elt != null) {
      let classes = elt.getAttribute('class');
      if (classes != null) {
        classes = classes.getValue();
        if (classes == classToFind) {data.push(elt);}
        else {
          classes = classes.split(' ');
          for (const j in classes) {
            if (classes[j] == classToFind) {
              data.push(elt);
              break;
            }
          }
        }
      }
    }
  }
  return data;
}

/**
 * @src https://sites.google.com/site/scriptsexamples/learn-by-example/parsing-html
 */
function getElementsByTagName(element, tagName) {
  const data = [];
  const descendants = element.getDescendants();
  for (const i in descendants) {
    const elt = descendants[i].asElement();
    if (elt != null && elt.getName() == tagName) data.push(elt);
  }
  return data;
}