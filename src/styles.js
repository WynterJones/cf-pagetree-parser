/**
 * ============================================================================
 * PAGETREE PARSER - Style Parsing Helpers
 * ============================================================================
 *
 * Parse inline styles and convert to ClickFunnels pagetree format.
 *
 * ============================================================================
 */

import { parseValueWithUnit, normalizeColor } from './utils.js';

/**
 * Shadow presets mapping (from inline shadow to CF params)
 */
export const SHADOW_PRESETS = {
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
export function parseShadow(shadowValue) {
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
export function shadowToParams(shadow) {
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
export function parseBorder(styles) {
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
export function borderToParams(border) {
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
export function parseSpacing(styles) {
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
export function spacingToAttrsAndParams(spacing, forceDefaults = false) {
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
export function parseBackground(styles) {
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
export function backgroundToParams(background) {
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
export function parseBorderRadius(styles) {
  if (styles['border-radius']) {
    return parseValueWithUnit(styles['border-radius']);
  }
  return null;
}

/**
 * Convert font-weight string to numeric value
 */
export function normalizeFontWeight(weight) {
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
export function parseLineHeight(value) {
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
export function parseTextAlign(value) {
  if (!value) return 'center'; // CF default
  const valid = ['left', 'center', 'right'];
  return valid.includes(value) ? value : 'center';
}

/**
 * Parse flex direction
 */
export function parseFlexDirection(value) {
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
export function parseJustifyContent(value) {
  const valid = [
    'flex-start', 'center', 'flex-end',
    'space-between', 'space-around', 'space-evenly'
  ];
  return valid.includes(value) ? value : 'center';
}

/**
 * Parse align-items
 */
export function parseAlignItems(value) {
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
export function normalizeFontFamily(fontFamily) {
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
export function parseFontFamily(value) {
  if (!value) return null;
  return normalizeFontFamily(value);
}
