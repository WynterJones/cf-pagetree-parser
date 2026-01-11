/**
 * ============================================================================
 * PAGETREE PARSER - Text Element Parsers
 * ============================================================================
 *
 * Headline/V1, SubHeadline/V1, Paragraph/V1
 *
 * ============================================================================
 */

import {
  generateId,
  generateFractionalIndex,
  parseInlineStyle,
  parseValueWithUnit,
  normalizeColor,
  parseHtmlToTextNodes,
  parseAnimationAttrs,
} from "../utils.js";

import {
  parseSpacing,
  spacingToAttrsAndParams,
  normalizeFontWeight,
  parseLineHeight,
  parseTextAlign,
  parseFontFamily,
} from "../styles.js";

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
export function parseHeadline(element, parentId, index) {
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
export function parseSubHeadline(element, parentId, index) {
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
export function parseParagraph(element, parentId, index) {
  return parseTextElement(
    element,
    parentId,
    index,
    "Paragraph/V1",
    ".elParagraph"
  );
}
