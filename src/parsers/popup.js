/**
 * ============================================================================
 * PAGETREE PARSER - Popup Parser
 * ============================================================================
 *
 * Parses cf-popup (ModalContainer/V1) elements for the popup property.
 *
 * ============================================================================
 */

import {
  generateId,
  parseInlineStyle,
  parseValueWithUnit,
} from '../utils.js';

import {
  parseShadow,
  shadowToParams,
} from '../styles.js';

/**
 * Parse ModalContainer (popup) from cf-popup rendered HTML
 *
 * @param {HTMLElement} element - The popup wrapper element with data-type="ModalContainer/V1"
 * @param {function} parseChildren - Callback to parse child elements
 * @returns {Object} The ModalContainer/V1 pagetree node
 */
export function parseModalContainer(element, parseChildren) {
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
