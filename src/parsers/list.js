/**
 * ============================================================================
 * PAGETREE PARSER - List Element Parser
 * ============================================================================
 *
 * BulletList/V1
 *
 * ============================================================================
 */

import {
  generateId,
  generateFractionalIndex,
  parseInlineStyle,
  parseValueWithUnit,
  normalizeColor,
  sanitizeHtml,
} from '../utils.js';

import {
  parseSpacing,
  spacingToAttrsAndParams,
} from '../styles.js';

/**
 * Parse BulletList/V1
 */
export function parseBulletList(element, parentId, index) {
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

  // Initialize with defaults, will be overridden by data attrs or inline styles
  let iconClass = 'fas fa-check fa_icon';
  let iconColor = '#10b981';
  let iconMarginRight = 12;
  let iconSize = null;
  let textColor = '#334155';
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
