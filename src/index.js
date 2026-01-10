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
export function parsePageTree(rootElement = null) {
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
 * @returns {string} The pagetree as JSON string
 */
export function exportPageTreeJSON(rootElement = null, pretty = true) {
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
export function downloadPageTree(filename = "pagetree.json", rootElement = null) {
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
export async function copyPageTreeToClipboard(rootElement = null) {
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
