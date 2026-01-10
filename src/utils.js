/**
 * ============================================================================
 * PAGETREE PARSER - Utilities
 * ============================================================================
 *
 * ID generation, fractional indexing, and common helpers.
 *
 * ============================================================================
 */

// Use DOMPurify in browser, simple passthrough on server
// Server-side parsing is from trusted FunnelWind source
let DOMPurify = null;
if (typeof window !== 'undefined') {
  import('dompurify').then(mod => { DOMPurify = mod.default; });
}

/**
 * Sanitize HTML to prevent XSS attacks
 * Allows only safe formatting tags for text content
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  // On server or before DOMPurify loads, return HTML as-is
  // (server-side parsing is from trusted FunnelWind source)
  if (!DOMPurify) return html;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'a', 'br', 'span', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
  });
}

/**
 * Generate a unique ClickFunnels-compatible ID
 * Format: 6Z-xxxxx-0 (5 random alphanumeric chars)
 */
export function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 5; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `6Z-${id}-0`;
}

/**
 * Generate fractional index for ordering elements
 * Sequence: a0, a1, a2... a9, aA, aB... aZ, b0, b1...
 */
export function generateFractionalIndex(index) {
  const BASE_62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  if (index < 36) {
    // a0 through aZ (0-35)
    return 'a' + BASE_62[index];
  } else if (index < 72) {
    // b0 through bZ (36-71)
    return 'b' + BASE_62[index - 36];
  } else if (index < 108) {
    // c0 through cZ (72-107)
    return 'c' + BASE_62[index - 72];
  } else {
    // For very long lists, use multi-character
    const prefix = String.fromCharCode(97 + Math.floor(index / 36)); // a, b, c...
    const suffix = BASE_62[index % 36];
    return prefix + suffix;
  }
}

/**
 * Parse a CSS value with unit (e.g., "48px" -> { value: 48, unit: "px" })
 */
export function parseValueWithUnit(str, defaultUnit = 'px') {
  if (str === null || str === undefined) return null;

  const strVal = String(str).trim();

  // Handle percentage
  if (strVal.endsWith('%')) {
    return {
      value: parseFloat(strVal),
      unit: '%'
    };
  }

  // Handle rem
  if (strVal.endsWith('rem')) {
    return {
      value: parseFloat(strVal),
      unit: 'rem'
    };
  }

  // Handle em
  if (strVal.endsWith('em')) {
    return {
      value: parseFloat(strVal),
      unit: 'em'
    };
  }

  // Handle px (explicit or implicit)
  if (strVal.endsWith('px')) {
    return {
      value: parseFloat(strVal),
      unit: 'px'
    };
  }

  // Pure number
  const num = parseFloat(strVal);
  if (!isNaN(num)) {
    return {
      value: num,
      unit: defaultUnit
    };
  }

  return null;
}

/**
 * Convert color to rgb/rgba format for ClickFunnels
 */
export function normalizeColor(color) {
  if (!color) return null;

  // Already in rgb/rgba format
  if (color.startsWith('rgb')) {
    return color;
  }

  // Hex color
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }

  // Named colors or other formats - return as-is
  return color;
}

/**
 * Convert hex color to rgb format
 */
export function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace('#', '');

  // Handle shorthand (e.g., #fff)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  // Handle 8-character hex with alpha
  if (hex.length === 8) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = parseInt(hex.substring(6, 8), 16) / 255;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  }

  // Standard 6-character hex
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Parse inline style string to object
 */
export function parseInlineStyle(styleStr) {
  if (!styleStr) return {};

  const styles = {};
  const parts = styleStr.split(';');

  for (const part of parts) {
    const colonIndex = part.indexOf(':');
    if (colonIndex > -1) {
      const prop = part.substring(0, colonIndex).trim();
      const val = part.substring(colonIndex + 1).trim();
      if (prop && val) {
        styles[prop] = val;
      }
    }
  }

  return styles;
}

/**
 * Get data-type attribute from element
 */
export function getDataType(element) {
  return element.getAttribute('data-type') || '';
}

/**
 * Parse animation data attributes from element
 * Returns { attrs, params } object with animation settings or empty objects if no animation
 */
export function parseAnimationAttrs(element) {
  const skipAnimation = element.getAttribute('data-skip-animation-settings');
  if (skipAnimation !== 'false') {
    return { attrs: {}, params: {} };
  }

  const attrs = {
    'data-skip-animation-settings': 'false',
  };

  const params = {};

  const animationType = element.getAttribute('data-animation-type');
  if (animationType) attrs['data-animation-type'] = animationType;

  const animationTime = element.getAttribute('data-animation-time');
  if (animationTime) {
    attrs['data-animation-time'] = parseInt(animationTime, 10);
    params['data-animation-time--unit'] = 'ms';
  }

  const animationDelay = element.getAttribute('data-animation-delay');
  if (animationDelay) {
    attrs['data-animation-delay'] = parseInt(animationDelay, 10);
    params['data-animation-delay--unit'] = 'ms';
  }

  const animationTrigger = element.getAttribute('data-animation-trigger');
  if (animationTrigger) attrs['data-animation-trigger'] = animationTrigger;

  const animationTiming = element.getAttribute('data-animation-timing-function');
  if (animationTiming) attrs['data-animation-timing-function'] = animationTiming;

  const animationDirection = element.getAttribute('data-animation-direction');
  if (animationDirection) attrs['data-animation-direction'] = animationDirection;

  const animationOnce = element.getAttribute('data-animation-once');
  if (animationOnce) attrs['data-animation-once'] = animationOnce === 'true';

  const animationLoop = element.getAttribute('data-animation-loop');
  if (animationLoop) attrs['data-animation-loop'] = animationLoop === 'true';

  return { attrs, params };
}

/**
 * Deep merge two objects
 */
export function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Extract text content from element (handles nested spans, etc.)
 */
export function extractTextContent(element) {
  return element.textContent || element.innerText || '';
}

/**
 * Parse HTML content to ContentEditableNode children
 * @param {string} html - The HTML content to parse
 * @param {string|null} defaultLinkColor - Default color for links (from data attribute)
 */
export function parseHtmlToTextNodes(html, defaultLinkColor = null) {
  const temp = document.createElement('div');
  temp.innerHTML = sanitizeHtml(html);

  const children = [];

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text) {
        return { type: 'text', innerText: text };
      }
      return null;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      // Handle inline formatting
      if (['b', 'strong'].includes(tagName)) {
        return {
          type: 'b',
          children: Array.from(node.childNodes).map(processNode).filter(Boolean)
        };
      }

      if (['i', 'em'].includes(tagName)) {
        return {
          type: 'i',
          children: Array.from(node.childNodes).map(processNode).filter(Boolean)
        };
      }

      if (tagName === 'u') {
        return {
          type: 'u',
          children: Array.from(node.childNodes).map(processNode).filter(Boolean)
        };
      }

      if (tagName === 'strike' || tagName === 's') {
        return {
          type: 'strike',
          children: Array.from(node.childNodes).map(processNode).filter(Boolean)
        };
      }

      if (tagName === 'a') {
        // Parse anchor's inline style for color
        const anchorStyle = node.getAttribute('style') || '';
        const styleObj = parseInlineStyle(anchorStyle);

        // Determine link color:
        // - If defaultLinkColor is set (from paint theme data-link-color), use it
        //   because paint themes use CSS !important to override inline styles
        // - Otherwise fall back to anchor's inline style
        let linkColor = defaultLinkColor;
        if (!linkColor && styleObj.color) {
          linkColor = normalizeColor(styleObj.color);
        }

        // Build attrs object
        const attrs = {
          href: node.getAttribute('href') || '#',
          id: `link-${generateId().slice(0, 5)}`,
          target: node.getAttribute('target') || '_self',
          className: 'elTypographyLink',
          rel: node.getAttribute('rel') || 'noopener',
        };

        // Add color as inline style if present
        if (linkColor) {
          attrs.style = { color: linkColor };
        }

        return {
          type: 'a',
          attrs,
          children: Array.from(node.childNodes).map(processNode).filter(Boolean)
        };
      }

      if (tagName === 'br') {
        return { type: 'br' };
      }

      if (tagName === 'span') {
        return {
          type: 'span',
          children: Array.from(node.childNodes).map(processNode).filter(Boolean)
        };
      }

      if (tagName === 'li') {
        return {
          type: 'li',
          children: Array.from(node.childNodes).map(processNode).filter(Boolean)
        };
      }

      // For other elements, just process children
      const results = [];
      for (const child of node.childNodes) {
        const processed = processNode(child);
        if (processed) results.push(processed);
      }
      return results.length === 1 ? results[0] : results;
    }

    return null;
  }

  for (const child of temp.childNodes) {
    const processed = processNode(child);
    if (processed) {
      if (Array.isArray(processed)) {
        children.push(...processed);
      } else {
        children.push(processed);
      }
    }
  }

  return children;
}
