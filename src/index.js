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

import { getDataType, generateId, normalizeColor } from "./utils.js";
import { normalizeFontFamily } from "./styles.js";

import {
  parseContentNode,
  parseSectionContainer,
  parseRowContainer,
  parseColContainer,
  parseColInner,
  parseFlexContainer,
  parseHeadline,
  parseSubHeadline,
  parseParagraph,
  parseButton,
  parseImage,
  parseIcon,
  parseVideo,
  parseDivider,
  parseInput,
  parseTextArea,
  parseSelectBox,
  parseCheckbox,
  parseBulletList,
  parseProgressBar,
  parseVideoPopup,
  parseCountdown,
  parseCheckoutPlaceholder,
  parseOrderSummaryPlaceholder,
  parseConfirmationPlaceholder,
  parseModalContainer,
} from "./parsers/index.js";

/**
 * Get typescale sizes calculated from baseSize and scaleRatio.
 * Matches StyleguideEditor.tsx and cf-elements.js getTypescale() for consistency.
 * Returns element-specific scales because headlines, subheadlines, and paragraphs
 * have different sizes at the same preset (e.g., "s" for headline = 20px, "s" for paragraph = 13px).
 *
 * @param {Object} typography - Typography settings with baseSize and scaleRatio
 * @returns {Object|null} - Map of element types to their size preset maps
 */
function getTypescale(typography) {
  if (!typography) return null;

  const { baseSize = 16, scaleRatio = 1.25 } = typography;
  const r = scaleRatio;
  const b = baseSize;

  // Build the base scale points (negative = smaller, positive = larger)
  const scale = {
    n3: Math.round(b / Math.pow(r, 3)), // ~8
    n2: Math.round(b / Math.pow(r, 2)), // ~10
    n1: Math.round(b / r), // ~13
    base: b, // 16
    p1: Math.round(b * r), // ~20
    p2: Math.round(b * Math.pow(r, 2)), // ~25
    p3: Math.round(b * Math.pow(r, 3)), // ~31
    p4: Math.round(b * Math.pow(r, 4)), // ~39
    p5: Math.round(b * Math.pow(r, 5)), // ~49
    p6: Math.round(b * Math.pow(r, 6)), // ~61
    p7: Math.round(b * Math.pow(r, 7)), // ~76
    p8: Math.round(b * Math.pow(r, 8)), // ~95
  };

  // Return element-specific scales (each element type maps presets to different scale points)
  return {
    headline: {
      "5xl": scale.p8,
      "4xl": scale.p7,
      "3xl": scale.p6,
      "2xl": scale.p5,
      xl: scale.p4,
      l: scale.p3,
      lg: scale.p3,
      m: scale.p2,
      md: scale.p2,
      s: scale.p1,
      sm: scale.p1,
      xs: scale.base,
    },
    subheadline: {
      "5xl": scale.p7,
      "4xl": scale.p6,
      "3xl": scale.p5,
      "2xl": scale.p4,
      xl: scale.p3,
      l: scale.p2,
      lg: scale.p2,
      m: scale.p1,
      md: scale.p1,
      s: scale.base,
      sm: scale.base,
      xs: scale.n1,
    },
    paragraph: {
      "5xl": scale.p6,
      "4xl": scale.p5,
      "3xl": scale.p4,
      "2xl": scale.p3,
      xl: scale.p2,
      l: scale.p1,
      lg: scale.p1,
      m: scale.base,
      md: scale.base,
      s: scale.n1,
      sm: scale.n1,
      xs: scale.n2,
    },
  };
}

/**
 * Apply styleguide fonts and colors as data attributes before parsing.
 * This ensures the parser captures styleguide-applied values.
 *
 * @param {Document|HTMLElement} root - The root element or document to process
 * @param {Object} styleguideData - Optional styleguide data (will try to read from embedded JSON if not provided)
 */
function applyStyleguideDataAttributes(root, styleguideData = null) {
  // Try to get styleguide from embedded JSON if not provided
  if (!styleguideData) {
    const scriptEl = root.querySelector
      ? root.querySelector("#cf-styleguide-data")
      : root.getElementById
      ? root.getElementById("cf-styleguide-data")
      : null;
    if (scriptEl) {
      try {
        styleguideData = JSON.parse(scriptEl.textContent);
      } catch (e) {
        console.warn("PageTree Parser: Failed to parse styleguide data:", e);
        return;
      }
    }
  }

  if (!styleguideData) return;

  const { typography, paintThemes, colors } = styleguideData;

  // Helper to get color hex by ID
  const getColorHex = (colorId) => {
    if (!colors) return "#000000";
    const color = colors.find((c) => c.id === colorId);
    return color ? color.hex : "#000000";
  };

  // Apply typography fonts to elements without explicit fonts
  if (typography) {
    const { headlineFont, subheadlineFont, contentFont } = typography;

    if (headlineFont) {
      root
        .querySelectorAll('[data-type="Headline/V1"]:not([data-font])')
        .forEach((el) => {
          el.setAttribute("data-font", headlineFont);
        });
    }

    if (subheadlineFont) {
      root
        .querySelectorAll('[data-type="SubHeadline/V1"]:not([data-font])')
        .forEach((el) => {
          el.setAttribute("data-font", subheadlineFont);
        });
    }

    if (contentFont) {
      root
        .querySelectorAll('[data-type="Paragraph/V1"]:not([data-font])')
        .forEach((el) => {
          el.setAttribute("data-font", contentFont);
        });
    }
  }

  // Helper to check if element's closest paint-themed ancestor is the given container
  // This prevents applying colors to elements inside nested non-paint containers
  const isDirectPaintDescendant = (el, paintContainer) => {
    // Find the closest ancestor with data-paint-colors attribute
    const closestPaint = el.closest("[data-paint-colors]");
    // Element should only get colors if its closest paint ancestor is this container
    return closestPaint === paintContainer;
  };

  // Apply paint theme colors - OVERRIDE existing (paint themes take precedence)
  // Only apply to elements that are direct descendants (no intervening non-paint containers)
  if (paintThemes?.length) {
    paintThemes.forEach((theme) => {
      const containers = root.querySelectorAll(
        `[data-paint-colors="${theme.id}"]`
      );
      containers.forEach((container) => {
        const headlineColor = getColorHex(theme.headlineColorId);
        const subheadlineColor = getColorHex(theme.subheadlineColorId);
        const contentColor = getColorHex(theme.contentColorId);
        const iconColor = getColorHex(theme.iconColorId);
        const linkColor = theme.linkColorId
          ? getColorHex(theme.linkColorId)
          : null;

        // Apply headline color (only to direct paint descendants)
        container
          .querySelectorAll('[data-type="Headline/V1"]')
          .forEach((el) => {
            if (isDirectPaintDescendant(el, container)) {
              if (!el.hasAttribute("data-color-explicit")) {
                el.setAttribute("data-color", headlineColor);
              }
              if (linkColor) el.setAttribute("data-link-color", linkColor);
            }
          });

        // Apply subheadline color (only to direct paint descendants)
        container
          .querySelectorAll('[data-type="SubHeadline/V1"]')
          .forEach((el) => {
            if (isDirectPaintDescendant(el, container)) {
              if (!el.hasAttribute("data-color-explicit")) {
                el.setAttribute("data-color", subheadlineColor);
              }
              if (linkColor) el.setAttribute("data-link-color", linkColor);
            }
          });

        // Apply content/paragraph color (only to direct paint descendants)
        container
          .querySelectorAll('[data-type="Paragraph/V1"]')
          .forEach((el) => {
            if (isDirectPaintDescendant(el, container)) {
              if (!el.hasAttribute("data-color-explicit")) {
                el.setAttribute("data-color", contentColor);
              }
              if (linkColor) el.setAttribute("data-link-color", linkColor);
            }
          });

        // Apply icon color (only to direct paint descendants)
        container.querySelectorAll('[data-type="Icon/V1"]').forEach((el) => {
          if (isDirectPaintDescendant(el, container)) {
            if (!el.hasAttribute("data-color-explicit")) {
              el.setAttribute("data-color", iconColor);
            }
          }
        });

        // Apply colors to bullet lists (only to direct paint descendants)
        container
          .querySelectorAll('[data-type="BulletList/V1"]')
          .forEach((el) => {
            if (isDirectPaintDescendant(el, container)) {
              if (!el.hasAttribute("data-text-color-explicit")) {
                el.setAttribute("data-text-color", contentColor);
              }
              if (!el.hasAttribute("data-icon-color-explicit")) {
                el.setAttribute("data-icon-color", iconColor);
              }
              if (linkColor) el.setAttribute("data-link-color", linkColor);
            }
          });
      });
    });
  }

  // Resolve size presets (xl, l, m, s) to pixel values for text elements
  // This allows the parser to capture correct font sizes even when using presets
  if (typography) {
    const typescale = getTypescale(typography);

    if (typescale) {
      // Map data-type to element scale key
      const elementTypeMap = {
        "Headline/V1": "headline",
        "SubHeadline/V1": "subheadline",
        "Paragraph/V1": "paragraph",
        "BulletList/V1": "paragraph", // Bullet lists use paragraph scale
      };

      // Find all text elements with a size attribute
      const textElements = root.querySelectorAll(
        '[data-type="Headline/V1"][data-size], ' +
          '[data-type="SubHeadline/V1"][data-size], ' +
          '[data-type="Paragraph/V1"][data-size], ' +
          '[data-type="BulletList/V1"][data-size]'
      );

      textElements.forEach((el) => {
        const sizeAttr = el.getAttribute("data-size");
        const dataType = el.getAttribute("data-type");
        const elementKey = elementTypeMap[dataType] || "headline";
        const elementScale = typescale[elementKey];

        // Check if it's a preset (not already a px value)
        if (sizeAttr && elementScale && elementScale[sizeAttr] !== undefined) {
          // Set the resolved pixel value as a separate attribute
          el.setAttribute("data-size-resolved", `${elementScale[sizeAttr]}px`);
        }
      });
    }
  }
}

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
 * Create parseElement function with styleguide data in closure
 * Also tracks element-id to internal-id mappings for scroll/show-hide resolution
 */
function createParseElement(styleguideData, elementIdMap) {
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
    } else if (dataType === "Button/V1") {
      // Button needs styleguide data to look up button styles
      node = parser(element, parentId, index, styleguideData);
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
 * @param {Object} styleguideData - Optional styleguide data for applying fonts/colors
 * @returns {Object} The pagetree JSON object
 */
export function parsePageTree(rootElement = null, styleguideData = null) {
  // Find the root ContentNode if not provided
  if (!rootElement) {
    rootElement = document.querySelector('[data-type="ContentNode"]');
  }

  if (!rootElement) {
    console.error("No ContentNode found in document");
    return null;
  }

  // Apply styleguide fonts and colors as data attributes before parsing
  // This ensures the parser captures styleguide-applied values (fonts, paint theme colors)
  const docRoot = rootElement.ownerDocument || document;
  applyStyleguideDataAttributes(docRoot, styleguideData);

  // Create element ID map for scroll/show-hide reference resolution
  const elementIdMap = {};

  // Create parseElement with styleguide data in closure for button style lookup
  const parseElement = createParseElement(styleguideData, elementIdMap);

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
  const textColorRaw = rootElement.getAttribute("data-text-color") || "#334155";
  const linkColorRaw = rootElement.getAttribute("data-link-color") || "#3b82f6";
  const textColor = normalizeColor(textColorRaw);
  const linkColor = normalizeColor(linkColorRaw);
  const fontFamily = rootElement.getAttribute("data-font-family") || "";
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
            "data-style-guide-corner": "style1",
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
 * @param {Object} styleguideData - Optional styleguide data for applying fonts/colors
 * @returns {string} The pagetree as JSON string
 */
export function exportPageTreeJSON(
  rootElement = null,
  pretty = true,
  styleguideData = null
) {
  const pageTree = parsePageTree(rootElement, styleguideData);
  if (!pageTree) return null;

  return pretty ? JSON.stringify(pageTree, null, 2) : JSON.stringify(pageTree);
}

/**
 * Download the pagetree as a JSON file
 *
 * @param {string} filename - The filename (default: 'pagetree.json')
 * @param {HTMLElement} rootElement - The root element to parse
 * @param {Object} styleguideData - Optional styleguide data for applying fonts/colors
 */
export function downloadPageTree(
  filename = "pagetree.json",
  rootElement = null,
  styleguideData = null
) {
  const json = exportPageTreeJSON(rootElement, true, styleguideData);
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
 * @param {Object} styleguideData - Optional styleguide data for applying fonts/colors
 * @returns {Promise<boolean>} Whether the copy was successful
 */
export async function copyPageTreeToClipboard(
  rootElement = null,
  styleguideData = null
) {
  const json = exportPageTreeJSON(rootElement, true, styleguideData);
  if (!json) return false;

  try {
    await navigator.clipboard.writeText(json);
    return true;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
}

// Expose global API when running in the browser
if (typeof window !== "undefined") {
  window.PageTreeParser = {
    parse: parsePageTree,
    toJSON: exportPageTreeJSON,
    download: downloadPageTree,
    copyToClipboard: copyPageTreeToClipboard,
  };
}

// Export all utilities for advanced usage
export {
  generateId,
  generateFractionalIndex,
  parseValueWithUnit,
  normalizeColor,
  parseInlineStyle,
} from "./utils.js";

export {
  parseShadow,
  shadowToParams,
  parseBorder,
  borderToParams,
  parseBackground,
  backgroundToParams,
} from "./styles.js";

export { PARSER_MAP };
