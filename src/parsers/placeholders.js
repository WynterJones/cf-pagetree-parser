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

import {
  generateId,
  generateFractionalIndex,
  parseInlineStyle,
} from '../utils.js';

import { parseSpacing, spacingToAttrsAndParams } from '../styles.js';

/**
 * Parse CheckoutPlaceholder
 * Outputs a Checkout/V2 element - the actual ClickFunnels checkout form
 */
export function parseCheckoutPlaceholder(element, parentId, index) {
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
        '--container-font-family': 'var(--style-guide-font-family-content)',
        '--input-headline-font-family': 'var(--style-guide-font-family-subheadline)',
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
export function parseOrderSummaryPlaceholder(element, parentId, index) {
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
export function parseConfirmationPlaceholder(element, parentId, index) {
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
