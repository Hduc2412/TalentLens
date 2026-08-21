const HIRAGANA_START = 0x3041
const HIRAGANA_END = 0x3096
const KATAKANA_OFFSET = 0x60

/** Fold hiragana onto katakana so a kana query matches a katakana name. */
const toKatakana = (value: string): string =>
  value.replace(/[ぁ-ゖ]/g, (character) => {
    const code = character.charCodeAt(0)
    return code >= HIRAGANA_START && code <= HIRAGANA_END
      ? String.fromCharCode(code + KATAKANA_OFFSET)
      : character
  })

/**
 * Normalize Japanese and Latin text for substring search.
 *
 * NFKC folds full-width Latin and half-width kana onto their canonical forms,
 * kana folding removes the hiragana/katakana split, and lower-casing handles
 * Latin employee ids and roles.
 */
export const normalizeJapanese = (value: string): string =>
  toKatakana(value.normalize('NFKC')).toLowerCase().trim()

/** Case- and kana-insensitive substring test. */
export const includesJapanese = (haystack: string, needle: string): boolean =>
  normalizeJapanese(haystack).includes(normalizeJapanese(needle))
