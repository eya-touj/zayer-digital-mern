const sanitizeHtml = require('sanitize-html');

function sanitizeMarkup(value) {
  if (value === null || value === undefined) return '';
  return sanitizeHtml(stripEmojiCharacters(value), {
    allowedTags: ['a', 'article', 'b', 'blockquote', 'br', 'button', 'code', 'dd', 'details', 'div', 'dl', 'dt', 'em', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'img', 'input', 'label', 'legend', 'li', 'main', 'ol', 'option', 'p', 'select', 'small', 'span', 'strong', 'summary', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul'],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'class'],
      form: ['method', 'action', 'class', 'data-zayer-message-form', 'data-kind'],
      img: ['src', 'alt', 'class', 'width', 'height', 'loading'],
      input: ['class', 'id', 'name', 'type', 'value', 'placeholder', 'required', 'checked', 'min', 'max', 'step', 'pattern', 'autocomplete', 'accept', 'multiple', 'disabled', 'tabindex', 'maxlength', 'minlength', 'aria-label', 'aria-hidden'],
      label: ['class', 'for'],
      select: ['class', 'id', 'name', 'required', 'disabled', 'multiple', 'aria-label'],
      option: ['value', 'selected', 'disabled'],
      textarea: ['class', 'id', 'name', 'rows', 'cols', 'required', 'placeholder', 'maxlength', 'minlength', 'aria-label'],
      button: ['class', 'id', 'type', 'name', 'value', 'disabled', 'aria-label'],
      '*': ['class', 'id', 'title', 'role', 'aria-label', 'aria-live', 'aria-hidden'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true) },
  });
}

function sanitizeCssDeclarations(input) {
  return String(input)
    .split(';')
    .map((declaration) => declaration.trim())
    .filter((declaration) => {
      const separator = declaration.indexOf(':');
      if (separator < 1) return false;
      const property = declaration.slice(0, separator).trim();
      const value = declaration.slice(separator + 1).trim();
      return /^--[a-z0-9_-]+$|^[a-z-]+$/i.test(property)
        && value.length > 0
        && !/(?:expression\s*\(|javascript\s*:|vbscript\s*:|@import|behavior\s*:|-moz-binding|url\s*\()/i.test(value);
    })
    .join('; ');
}

function splitRules(css) {
  const rules = [];
  let start = 0;
  let depth = 0;
  for (let index = 0; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1;
    if (css[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        rules.push(css.slice(start, index + 1));
        start = index + 1;
      }
    }
  }
  return rules;
}

function scopeCss(css, scope = '.cms-component') {
  const validScope = /^\.[a-z][a-z0-9_-]*$/i.test(scope) || /^\.zcms-component\[data-component-id="\d+"\]$/.test(scope);
  const safeScope = validScope ? scope : '.cms-component';
  const source = String(css || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import[^;]*;?/gi, '');
  return splitRules(source).map((rule) => {
    const opening = rule.indexOf('{');
    const closing = rule.lastIndexOf('}');
    if (opening < 0 || closing <= opening) return '';
    const selector = rule.slice(0, opening).trim();
    const body = rule.slice(opening + 1, closing).trim();
    if (selector.startsWith('@media') || selector.startsWith('@supports')) {
      const nested = scopeCss(body, safeScope);
      return `${selector}{${nested}}`;
    }
    if (selector.startsWith('@') || !body) return '';
    const declarations = sanitizeCssDeclarations(body);
    if (!declarations) return '';
    const scoped = selector.split(',').map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return '';
      return trimmed.startsWith(safeScope) ? trimmed : `${safeScope} ${trimmed}`;
    }).filter(Boolean).join(', ');
    return scoped ? `${scoped}{${declarations}}` : '';
  }).filter(Boolean).join('\n');
}

function sanitizeComponentCss(value) {
  return stripEmojiCharacters(value).slice(0, 20000)
    .replace(/<\/?(?:style|script)\b[^>]*>/gi, '')
    .replace(/@import\s+[^;]+;?/gi, '')
    .replace(/url\s*\([^)]*\)|expression\s*\([^)]*\)|javascript\s*:|behavior\s*:|-moz-binding\s*:/gi, '')
    .trim();
}

function plainText(value, maxLength = 5000) {
  return stripEmojiCharacters(String(value || '').replace(/<[^>]*>/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')).trim().slice(0, maxLength);
}

function stripEmojiCharacters(value) {
  return String(value || '').replace(/[\p{Emoji_Presentation}\p{Emoji_Modifier}\u200D\uFE0F\u20E3]/gu, '');
}

function safeUrl(value, maxLength = 1000) {
  const text = plainText(value, maxLength);
  if (!text) return '';
  if (text.startsWith('/') && !text.startsWith('//')) return text;
  if (/^(?:\.{1,2}\/|[a-z0-9])[a-z0-9._~!$&'()*+,;=@%/-]*(?:[?#][^\s]*)?$/i.test(text)) return text;
  try {
    const url = new URL(text);
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) && !url.username && !url.password) return text;
  } catch {}
  return '';
}

module.exports = { sanitizeMarkup, scopeCss, sanitizeComponentCss, plainText, safeUrl, stripEmojiCharacters };
