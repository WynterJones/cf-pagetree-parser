/**
 * ============================================================================
 * PAGETREE PARSER - Media Element Parsers
 * ============================================================================
 *
 * Image/V2, Icon/V1, Video/V1, Divider/V1
 *
 * ============================================================================
 */

import {
  generateId,
  generateFractionalIndex,
  parseInlineStyle,
  parseValueWithUnit,
  normalizeColor,
  parseAnimationAttrs,
} from '../utils.js';

import {
  parseSpacing,
  spacingToAttrsAndParams,
  parseBorderRadius,
  parseBorder,
  borderToParams,
  parseShadow,
  shadowToParams,
  parseTextAlign,
  parseBackground,
} from '../styles.js';

/**
 * Parse Image/V2
 */
export function parseImage(element, parentId, index) {
  const id = generateId();

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
export function parseIcon(element, parentId, index) {
  const id = generateId();

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
export function parseVideo(element, parentId, index) {
  const id = generateId();

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
export function parseDivider(element, parentId, index) {
  const id = generateId();

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
