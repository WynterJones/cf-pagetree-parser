/**
 * cf-pagetree-parser - Standalone Browser Bundle
 * Parse FunnelWind HTML to ClickFunnels PageTree JSON
 *
 * AUTO-GENERATED - Do not edit directly!
 * Run: npm run build
 */

(function(global) {
'use strict';

/**
 * Sanitize HTML - simplified version (no DOMPurify dependency)
 * For trusted FunnelWind source content only
 */
function sanitizeHtml(html) {
  if (!html) return '';
  return html;
}


// --- utils.js ---
/**
 * ============================================================================
 * PAGETREE PARSER - Utilities
 * ============================================================================
 *
 * ID generation, fractional indexing, and common helpers.
 *
 * ============================================================================
 */

/**
 * Sanitize HTML - passthrough for trusted FunnelWind source content
 */
function sanitizeHtml(html) {
  if (!html) return '';
  return html;
}

/**
 * Generate a unique ClickFunnels-compatible ID
 * Format: 6Z-xxxxx-0 (5 random alphanumeric chars)
 */
function generateId() {
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
function generateFractionalIndex(index) {
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
function parseValueWithUnit(str, defaultUnit = 'px') {
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
function normalizeColor(color) {
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
function hexToRgb(hex) {
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
function parseInlineStyle(styleStr) {
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
function getDataType(element) {
  return element.getAttribute('data-type') || '';
}

/**
 * Parse animation data attributes from element
 * Returns { attrs, params } object with animation settings or empty objects if no animation
 */
function parseAnimationAttrs(element) {
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
function deepMerge(target, source) {
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
function extractTextContent(element) {
  return element.textContent || element.innerText || '';
}

/**
 * Parse HTML content to ContentEditableNode children
 * @param {string} html - The HTML content to parse
 * @param {string|null} defaultLinkColor - Default color for links (from data attribute)
 */
function parseHtmlToTextNodes(html, defaultLinkColor = null) {
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

// --- styles.js ---
/**
 * ============================================================================
 * PAGETREE PARSER - Style Parsing Helpers
 * ============================================================================
 *
 * Parse inline styles and convert to ClickFunnels pagetree format.
 *
 * ============================================================================
 */

/**
 * Shadow presets mapping (from inline shadow to CF params)
 */
const SHADOW_PRESETS = {
  'none': null,
  '0 1px 2px rgba(0,0,0,0.05)': {
    x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(0, 0, 0, 0.05)'
  },
  '0 1px 3px rgba(0,0,0,0.1)': {
    x: 0, y: 1, blur: 3, spread: 0, color: 'rgba(0, 0, 0, 0.1)'
  },
  '0 4px 6px rgba(0,0,0,0.1)': {
    x: 0, y: 4, blur: 6, spread: 0, color: 'rgba(0, 0, 0, 0.1)'
  },
  '0 10px 15px rgba(0,0,0,0.1)': {
    x: 0, y: 10, blur: 15, spread: 0, color: 'rgba(0, 0, 0, 0.1)'
  },
  '0 20px 25px rgba(0,0,0,0.1)': {
    x: 0, y: 20, blur: 25, spread: 0, color: 'rgba(0, 0, 0, 0.1)'
  },
  '0 25px 50px rgba(0,0,0,0.25)': {
    x: 0, y: 25, blur: 50, spread: 0, color: 'rgba(0, 0, 0, 0.25)'
  },
};

/**
 * Parse box-shadow value to CF params
 */
function parseShadow(shadowValue) {
  if (!shadowValue || shadowValue === 'none') return null;

  // Check if it matches a preset
  const normalized = shadowValue.replace(/\s+/g, ' ').trim();
  if (SHADOW_PRESETS[normalized]) {
    return SHADOW_PRESETS[normalized];
  }

  // Check for inset keyword
  const isInset = shadowValue.toLowerCase().includes('inset');
  const shadowWithoutInset = shadowValue.replace(/inset\s*/gi, '').trim();

  // Parse custom shadow: "0 4px 6px rgba(0,0,0,0.1)"
  const match = shadowWithoutInset.match(
    /(-?\d+(?:\.\d+)?(?:px)?)\s+(-?\d+(?:\.\d+)?(?:px)?)\s+(-?\d+(?:\.\d+)?(?:px)?)\s*(-?\d+(?:\.\d+)?(?:px)?)?\s*(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})?/
  );

  if (match) {
    return {
      x: parseFloat(match[1]) || 0,
      y: parseFloat(match[2]) || 0,
      blur: parseFloat(match[3]) || 0,
      spread: parseFloat(match[4]) || 0,
      color: match[5] || 'rgba(0, 0, 0, 0.1)',
      inset: isInset,
    };
  }

  return null;
}

/**
 * Convert shadow params to CF pagetree format
 */
function shadowToParams(shadow) {
  if (!shadow) return {};

  const params = {
    '--style-box-shadow-distance-x': shadow.x,
    '--style-box-shadow-distance-y': shadow.y,
    '--style-box-shadow-blur': shadow.blur,
    '--style-box-shadow-spread': shadow.spread,
    '--style-box-shadow-color': shadow.color,
    '--style-box-shadow-distance-x--unit': 'px',
    '--style-box-shadow-distance-y--unit': 'px',
    '--style-box-shadow-blur--unit': 'px',
    '--style-box-shadow-spread--unit': 'px',
  };

  if (shadow.inset) {
    params['--style-box-shadow-style-type'] = 'inset';
  }

  return params;
}

/**
 * Parse border properties from inline styles
 */
function parseBorder(styles) {
  const result = {
    width: null,
    style: null,
    color: null,
  };

  // Check for border shorthand
  if (styles.border) {
    const parts = styles.border.split(/\s+/);
    for (const part of parts) {
      if (part.match(/^\d/)) {
        result.width = parseValueWithUnit(part);
      } else if (['solid', 'dashed', 'dotted', 'none'].includes(part)) {
        result.style = part;
      } else {
        result.color = normalizeColor(part);
      }
    }
  }

  // Check individual properties (override shorthand)
  if (styles['border-width']) {
    result.width = parseValueWithUnit(styles['border-width']);
  }
  if (styles['border-style']) {
    result.style = styles['border-style'];
  }
  if (styles['border-color']) {
    result.color = normalizeColor(styles['border-color']);
  }

  return result;
}

/**
 * Convert border to CF params format
 */
function borderToParams(border) {
  if (!border.width && !border.style && !border.color) return {};

  const params = {};

  if (border.width) {
    params['--style-border-width'] = border.width.value;
    params['--style-border-width--unit'] = border.width.unit;
  }
  if (border.style) {
    params['--style-border-style'] = border.style;
  }
  if (border.color) {
    params['--style-border-color'] = border.color;
  }

  return params;
}

/**
 * Parse spacing (padding/margin) from inline styles
 */
function parseSpacing(styles) {
  const result = {};

  if (styles['padding-top']) {
    result.paddingTop = parseValueWithUnit(styles['padding-top']);
  }
  if (styles['padding-bottom']) {
    result.paddingBottom = parseValueWithUnit(styles['padding-bottom']);
  }
  if (styles['padding-left'] || styles['padding-right']) {
    result.paddingHorizontal = parseValueWithUnit(
      styles['padding-left'] || styles['padding-right']
    );
  }
  if (styles['margin-top']) {
    result.marginTop = parseValueWithUnit(styles['margin-top']);
  }

  return result;
}

/**
 * Convert spacing to CF attrs/params format
 */
function spacingToAttrsAndParams(spacing, forceDefaults = false) {
  const attrs = { style: {} };
  const params = {};

  const paddingTop = spacing.paddingTop || (forceDefaults ? parseValueWithUnit('0px') : null);
  const paddingBottom = spacing.paddingBottom || (forceDefaults ? parseValueWithUnit('0px') : null);
  const paddingHorizontal = spacing.paddingHorizontal || (forceDefaults ? parseValueWithUnit('0px') : null);
  const marginTop = spacing.marginTop || (forceDefaults ? parseValueWithUnit('0px') : null);

  if (paddingTop) {
    attrs.style['padding-top'] = paddingTop.value;
    params['padding-top--unit'] = paddingTop.unit;
  }

  if (paddingBottom) {
    attrs.style['padding-bottom'] = paddingBottom.value;
    params['padding-bottom--unit'] = paddingBottom.unit;
  }

  if (paddingHorizontal) {
    params['--style-padding-horizontal'] = paddingHorizontal.value;
    params['--style-padding-horizontal--unit'] = paddingHorizontal.unit;
  }

  if (marginTop) {
    attrs.style['margin-top'] = marginTop.value;
    params['margin-top--unit'] = marginTop.unit;
  }

  return { attrs, params };
}

/**
 * Parse background from inline styles
 */
function parseBackground(styles) {
  const result = {
    color: null,
    imageUrl: null,
    gradient: null,
  };

  if (styles['background-color']) {
    result.color = normalizeColor(styles['background-color']);
  }

  if (styles.background) {
    // Check if it's a gradient
    if (styles.background.includes('gradient')) {
      result.gradient = styles.background;
    } else {
      // Could be color
      result.color = normalizeColor(styles.background);
    }
  }

  if (styles['background-image']) {
    const urlMatch = styles['background-image'].match(/url\(['"]?([^'"]+)['"]?\)/);
    if (urlMatch) {
      result.imageUrl = urlMatch[1];
    }
  }

  return result;
}

/**
 * Convert background to CF params format
 *
 * NOTE: In ClickFunnels, gradients use --style-background-color (not --style-background-image)
 * The gradient value like "linear-gradient(180deg, #6366f1 0%, #a855f7 100%)"
 * goes directly into --style-background-color
 *
 * IMPORTANT: --style-background-image-url is always included (even as empty string)
 * This is required for ClickFunnels to recognize background settings
 */
function backgroundToParams(background) {
  const params = {};

  // Gradients take priority and use --style-background-color
  if (background.gradient) {
    params['--style-background-color'] = background.gradient;
  } else if (background.color) {
    params['--style-background-color'] = background.color;
  }

  // Always include background-image-url (empty string if no image)
  params['--style-background-image-url'] = background.imageUrl || '';

  return params;
}

/**
 * Parse border-radius from inline styles
 */
function parseBorderRadius(styles) {
  if (styles['border-radius']) {
    return parseValueWithUnit(styles['border-radius']);
  }
  return null;
}

/**
 * Convert font-weight string to numeric value
 */
function normalizeFontWeight(weight) {
  const weightMap = {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  };

  if (weightMap[weight]) {
    return weightMap[weight];
  }

  return weight;
}

/**
 * Parse line-height and convert to percentage
 */
function parseLineHeight(value) {
  if (!value) return null;

  // Already percentage
  if (String(value).endsWith('%')) {
    return {
      value: parseFloat(value),
      unit: '%'
    };
  }

  // Decimal multiplier (e.g., 1.5 = 150%)
  const num = parseFloat(value);
  if (!isNaN(num) && num > 0 && num < 5) {
    return {
      value: Math.round(num * 100),
      unit: '%'
    };
  }

  // Named values
  const lineHeightMap = {
    none: 100,
    tight: 110,
    snug: 120,
    normal: 140,
    relaxed: 160,
    loose: 180,
  };

  if (lineHeightMap[value]) {
    return {
      value: lineHeightMap[value],
      unit: '%'
    };
  }

  return {
    value: parseFloat(value) || 140,
    unit: '%'
  };
}

/**
 * Parse text-align value
 */
function parseTextAlign(value) {
  if (!value) return 'center'; // CF default
  const valid = ['left', 'center', 'right'];
  return valid.includes(value) ? value : 'center';
}

/**
 * Parse flex direction
 */
function parseFlexDirection(value) {
  const map = {
    row: 'row',
    column: 'column',
    'row-reverse': 'row-reverse',
    'column-reverse': 'column-reverse',
  };
  return map[value] || 'row';
}

/**
 * Parse justify-content
 */
function parseJustifyContent(value) {
  const valid = [
    'flex-start', 'center', 'flex-end',
    'space-between', 'space-around', 'space-evenly'
  ];
  return valid.includes(value) ? value : 'center';
}

/**
 * Parse align-items
 */
function parseAlignItems(value) {
  const valid = ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'];
  return valid.includes(value) ? value : 'center';
}

/**
 * Normalize font-family to ClickFunnels format
 * ClickFunnels expects: "\"FontName\", sans-serif" (with escaped quotes around font name)
 *
 * Input formats handled:
 *   - "Poppins" -> "\"Poppins\", sans-serif"
 *   - "Noto Sans JP" -> "\"Noto Sans JP\", sans-serif"
 *   - "'Poppins', sans-serif" -> "\"Poppins\", sans-serif"
 *   - "\"Poppins\", sans-serif" -> "\"Poppins\", sans-serif" (already correct)
 *   - "Poppins, sans-serif" -> "\"Poppins\", sans-serif"
 */
function normalizeFontFamily(fontFamily) {
  if (!fontFamily) return null;

  // Trim whitespace
  let font = fontFamily.trim();

  // If already in ClickFunnels format (starts with escaped quote or actual quote char for the font name)
  if (font.startsWith('"') && font.includes(',')) {
    // Already has quotes, return as-is
    return font;
  }

  // Remove surrounding single or double quotes if present
  font = font.replace(/^['"]|['"]$/g, '');

  // Check if it has a fallback already (contains comma)
  if (font.includes(',')) {
    // Extract the primary font name
    const parts = font.split(',');
    const primaryFont = parts[0].trim().replace(/^['"]|['"]$/g, '');
    const fallback = parts.slice(1).map(p => p.trim()).join(', ') || 'sans-serif';

    return `"${primaryFont}", ${fallback}`;
  }

  // Just a font name, add quotes and fallback
  return `"${font}", sans-serif`;
}

/**
 * Parse font-family from inline style value
 * Returns the normalized ClickFunnels format
 */
function parseFontFamily(value) {
  if (!value) return null;
  return normalizeFontFamily(value);
}

// --- layout.js ---
/**
 * ============================================================================
 * PAGETREE PARSER - Layout Parsers
 * ============================================================================
 *
 * ContentNode, SectionContainer, RowContainer, ColContainer, FlexContainer
 *
 * ============================================================================
 */

/**
 * Parse ContentNode (root container)
 */
function parseContentNode(element, parseChildren) {
  const styles = parseInlineStyle(element.getAttribute('style') || '');
  const background = parseBackground(styles);
  const overlay = element.getAttribute('data-overlay');
  const bgStyleClass = element.getAttribute('data-bg-style') || 'bgCoverCenter';

  const node = {
    type: 'ContentNode',
    id: '',
    version: 0,
    params: {
      ...backgroundToParams(background),
      '--style-foreground-color': overlay || '',
    },
    attrs: {
      style: {
        display: 'block',
        'background-position': 'center !important',
      },
      'data-skip-background-settings': background.color || background.imageUrl || background.gradient ? 'false' : 'true',
      className: bgStyleClass,
    },
    children: [],
  };

  // Parse children (sections) - skip the overlay div and content wrapper
  const sectionChildren = element.querySelectorAll(':scope > div > section, :scope > div > [data-type="SectionContainer/V1"], :scope > section, :scope > [data-type="SectionContainer/V1"]');
  sectionChildren.forEach((child, index) => {
    const childNode = parseChildren(child, '', index);
    if (childNode) {
      node.children.push(childNode);
    }
  });

  return node;
}

/**
 * Parse SectionContainer
 */
function parseSectionContainer(element, parentId, index, parseChildren) {
  const id = generateId();
  const elementId = element.getAttribute('id'); // Custom element ID for scroll-to/show-hide
  const styles = parseInlineStyle(element.getAttribute('style') || '');
  const background = parseBackground(styles);
  const border = parseBorder(styles);
  const shadow = parseShadow(styles['box-shadow']);
  const borderRadius = parseBorderRadius(styles);
  const spacing = parseSpacing(styles);
  const rowSpacingWithDefaults = {
    paddingTop: spacing.paddingTop || parseValueWithUnit('0px'),
    paddingBottom: spacing.paddingBottom || parseValueWithUnit('0px'),
    paddingHorizontal: spacing.paddingHorizontal || parseValueWithUnit('0px'),
    marginTop: spacing.marginTop || parseValueWithUnit('0px'),
  };
  const overlay = element.getAttribute('data-overlay');

  // Video background attributes
  const videoBgUrl = element.getAttribute('data-video-bg-url');
  const videoBgType = element.getAttribute('data-video-bg-type');
  const videoBgHideMobile = element.getAttribute('data-video-bg-hide-mobile');
  const videoBgOverlay = element.getAttribute('data-video-bg-overlay');

  // Determine container width class
  const maxWidth = styles['max-width'] || '1170px';
  let containerClass = 'wideContainer';
  if (maxWidth.includes('550') || maxWidth.includes('small')) containerClass = 'smallContainer';
  else if (maxWidth.includes('720') || maxWidth.includes('mid')) containerClass = 'midContainer';
  else if (maxWidth.includes('960') || maxWidth.includes('midWide')) containerClass = 'midWideContainer';
  else if (maxWidth.includes('100%') || maxWidth.includes('full')) containerClass = 'fullContainer';

  // Add background style class when there's a background image
  const bgStyleClass = element.getAttribute('data-bg-style');
  if (background.imageUrl) {
    containerClass += ' ' + (bgStyleClass || 'bgCoverCenter');
  }

  const node = {
    type: 'SectionContainer/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      className: containerClass,
      'data-skip-background-settings': background.color || background.imageUrl || background.gradient ? 'false' : 'true',
      'data-skip-shadow-settings': shadow ? 'false' : 'true',
      'data-skip-corners-settings': borderRadius ? 'false' : 'true',
      style: {},
    },
    params: {},
    children: [],
  };

  // Add custom element ID for scroll-to/show-hide targeting
  if (elementId) {
    node.attrs.id = elementId;
  }

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(rowSpacingWithDefaults);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply background (always include params for ClickFunnels compatibility)
  Object.assign(node.params, backgroundToParams(background));

  // Apply overlay
  if (overlay) {
    node.params['--style-foreground-color'] = overlay;
  }

  // Apply video background params
  if (videoBgUrl && videoBgType === 'youtube') {
    // Required data attributes for video background
    node.attrs['data-skip-background-settings'] = 'false';
    node.attrs['data-skip-background-video-settings'] = 'false';

    node.params['video-bg-url'] = videoBgUrl;
    node.params['video-bg-type'] = 'youtube';
    node.params['video-bg-thumbnail-background'] = false;
    node.params['video-bg-use-background-as-overlay'] = true;
    node.params['video-bg-hide-on-mobile'] = videoBgHideMobile === 'true';

    // Always use offset style with 50% vertical offset
    node.params['video-bg-style-type'] = 'offset';
    node.params['video-bg-offset-y'] = 50;

    // Always set background-image-url to empty string (required by ClickFunnels)
    node.params['--style-background-image-url'] = '';

    // Set overlay color - must be rgba for video background
    if (videoBgOverlay) {
      node.params['--style-background-color'] = videoBgOverlay;
    }
  }

  // Apply border
  if (border.width || border.style || border.color) {
    Object.assign(node.params, borderToParams(border));
  }

  // Apply shadow
  if (shadow) {
    Object.assign(node.params, shadowToParams(shadow));
  }

  // Apply border-radius and separate corners
  const separateCorners = element.getAttribute('data-separate-corners') === 'true';
  if (separateCorners) {
    node.params['separate-corners'] = true;
    // Parse individual corner radii
    if (styles['border-top-left-radius']) {
      const tl = parseValueWithUnit(styles['border-top-left-radius']);
      if (tl) {
        node.attrs.style['border-top-left-radius'] = tl.value;
        node.params['border-top-left-radius--unit'] = tl.unit;
      }
    }
    if (styles['border-top-right-radius']) {
      const tr = parseValueWithUnit(styles['border-top-right-radius']);
      if (tr) {
        node.attrs.style['border-top-right-radius'] = tr.value;
        node.params['border-top-right-radius--unit'] = tr.unit;
      }
    }
    if (styles['border-bottom-left-radius']) {
      const bl = parseValueWithUnit(styles['border-bottom-left-radius']);
      if (bl) {
        node.attrs.style['border-bottom-left-radius'] = bl.value;
        node.params['border-bottom-left-radius--unit'] = bl.unit;
      }
    }
    if (styles['border-bottom-right-radius']) {
      const br = parseValueWithUnit(styles['border-bottom-right-radius']);
      if (br) {
        node.attrs.style['border-bottom-right-radius'] = br.value;
        node.params['border-bottom-right-radius--unit'] = br.unit;
      }
    }
    // Also set the base border-radius if present
    if (borderRadius) {
      node.attrs.style['border-radius'] = borderRadius.value;
      node.params['border-radius--unit'] = borderRadius.unit;
    }
  } else if (borderRadius) {
    node.attrs.style['border-radius'] = borderRadius.value;
    node.params['border-radius--unit'] = borderRadius.unit;
  }

  // Check for visibility
  const showOnly = element.getAttribute('data-show');
  if (showOnly) {
    node.attrs['data-show-only'] = showOnly;
  }

  // Parse children (rows) - skip the overlay div and content wrapper
  const rowChildren = element.querySelectorAll(':scope > div > [data-type="RowContainer/V1"], :scope > [data-type="RowContainer/V1"]');
  rowChildren.forEach((child, childIndex) => {
    const childNode = parseChildren(child, id, childIndex);
    if (childNode) {
      node.children.push(childNode);
    }
  });

  return node;
}

/**
 * Parse RowContainer
 */
function parseRowContainer(element, parentId, index, parseChildren) {
  const id = generateId();
  const elementId = element.getAttribute('id'); // Custom element ID for scroll-to/show-hide
  const styles = parseInlineStyle(element.getAttribute('style') || '');
  const background = parseBackground(styles);
  const border = parseBorder(styles);
  const shadow = parseShadow(styles['box-shadow']);
  const borderRadius = parseBorderRadius(styles);
  const spacing = parseSpacing(styles);
  const spacingWithDefaults = {
    paddingTop: spacing.paddingTop || parseValueWithUnit('0px'),
    paddingBottom: spacing.paddingBottom || parseValueWithUnit('0px'),
    paddingHorizontal: spacing.paddingHorizontal || parseValueWithUnit('0px'),
    marginTop: spacing.marginTop || parseValueWithUnit('0px'),
  };
  const overlay = element.getAttribute('data-overlay');

  const width = parseValueWithUnit(styles.width || '1170px');

  // Determine className - add bg style class when there's a background image
  const bgStyleClass = element.getAttribute('data-bg-style');
  let className = '';
  if (background.imageUrl) {
    className = bgStyleClass || 'bgCoverCenter';
  }

  // Parse z-index if present
  const zIndex = styles['z-index'] ? parseInt(styles['z-index'], 10) : null;

  // Parse animation attributes
  const { attrs: animationAttrs, params: animationParams } = parseAnimationAttrs(element);

  const node = {
    type: 'RowContainer/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      'data-skip-background-settings': background.color || background.imageUrl || background.gradient ? 'false' : 'true',
      'data-skip-shadow-settings': shadow ? 'false' : 'true',
      'data-skip-corners-settings': borderRadius ? 'false' : 'true',
      ...animationAttrs,
      style: {
        width: width ? width.value : 1170,
      },
    },
    params: {
      'width--unit': width ? width.unit : 'px',
      ...animationParams,
    },
    selectors: {
      '.col-inner': {
        params: { 'height--unit': '%' },
        attrs: { style: { height: 'auto' } },
      },
    },
    children: [],
  };

  // Apply z-index if present
  if (zIndex !== null && !isNaN(zIndex)) {
    node.attrs.style['z-index'] = zIndex;
  }

  // Add custom element ID for scroll-to/show-hide targeting
  if (elementId) {
    node.attrs.id = elementId;
  }

  // Add className if set
  if (className) {
    node.attrs.className = className;
  }

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacingWithDefaults);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply background (always include params for ClickFunnels compatibility)
  Object.assign(node.params, backgroundToParams(background));

  // Apply overlay
  if (overlay) {
    node.params['--style-foreground-color'] = overlay;
  }

  // Apply border
  if (border.width || border.style || border.color) {
    Object.assign(node.params, borderToParams(border));
  }

  // Apply shadow
  if (shadow) {
    Object.assign(node.params, shadowToParams(shadow));
  }

  // Apply border-radius and separate corners
  const rowSeparateCorners = element.getAttribute('data-separate-corners') === 'true';
  if (rowSeparateCorners) {
    node.params['separate-corners'] = true;
    // Parse individual corner radii
    if (styles['border-top-left-radius']) {
      const tl = parseValueWithUnit(styles['border-top-left-radius']);
      if (tl) {
        node.attrs.style['border-top-left-radius'] = tl.value;
        node.params['border-top-left-radius--unit'] = tl.unit;
      }
    }
    if (styles['border-top-right-radius']) {
      const tr = parseValueWithUnit(styles['border-top-right-radius']);
      if (tr) {
        node.attrs.style['border-top-right-radius'] = tr.value;
        node.params['border-top-right-radius--unit'] = tr.unit;
      }
    }
    if (styles['border-bottom-left-radius']) {
      const bl = parseValueWithUnit(styles['border-bottom-left-radius']);
      if (bl) {
        node.attrs.style['border-bottom-left-radius'] = bl.value;
        node.params['border-bottom-left-radius--unit'] = bl.unit;
      }
    }
    if (styles['border-bottom-right-radius']) {
      const br = parseValueWithUnit(styles['border-bottom-right-radius']);
      if (br) {
        node.attrs.style['border-bottom-right-radius'] = br.value;
        node.params['border-bottom-right-radius--unit'] = br.unit;
      }
    }
    // Also set the base border-radius if present
    if (borderRadius) {
      node.attrs.style['border-radius'] = borderRadius.value;
      node.params['border-radius--unit'] = borderRadius.unit;
    }
  } else if (borderRadius) {
    node.attrs.style['border-radius'] = borderRadius.value;
    node.params['border-radius--unit'] = borderRadius.unit;
  }

  // Parse children (columns) - skip the overlay div and content wrapper
  let colChildren = element.querySelectorAll(':scope > [data-type="ColContainer/V1"]');
  // If columns are nested in a z-index wrapper (overlay case), find them there
  if (colChildren.length === 0) {
    colChildren = element.querySelectorAll(':scope > div > [data-type="ColContainer/V1"]');
  }
  colChildren.forEach((child, childIndex) => {
    const childNode = parseChildren(child, id, childIndex);
    if (childNode) {
      node.children.push(childNode);
    }
  });

  return node;
}

/**
 * Parse ColContainer
 */
function parseColContainer(element, parentId, index, parseChildren) {
  const id = generateId();
  const elementId = element.getAttribute('id'); // Custom element ID for scroll-to/show-hide
  const styles = parseInlineStyle(element.getAttribute('style') || '');

  // Calculate column span from width percentage
  const widthStr = styles.width || '100%';
  const widthPercent = parseFloat(widthStr);
  const mdNum = Math.round((widthPercent / 100) * 12) || 12;

  // Get column direction from data attribute
  const colDirection = element.getAttribute('data-col-direction') || 'left';

  const node = {
    type: 'ColContainer/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {},
    params: {
      mdNum,
      colDirection,
    },
    selectors: {
      '& > .col-inner': {
        params: {},
        attrs: {
          style: {},
        },
      },
      '.col-inner': {},
    },
    children: [],
  };

  // Add custom element ID for scroll-to/show-hide targeting
  if (elementId) {
    node.attrs.id = elementId;
  }

  // Find the col-inner element
  const colInner = element.querySelector(':scope > .col-inner');

  if (colInner) {
    const innerStyles = parseInlineStyle(colInner.getAttribute('style') || '');
    const background = parseBackground(innerStyles);
    const border = parseBorder(innerStyles);
    const shadow = parseShadow(innerStyles['box-shadow']);
    const spacing = parseSpacing(innerStyles);
    const overlay = colInner.getAttribute('data-overlay');
    const separateCorners = colInner.getAttribute('data-separate-corners') === 'true';
    const borderRadius = parseBorderRadius(innerStyles);

    const colInnerSelector = node.selectors['& > .col-inner'];

    // Check if there's any actual styling on the col-inner
    const hasMargin = innerStyles['margin-left'] || innerStyles['margin-right'];
    const hasBackground = background.color || background.imageUrl || background.gradient;
    const hasBorder = border.width || border.style || border.color;

    // Spacing - add values if explicitly set
    if (spacing.paddingTop) {
      colInnerSelector.attrs.style['padding-top'] = spacing.paddingTop.value;
      colInnerSelector.params['padding-top--unit'] = spacing.paddingTop.unit;
    }

    if (spacing.paddingBottom) {
      colInnerSelector.attrs.style['padding-bottom'] = spacing.paddingBottom.value;
      colInnerSelector.params['padding-bottom--unit'] = spacing.paddingBottom.unit;
    }

    if (spacing.paddingHorizontal) {
      colInnerSelector.params['--style-padding-horizontal'] = spacing.paddingHorizontal.value;
      colInnerSelector.params['--style-padding-horizontal--unit'] = spacing.paddingHorizontal.unit;
    }

    // Margin horizontal
    if (hasMargin) {
      const mx = parseValueWithUnit(innerStyles['margin-left'] || innerStyles['margin-right']);
      if (mx) {
        colInnerSelector.params['--style-margin-horizontal'] = mx.value;
        colInnerSelector.params['--style-margin-horizontal--unit'] = mx.unit;
      }
    }

    // Background (gradient takes priority, then color)
    if (background.gradient) {
      colInnerSelector.params['--style-background-color'] = background.gradient;
    } else if (background.color) {
      colInnerSelector.params['--style-background-color'] = background.color;
    }

    // Always include background-image-url param (empty string if no image)
    // This is required for ClickFunnels to recognize background settings
    colInnerSelector.params['--style-background-image-url'] = background.imageUrl || '';

    if (background.imageUrl) {
      // Add bg style class when there's a background image
      const colInnerBgStyle = colInner.getAttribute('data-bg-style');
      colInnerSelector.attrs.className = colInnerBgStyle || 'bgCoverCenter';
    }

    // Overlay (foreground color)
    if (overlay) {
      colInnerSelector.params['--style-foreground-color'] = overlay;
    }

    // Border
    if (hasBorder) {
      Object.assign(colInnerSelector.params, borderToParams(border));
    }

    // Shadow
    if (shadow) {
      Object.assign(colInnerSelector.params, shadowToParams(shadow));
      colInnerSelector.attrs['data-skip-shadow-settings'] = 'false';
    } else {
      colInnerSelector.attrs['data-skip-shadow-settings'] = 'true';
    }

    // Border radius
    if (borderRadius) {
      colInnerSelector.attrs.style['border-radius'] = borderRadius.value;
      colInnerSelector.params['border-radius--unit'] = borderRadius.unit;
      colInnerSelector.attrs['data-skip-corners-settings'] = 'false';
    } else {
      colInnerSelector.attrs['data-skip-corners-settings'] = 'true';
    }

    // Individual corner radii
    if (separateCorners) {
      colInnerSelector.params['separate-corners'] = true;
      if (innerStyles['border-top-left-radius']) {
        const tl = parseValueWithUnit(innerStyles['border-top-left-radius']);
        if (tl) {
          colInnerSelector.attrs.style['border-top-left-radius'] = tl.value;
          colInnerSelector.params['border-top-left-radius--unit'] = tl.unit;
        }
      }
      if (innerStyles['border-top-right-radius']) {
        const tr = parseValueWithUnit(innerStyles['border-top-right-radius']);
        if (tr) {
          colInnerSelector.attrs.style['border-top-right-radius'] = tr.value;
          colInnerSelector.params['border-top-right-radius--unit'] = tr.unit;
        }
      }
      if (innerStyles['border-bottom-left-radius']) {
        const bl = parseValueWithUnit(innerStyles['border-bottom-left-radius']);
        if (bl) {
          colInnerSelector.attrs.style['border-bottom-left-radius'] = bl.value;
          colInnerSelector.params['border-bottom-left-radius--unit'] = bl.unit;
        }
      }
      if (innerStyles['border-bottom-right-radius']) {
        const br = parseValueWithUnit(innerStyles['border-bottom-right-radius']);
        if (br) {
          colInnerSelector.attrs.style['border-bottom-right-radius'] = br.value;
          colInnerSelector.params['border-bottom-right-radius--unit'] = br.unit;
        }
      }
      colInnerSelector.attrs['data-skip-corners-settings'] = 'false';
    }

    // Background settings flag
    colInnerSelector.attrs['data-skip-background-settings'] =
      (hasBackground || overlay) ? 'false' : 'true';

    // Parse children from col-inner, skipping overlay and content wrapper
    let childIdx = 0;
    const parseColInnerChildren = (container) => {
      Array.from(container.children).forEach((child) => {
        // Skip overlay divs
        if (child.classList && child.classList.contains('cf-overlay')) {
          return;
        }
        // If content wrapper (z-index div), dive into it
        const childStyle = child.getAttribute('style') || '';
        if (!child.getAttribute('data-type') && childStyle.includes('z-index') && child.children.length > 0) {
          parseColInnerChildren(child);
        } else {
          const childNode = parseChildren(child, id, childIdx);
          if (childNode) {
            node.children.push(childNode);
            childIdx++;
          }
        }
      });
    };
    parseColInnerChildren(colInner);
  } else {
    // No col-inner found, parse direct children
    let childIdx = 0;
    Array.from(element.children).forEach((child) => {
      if (child.classList && child.classList.contains('cf-overlay')) {
        return;
      }
      const childNode = parseChildren(child, id, childIdx);
      if (childNode) {
        node.children.push(childNode);
        childIdx++;
      }
    });
  }

  return node;
}

/**
 * Parse FlexContainer
 */
function parseFlexContainer(element, parentId, index, parseChildren) {
  const id = generateId();
  const elementId = element.getAttribute('id'); // Custom element ID for scroll-to/show-hide
  const styles = parseInlineStyle(element.getAttribute('style') || '');
  const background = parseBackground(styles);
  const border = parseBorder(styles);
  const shadow = parseShadow(styles['box-shadow']);
  const borderRadius = parseBorderRadius(styles);
  const spacing = parseSpacing(styles);
  const flexSpacingWithDefaults = {
    paddingTop: spacing.paddingTop || parseValueWithUnit('0px'),
    paddingBottom: spacing.paddingBottom || parseValueWithUnit('0px'),
    paddingHorizontal: spacing.paddingHorizontal || parseValueWithUnit('0px'),
    marginTop: spacing.marginTop || parseValueWithUnit('0px'),
  };
  const overlay = element.getAttribute('data-overlay');

  const width = parseValueWithUnit(styles.width || '100%', '%');
  const height = styles.height ? parseValueWithUnit(styles.height, 'px') : null;
  const gap = parseValueWithUnit(styles.gap || '1.5em', 'em');

  // Determine className - add bg style class when there's a background image
  const bgStyleClass = element.getAttribute('data-bg-style');
  let className = 'elFlexWrap elFlexNoWrapMobile';
  if (background.imageUrl) {
    className += ' ' + (bgStyleClass || 'bgCoverCenter');
  }

  const node = {
    type: 'FlexContainer/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      className,
      'data-skip-background-settings': background.color || background.imageUrl || background.gradient ? 'false' : 'true',
      'data-skip-shadow-settings': shadow ? 'false' : 'true',
      'data-skip-corners-settings': borderRadius ? 'false' : 'true',
      style: {
        'flex-direction': parseFlexDirection(styles['flex-direction']),
        'justify-content': parseJustifyContent(styles['justify-content']),
        'align-items': parseAlignItems(styles['align-items']),
        gap: gap ? gap.value : 0,
      },
    },
    params: {
      'gap--unit': gap ? gap.unit : 'em',
    },
    children: [],
  };

  // Add custom element ID for scroll-to/show-hide targeting
  if (elementId) {
    node.attrs.id = elementId;
  }

  // Add width
  node.attrs.style.width = width.value;
  node.params['width--unit'] = width.unit;

  // Add height if specified
  if (height) {
    node.attrs.style.height = height.value;
    node.params['height--unit'] = height.unit;
  }

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(flexSpacingWithDefaults);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply background (includes gradient, color, and imageUrl)
  if (background.color || background.imageUrl || background.gradient) {
    Object.assign(node.params, backgroundToParams(background));
  }

  // Apply overlay
  if (overlay) {
    node.params['--style-foreground-color'] = overlay;
  }

  // Apply border
  if (border.width || border.style || border.color) {
    Object.assign(node.params, borderToParams(border));
  }

  // Apply shadow
  if (shadow) {
    Object.assign(node.params, shadowToParams(shadow));
  }

  // Apply border-radius
  if (borderRadius) {
    node.attrs.style['border-radius'] = borderRadius.value;
    node.params['border-radius--unit'] = borderRadius.unit;
  }

  // Handle flex-wrap - modify className without losing other classes
  // Default className already includes 'elFlexWrap elFlexNoWrapMobile'
  // If wrap is explicitly NOT set, remove elFlexWrap and keep elFlexNoWrapMobile
  if (styles['flex-wrap'] !== 'wrap') {
    node.attrs.className = node.attrs.className.replace('elFlexWrap ', '');
  }

  // Parse children - skip the overlay div (has class cf-overlay)
  const children = element.children;
  let actualIndex = 0;
  Array.from(children).forEach((child) => {
    // Skip overlay divs
    if (child.classList && child.classList.contains('cf-overlay')) {
      return;
    }
    const childNode = parseChildren(child, id, actualIndex);
    if (childNode) {
      // Set width: auto on flex children to prevent them from expanding to 100%
      // This is critical for proper flex layout in ClickFunnels
      if (!childNode.attrs) childNode.attrs = {};
      if (!childNode.attrs.style) childNode.attrs.style = {};
      if (!childNode.params) childNode.params = {};

      // Only set width: auto if no explicit width is already set
      // Skip FlexContainer children (they have their own width handling)
      if (childNode.attrs.style.width === undefined && childNode.type !== 'FlexContainer/V1') {
        childNode.attrs.style.width = 'auto';
      }

      node.children.push(childNode);
      actualIndex++;
    }
  });

  return node;
}

/**
 * Parse ColInner - wrapper element inside ColContainer
 * This is typically a transparent wrapper, so we just parse its children
 * and return them without creating a node for ColInner itself
 */
function parseColInner(_element, _parentId, _index, _parseChildren) {
  // ColInner is a wrapper element - we don't create a node for it,
  // we just return null and let the parent (ColContainer) handle it
  // The ColContainer parser already handles col-inner styling via selectors
  return null;
}

// --- text.js ---
/**
 * ============================================================================
 * PAGETREE PARSER - Text Element Parsers
 * ============================================================================
 *
 * Headline/V1, SubHeadline/V1, Paragraph/V1
 *
 * ============================================================================
 */

/**
 * Parse text element (Headline, SubHeadline, or Paragraph)
 *
 * Reads from data attributes first (most reliable), falls back to inline styles
 */
function parseTextElement(
  element,
  parentId,
  index,
  type,
  selector
) {
  const id = generateId();
  const contentEditableId = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute("style") || "");
  const spacing = parseSpacing(wrapperStyles);

  // Find the text element (h1, h2, p, span)
  const textEl =
    element.querySelector("h1, h2, h3, h4, h5, h6, p, span") || element;
  const textStyles = parseInlineStyle(textEl.getAttribute("style") || "");

  // Read from data attributes first (most reliable), fallback to inline styles
  // data-size-resolved is set by applyStyleguideDataAttributes() when size presets are used
  // This converts "xl", "l", "m", "s" presets to actual pixel values from the typescale
  const sizeResolved = element.getAttribute("data-size-resolved");
  const sizeAttr = element.getAttribute("data-size");
  const parsedSizeResolved = sizeResolved ? parseValueWithUnit(sizeResolved) : null;
  const parsedSizeAttr = sizeAttr ? parseValueWithUnit(sizeAttr) : null;
  const fontSize = parsedSizeResolved || parsedSizeAttr || parseValueWithUnit(textStyles["font-size"] || "48px");

  const weightAttr = element.getAttribute("data-weight");
  const fontWeight = weightAttr
    ? normalizeFontWeight(weightAttr)
    : normalizeFontWeight(textStyles["font-weight"] || "normal");

  const fontAttr = element.getAttribute("data-font");
  // Normalize font-family to ClickFunnels format (e.g., "\"Poppins\", sans-serif")
  const fontFamily = fontAttr
    ? parseFontFamily(fontAttr)
    : parseFontFamily(textStyles["font-family"]);

  // Get color: element data-color > inline style > page color > default
  const colorAttr = element.getAttribute("data-color");
  let color;
  if (colorAttr) {
    color = normalizeColor(colorAttr);
  } else if (textStyles.color) {
    color = normalizeColor(textStyles.color);
  } else {
    // Fall back to page-level color from ContentNode
    const contentNode = element.closest('[data-type="ContentNode"]');
    const pageColor = contentNode?.getAttribute("data-color") || contentNode?.getAttribute("data-text-color");
    color = pageColor ? normalizeColor(pageColor) : "#000000";
  }

  const alignAttr = element.getAttribute("data-align");
  const textAlign = alignAttr || parseTextAlign(textStyles["text-align"]);

  const leadingAttr = element.getAttribute("data-leading");
  const lineHeight = leadingAttr
    ? parseLineHeight(leadingAttr)
    : parseLineHeight(textStyles["line-height"]);

  const trackingAttr = element.getAttribute("data-tracking");
  const letterSpacing = trackingAttr
    ? parseValueWithUnit(trackingAttr, "rem")
    : parseValueWithUnit(textStyles["letter-spacing"], "rem");

  const transformAttr = element.getAttribute("data-transform");
  const textTransform = transformAttr || textStyles["text-transform"];

  // Get icon attributes
  const iconAttr = element.getAttribute("data-icon");
  const iconAlignAttr = element.getAttribute("data-icon-align");

  // Get link color - prefer data attribute, fallback to parsing anchor elements
  const linkColorAttr = element.getAttribute("data-link-color");
  let linkColor = null;
  if (linkColorAttr) {
    linkColor = normalizeColor(linkColorAttr);
  } else {
    // Try to find an anchor in the content and get its color
    const anchor = textEl.querySelector("a");
    if (anchor) {
      const anchorStyles = parseInlineStyle(anchor.getAttribute("style") || "");
      if (anchorStyles.color) {
        linkColor = normalizeColor(anchorStyles.color);
      }
    }
  }

  // Build the style object for the selector
  const selectorStyle = {
    "font-size": fontSize ? fontSize.value : 48,
    "font-weight": fontWeight,
    color: color,
    "text-align": textAlign,
    "line-height": lineHeight ? lineHeight.value : 140,
    "letter-spacing": letterSpacing ? letterSpacing.value : 0,
  };

  // Add font-family if present
  if (fontFamily) {
    selectorStyle["font-family"] = fontFamily;
  }

  // Parse animation attributes
  const { attrs: animationAttrs, params: animationParams } = parseAnimationAttrs(element);

  const node = {
    type,
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      style: {},
      ...animationAttrs,
    },
    params: {
      "padding-top--unit": "px",
      "padding-bottom--unit": "px",
      "--style-padding-horizontal--unit": "px",
      "--style-padding-horizontal": 0,
      ...animationParams,
    },
    selectors: {
      [selector]: {
        attrs: {
          style: selectorStyle,
        },
        params: {
          "font-size--unit": fontSize ? fontSize.unit : "px",
          "line-height--unit": "%",
          "letter-spacing--unit": "rem",
        },
      },
    },
    children: [
      {
        type: "ContentEditableNode",
        attrs: {
          "data-align-selector": selector,
        },
        id: contentEditableId,
        version: 0,
        parentId: id,
        fractionalIndex: "a0",
        children: [],
      },
    ],
  };

  // Apply spacing to wrapper
  const spacingWithDefaults = {
    paddingTop: spacing.paddingTop || parseValueWithUnit("0px"),
    paddingBottom: spacing.paddingBottom || parseValueWithUnit("0px"),
    paddingHorizontal: spacing.paddingHorizontal || parseValueWithUnit("0px"),
    marginTop: spacing.marginTop || parseValueWithUnit("0px"),
  };

  const { attrs: spacingAttrs, params: spacingParams } =
    spacingToAttrsAndParams(spacingWithDefaults, true);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply text-transform if present
  if (textTransform) {
    node.selectors[selector].attrs.style["text-transform"] = textTransform;
  }

  // Apply link color to selector (for CSS cascade)
  if (linkColor) {
    node.selectors[`${selector} .elTypographyLink`] = {
      attrs: {
        style: {
          color: linkColor,
        },
      },
    };
  }

  // Add icon attributes to params if present
  if (iconAttr) {
    node.params["icon"] = iconAttr;
  }
  if (iconAlignAttr) {
    node.params["icon-align"] = iconAlignAttr;
  }

  // Parse text content - pass linkColor for inline anchor styles
  const textContent = textEl.innerHTML;
  node.children[0].children = parseHtmlToTextNodes(textContent, linkColor);

  // If no children were parsed, add simple text
  if (node.children[0].children.length === 0) {
    node.children[0].children.push({
      type: "text",
      innerText: textEl.textContent || "",
    });
  }

  return node;
}

/**
 * Parse Headline/V1
 */
function parseHeadline(element, parentId, index) {
  return parseTextElement(
    element,
    parentId,
    index,
    "Headline/V1",
    ".elHeadline"
  );
}

/**
 * Parse SubHeadline/V1
 */
function parseSubHeadline(element, parentId, index) {
  return parseTextElement(
    element,
    parentId,
    index,
    "SubHeadline/V1",
    ".elSubheadline"
  );
}

/**
 * Parse Paragraph/V1
 */
function parseParagraph(element, parentId, index) {
  return parseTextElement(
    element,
    parentId,
    index,
    "Paragraph/V1",
    ".elParagraph"
  );
}

// --- button.js ---
/**
 * ============================================================================
 * PAGETREE PARSER - Button Parser
 * ============================================================================
 *
 * Button/V1
 *
 * ============================================================================
 */

/**
 * Parse Button/V1
 *
 * Reads from data attributes first (most reliable), falls back to inline styles
 * @param {HTMLElement} element - The button element
 * @param {string} parentId - Parent element ID
 * @param {number} index - Child index
 */
function parseButton(element, parentId, index) {
  const id = generateId();
  const mainTextId = generateId();
  const subTextId = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  // Get href, target from data attributes
  const href = element.getAttribute('data-href') || '#';
  const target = element.getAttribute('data-target') || '_self';

  // Show/hide specific attributes
  const showIds = element.getAttribute('data-show-ids');
  const hideIds = element.getAttribute('data-hide-ids');
  const elButtonType = element.getAttribute('data-elbuttontype');

  // Find the anchor element for fallback parsing
  const anchor = element.querySelector('a');
  const anchorStyles = anchor ? parseInlineStyle(anchor.getAttribute('style') || '') : {};

  // Find text span for fallback parsing
  const textSpan = anchor ? anchor.querySelector('span') : null;
  const textStyles = textSpan ? parseInlineStyle(textSpan.getAttribute('style') || '') : {};

  // Read from data attributes first, then inline styles
  const bgAttr = element.getAttribute('data-bg');
  const bgColor = bgAttr
    ? normalizeColor(bgAttr)
    : (normalizeColor(anchorStyles['background-color']) || '#3b82f6');

  const textColorAttr = element.getAttribute('data-color');
  const textColor = textColorAttr
    ? normalizeColor(textColorAttr)
    : (normalizeColor(textStyles.color) || '#ffffff');

  // Font styling - prefer data attributes
  const fontSizeAttr = element.getAttribute('data-size');
  const fontSize = fontSizeAttr ? parseValueWithUnit(fontSizeAttr) : parseValueWithUnit(textStyles['font-size'] || '20px');
  const fontWeight = element.getAttribute('data-weight') ||
    normalizeFontWeight(textStyles['font-weight'] || '700');

  // Padding - prefer data attributes
  const pxAttr = element.getAttribute('data-px');
  const pyAttr = element.getAttribute('data-py');
  const paddingHorizontal = pxAttr ? parseValueWithUnit(pxAttr) : parseValueWithUnit(anchorStyles['padding-right'] || '32px');
  const paddingVertical = pyAttr ? parseValueWithUnit(pyAttr) : parseValueWithUnit(anchorStyles['padding-top'] || '16px');

  // Border and corners - data attributes first, then inline styles
  const roundedAttr = element.getAttribute('data-rounded');
  const borderRadius = roundedAttr
    ? parseValueWithUnit(roundedAttr)
    : parseBorderRadius(anchorStyles);

  const borderColorAttr = element.getAttribute('data-border-color');
  const borderColor = borderColorAttr
    ? normalizeColor(borderColorAttr)
    : normalizeColor(anchorStyles['border-color']);

  const borderWidthAttr = element.getAttribute('data-border-width');
  const borderWidth = borderWidthAttr
    ? parseValueWithUnit(borderWidthAttr)
    : parseValueWithUnit(anchorStyles['border-width'] || '0');

  // Shadow
  const shadowAttr = element.getAttribute('data-shadow');
  const shadow = shadowAttr ? parseShadow(shadowAttr) : parseShadow(anchorStyles['box-shadow']);

  // Alignment
  const textAlign = element.getAttribute('data-align') || parseTextAlign(wrapperStyles['text-align']);

  // Get main text (extract from span, excluding icons)
  let mainText = 'Button';
  if (textSpan) {
    // Clone the span and remove icons to get clean text
    const textContent = extractTextContent(textSpan).trim();
    mainText = textContent || 'Button';
  }

  // Get subtext - prefer data attribute
  const subTextAttr = element.getAttribute('data-subtext');
  const subTextEl = anchor ? anchor.querySelector('span:last-child:not(:first-child)') : null;
  const subText = subTextAttr || (subTextEl ? extractTextContent(subTextEl).trim() : '');
  const subTextColorAttr = element.getAttribute('data-subtext-color');
  const subTextColor = subTextColorAttr
    ? normalizeColor(subTextColorAttr)
    : 'rgba(255, 255, 255, 0.8)';

  // Check for icons - prefer data attributes
  const iconAttr = element.getAttribute('data-icon');
  const iconPositionAttr = element.getAttribute('data-icon-position') || 'left';
  const iconColorAttr = element.getAttribute('data-icon-color');

  // Fallback to DOM parsing for icons
  const iconBefore = anchor ? anchor.querySelector('span > i:first-child') : null;
  const iconAfter = anchor ? anchor.querySelector('span > i:last-child') : null;

  // Full width
  const fullWidth = element.getAttribute('data-full-width') === 'true';

  // Build button selector - always include padding params
  const buttonSelector = {
    attrs: {
      style: {},
    },
    params: {
      '--style-padding-horizontal': paddingHorizontal ? paddingHorizontal.value : 32,
      '--style-padding-horizontal--unit': paddingHorizontal ? paddingHorizontal.unit : 'px',
      '--style-padding-vertical': paddingVertical ? paddingVertical.value : 16,
      '--style-padding-vertical--unit': paddingVertical ? paddingVertical.unit : 'px',
      '--style-background-color': bgColor,
      '--style-border-color': borderColor || 'transparent',
      '--style-border-width': borderWidth ? borderWidth.value : 0,
      '--style-border-width--unit': borderWidth ? borderWidth.unit : 'px',
    },
  };

  // Parse animation attributes
  const { attrs: animationAttrs, params: animationParams } = parseAnimationAttrs(element);

  const node = {
    type: 'Button/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      style: {
        'text-align': textAlign,
      },
      ...animationAttrs,
    },
    params: {
      buttonState: 'default',
      href,
      target,
      ...animationParams,
    },
    selectors: {
      '.elButton': buttonSelector,
      '.elButton .elButtonText': {
        attrs: {
          style: {
            color: textColor,
            'font-weight': fontWeight,
            'font-size': fontSize ? fontSize.value : 20,
          },
        },
        params: {
          'font-size--unit': fontSize ? fontSize.unit : 'px',
          'line-height--unit': '%',
        },
      },
      '.elButton .elButtonSub': {
        attrs: { style: {} },
        params: { 'font-size--unit': 'px' },
      },
      '.fa_prepended': {
        attrs: {
          style: {
            'margin-left': 0,
            'margin-right': 10,
          },
        },
        params: {
          'margin-left--unit': 'px',
          'margin-right--unit': 'px',
        },
      },
      '.fa_apended': {
        attrs: {
          style: {
            'margin-left': 10,
            'margin-right': 0,
          },
        },
        params: {
          'margin-left--unit': 'px',
          'margin-right--unit': 'px',
        },
      },
    },
    children: [
      {
        type: 'text',
        innerText: mainText,
        slotName: 'button-main',
        id: mainTextId,
        version: 0,
        parentId: id,
        fractionalIndex: 'a0',
      },
    ],
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply show/hide action params
  if (showIds) {
    node.params.showIds = showIds;
  }
  if (hideIds) {
    node.params.hideIds = hideIds;
  }
  if (elButtonType) {
    node.attrs['data-elbuttontype'] = elButtonType;
  }

  // Apply border-radius
  if (borderRadius) {
    node.selectors['.elButton'].attrs.style['border-radius'] = borderRadius.value;
    node.selectors['.elButton'].params['border-radius--unit'] = borderRadius.unit;
  }

  // Apply shadow (button doesn't support shadow in CF, but keep for reference)
  if (shadow) {
    // CF buttons don't have native shadow support
  }

  // Add subtext if present
  if (subText) {
    node.children.push({
      type: 'text',
      innerText: subText,
      slotName: 'button-sub',
      id: subTextId,
      version: 0,
      parentId: id,
      fractionalIndex: 'Zz',
    });
  }

  // Add icons - prefer data attributes
  if (iconAttr) {
    // Use data attributes for icon (more reliable)
    const normalizedIconColor = iconColorAttr ? normalizeColor(iconColorAttr) : null;
    if (iconPositionAttr === 'left') {
      node.params.iconBefore = iconAttr;
      if (normalizedIconColor) {
        node.selectors['.fa_prepended'].attrs.style.color = normalizedIconColor;
      }
    } else {
      node.params.iconAfter = iconAttr;
      if (normalizedIconColor) {
        node.selectors['.fa_apended'].attrs.style.color = normalizedIconColor;
      }
    }
  } else if (iconBefore) {
    // Fallback to DOM parsing
    const iconClass = iconBefore.getAttribute('class') || '';
    node.params.iconBefore = iconClass;
    const iconColor = normalizeColor(iconBefore.style.color);
    if (iconColor) {
      node.selectors['.fa_prepended'].attrs.style.color = iconColor;
    }
  }

  if (!iconAttr && iconAfter) {
    const iconClass = iconAfter.getAttribute('class') || '';
    node.params.iconAfter = iconClass;
    const iconColor = normalizeColor(iconAfter.style.color);
    if (iconColor) {
      node.selectors['.fa_apended'].attrs.style.color = iconColor;
    }
  }

  // Handle full width
  if (fullWidth) {
    // Ensure style object exists for width
    if (!node.selectors['.elButton'].attrs.style) {
      node.selectors['.elButton'].attrs.style = {};
    }
    node.selectors['.elButton'].attrs.style.width = '100%';
  }

  // Handle subtext color
  if (subText && subTextColor) {
    node.selectors['.elButton .elButtonSub'].attrs.style.color = subTextColor;
  }

  return node;
}

// --- media.js ---
/**
 * ============================================================================
 * PAGETREE PARSER - Media Element Parsers
 * ============================================================================
 *
 * Image/V2, Icon/V1, Video/V1, Divider/V1
 *
 * ============================================================================
 */

/**
 * Parse Image/V2
 */
function parseImage(element, parentId, index) {
  const id = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);
  const textAlign = parseTextAlign(wrapperStyles['text-align']);

  // Find the img element
  const img = element.querySelector('img');
  const imgStyles = img ? parseInlineStyle(img.getAttribute('style') || '') : {};

  const src = img ? img.getAttribute('src') : '';
  const alt = img ? img.getAttribute('alt') : '';

  const width = parseValueWithUnit(imgStyles.width || '100%', '%');
  const height = parseValueWithUnit(imgStyles.height, 'px');
  const borderRadius = parseBorderRadius(imgStyles);
  const border = parseBorder(imgStyles);
  const shadow = parseShadow(imgStyles['box-shadow']);
  const objectFit = imgStyles['object-fit'] || 'cover';

  // Parse animation attributes
  const { attrs: animationAttrs, params: animationParams } = parseAnimationAttrs(element);

  const node = {
    type: 'Image/V2',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      alt,
      style: {
        'text-align': textAlign,
      },
      ...animationAttrs,
    },
    params: {
      imageUrl: [{ type: 'text', innerText: src }],
      'padding-top--unit': 'px',
      'padding-bottom--unit': 'px',
      '--style-padding-horizontal--unit': 'px',
      '--style-padding-horizontal': 0,
      ...animationParams,
    },
    selectors: {
      '.elImage': {
        attrs: {
          style: {
            width: width ? width.value : 100,
            'object-fit': objectFit,
          },
          'data-image-quality': 100,
          'data-skip-corners-settings': borderRadius ? 'false' : 'true',
          'data-skip-shadow-settings': shadow ? 'false' : 'true',
        },
        params: {
          'width--unit': width ? width.unit : '%',
        },
      },
    },
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply height if specified
  if (height) {
    node.selectors['.elImage'].attrs.style.height = height.value;
    node.selectors['.elImage'].params['height--unit'] = height.unit;
  }

  // Apply border-radius
  if (borderRadius) {
    node.selectors['.elImage'].attrs.style['border-radius'] = borderRadius.value;
    node.selectors['.elImage'].params['border-radius--unit'] = borderRadius.unit;
  }

  // Apply border
  if (border.width || border.style || border.color) {
    Object.assign(node.selectors['.elImage'].params, borderToParams(border));
  }

  // Apply shadow
  if (shadow) {
    Object.assign(node.selectors['.elImage'].params, shadowToParams(shadow));
  }

  return node;
}

/**
 * Parse Icon/V1
 */
function parseIcon(element, parentId, index) {
  const id = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);
  const textAlign = parseTextAlign(wrapperStyles['text-align']);

  // Find the icon element
  const icon = element.querySelector('i');
  // Prefer data-icon attribute, fallback to class from <i> element
  const iconAttr = element.getAttribute('data-icon');
  const iconClass = iconAttr || (icon ? icon.getAttribute('class') : 'fas fa-star');
  const iconStyles = icon ? parseInlineStyle(icon.getAttribute('style') || '') : {};

  // Read from data attributes first (most reliable), fallback to inline styles
  const sizeAttr = element.getAttribute('data-size');
  const fontSize = sizeAttr
    ? parseValueWithUnit(sizeAttr)
    : parseValueWithUnit(iconStyles['font-size'] || '48px');

  const colorAttr = element.getAttribute('data-color');
  const color = colorAttr
    ? normalizeColor(colorAttr)
    : normalizeColor(iconStyles.color || '#3b82f6');

  const opacityAttr = element.getAttribute('data-opacity');
  const opacity = opacityAttr || iconStyles.opacity;

  // Parse animation attributes
  const { attrs: animationAttrs, params: animationParams } = parseAnimationAttrs(element);

  const node = {
    type: 'Icon/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      style: {},
      ...animationAttrs,
    },
    params: {
      ...animationParams,
    },
    selectors: {
      '.fa_icon': {
        attrs: {
          className: iconClass,
          style: {
            'font-size': fontSize ? fontSize.value : 48,
            color,
          },
        },
        params: {
          'font-size--unit': fontSize ? fontSize.unit : 'px',
        },
      },
      '.iconElement': {
        attrs: {
          style: {
            'text-align': textAlign,
          },
        },
      },
    },
  };

  // Apply opacity if present
  if (opacity) {
    node.selectors['.fa_icon'].attrs.style.opacity = parseFloat(opacity);
  }

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  return node;
}

/**
 * Parse Video/V1
 */
function parseVideo(element, parentId, index) {
  const id = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  // Get video URL and type from data attributes
  const videoUrl = element.getAttribute('data-video-url') || '';
  const videoType = element.getAttribute('data-video-type') || 'youtube';

  // Find container div for styling
  const container = element.querySelector('div');
  const containerStyles = container ? parseInlineStyle(container.getAttribute('style') || '') : {};

  const borderRadius = parseBorderRadius(containerStyles);
  const shadow = parseShadow(containerStyles['box-shadow']);
  const border = parseBorder(containerStyles);
  const background = parseBackground(containerStyles);

  const node = {
    type: 'Video/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      'data-video-type': videoType,
      'data-skip-background-settings': background.color ? 'false' : 'true',
      'data-skip-shadow-settings': shadow ? 'false' : 'true',
      'data-skip-corners-settings': borderRadius ? 'false' : 'true',
      style: {},
    },
    params: {
      'video_url': videoUrl,
      'padding-top--unit': 'px',
      'padding-bottom--unit': 'px',
      '--style-padding-horizontal--unit': 'px',
      '--style-padding-horizontal': 0,
    },
    selectors: {},
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply border-radius
  if (borderRadius) {
    node.attrs.style['border-radius'] = borderRadius.value;
    node.params['border-radius--unit'] = borderRadius.unit;
  }

  // Apply shadow
  if (shadow) {
    Object.assign(node.params, shadowToParams(shadow));
  }

  // Apply border
  if (border.width || border.style || border.color) {
    Object.assign(node.params, borderToParams(border));
  }

  // Apply background color
  if (background.color) {
    node.params['--style-background-color'] = background.color;
  }

  return node;
}

/**
 * Parse Divider/V1
 */
function parseDivider(element, parentId, index) {
  const id = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  // Find the divider line element
  const line = element.querySelector('div');
  const lineStyles = line ? parseInlineStyle(line.getAttribute('style') || '') : {};

  // Parse border-top for thickness, style, and color
  // Format: "1px solid #e2e8f0" or "3px dashed rgb(181, 69, 69)"
  let borderWidth = 1;
  let borderStyle = 'solid';
  let borderColor = '#e2e8f0';

  if (lineStyles['border-top']) {
    // Match: thickness style color (where color can be hex, rgb, rgba, or named)
    const match = lineStyles['border-top'].match(/^(\d+(?:\.\d+)?px)\s+(solid|dashed|dotted)\s+(.+)$/i);
    if (match) {
      borderWidth = parseFloat(match[1]);
      borderStyle = match[2].toLowerCase();
      borderColor = normalizeColor(match[3].trim());
    }
  }

  const width = parseValueWithUnit(lineStyles.width || '100%', '%');

  // Parse alignment from margin
  // "0 auto" = center, "0 auto 0 0" = left, "0 0 0 auto" = right
  let margin = '0 auto';
  if (lineStyles.margin) {
    margin = lineStyles.margin;
  }

  // Parse box shadow
  const shadow = parseShadow(lineStyles['box-shadow']);

  // Check data attribute for shadow settings
  const skipShadowSettings = element.getAttribute('data-skip-shadow-settings') !== 'false';

  const node = {
    type: 'Divider/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      style: {},
    },
    params: {
      'padding-top--unit': 'px',
      'padding-bottom--unit': 'px',
      '--style-padding-horizontal--unit': 'px',
      '--style-padding-horizontal': 0,
      'margin-top--unit': 'px',
    },
    selectors: {
      '.elDivider': {
        attrs: {
          style: {
            width: width ? width.value : 100,
            margin: margin,
          },
          'data-skip-shadow-settings': skipShadowSettings ? 'true' : 'false',
        },
        params: {
          'width--unit': width ? width.unit : '%',
          '--style-border-top-width': borderWidth,
          '--style-border-top-width--unit': 'px',
          '--style-border-style': borderStyle,
          '--style-border-color': borderColor,
        },
      },
    },
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply shadow if present
  if (shadow) {
    Object.assign(node.selectors['.elDivider'].params, shadowToParams(shadow));
  }

  return node;
}

// --- form.js ---
/**
 * ============================================================================
 * PAGETREE PARSER - Form Element Parsers
 * ============================================================================
 *
 * Input/V1, TextArea/V1, SelectBox/V1, Checkbox/V1
 *
 * ============================================================================
 */

/**
 * Parse Input/V1
 */
function parseInput(element, parentId, index) {
  const id = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  // Get input type from data attribute
  const inputType = element.getAttribute('data-input-type') || 'email';
  const inputName = element.getAttribute('data-input-name') || inputType;
  const isRequired = element.getAttribute('data-required') === 'true';
  const widthAttr = element.getAttribute('data-width');
  const alignAttr = element.getAttribute('data-align') || 'center';
  const placeholder = element.getAttribute('data-placeholder') || '';
  const fontSizeAttr = element.getAttribute('data-font-size');
  const colorAttr = element.getAttribute('data-color');

  // Find the container div
  const container = element.querySelector('div');
  const containerStyles = container ? parseInlineStyle(container.getAttribute('style') || '') : {};

  const background = parseBackground(containerStyles);
  const border = parseBorder(containerStyles);
  const borderRadius = parseBorderRadius(containerStyles);
  const shadow = parseShadow(containerStyles['box-shadow']);

  const paddingHorizontal = parseValueWithUnit(containerStyles['padding-left'] || '16px');
  const paddingVertical = parseValueWithUnit(containerStyles['padding-top'] || '12px');

  // Width percentage
  const width = widthAttr ? parseFloat(widthAttr) : 100;

  // Map align to CF format
  const alignMap = { 'left': 'left', 'center': 'center', 'right': 'right' };
  const marginAlign = alignMap[alignAttr] || 'center';

  // Parse margin-top with default of 0
  const marginTop = parseValueWithUnit(wrapperStyles['margin-top'] || '0px');

  const node = {
    type: 'Input/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      'data-skip-shadow-settings': shadow ? 'false' : 'true',
      type: inputType === 'phone_number' ? 'tel' : (inputType === 'email' ? 'email' : 'text'),
      style: {
        width,
        'margin-top': marginTop.value,
      },
    },
    params: {
      label: placeholder,
      labelType: 'on-border',
      type: inputType,
      '--style-background-color': background.color || '#ffffff',
      'width--unit': '%',
      '--style-margin-align': marginAlign,
      'margin-top--unit': marginTop.unit,
    },
    selectors: {
      '.elInput': {
        attrs: {
          name: inputName,
          type: inputType,
          className: isRequired ? 'required1' : 'required0',
          style: {},
        },
        params: {
          'font-size--unit': 'px',
        },
      },
      '.inputHolder, .borderHolder': {
        attrs: {
          style: {
            'padding-top': paddingVertical ? paddingVertical.value : 12,
            'padding-bottom': paddingVertical ? paddingVertical.value : 12,
          },
        },
        params: {
          '--style-padding-horizontal': paddingHorizontal ? paddingHorizontal.value : 16,
          '--style-padding-horizontal--unit': paddingHorizontal ? paddingHorizontal.unit : 'px',
          'padding-top--unit': 'px',
          'padding-bottom--unit': 'px',
        },
      },
      '&.elFormItemWrapper, .inputHolder, .borderHolder': {
        attrs: {
          style: {},
          'data-skip-corners-settings': borderRadius ? 'false' : 'true',
        },
      },
      '.borderHolder': {
        params: {
          '--style-background-color': background.color || '#ffffff',
        },
      },
    },
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply border
  if (border.width || border.style || border.color) {
    Object.assign(node.selectors['.inputHolder, .borderHolder'].params, borderToParams(border));
  } else {
    // Default border
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-width'] = 1;
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-style'] = 'solid';
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-color'] = 'rgba(0, 0, 0, 0.2)';
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-width--unit'] = 'px';
  }

  // Apply border-radius
  if (borderRadius) {
    node.selectors['&.elFormItemWrapper, .inputHolder, .borderHolder'].attrs.style['border-radius'] = borderRadius.value;
    node.selectors['&.elFormItemWrapper, .inputHolder, .borderHolder'].params = {
      'border-radius--unit': borderRadius.unit,
    };
  }

  // Handle custom type
  if (inputType === 'custom_type') {
    node.selectors['.elInput'].attrs['data-custom-type'] = inputName;
  }

  // Apply shadow
  if (shadow) {
    Object.assign(node.params, shadowToParams(shadow));
  }

  // Parse font-size - prefer data attribute, fallback to inline style
  const inputEl = container ? container.querySelector('input') : null;
  const inputStyles = inputEl ? parseInlineStyle(inputEl.getAttribute('style') || '') : {};
  const fontSize = fontSizeAttr
    ? parseValueWithUnit(fontSizeAttr)
    : parseValueWithUnit(inputStyles['font-size'] || '16px');
  if (fontSize) {
    node.selectors['.elInput'].attrs.style['font-size'] = fontSize.value;
    node.selectors['.elInput'].params['font-size--unit'] = fontSize.unit;
  }

  // Parse color - prefer data attribute, fallback to inline style
  const textColor = colorAttr
    ? normalizeColor(colorAttr)
    : (inputStyles.color ? normalizeColor(inputStyles.color) : null);
  if (textColor) {
    node.selectors['.elInput'].attrs.style.color = textColor;
  }

  return node;
}

/**
 * Parse TextArea/V1
 */
function parseTextArea(element, parentId, index) {
  const id = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  const textareaName = element.getAttribute('data-textarea-name') || 'message';
  const isRequired = element.getAttribute('data-required') === 'true';
  const widthAttr = element.getAttribute('data-width');
  const heightAttr = element.getAttribute('data-height');
  const alignAttr = element.getAttribute('data-align') || 'center';
  const placeholder = element.getAttribute('data-placeholder') || '';
  const fontSizeAttr = element.getAttribute('data-font-size');
  const colorAttr = element.getAttribute('data-color');

  // Find the container div
  const container = element.querySelector('div');
  const containerStyles = container ? parseInlineStyle(container.getAttribute('style') || '') : {};

  const background = parseBackground(containerStyles);
  const border = parseBorder(containerStyles);
  const borderRadius = parseBorderRadius(containerStyles);
  const shadow = parseShadow(containerStyles['box-shadow']);

  const paddingHorizontal = parseValueWithUnit(containerStyles['padding-left'] || '16px');
  const paddingVertical = parseValueWithUnit(containerStyles['padding-top'] || '12px');

  const width = widthAttr ? parseFloat(widthAttr) : 100;
  const height = heightAttr ? parseFloat(heightAttr) : 120;

  // Map align to CF format
  const alignMap = { 'left': 'left', 'center': 'center', 'right': 'right' };
  const marginAlign = alignMap[alignAttr] || 'center';

  // Parse margin-top with default of 0
  const marginTop = parseValueWithUnit(wrapperStyles['margin-top'] || '0px');

  const node = {
    type: 'TextArea/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      'data-skip-shadow-settings': shadow ? 'false' : 'true',
      style: {
        width,
        'margin-top': marginTop.value,
      },
    },
    params: {
      label: placeholder,
      labelType: 'on-border',
      '--style-background-color': background.color || '#ffffff',
      'width--unit': '%',
      '--style-margin-align': marginAlign,
      'margin-top--unit': marginTop.unit,
      height,
      'height--unit': 'px',
    },
    selectors: {
      '.elTextarea': {
        attrs: {
          name: textareaName,
          type: 'custom_type',
          'data-custom-type': textareaName,
          className: isRequired ? 'required1' : 'required0',
          style: {
            height,
          },
        },
        params: {
          'height--unit': 'px',
          'font-size--unit': 'px',
        },
      },
      '.inputHolder, .borderHolder': {
        attrs: {
          style: {
            'padding-top': paddingVertical ? paddingVertical.value : 12,
            'padding-bottom': paddingVertical ? paddingVertical.value : 12,
          },
        },
        params: {
          '--style-padding-horizontal': paddingHorizontal ? paddingHorizontal.value : 16,
          '--style-padding-horizontal--unit': paddingHorizontal ? paddingHorizontal.unit : 'px',
          'padding-top--unit': 'px',
          'padding-bottom--unit': 'px',
        },
      },
      '&.elFormItemWrapper, .inputHolder, .borderHolder': {
        attrs: {
          style: {},
          'data-skip-corners-settings': borderRadius ? 'false' : 'true',
        },
      },
      '.borderHolder': {
        params: {
          '--style-background-color': background.color || '#ffffff',
        },
      },
    },
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply border
  if (border.width || border.style || border.color) {
    Object.assign(node.selectors['.inputHolder, .borderHolder'].params, borderToParams(border));
  } else {
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-width'] = 1;
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-style'] = 'solid';
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-color'] = 'rgba(0, 0, 0, 0.2)';
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-width--unit'] = 'px';
  }

  // Apply border-radius
  if (borderRadius) {
    node.selectors['&.elFormItemWrapper, .inputHolder, .borderHolder'].attrs.style['border-radius'] = borderRadius.value;
    node.selectors['&.elFormItemWrapper, .inputHolder, .borderHolder'].params = {
      'border-radius--unit': borderRadius.unit,
    };
  }

  // Apply shadow
  if (shadow) {
    Object.assign(node.params, shadowToParams(shadow));
  }

  // Parse font-size - prefer data attribute, fallback to inline style
  const textareaEl = container ? container.querySelector('textarea') : null;
  const textareaStyles = textareaEl ? parseInlineStyle(textareaEl.getAttribute('style') || '') : {};
  const fontSize = fontSizeAttr
    ? parseValueWithUnit(fontSizeAttr)
    : parseValueWithUnit(textareaStyles['font-size'] || '16px');
  if (fontSize) {
    node.selectors['.elTextarea'].attrs.style['font-size'] = fontSize.value;
    node.selectors['.elTextarea'].params['font-size--unit'] = fontSize.unit;
  }

  // Parse color - prefer data attribute, fallback to inline style
  const textColor = colorAttr
    ? normalizeColor(colorAttr)
    : (textareaStyles.color ? normalizeColor(textareaStyles.color) : null);
  if (textColor) {
    node.selectors['.elTextarea'].attrs.style.color = textColor;
  }

  return node;
}

/**
 * Parse SelectBox/V1
 */
function parseSelectBox(element, parentId, index) {
  const id = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  const selectName = element.getAttribute('data-select-name') || 'option';
  const selectType = element.getAttribute('data-select-type') || 'custom_type';
  const isRequired = element.getAttribute('data-required') === 'true';
  const widthAttr = element.getAttribute('data-width');
  const alignAttr = element.getAttribute('data-align') || 'center';
  const placeholder = element.getAttribute('data-placeholder') || '';
  const fontSizeAttr = element.getAttribute('data-font-size');
  const colorAttr = element.getAttribute('data-color');

  // Find the container div
  const container = element.querySelector('div');
  const containerStyles = container ? parseInlineStyle(container.getAttribute('style') || '') : {};

  const background = parseBackground(containerStyles);
  const border = parseBorder(containerStyles);
  const borderRadius = parseBorderRadius(containerStyles);
  const shadow = parseShadow(containerStyles['box-shadow']);

  const paddingHorizontal = parseValueWithUnit(containerStyles['padding-left'] || '16px');
  const paddingVertical = parseValueWithUnit(containerStyles['padding-top'] || '12px');

  // Find select element and options
  const select = element.querySelector('select');
  const options = select ? Array.from(select.querySelectorAll('option')) : [];

  const width = widthAttr ? parseFloat(widthAttr) : 100;

  // Map align to CF format
  const alignMap = { 'left': 'left', 'center': 'center', 'right': 'right' };
  const marginAlign = alignMap[alignAttr] || 'center';

  // Parse margin-top with default of 0
  const marginTop = parseValueWithUnit(wrapperStyles['margin-top'] || '0px');

  // Build children array from options
  const children = options.map((opt, optIndex) => {
    const optionId = generateId();
    const textId = generateId();
    return {
      type: 'option',
      attrs: { value: opt.value || '' },
      id: optionId,
      version: 0,
      parentId: id,
      fractionalIndex: generateFractionalIndex(optIndex),
      children: [
        {
          type: 'text',
          innerText: opt.textContent || '',
          id: textId,
          version: 0,
          parentId: optionId,
          fractionalIndex: 'a0',
        },
      ],
    };
  });

  const node = {
    type: 'SelectBox/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      style: {
        width,
        'margin-top': marginTop.value,
      },
    },
    params: {
      label: placeholder,
      labelType: 'on-border',
      'width--unit': '%',
      'margin-top--unit': marginTop.unit,
      '--style-margin-align': marginAlign,
      '--style-padding-horizontal': 0,
      '--style-padding-horizontal--unit': 'px',
      'padding-top--unit': 'px',
      'padding-bottom--unit': 'px',
    },
    selectors: {
      '.elSelectWrapper': {
        attrs: { 'data-type': selectType },
      },
      '.elSelect': {
        attrs: {
          'data-skip-corners-settings': borderRadius ? 'false' : 'true',
          'data-skip-shadow-settings': shadow ? 'false' : 'true',
          name: selectType,
          'data-custom-type': selectName,
          className: isRequired ? 'required1' : 'required0',
          style: {
            'padding-top': paddingVertical ? paddingVertical.value : 12,
            'padding-bottom': paddingVertical ? paddingVertical.value : 12,
          },
        },
        params: {
          '--style-background-color': background.color || '#ffffff',
          '--style-padding-horizontal': paddingHorizontal ? paddingHorizontal.value : 16,
          '--style-padding-horizontal--unit': paddingHorizontal ? paddingHorizontal.unit : 'px',
          'padding-top--unit': 'px',
          'padding-bottom--unit': 'px',
        },
      },
      '.elSelect, .elSelectLabel': {
        attrs: {
          style: {},
        },
        params: {
          'font-size--unit': 'px',
        },
      },
    },
    children,
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply border to .elSelect
  if (border.width || border.style || border.color) {
    Object.assign(node.selectors['.elSelect'].params, borderToParams(border));
  } else {
    node.selectors['.elSelect'].params['--style-border-width'] = 1;
    node.selectors['.elSelect'].params['--style-border-style'] = 'solid';
    node.selectors['.elSelect'].params['--style-border-color'] = 'rgba(0, 0, 0, 0.2)';
  }

  // Apply border-radius to .elSelect
  if (borderRadius) {
    node.selectors['.elSelect'].attrs.style['border-radius'] = borderRadius.value;
    node.selectors['.elSelect'].params['border-radius--unit'] = borderRadius.unit;
  }

  // Apply shadow to .elSelect
  if (shadow) {
    Object.assign(node.selectors['.elSelect'].params, shadowToParams(shadow));
  }

  // Parse font-size - prefer data attribute, fallback to inline style
  const selectEl = container ? container.querySelector('select') : null;
  const selectStyles = selectEl ? parseInlineStyle(selectEl.getAttribute('style') || '') : {};
  const fontSize = fontSizeAttr
    ? parseValueWithUnit(fontSizeAttr)
    : parseValueWithUnit(selectStyles['font-size'] || '16px');
  if (fontSize) {
    node.selectors['.elSelect, .elSelectLabel'].attrs.style['font-size'] = fontSize.value;
    node.selectors['.elSelect, .elSelectLabel'].params['font-size--unit'] = fontSize.unit;
  }

  // Parse color - prefer data attribute, fallback to inline style
  const textColor = colorAttr
    ? normalizeColor(colorAttr)
    : (selectStyles.color ? normalizeColor(selectStyles.color) : null);
  if (textColor) {
    node.selectors['.elSelect, .elSelectLabel'].attrs.style.color = textColor;
  }

  return node;
}

/**
 * Parse Checkbox/V1
 */
function parseCheckbox(element, parentId, index) {
  const id = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  const checkboxName = element.getAttribute('data-name') || 'agree';
  const isChecked = element.getAttribute('data-checked') === 'true';
  const isRequired = element.getAttribute('data-required') === 'true';

  // Find checkbox label and text
  const label = element.querySelector('label');
  const textSpan = label ? label.querySelector('span:last-child') : null;
  const labelText = textSpan ? textSpan.innerHTML : '';

  // Find the checkbox box styling
  const checkboxBox = label ? label.querySelector('span:first-of-type') : null;
  const boxStyles = checkboxBox ? parseInlineStyle(checkboxBox.getAttribute('style') || '') : {};

  const boxSize = parseValueWithUnit(boxStyles.width || '20px');
  const boxBgColor = normalizeColor(boxStyles['background-color'] || '#ffffff');
  const boxBorderMatch = (boxStyles.border || '').match(/(\d+)px\s+\w+\s+(.+)/);
  const boxBorderWidth = boxBorderMatch ? parseInt(boxBorderMatch[1], 10) : 2;
  const boxBorderColor = boxBorderMatch ? normalizeColor(boxBorderMatch[2]) : 'rgb(229, 231, 235)';
  const boxBorderRadius = parseBorderRadius(boxStyles);

  // Label text styling - inherit page color if not set
  const textStyles = textSpan ? parseInlineStyle(textSpan.getAttribute('style') || '') : {};
  let labelColor;
  if (textStyles.color) {
    labelColor = normalizeColor(textStyles.color);
  } else {
    const contentNode = element.closest('[data-type="ContentNode"]');
    const pageColor = contentNode?.getAttribute("data-color") || contentNode?.getAttribute("data-text-color");
    labelColor = pageColor ? normalizeColor(pageColor) : '#334155';
  }
  const labelFontSize = parseValueWithUnit(textStyles['font-size'] || '16px');

  // Gap between checkbox and label
  const labelStyles = label ? parseInlineStyle(label.getAttribute('style') || '') : {};
  const gap = parseValueWithUnit(labelStyles.gap || '12px', 'em');

  const node = {
    type: 'Checkbox/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      style: {},
    },
    params: {
      isFormItem: true,
      name: checkboxName,
      checked: isChecked,
      useCheckboxIcon: true,
      required: isRequired,
    },
    selectors: {
      '.elCheckboxLabel': {
        attrs: {
          style: {
            gap: gap ? gap.value : 1,
          },
        },
        params: {
          'gap--unit': gap ? gap.unit : 'em',
        },
      },
      '.elCheckboxLabel .elCheckboxInput ~ .elCheckbox': {
        attrs: {
          style: {
            'font-size': boxSize ? boxSize.value : 20,
            'border-radius': boxBorderRadius ? boxBorderRadius.value : 4,
            'background-color': boxBgColor,
          },
        },
        params: {
          'font-size--unit': boxSize ? boxSize.unit : 'px',
          '--style-border-style': 'solid',
          '--style-border-width': boxBorderWidth,
          '--style-border-width--unit': 'px',
          '--style-border-color': boxBorderColor,
          'border-radius--unit': boxBorderRadius ? boxBorderRadius.unit : 'px',
        },
      },
      '.elCheckboxLabel .elCheckboxInput:checked ~ .elCheckbox': {
        attrs: {
          style: {
            'background-color': 'rgb(59, 130, 246)',
          },
        },
        params: {
          '--style-border-color': 'rgb(59, 130, 246)',
        },
      },
      '.elCheckboxLabel .elCheckboxInput:checked ~ .elCheckboxText': {
        attrs: {
          style: {
            color: labelColor,
          },
        },
      },
      '.elCheckboxLabel .elCheckboxInput ~ .elCheckboxText': {
        attrs: {
          style: {
            color: labelColor,
          },
        },
      },
      '.elCheckboxText': {
        attrs: {
          style: {
            'font-weight': textStyles['font-weight'] || '400',
            'font-size': labelFontSize ? labelFontSize.value : 16,
          },
        },
        params: {
          'font-size--unit': labelFontSize ? labelFontSize.unit : 'px',
        },
      },
    },
    children: [
      {
        type: 'ContentEditableNode',
        slotName: 'label',
        id: '',
        version: 0,
        parentId: '',
        fractionalIndex: 'a0',
        children: parseHtmlToTextNodes(labelText),
      },
    ],
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  return node;
}

// --- list.js ---
/**
 * ============================================================================
 * PAGETREE PARSER - List Element Parser
 * ============================================================================
 *
 * BulletList/V1
 *
 * ============================================================================
 */

/**
 * Parse BulletList/V1
 */
function parseBulletList(element, parentId, index) {
  const id = generateId();
  const contentEditableId = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  // Find the ul element
  const ul = element.querySelector('ul');
  const ulStyles = ul ? parseInlineStyle(ul.getAttribute('style') || '') : {};

  // Get item gap from ul's gap style
  const itemGap = parseValueWithUnit(ulStyles.gap || '8px');

  // Read data attributes first (most reliable)
  const sizeResolvedAttr = element.getAttribute('data-size-resolved'); // Pre-resolved pixel value
  const textSizeAttr = element.getAttribute('data-text-size'); // Legacy: direct pixel value
  const iconSizeAttr = element.getAttribute('data-icon-size');
  const textColorAttr = element.getAttribute('data-text-color');
  const iconColorAttr = element.getAttribute('data-icon-color');
  const iconAttr = element.getAttribute('data-icon');
  const gapAttr = element.getAttribute('data-gap');

  // Find list items
  const items = ul ? ul.querySelectorAll('li') : [];

  // Get page-level color from ContentNode for fallback
  const contentNode = element.closest('[data-type="ContentNode"]');
  const pageColor = contentNode?.getAttribute("data-color") || contentNode?.getAttribute("data-text-color");
  const defaultTextColor = pageColor ? normalizeColor(pageColor) : '#334155';

  // Initialize with defaults, will be overridden by data attrs or inline styles
  let iconClass = 'fas fa-check fa_icon';
  let iconColor = '#10b981';
  let iconMarginRight = 12;
  let iconSize = null;
  let textColor = defaultTextColor;
  let textSize = null;
  let justifyContent = 'flex-start';

  // Parse from inline styles as fallback
  if (items.length > 0) {
    const firstItem = items[0];
    const icon = firstItem.querySelector('i');
    const textSpan = firstItem.querySelector('span');

    // Get alignment from li styles
    const liStyles = parseInlineStyle(firstItem.getAttribute('style') || '');
    if (liStyles['justify-content']) {
      justifyContent = liStyles['justify-content'];
    }

    if (icon) {
      const rawClass = icon.getAttribute('class') || 'fas fa-check';
      // Ensure fa_icon is in the class (only if not from data attr)
      if (!iconAttr) {
        iconClass = rawClass.includes('fa_icon') ? rawClass : `${rawClass} fa_icon`;
      }
      const iconStyles = parseInlineStyle(icon.getAttribute('style') || '');
      // Only use inline style if no data attr
      if (!iconColorAttr) {
        iconColor = normalizeColor(iconStyles.color) || iconColor;
      }
      const marginRight = parseValueWithUnit(iconStyles['margin-right']);
      if (marginRight) iconMarginRight = marginRight.value;
      // Get icon font size from inline style if not from data attr
      if (!iconSizeAttr) {
        const iconFontSize = parseValueWithUnit(iconStyles['font-size']);
        if (iconFontSize) iconSize = iconFontSize;
      }
    }

    if (textSpan) {
      const textStyles = parseInlineStyle(textSpan.getAttribute('style') || '');
      // Only use inline style if no data attr
      if (!textColorAttr) {
        textColor = normalizeColor(textStyles.color) || textColor;
      }
      // Get text font size from inline style if not from data attr
      if (!textSizeAttr) {
        const textFontSize = parseValueWithUnit(textStyles['font-size']);
        if (textFontSize) textSize = textFontSize;
      }
    }
  }

  // Apply data attributes (override inline styles)
  if (iconAttr) {
    iconClass = iconAttr.includes('fa_icon') ? iconAttr : `${iconAttr} fa_icon`;
  }
  if (iconColorAttr) {
    iconColor = normalizeColor(iconColorAttr);
  }
  if (textColorAttr) {
    textColor = normalizeColor(textColorAttr);
  }
  // Priority: data-size-resolved > data-size (as px) > data-text-size (legacy)
  if (sizeResolvedAttr) {
    const parsed = parseValueWithUnit(sizeResolvedAttr);
    if (parsed) textSize = parsed;
  } else if (textSizeAttr) {
    const parsed = parseValueWithUnit(textSizeAttr);
    if (parsed) textSize = parsed;
  }
  if (iconSizeAttr) {
    const parsed = parseValueWithUnit(iconSizeAttr);
    if (parsed) iconSize = parsed;
  }
  if (gapAttr) {
    const parsed = parseValueWithUnit(gapAttr);
    if (parsed) iconMarginRight = parsed.value;
  }

  // Get link color - prefer data attribute, fallback to parsing anchor elements
  const linkColorAttr = element.getAttribute('data-link-color');
  let linkColor = null;
  if (linkColorAttr) {
    linkColor = normalizeColor(linkColorAttr);
  } else if (ul) {
    // Try to find an anchor in any list item
    const anchor = ul.querySelector('a');
    if (anchor) {
      const anchorStyles = parseInlineStyle(anchor.getAttribute('style') || '');
      if (anchorStyles.color) {
        linkColor = normalizeColor(anchorStyles.color);
      }
    }
  }

  const node = {
    type: 'BulletList/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      style: {},
    },
    params: {
      '--style-padding-horizontal--unit': 'px',
      '--style-padding-horizontal': 0,
      'margin-top--unit': 'px',
    },
    selectors: {
      '.elBulletList': {
        attrs: {
          'data-skip-text-shadow-settings': 'true',
          style: {
            color: textColor,
            ...(textSize ? { 'font-size': textSize.value } : {}),
          },
        },
        params: {
          ...(textSize ? { 'font-size--unit': textSize.unit } : {}),
        },
      },
      '.elBulletList li:not(:first-child)': {
        attrs: {
          style: {
            'margin-top': itemGap ? itemGap.value : 15,
          },
        },
        params: {
          'margin-top--unit': itemGap ? itemGap.unit : 'px',
        },
      },
      '.elBulletList .fa_icon': {
        attrs: {
          style: {
            'margin-right': iconMarginRight,
            ...(iconSize ? { 'font-size': iconSize.value } : {}),
          },
        },
        params: {
          'margin-right--unit': 'px',
          ...(iconSize ? { 'font-size--unit': iconSize.unit } : {}),
        },
      },
      '.elBulletList .fa,\n.elBulletList .fas,\n.elBulletList .fa-fw': {
        attrs: {
          style: {
            color: iconColor,
          },
        },
      },
      '.elBulletList li': {
        attrs: {
          style: {
            'justify-content': justifyContent,
          },
        },
      },
    },
    children: [
      {
        type: 'ContentEditableNode',
        attrs: {
          'data-align-selector': '.elBulletList li',
        },
        id: contentEditableId,
        version: 0,
        parentId: id,
        fractionalIndex: 'a0',
        children: [],
      },
    ],
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply link color if present
  if (linkColor) {
    node.selectors['.elBulletList .elTypographyLink'] = {
      attrs: {
        style: {
          color: linkColor,
        },
      },
    };
  }

  // Parse list items into proper structure
  let itemIndex = 0;
  items.forEach((item) => {
    const liId = generateId();
    const iconNodeId = generateId();
    const spanWrapperId = generateId();

    const textSpan = item.querySelector('span');
    const text = textSpan ? sanitizeHtml(textSpan.innerHTML) : item.textContent;

    // Build the li children
    const liChildren = [];

    // IconNode
    liChildren.push({
      type: 'IconNode',
      attrs: {
        className: iconClass,
        contenteditable: 'false',
      },
      id: iconNodeId,
      version: 0,
      parentId: liId,
      fractionalIndex: 'a0',
    });

    // Text span wrapper
    const spanChildren = [];

    // Parse the text content - handle bold tags
    if (textSpan) {
      const boldEl = textSpan.querySelector('b, strong');
      if (boldEl) {
        const boldId = generateId();
        const boldTextId = generateId();
        spanChildren.push({
          type: 'b',
          id: boldId,
          version: 0,
          parentId: spanWrapperId,
          fractionalIndex: `a${spanChildren.length}`,
          children: [
            {
              innerText: boldEl.textContent,
              type: 'text',
              id: boldTextId,
              version: 0,
              parentId: boldId,
              fractionalIndex: 'a0',
            },
          ],
        });
        // Get text after bold
        const afterBold = sanitizeHtml(textSpan.innerHTML.replace(boldEl.outerHTML, '')).trim();
        if (afterBold) {
          spanChildren.push({
            innerText: afterBold,
            type: 'text',
            id: generateId(),
            version: 0,
            parentId: spanWrapperId,
            fractionalIndex: `a${spanChildren.length}`,
          });
        }
      } else {
        // Plain text
        spanChildren.push({
          innerText: text,
          type: 'text',
          id: generateId(),
          version: 0,
          parentId: spanWrapperId,
          fractionalIndex: 'a0',
        });
      }
    } else {
      spanChildren.push({
        innerText: text,
        type: 'text',
        id: generateId(),
        version: 0,
        parentId: spanWrapperId,
        fractionalIndex: 'a0',
      });
    }

    liChildren.push({
      type: 'span',
      attrs: {
        className: 'elBulletListTextWrapper',
      },
      id: spanWrapperId,
      version: 0,
      parentId: liId,
      fractionalIndex: 'a1',
      children: spanChildren,
    });

    node.children[0].children.push({
      type: 'li',
      id: liId,
      version: 0,
      parentId: contentEditableId,
      fractionalIndex: `a${itemIndex}`,
      children: liChildren,
    });

    itemIndex++;
  });

  return node;
}

// --- interactive.js ---
/**
 * ============================================================================
 * PAGETREE PARSER - Interactive Element Parsers
 * ============================================================================
 *
 * ProgressBar/V1, VideoPopup/V1, Countdown/V1
 *
 * ============================================================================
 */

/**
 * Parse ProgressBar/V1
 */
function parseProgressBar(element, parentId, index) {
  const id = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  // Read from data attributes (most reliable)
  const progress = parseInt(element.getAttribute('data-progress') || '50', 10);
  const progressText = element.getAttribute('data-text') || '';
  const showTextOutside = element.getAttribute('data-text-outside') === 'true';
  const align = element.getAttribute('data-align') || wrapperStyles['text-align'] || 'center';

  // Find the progress track
  const track = element.querySelector('.progress');
  const trackStyles = track ? parseInlineStyle(track.getAttribute('style') || '') : {};

  // Find the progress bar (fill)
  const bar = element.querySelector('.progress-bar');
  const barStyles = bar ? parseInlineStyle(bar.getAttribute('style') || '') : {};

  // Find the label
  const label = element.querySelector('.progress-label');
  const labelStyles = label ? parseInlineStyle(label.getAttribute('style') || '') : {};

  // Width comes from data-width attribute or wrapper styles
  const widthAttr = element.getAttribute('data-width');
  const width = parseValueWithUnit(widthAttr || wrapperStyles.width || '100%', '%');
  const height = parseValueWithUnit(trackStyles.height || element.getAttribute('data-height') || '24px', 'px');
  const borderRadius = parseBorderRadius(trackStyles);
  const border = parseBorder(trackStyles);
  const shadow = parseShadow(trackStyles['box-shadow']);

  const bgColor = normalizeColor(trackStyles['background-color'] || element.getAttribute('data-bg') || '#e2e8f0');
  const fillColor = normalizeColor(barStyles['background-color'] || element.getAttribute('data-fill') || '#3b82f6');
  const labelColor = normalizeColor(labelStyles.color || '#ffffff');

  // Map alignment to text-align for label
  const textAlign = align || 'center';

  const node = {
    type: 'ProgressBar/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      style: {},
    },
    params: {
      progress,
      'progress-text': progressText,
      'show_text_outside': showTextOutside ? 'true' : 'false',
    },
    selectors: {
      '.progress': {
        attrs: {
          style: {
            width: width ? width.value : 100,
            'border-radius': borderRadius ? borderRadius.value : 9999,
          },
          'data-skip-shadow-settings': shadow ? 'false' : 'true',
          'data-skip-corners-settings': borderRadius ? 'false' : 'true',
        },
        params: {
          '--style-background-color': bgColor,
          'border-radius--unit': borderRadius ? borderRadius.unit : 'px',
          'width--unit': width ? width.unit : '%',
        },
      },
      '.progress-bar': {
        attrs: {
          style: {
            height: height ? height.value : 24,
          },
        },
        params: {
          '--style-background-color': fillColor,
          'height--unit': height ? height.unit : 'px',
        },
      },
      '.progress-label': {
        attrs: {
          style: {
            'font-size': 16,
            'text-align': textAlign,
          },
        },
        params: {
          'font-size--unit': 'px',
        },
      },
      '& > .progress-label': {
        attrs: {
          style: {
            color: labelColor,
          },
        },
      },
    },
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply border
  if (border.width || border.style || border.color) {
    Object.assign(node.selectors['.progress'].params, borderToParams(border));
  }

  // Apply shadow
  if (shadow) {
    Object.assign(node.selectors['.progress'].params, shadowToParams(shadow));
  }

  return node;
}

/**
 * Parse VideoPopup/V1
 */
function parseVideoPopup(element, parentId, index) {
  const id = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);
  const textAlign = parseTextAlign(wrapperStyles['text-align']);

  // Read from data attributes
  const videoUrl = element.getAttribute('data-video-url') || '';
  const videoType = element.getAttribute('data-video-type') || 'youtube';
  const thumbnail = element.getAttribute('data-thumbnail') || '';
  const overlayBg = element.getAttribute('data-overlay-bg') || 'rgba(0,0,0,0.8)';

  // Find the image element
  const img = element.querySelector('.elImage');
  const imgStyles = img ? parseInlineStyle(img.getAttribute('style') || '') : {};
  const alt = img ? img.getAttribute('alt') : '';

  // Find image wrapper for alignment and width
  const imageWrapper = element.querySelector('.elImageWrapper');
  const imageWrapperStyles = imageWrapper ? parseInlineStyle(imageWrapper.getAttribute('style') || '') : {};

  // Width comes from data-width attribute or imageWrapper styles
  const widthAttr = element.getAttribute('data-width');
  const width = parseValueWithUnit(widthAttr || imageWrapperStyles.width || '100%', '%');
  const borderRadius = parseBorderRadius(imgStyles);
  const border = parseBorder(imgStyles);
  const shadow = parseShadow(imgStyles['box-shadow']);

  // Extract video ID for thumbnail URL
  const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : '';
  const thumbnailUrl = thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '');

  const node = {
    type: 'VideoPopup/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      alt: alt || 'Video thumbnail',
    },
    params: {
      imageUrl: [{ type: 'text', innerText: thumbnailUrl }],
    },
    selectors: {
      '.elImage': {
        attrs: {
          alt,
          style: {
            width: width ? width.value : 100,
            'border-radius': borderRadius ? borderRadius.value : 16,
          },
          'data-skip-corners-settings': borderRadius ? 'false' : 'true',
          'data-skip-shadow-settings': shadow ? 'false' : 'true',
        },
        params: {
          'width--unit': width ? width.unit : '%',
          'border-radius--unit': borderRadius ? borderRadius.unit : 'px',
        },
      },
      '.elImageWrapper': {
        attrs: {
          style: {
            'text-align': textAlign || 'center',
          },
        },
      },
      '.elVideoWrapper': {
        attrs: {
          'data-video-type': videoType,
          'data-video-title': alt,
        },
        params: {
          video_url: videoUrl,
        },
      },
      '.elVideoWrapper .elVideoplaceholder_inner': {
        attrs: {
          className: 'bgCoverCenter',
        },
        params: {
          '--style-background-image-url': thumbnailUrl,
        },
      },
      '.elModal': {
        params: {
          '--style-background-color': overlayBg,
        },
      },
    },
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style || (node.attrs.style = {}), spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply border to image
  if (border.width || border.style || border.color) {
    Object.assign(node.selectors['.elImage'].params, borderToParams(border));
  }

  // Apply shadow to image
  if (shadow) {
    Object.assign(node.selectors['.elImage'].params, shadowToParams(shadow));
  }

  return node;
}

/**
 * Parse Countdown/V1
 */
function parseCountdown(element, parentId, index) {
  const id = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  // Read from data attributes
  const endDate = element.getAttribute('data-end-date') || '';
  const endTime = element.getAttribute('data-end-time') || '00:00:00';
  const timezone = element.getAttribute('data-timezone') || 'America/New_York';
  const showDays = element.getAttribute('data-show-days') !== 'false';
  const showHours = element.getAttribute('data-show-hours') !== 'false';
  const showMinutes = element.getAttribute('data-show-minutes') !== 'false';
  const showSeconds = element.getAttribute('data-show-seconds') !== 'false';
  const redirect = element.getAttribute('data-redirect') || '';
  const numberBg = normalizeColor(element.getAttribute('data-number-bg') || '#1C65E1');
  const numberColor = normalizeColor(element.getAttribute('data-number-color') || '#ffffff');
  const labelColor = normalizeColor(element.getAttribute('data-label-color') || '#164EAD');

  // Find countdown row for gap
  const countdownRow = element.querySelector('.elCountdownRow');
  const rowStyles = countdownRow ? parseInlineStyle(countdownRow.getAttribute('style') || '') : {};
  const gap = parseValueWithUnit(rowStyles.gap || '0.65em', 'em');

  // Find amount container for styling
  const amountContainer = element.querySelector('.elCountdownAmountContainer');
  const containerStyles = amountContainer ? parseInlineStyle(amountContainer.getAttribute('style') || '') : {};
  const borderRadius = parseBorderRadius(containerStyles);

  // Parse shadow from inline styles or data attribute
  let shadow = parseShadow(containerStyles['box-shadow']);
  if (!shadow) {
    const shadowAttr = element.getAttribute('data-shadow');
    if (shadowAttr) {
      // Resolve preset names to actual shadow values
      const SHADOW_VALUES = {
        'sm': '0 1px 2px rgba(0,0,0,0.05)',
        'md': '0 4px 6px rgba(0,0,0,0.1)',
        'lg': '0 10px 15px rgba(0,0,0,0.1)',
        'xl': '0 20px 25px rgba(0,0,0,0.1)',
        '2xl': '0 25px 50px rgba(0,0,0,0.25)',
      };
      shadow = parseShadow(SHADOW_VALUES[shadowAttr] || shadowAttr);
    }
  }

  // Parse border from inline styles or data attributes
  let border = parseBorder(containerStyles);
  if (!border.width && !border.style && !border.color) {
    const borderAttr = element.getAttribute('data-border');
    const borderColorAttr = element.getAttribute('data-border-color');
    if (borderAttr) {
      border = {
        width: parseValueWithUnit(borderAttr.includes('px') ? borderAttr : `${borderAttr}px`),
        style: 'solid',
        color: normalizeColor(borderColorAttr || numberBg),
      };
    }
  }

  // Find amount text for font styling
  const amountText = element.querySelector('.elCountdownAmount');
  const amountStyles = amountText ? parseInlineStyle(amountText.getAttribute('style') || '') : {};
  const numberSize = parseValueWithUnit(amountStyles['font-size'] || '28px', 'px');

  // Find period text for font styling
  const periodText = element.querySelector('.elCountdownPeriod');
  const periodStyles = periodText ? parseInlineStyle(periodText.getAttribute('style') || '') : {};
  const labelSize = parseValueWithUnit(periodStyles['font-size'] || '11px', 'px');

  const node = {
    type: 'Countdown/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      style: {},
    },
    params: {
      type: 'countdown',
      countdown_opts: {
        show_years: false,
        show_months: false,
        show_weeks: false,
        show_days: showDays,
        show_hours: showHours,
        show_minutes: showMinutes,
        show_seconds: showSeconds,
      },
      show_colons: false,
      timezone,
      timer_action: redirect ? 'redirect_to' : 'none',
      cookie_policy: 'none',
      expire_days: 0,
      countdownTexts: {
        years: 'Years',
        months: 'Months',
        weeks: 'Weeks',
        days: 'Days',
        hours: 'Hours',
        minutes: 'Minutes',
        seconds: 'Seconds',
      },
      end_date: endDate,
      countdown_id: id,
      end_time: endTime,
      redirect_to: redirect,
    },
    selectors: {
      '.elCountdownAmount': {
        attrs: {
          style: {
            color: numberColor,
            'font-size': numberSize ? `${numberSize.value}px` : '28px',
            'font-weight': '700',
            'line-height': '100%',
          },
        },
      },
      '.elCountdownPeriod': {
        attrs: {
          style: {
            'text-transform': 'uppercase',
            color: labelColor,
            'text-align': 'center',
            'font-size': labelSize ? `${labelSize.value}px` : '11px',
            'font-weight': '600',
          },
        },
      },
      '.elCountdownRow': {
        attrs: {
          style: {
            gap: gap ? gap.value : 0.65,
            'flex-direction': 'row',
          },
        },
        params: {
          'gap--unit': gap ? gap.unit : 'em',
        },
      },
      '.elCountdownGroupDate': {
        attrs: {
          style: {
            gap: 0.78,
          },
        },
        params: {
          'gap--unit': 'em',
        },
      },
      '.elCountdownGroupTime': {
        attrs: {
          style: {
            gap: '1.1em',
          },
        },
        params: {
          'gap--unit': 'em',
        },
      },
      '.elCountdownColumn': {
        attrs: {
          style: {
            gap: '0.5em',
            'flex-direction': 'column',
            'border-style': 'none',
            'padding-top': 0,
            'padding-bottom': 0,
          },
          'data-skip-shadow-settings': 'true',
        },
        params: {
          'gap--unit': 'em',
          '--style-padding-horizontal': 0,
        },
      },
      '.elCountdownAmountContainer': {
        attrs: {
          style: {
            'line-height': '100%',
            'padding-top': 14,
            'padding-bottom': 14,
            'border-radius': borderRadius ? borderRadius.value : 16,
          },
          'data-skip-corners-settings': borderRadius ? 'false' : 'true',
          'data-skip-shadow-settings': shadow ? 'false' : 'true',
        },
        params: {
          '--style-background-color': numberBg,
          '--style-padding-horizontal': 14,
          '--style-padding-horizontal--unit': 'px',
          'padding-top--unit': 'px',
          'padding-bottom--unit': 'px',
          'border-radius--unit': borderRadius ? borderRadius.unit : 'px',
        },
      },
    },
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply border to amount container
  if (border.width || border.style || border.color) {
    Object.assign(node.selectors['.elCountdownAmountContainer'].params, borderToParams(border));
  }

  // Apply shadow to amount container
  if (shadow) {
    Object.assign(node.selectors['.elCountdownAmountContainer'].params, shadowToParams(shadow));
  }

  return node;
}

// --- popup.js ---
/**
 * ============================================================================
 * PAGETREE PARSER - Popup Parser
 * ============================================================================
 *
 * Parses cf-popup (ModalContainer/V1) elements for the popup property.
 *
 * ============================================================================
 */

/**
 * Parse ModalContainer (popup) from cf-popup rendered HTML
 *
 * @param {HTMLElement} element - The popup wrapper element with data-type="ModalContainer/V1"
 * @param {function} parseChildren - Callback to parse child elements
 * @returns {Object} The ModalContainer/V1 pagetree node
 */
function parseModalContainer(element, parseChildren) {
  const id = generateId();

  // Get popup settings from data attributes
  const width = element.getAttribute('data-popup-width') || '750px';
  const overlay = element.getAttribute('data-popup-overlay') || 'rgba(0,0,0,0.5)';
  const rounded = element.getAttribute('data-popup-rounded') || '16px';
  const border = element.getAttribute('data-popup-border');
  const borderColor = element.getAttribute('data-popup-border-color') || '#000000';
  const shadowAttr = element.getAttribute('data-popup-shadow');

  // Find the modal container to get actual styles
  const modalEl = element.querySelector('.cf-popup-modal, .containerModal');
  const modalStyles = modalEl ? parseInlineStyle(modalEl.getAttribute('style') || '') : {};

  // Find the inner container for width
  const innerEl = element.querySelector('.elModalInnerContainer');

  // Parse values
  const parsedWidth = parseValueWithUnit(width, 'px');
  const parsedRounded = parseValueWithUnit(rounded, 'px');
  const parsedMt = parseValueWithUnit(modalStyles['margin-top'] || '45px', 'px');
  const parsedMb = parseValueWithUnit(modalStyles['margin-bottom'] || '10px', 'px');

  // Build the node
  const node = {
    id,
    version: 0,
    type: 'ModalContainer/V1',
    selectors: {
      '.containerModal': {
        attrs: {
          'data-skip-corners-settings': parsedRounded ? 'false' : 'true',
          'data-skip-shadow-settings': shadowAttr ? 'false' : 'true',
          style: {
            'margin-bottom': parsedMb ? parsedMb.value : 10,
            'margin-top': parsedMt ? parsedMt.value : 45,
          },
        },
        params: {
          'margin-bottom--unit': parsedMb ? parsedMb.unit : 'px',
          'margin-top--unit': parsedMt ? parsedMt.unit : 'px',
        },
      },
      '.modal-wrapper': {
        params: {
          '--style-background-color': overlay,
          '--style-padding-horizontal--unit': 'px',
          '--style-padding-horizontal': 0,
        },
      },
      '.elModalInnerContainer': {
        params: {
          'width--unit': parsedWidth ? parsedWidth.unit : 'px',
        },
        attrs: {
          style: {
            width: parsedWidth ? parsedWidth.value : 750,
          },
        },
      },
    },
    children: [],
  };

  // Apply border-radius
  if (parsedRounded) {
    node.selectors['.containerModal'].attrs.style['border-radius'] = parsedRounded.value;
    node.selectors['.containerModal'].params['border-radius--unit'] = parsedRounded.unit;
  }

  // Apply border if present
  if (border) {
    const parsedBorder = parseValueWithUnit(border, 'px');
    if (parsedBorder) {
      node.selectors['.containerModal'].params['--style-border-style'] = 'solid';
      node.selectors['.containerModal'].params['--style-border-width'] = parsedBorder.value;
      node.selectors['.containerModal'].params['--style-border-width--unit'] = parsedBorder.unit;
      node.selectors['.containerModal'].params['--style-border-color'] = borderColor;
    }
  }

  // Apply shadow if present
  if (shadowAttr) {
    const shadow = parseShadow(modalStyles['box-shadow']);
    if (shadow) {
      Object.assign(node.selectors['.containerModal'].params, shadowToParams(shadow));
    }
  }

  // Parse children (sections inside the popup)
  // Look for sections inside the inner container
  const sectionsContainer = innerEl || modalEl;
  if (sectionsContainer) {
    const sectionChildren = sectionsContainer.querySelectorAll(':scope > section, :scope > [data-type="SectionContainer/V1"]');
    sectionChildren.forEach((child, index) => {
      const childNode = parseChildren(child, id, index);
      if (childNode) {
        node.children.push(childNode);
      }
    });
  }

  return node;
}

// --- placeholders.js ---
/**
 * ============================================================================
 * PAGETREE PARSER - Placeholder Parsers
 * ============================================================================
 *
 * Parsers for placeholder elements that output actual ClickFunnels element types.
 * These placeholders render as visual boxes in FunnelWind but output the
 * proper ClickFunnels element types in the pagetree for seamless import.
 *
 * - CheckoutPlaceholder → Checkout/V2
 * - OrderSummaryPlaceholder → CheckoutOrderSummary/V1
 * - ConfirmationPlaceholder → OrderConfirmation/V1
 *
 * ============================================================================
 */

/**
 * Parse CheckoutPlaceholder
 * Outputs a Checkout/V2 element - the actual ClickFunnels checkout form
 */
function parseCheckoutPlaceholder(element, parentId, index) {
  const id = generateId();
  const tosTextId = generateId();
  const tosTextInner = generateId();
  const ctaHeaderId = generateId();
  const ctaHeaderInner = generateId();

  const styles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(styles);

  const node = {
    type: 'Checkout/V2',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      style: {
        '--multiple-payments-font-family': 'sans-serif',
        '--input-background-color': '#FFFFFF',
      },
    },
    selectors: {
      '.elButton': {
        params: {
          '--style-border-style': 'solid',
          'border-radius--unit': 'px',
        },
        attrs: {
          style: {
            'border-style': 'none',
            'border-radius': 6,
          },
          'data-skip-corners-settings': 'false',
        },
      },
    },
    children: [
      {
        type: 'p',
        slotName: 'tos-text',
        id: tosTextId,
        version: 0,
        parentId: id,
        fractionalIndex: 'a0',
        children: [
          {
            type: 'text',
            innerText: 'By completing this purchase, you agree to our terms of service.',
            id: tosTextInner,
            version: 0,
            parentId: tosTextId,
            fractionalIndex: 'a0',
          },
        ],
      },
      {
        type: 'p',
        slotName: 'cta-header',
        id: ctaHeaderId,
        version: 0,
        parentId: id,
        fractionalIndex: 'a1',
        children: [
          {
            type: 'text',
            innerText: 'Complete Your Order Today!',
            id: ctaHeaderInner,
            version: 0,
            parentId: ctaHeaderId,
            fractionalIndex: 'a0',
          },
        ],
      },
    ],
  };

  // Apply spacing
  const { attrs: spacingAttrs } = spacingToAttrsAndParams(spacing);
  if (spacingAttrs.style) {
    Object.assign(node.attrs.style, spacingAttrs.style);
  }

  return node;
}

/**
 * Parse OrderSummaryPlaceholder
 * Outputs a CheckoutOrderSummary/V1 element - displays cart items and totals
 */
function parseOrderSummaryPlaceholder(element, parentId, index) {
  const id = generateId();

  const styles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(styles);

  const node = {
    type: 'CheckoutOrderSummary/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    params: {
      open: true,
      state: 'ok',
      linkWithCheckout: true,
      // linkedCheckoutId will need to be set manually in ClickFunnels to link to the checkout
    },
  };

  // Apply spacing if present
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  if (spacingAttrs.style && Object.keys(spacingAttrs.style).length > 0) {
    node.attrs = { style: spacingAttrs.style };
  }
  if (Object.keys(spacingParams).length > 0) {
    Object.assign(node.params, spacingParams);
  }

  return node;
}

/**
 * Parse ConfirmationPlaceholder
 * Outputs an OrderConfirmation/V1 element - shows purchase receipt
 */
function parseConfirmationPlaceholder(element, parentId, index) {
  const id = generateId();

  const styles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(styles);

  const node = {
    type: 'OrderConfirmation/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    selectors: {
      '.elOrderConfirmationV1': {
        attrs: {
          'data-skip-corners-settings': 'false',
          style: {
            'border-radius': '8px',
          },
        },
        params: {
          '--style-border-width': '1px',
          '--style-border-style': 'solid',
          '--style-border-color': '#ECF0F5',
        },
      },
    },
  };

  // Apply spacing if present
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  if (spacingAttrs.style && Object.keys(spacingAttrs.style).length > 0) {
    node.attrs = { style: spacingAttrs.style };
  }
  if (Object.keys(spacingParams).length > 0) {
    node.params = spacingParams;
  }

  return node;
}

// --- index.js ---
/**
 * ============================================================================
 * FUNNELWIND PAGETREE PARSER
 * ============================================================================
 *
 * Converts rendered FunnelWind web components to ClickFunnels pagetree JSON.
 *
 * USAGE:
 *   // After FunnelWind renders the page
 *   import { parsePageTree } from './pagetree-parser/index.js';
 *
 *   // Parse the entire page
 *   const pageTree = parsePageTree();
 *
 *   // Or parse from a specific container
 *   const pageTree = parsePageTree(document.querySelector('[data-type="ContentNode"]'));
 *
 *   // Export as JSON
 *   const json = JSON.stringify(pageTree, null, 2);
 *
 * ============================================================================
 */

/**
 * Map of data-type to parser function
 */
const PARSER_MAP = {
  ContentNode: parseContentNode,
  "SectionContainer/V1": parseSectionContainer,
  "RowContainer/V1": parseRowContainer,
  "ColContainer/V1": parseColContainer,
  "ColInner/V1": parseColInner,
  "FlexContainer/V1": parseFlexContainer,
  "Headline/V1": parseHeadline,
  "SubHeadline/V1": parseSubHeadline,
  "Paragraph/V1": parseParagraph,
  "Button/V1": parseButton,
  "Image/V2": parseImage,
  "Icon/V1": parseIcon,
  "Video/V1": parseVideo,
  "Divider/V1": parseDivider,
  "Input/V1": parseInput,
  "TextArea/V1": parseTextArea,
  "SelectBox/V1": parseSelectBox,
  "Checkbox/V1": parseCheckbox,
  "BulletList/V1": parseBulletList,
  "ProgressBar/V1": parseProgressBar,
  "VideoPopup/V1": parseVideoPopup,
  "Countdown/V1": parseCountdown,
  // Placeholders (output actual ClickFunnels element types)
  "CheckoutPlaceholder": parseCheckoutPlaceholder,
  "OrderSummaryPlaceholder": parseOrderSummaryPlaceholder,
  "ConfirmationPlaceholder": parseConfirmationPlaceholder,
  // Popup
  "ModalContainer/V1": parseModalContainer,
};

/**
 * Create parseElement function
 * Tracks element-id to internal-id mappings for scroll/show-hide resolution
 */
function createParseElement(elementIdMap) {
  function parseElement(element, parentId, index) {
    const dataType = getDataType(element);

    // Skip elements without data-type (like col-inner wrappers)
    if (!dataType) {
      return null;
    }

    const parser = PARSER_MAP[dataType];
    if (!parser) {
      console.warn(`No parser found for data-type: ${dataType}`);
      return null;
    }

    // Container elements need the parseChildren callback
    const containerTypes = [
      "ContentNode",
      "SectionContainer/V1",
      "RowContainer/V1",
      "ColContainer/V1",
      "FlexContainer/V1",
    ];

    let node;
    if (containerTypes.includes(dataType)) {
      node = parser(element, parentId, index, parseElement);
    } else {
      node = parser(element, parentId, index);
    }

    // Track element-id to internal-id mapping for scroll/show-hide resolution
    if (node && node.attrs && node.attrs.id && node.id) {
      elementIdMap[node.attrs.id] = node.id;
    }

    return node;
  }

  return parseElement;
}

/**
 * Resolve element-id references in button scroll-target and show-ids/hide-ids
 * to use internal pagetree IDs with id- prefix
 */
function resolveButtonReferences(node, elementIdMap) {
  if (!node) return;

  // Process buttons
  if (node.type === "Button/V1" && node.params) {
    // Resolve scroll href: #scroll-elementId → #scroll-id-internalId
    if (node.params.href && node.params.href.startsWith("#scroll-")) {
      const elementId = node.params.href.replace("#scroll-", "");
      const internalId = elementIdMap[elementId];
      if (internalId) {
        node.params.href = `#scroll-id-${internalId}`;
      }
    }

    // Resolve showIds: elementId1,elementId2 → id-internalId1,id-internalId2
    if (node.params.showIds) {
      const ids = node.params.showIds.split(",").map((id) => id.trim());
      const resolvedIds = ids.map((elementId) => {
        const internalId = elementIdMap[elementId];
        return internalId ? `id-${internalId}` : elementId;
      });
      node.params.showIds = resolvedIds.join(",");
    }

    // Resolve hideIds: elementId1,elementId2 → id-internalId1,id-internalId2
    if (node.params.hideIds) {
      const ids = node.params.hideIds.split(",").map((id) => id.trim());
      const resolvedIds = ids.map((elementId) => {
        const internalId = elementIdMap[elementId];
        return internalId ? `id-${internalId}` : elementId;
      });
      node.params.hideIds = resolvedIds.join(",");
    }
  }

  // Recursively process children
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child) => resolveButtonReferences(child, elementIdMap));
  }
}

/**
 * Parse the entire page tree starting from a root element
 *
 * @param {HTMLElement} rootElement - The root element to parse (default: find ContentNode)
 * @returns {Object} The pagetree JSON object
 */
function parsePageTree(rootElement = null) {
  // Find the root ContentNode if not provided
  if (!rootElement) {
    rootElement = document.querySelector('[data-type="ContentNode"]');
  }

  if (!rootElement) {
    console.error("No ContentNode found in document");
    return null;
  }

  // Get document root for popup detection
  const docRoot = rootElement.ownerDocument || document;

  // Create element ID map for scroll/show-hide reference resolution
  const elementIdMap = {};

  // Create parseElement function
  const parseElement = createParseElement(elementIdMap);

  // Parse the content node
  const content = parseContentNode(rootElement, parseElement);

  // Resolve button scroll-target and show-ids/hide-ids references
  // This converts element-id references to internal pagetree IDs with id- prefix
  resolveButtonReferences(content, elementIdMap);

  // Parse popup if present (cf-popup renders to .cf-popup-wrapper with data-type="ModalContainer/V1")
  let popupNode = null;
  const popupElement = docRoot.querySelector('.cf-popup-wrapper[data-type="ModalContainer/V1"]');
  if (popupElement) {
    popupNode = parseModalContainer(popupElement, parseElement);
    // Also resolve button references in popup
    resolveButtonReferences(popupNode, elementIdMap);
  }

  // Extract page settings from data attributes
  // Support both 'color' (simple) and 'text-color' (explicit) for page text color
  const textColorRaw = rootElement.getAttribute("data-color") || rootElement.getAttribute("data-text-color") || "#334155";
  const linkColorRaw = rootElement.getAttribute("data-link-color") || "#3b82f6";
  const textColor = normalizeColor(textColorRaw);
  const linkColor = normalizeColor(linkColorRaw);
  // Support both 'font' (simple) and 'font-family' attributes
  const fontFamily = rootElement.getAttribute("data-font") || rootElement.getAttribute("data-font-family") || "";
  const fontWeight = rootElement.getAttribute("data-font-weight") || "";
  // Decode URL-encoded values
  const headerCodeRaw = rootElement.getAttribute("data-header-code") || "";
  const footerCodeRaw = rootElement.getAttribute("data-footer-code") || "";
  const customCssRaw = rootElement.getAttribute("data-custom-css") || "";
  const headerCode = headerCodeRaw ? decodeURIComponent(headerCodeRaw) : "";
  const footerCode = footerCodeRaw ? decodeURIComponent(footerCodeRaw) : "";
  const customCss = customCssRaw ? decodeURIComponent(customCssRaw) : "";

  // Generate settings ID
  const settingsId = generateId();

  // Build settings children
  const settingsChildren = [];

  // page_style (CSS/fonts/colors)
  const pageStyleAttrs = {
    style: {
      color: textColor,
    },
  };
  // Normalize font-family to ClickFunnels format (e.g., "\"Poppins\", sans-serif")
  const normalizedFontFamily = fontFamily
    ? normalizeFontFamily(fontFamily)
    : null;
  if (normalizedFontFamily)
    pageStyleAttrs.style["font-family"] = normalizedFontFamily;
  if (fontWeight) pageStyleAttrs.style["font-weight"] = fontWeight;

  settingsChildren.push({
    id: "page_style",
    type: "css",
    parentId: settingsId,
    fractionalIndex: "a0",
    attrs: pageStyleAttrs,
    selectors: {
      ".elTypographyLink": {
        attrs: {
          style: {
            color: linkColor,
          },
        },
        params: {},
      },
    },
    params: {},
  });

  // header-code
  settingsChildren.push({
    id: "header-code",
    type: "raw",
    parentId: settingsId,
    fractionalIndex: "a1",
    innerText: headerCode,
  });

  // footer-code
  settingsChildren.push({
    id: "footer-code",
    type: "raw",
    parentId: settingsId,
    fractionalIndex: "a2",
    innerText: footerCode,
  });

  // css - default CSS plus any custom CSS
  const defaultCss = "";
  const combinedCss = customCss ? `${defaultCss}\n\n${customCss}` : defaultCss;
  settingsChildren.push({
    id: "css",
    type: "raw",
    parentId: settingsId,
    fractionalIndex: "a3",
    innerText: combinedCss,
  });

  // Build the full pagetree structure
  const pageTree = {
    version: 157,
    content,
    settings: {
      id: settingsId,
      type: "settings",
      version: 0,
      children: settingsChildren,
    },
    popup: popupNode || {
      id: "",
      version: 0,
      type: "ModalContainer/V1",
      selectors: {
        ".containerModal": {
          attrs: {
            "data-skip-corners-settings": "false",
            style: { "margin-bottom": 0 },
          },
        },
      },
    },
  };

  return pageTree;
}

/**
 * Parse and export as JSON string
 *
 * @param {HTMLElement} rootElement - The root element to parse
 * @param {boolean} pretty - Whether to pretty-print the JSON
 * @returns {string} The pagetree as JSON string
 */
function exportPageTreeJSON(rootElement = null, pretty = true) {
  const pageTree = parsePageTree(rootElement);
  if (!pageTree) return null;

  return pretty ? JSON.stringify(pageTree, null, 2) : JSON.stringify(pageTree);
}

/**
 * Download the pagetree as a JSON file
 *
 * @param {string} filename - The filename (default: 'pagetree.json')
 * @param {HTMLElement} rootElement - The root element to parse
 */
function downloadPageTree(filename = "pagetree.json", rootElement = null) {
  const json = exportPageTreeJSON(rootElement, true);
  if (!json) return;

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy pagetree JSON to clipboard
 *
 * @param {HTMLElement} rootElement - The root element to parse
 * @returns {Promise<boolean>} Whether the copy was successful
 */
async function copyPageTreeToClipboard(rootElement = null) {
  const json = exportPageTreeJSON(rootElement, true);
  if (!json) return false;

  try {
    await navigator.clipboard.writeText(json);
    return true;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
}

// Export all utilities for advanced usage


// Expose API
global.CFPageTreeParser = {
  parsePageTree,
  createParseElement,
  exportPageTreeJSON,
  downloadPageTree,
  copyPageTreeToClipboard,
  // Utils
  generateId,
  generateFractionalIndex,
  parseValueWithUnit,
  normalizeColor,
  parseInlineStyle,
  // Styles
  parseShadow,
  shadowToParams,
  parseBorder,
  borderToParams,
  parseBackground,
  backgroundToParams,
};

})(typeof window !== 'undefined' ? window : global);
