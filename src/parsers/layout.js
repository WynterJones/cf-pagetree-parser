/**
 * ============================================================================
 * PAGETREE PARSER - Layout Parsers
 * ============================================================================
 *
 * ContentNode, SectionContainer, RowContainer, ColContainer, FlexContainer
 *
 * ============================================================================
 */

import {
  generateId,
  generateFractionalIndex,
  parseInlineStyle,
  parseValueWithUnit,
  parseAnimationAttrs,
} from '../utils.js';

import {
  parseBackground,
  backgroundToParams,
  parseBorder,
  borderToParams,
  parseShadow,
  shadowToParams,
  parseBorderRadius,
  parseSpacing,
  spacingToAttrsAndParams,
  parseFlexDirection,
  parseJustifyContent,
  parseAlignItems,
} from '../styles.js';

/**
 * Parse ContentNode (root container)
 */
export function parseContentNode(element, parseChildren) {
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
export function parseSectionContainer(element, parentId, index, parseChildren) {
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
export function parseRowContainer(element, parentId, index, parseChildren) {
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
export function parseColContainer(element, parentId, index, parseChildren) {
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
export function parseFlexContainer(element, parentId, index, parseChildren) {
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
export function parseColInner(_element, _parentId, _index, _parseChildren) {
  // ColInner is a wrapper element - we don't create a node for it,
  // we just return null and let the parent (ColContainer) handle it
  // The ColContainer parser already handles col-inner styling via selectors
  return null;
}
