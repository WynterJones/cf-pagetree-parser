/**
 * ============================================================================
 * PAGETREE PARSER - Button Parser
 * ============================================================================
 *
 * Button/V1
 *
 * ============================================================================
 */

import {
  generateId,
  generateFractionalIndex,
  parseInlineStyle,
  parseValueWithUnit,
  normalizeColor,
  extractTextContent,
  parseAnimationAttrs,
} from '../utils.js';

import {
  parseSpacing,
  spacingToAttrsAndParams,
  parseBorderRadius,
  parseShadow,
  normalizeFontWeight,
  parseTextAlign,
} from '../styles.js';

/**
 * Parse Button/V1
 *
 * Reads from data attributes first (most reliable), falls back to inline styles
 * @param {HTMLElement} element - The button element
 * @param {string} parentId - Parent element ID
 * @param {number} index - Child index
 * @param {Object} styleguideData - Optional styleguide data for looking up button styles
 */
export function parseButton(element, parentId, index, styleguideData = null) {
  const id = generateId();
  const mainTextId = generateId();
  const subTextId = generateId();

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  // Get href, target from data attributes
  const href = element.getAttribute('data-href') || '#';
  const target = element.getAttribute('data-target') || '_self';

  // Show/hide specific attributes
  const showIds = element.getAttribute('data-show-ids');
  const hideIds = element.getAttribute('data-hide-ids');
  const elButtonType = element.getAttribute('data-elbuttontype');

  // Check for styleguide button
  const styleGuideButton = element.getAttribute('data-style-guide-button');

  // Look up button style from styleguide if available
  let styleguideButtonStyle = null;
  if (styleGuideButton && styleguideData?.buttons) {
    styleguideButtonStyle = styleguideData.buttons.find(btn => btn.id === styleGuideButton);
  }

  // Find the anchor element for fallback parsing
  const anchor = element.querySelector('a');
  const anchorStyles = anchor ? parseInlineStyle(anchor.getAttribute('style') || '') : {};

  // Find text span for fallback parsing
  const textSpan = anchor ? anchor.querySelector('span') : null;
  const textStyles = textSpan ? parseInlineStyle(textSpan.getAttribute('style') || '') : {};

  // Read from styleguide button style first, then data attributes, then inline styles
  // Styleguide button structure: { regular: { bg, color }, hover: { bg, color }, borderRadius, borderWidth, borderColor }
  const bgAttr = element.getAttribute('data-bg');
  const bgColor = styleguideButtonStyle?.regular?.bg
    ? normalizeColor(styleguideButtonStyle.regular.bg)
    : bgAttr
      ? normalizeColor(bgAttr)
      : (normalizeColor(anchorStyles['background-color']) || '#3b82f6');

  const textColorAttr = element.getAttribute('data-color');
  const textColor = styleguideButtonStyle?.regular?.color
    ? normalizeColor(styleguideButtonStyle.regular.color)
    : textColorAttr
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

  // Border and corners - styleguide first, then data attributes
  const roundedAttr = element.getAttribute('data-rounded');
  const borderRadius = styleguideButtonStyle?.borderRadius != null
    ? { value: styleguideButtonStyle.borderRadius, unit: 'px' }
    : roundedAttr
      ? parseValueWithUnit(roundedAttr)
      : parseBorderRadius(anchorStyles);

  const borderColorAttr = element.getAttribute('data-border-color');
  const borderColor = styleguideButtonStyle?.borderColor
    ? normalizeColor(styleguideButtonStyle.borderColor)
    : borderColorAttr
      ? normalizeColor(borderColorAttr)
      : normalizeColor(anchorStyles['border-color']);

  const borderWidthAttr = element.getAttribute('data-border-width');
  const borderWidth = styleguideButtonStyle?.borderWidth != null
    ? { value: styleguideButtonStyle.borderWidth, unit: 'px' }
    : borderWidthAttr
      ? parseValueWithUnit(borderWidthAttr)
      : parseValueWithUnit(anchorStyles['border-width'] || '0');

  // Shadow
  const shadowAttr = element.getAttribute('data-shadow');
  const shadow = shadowAttr ? parseShadow(shadowAttr) : parseShadow(anchorStyles['box-shadow']);

  // Hover state from styleguide
  const hoverBgColor = styleguideButtonStyle?.hover?.bg
    ? normalizeColor(styleguideButtonStyle.hover.bg)
    : null;
  const hoverTextColor = styleguideButtonStyle?.hover?.color
    ? normalizeColor(styleguideButtonStyle.hover.color)
    : null;

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
  // When using styleguide button, also include data-style-guide-button attribute
  const buttonSelector = {
    attrs: {
      style: {},
    },
    params: {
      '--style-padding-horizontal': paddingHorizontal ? paddingHorizontal.value : 32,
      '--style-padding-horizontal--unit': paddingHorizontal ? paddingHorizontal.unit : 'px',
      '--style-padding-vertical': paddingVertical ? paddingVertical.value : 16,
      '--style-padding-vertical--unit': paddingVertical ? paddingVertical.unit : 'px',
      'style-guide-override-button': true,
      '--style-background-color': bgColor,
      '--style-border-color': borderColor || 'transparent',
      '--style-border-width': borderWidth ? borderWidth.value : 0,
      '--style-border-width--unit': borderWidth ? borderWidth.unit : 'px',
    },
  };

  // Add styleguide button reference if present
  if (styleGuideButton) {
    buttonSelector.attrs['data-style-guide-button'] = styleGuideButton;
  }

  // Parse animation attributes
  const { attrs: animationAttrs, params: animationParams } = parseAnimationAttrs(element);

  const node = {
    type: 'Button/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
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

  // Add hover state selectors if available from styleguide
  if (hoverBgColor) {
    node.selectors['.elButton:hover'] = {
      attrs: {
        style: {},
      },
      params: {
        '--style-background-color': hoverBgColor,
      },
    };
  }
  if (hoverTextColor) {
    node.selectors['.elButton:hover .elButtonText'] = {
      attrs: {
        style: {
          color: hoverTextColor,
        },
      },
    };
  }

  return node;
}
