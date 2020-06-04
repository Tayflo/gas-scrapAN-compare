/**
 * Paragraphe d'une proposition de loi.
 */
class Paragraph {
  constructor() {
    /**
     * Nom du numéro de l'article auquel le paragraphe appartient.
     * @type {string}
     */
    this.articleNumero;
    /**
     * Numéro du paragraphe dans l'article auquel il appartient (à partir de 1).
     * Inutile.
     * @type {number}
     */
    this.relativeNo;
    /**
     * Numéro du paragraphe dans la version de la proposition de loi (à partir de 1).
     * Inutile.
     * @type {number}
     */
    this.absoluteNo;
    /**
     * Contenu du paragraphe.
     * @type {string}
     */
    this.text;
  }
}

/**
 * Version d'une proposition de loi.
 */
class Version {
  /**
   * @param {string} name
   * @param {string} url
   * @param {Paragraph[]} paragraphs
   */
  constructor(name, url, paragraphs) {
    /**
     * @type {string}
     */
    this.name = name;
    /**
     * @type {string}
     */
    this.url = url;
    /**
     * @type {Paragraph[]}
     */
    this.paragraphs = paragraphs;
  }
}

/**
 * Différence au sein d'un tableau (de mots d'un paragraphe).
 */
class Difference {
  constructor(type, value) {
    /**
     * Type of the difference. Aviable values:
     * * same
     * * del
     * * add
     * @type {string}
     */
    this.type = type;

    /**
     * @type {any}
     */
    this.value = value;

    /**
     * @type {number}
     */
    this.idx;
  }
}