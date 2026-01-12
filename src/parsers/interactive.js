/**
 * ============================================================================
 * PAGETREE PARSER - Interactive Element Parsers
 * ============================================================================
 *
 * ProgressBar/V1, VideoPopup/V1, Countdown/V1
 *
 * ============================================================================
 */

import {
  generateId,
  generateFractionalIndex,
  parseInlineStyle,
  parseValueWithUnit,
  normalizeColor,
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
} from '../styles.js';

/**
 * Parse ProgressBar/V1
 */
export function parseProgressBar(element, parentId, index) {
  const id = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  // Read from data attributes (most reliable)
  const progress = parseInt(element.getAttribute('data-progress') || '50', 10);
  const progressText = element.getAttribute('data-text') || '';
  const showTextOutside = element.getAttribute('data-text-outside') === 'true';
  const align = element.getAttribute('data-align') || wrapperStyles['text-align'] || 'center';

  // Find the progress track
  const track = element.querySelector('.progress');
  const trackStyles = track ? parseInlineStyle(track.getAttribute('style') || '') : {};

  // Find the progress bar (fill)
  const bar = element.querySelector('.progress-bar');
  const barStyles = bar ? parseInlineStyle(bar.getAttribute('style') || '') : {};

  // Find the label
  const label = element.querySelector('.progress-label');
  const labelStyles = label ? parseInlineStyle(label.getAttribute('style') || '') : {};

  // Width comes from data-width attribute or wrapper styles
  const widthAttr = element.getAttribute('data-width');
  const width = parseValueWithUnit(widthAttr || wrapperStyles.width || '100%', '%');
  const height = parseValueWithUnit(trackStyles.height || element.getAttribute('data-height') || '24px', 'px');
  const borderRadius = parseBorderRadius(trackStyles);
  const border = parseBorder(trackStyles);
  const shadow = parseShadow(trackStyles['box-shadow']);

  const bgColor = normalizeColor(trackStyles['background-color'] || element.getAttribute('data-bg') || '#e2e8f0');
  const fillColor = normalizeColor(barStyles['background-color'] || element.getAttribute('data-fill') || '#3b82f6');
  const labelColor = normalizeColor(labelStyles.color || '#ffffff');

  // Map alignment to text-align for label
  const textAlign = align || 'center';

  const node = {
    type: 'ProgressBar/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      style: {},
    },
    params: {
      progress,
      'progress-text': progressText,
      'show_text_outside': showTextOutside ? 'true' : 'false',
    },
    selectors: {
      '.progress': {
        attrs: {
          style: {
            width: width ? width.value : 100,
            'border-radius': borderRadius ? borderRadius.value : 9999,
          },
          'data-skip-shadow-settings': shadow ? 'false' : 'true',
          'data-skip-corners-settings': borderRadius ? 'false' : 'true',
        },
        params: {
          '--style-background-color': bgColor,
          'border-radius--unit': borderRadius ? borderRadius.unit : 'px',
          'width--unit': width ? width.unit : '%',
        },
      },
      '.progress-bar': {
        attrs: {
          style: {
            height: height ? height.value : 24,
          },
        },
        params: {
          '--style-background-color': fillColor,
          'height--unit': height ? height.unit : 'px',
        },
      },
      '.progress-label': {
        attrs: {
          style: {
            'font-size': 16,
            'text-align': textAlign,
          },
        },
        params: {
          'font-size--unit': 'px',
        },
      },
      '& > .progress-label': {
        attrs: {
          style: {
            color: labelColor,
          },
        },
      },
    },
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply border
  if (border.width || border.style || border.color) {
    Object.assign(node.selectors['.progress'].params, borderToParams(border));
  }

  // Apply shadow
  if (shadow) {
    Object.assign(node.selectors['.progress'].params, shadowToParams(shadow));
  }

  return node;
}

/**
 * Parse VideoPopup/V1
 */
export function parseVideoPopup(element, parentId, index) {
  const id = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);
  const textAlign = parseTextAlign(wrapperStyles['text-align']);

  // Read from data attributes
  const videoUrl = element.getAttribute('data-video-url') || '';
  const videoType = element.getAttribute('data-video-type') || 'youtube';
  const thumbnail = element.getAttribute('data-thumbnail') || '';
  const overlayBg = element.getAttribute('data-overlay-bg') || 'rgba(0,0,0,0.8)';

  // Find the image element
  const img = element.querySelector('.elImage');
  const imgStyles = img ? parseInlineStyle(img.getAttribute('style') || '') : {};
  const alt = img ? img.getAttribute('alt') : '';

  // Find image wrapper for alignment and width
  const imageWrapper = element.querySelector('.elImageWrapper');
  const imageWrapperStyles = imageWrapper ? parseInlineStyle(imageWrapper.getAttribute('style') || '') : {};

  // Width comes from data-width attribute or imageWrapper styles
  const widthAttr = element.getAttribute('data-width');
  const width = parseValueWithUnit(widthAttr || imageWrapperStyles.width || '100%', '%');
  const borderRadius = parseBorderRadius(imgStyles);
  const border = parseBorder(imgStyles);
  const shadow = parseShadow(imgStyles['box-shadow']);

  // Extract video ID for thumbnail URL
  const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : '';
  const thumbnailUrl = thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '');

  const node = {
    type: 'VideoPopup/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      alt: alt || 'Video thumbnail',
    },
    params: {
      imageUrl: [{ type: 'text', innerText: thumbnailUrl }],
    },
    selectors: {
      '.elImage': {
        attrs: {
          alt,
          style: {
            width: width ? width.value : 100,
            'border-radius': borderRadius ? borderRadius.value : 16,
          },
          'data-skip-corners-settings': borderRadius ? 'false' : 'true',
          'data-skip-shadow-settings': shadow ? 'false' : 'true',
        },
        params: {
          'width--unit': width ? width.unit : '%',
          'border-radius--unit': borderRadius ? borderRadius.unit : 'px',
        },
      },
      '.elImageWrapper': {
        attrs: {
          style: {
            'text-align': textAlign || 'center',
          },
        },
      },
      '.elVideoWrapper': {
        attrs: {
          'data-video-type': videoType,
          'data-video-title': alt,
        },
        params: {
          video_url: videoUrl,
        },
      },
      '.elVideoWrapper .elVideoplaceholder_inner': {
        attrs: {
          className: 'bgCoverCenter',
        },
        params: {
          '--style-background-image-url': thumbnailUrl,
        },
      },
      '.elModal': {
        params: {
          '--style-background-color': overlayBg,
        },
      },
    },
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style || (node.attrs.style = {}), spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply border to image
  if (border.width || border.style || border.color) {
    Object.assign(node.selectors['.elImage'].params, borderToParams(border));
  }

  // Apply shadow to image
  if (shadow) {
    Object.assign(node.selectors['.elImage'].params, shadowToParams(shadow));
  }

  return node;
}

/**
 * Parse Countdown/V1
 */
export function parseCountdown(element, parentId, index) {
  const id = generateId();

  // Get element-id for scroll-to/show-hide targeting
  const elementId = element.getAttribute('id') || element.getAttribute('data-element-id');

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  // Read from data attributes
  const endDate = element.getAttribute('data-end-date') || '';
  const endTime = element.getAttribute('data-end-time') || '00:00:00';
  const timezone = element.getAttribute('data-timezone') || 'America/New_York';
  const showDays = element.getAttribute('data-show-days') !== 'false';
  const showHours = element.getAttribute('data-show-hours') !== 'false';
  const showMinutes = element.getAttribute('data-show-minutes') !== 'false';
  const showSeconds = element.getAttribute('data-show-seconds') !== 'false';
  const redirect = element.getAttribute('data-redirect') || '';
  const numberBg = normalizeColor(element.getAttribute('data-number-bg') || '#1C65E1');
  const numberColor = normalizeColor(element.getAttribute('data-number-color') || '#ffffff');
  const labelColor = normalizeColor(element.getAttribute('data-label-color') || '#164EAD');

  // Find countdown row for gap
  const countdownRow = element.querySelector('.elCountdownRow');
  const rowStyles = countdownRow ? parseInlineStyle(countdownRow.getAttribute('style') || '') : {};
  const gap = parseValueWithUnit(rowStyles.gap || '0.65em', 'em');

  // Find amount container for styling
  const amountContainer = element.querySelector('.elCountdownAmountContainer');
  const containerStyles = amountContainer ? parseInlineStyle(amountContainer.getAttribute('style') || '') : {};
  const borderRadius = parseBorderRadius(containerStyles);

  // Parse shadow from inline styles or data attribute
  // parseShadow() now handles preset names like "sm", "lg", "xl" automatically
  let shadow = parseShadow(containerStyles['box-shadow']);
  if (!shadow) {
    const shadowAttr = element.getAttribute('data-shadow');
    if (shadowAttr) {
      shadow = parseShadow(shadowAttr);
    }
  }

  // Parse border from inline styles or data attributes
  let border = parseBorder(containerStyles);
  if (!border.width && !border.style && !border.color) {
    const borderAttr = element.getAttribute('data-border');
    const borderColorAttr = element.getAttribute('data-border-color');
    if (borderAttr) {
      border = {
        width: parseValueWithUnit(borderAttr.includes('px') ? borderAttr : `${borderAttr}px`),
        style: 'solid',
        color: normalizeColor(borderColorAttr || numberBg),
      };
    }
  }

  // Find amount text for font styling
  const amountText = element.querySelector('.elCountdownAmount');
  const amountStyles = amountText ? parseInlineStyle(amountText.getAttribute('style') || '') : {};
  const numberSize = parseValueWithUnit(amountStyles['font-size'] || '28px', 'px');

  // Find period text for font styling
  const periodText = element.querySelector('.elCountdownPeriod');
  const periodStyles = periodText ? parseInlineStyle(periodText.getAttribute('style') || '') : {};
  const labelSize = parseValueWithUnit(periodStyles['font-size'] || '11px', 'px');

  const node = {
    type: 'Countdown/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      ...(elementId ? { id: elementId } : {}),
      style: {},
    },
    params: {
      type: 'countdown',
      countdown_opts: {
        show_years: false,
        show_months: false,
        show_weeks: false,
        show_days: showDays,
        show_hours: showHours,
        show_minutes: showMinutes,
        show_seconds: showSeconds,
      },
      show_colons: false,
      timezone,
      timer_action: redirect ? 'redirect_to' : 'none',
      cookie_policy: 'none',
      expire_days: 0,
      countdownTexts: {
        years: 'Years',
        months: 'Months',
        weeks: 'Weeks',
        days: 'Days',
        hours: 'Hours',
        minutes: 'Minutes',
        seconds: 'Seconds',
      },
      end_date: endDate,
      countdown_id: id,
      end_time: endTime,
      redirect_to: redirect,
    },
    selectors: {
      '.elCountdownAmount': {
        attrs: {
          style: {
            color: numberColor,
            'font-size': numberSize ? `${numberSize.value}px` : '28px',
            'font-weight': '700',
            'line-height': '100%',
          },
        },
      },
      '.elCountdownPeriod': {
        attrs: {
          style: {
            'text-transform': 'uppercase',
            color: labelColor,
            'text-align': 'center',
            'font-size': labelSize ? `${labelSize.value}px` : '11px',
            'font-weight': '600',
          },
        },
      },
      '.elCountdownRow': {
        attrs: {
          style: {
            gap: gap ? gap.value : 0.65,
            'flex-direction': 'row',
          },
        },
        params: {
          'gap--unit': gap ? gap.unit : 'em',
        },
      },
      '.elCountdownGroupDate': {
        attrs: {
          style: {
            gap: 0.78,
          },
        },
        params: {
          'gap--unit': 'em',
        },
      },
      '.elCountdownGroupTime': {
        attrs: {
          style: {
            gap: '1.1em',
          },
        },
        params: {
          'gap--unit': 'em',
        },
      },
      '.elCountdownColumn': {
        attrs: {
          style: {
            gap: '0.5em',
            'flex-direction': 'column',
            'border-style': 'none',
            'padding-top': 0,
            'padding-bottom': 0,
          },
          'data-skip-shadow-settings': 'true',
        },
        params: {
          'gap--unit': 'em',
          '--style-padding-horizontal': 0,
        },
      },
      '.elCountdownAmountContainer': {
        attrs: {
          style: {
            'line-height': '100%',
            'padding-top': 14,
            'padding-bottom': 14,
            'border-radius': borderRadius ? borderRadius.value : 16,
          },
          'data-skip-corners-settings': borderRadius ? 'false' : 'true',
          'data-skip-shadow-settings': shadow ? 'false' : 'true',
        },
        params: {
          '--style-background-color': numberBg,
          '--style-padding-horizontal': 14,
          '--style-padding-horizontal--unit': 'px',
          'padding-top--unit': 'px',
          'padding-bottom--unit': 'px',
          'border-radius--unit': borderRadius ? borderRadius.unit : 'px',
        },
      },
    },
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply border to amount container
  if (border.width || border.style || border.color) {
    Object.assign(node.selectors['.elCountdownAmountContainer'].params, borderToParams(border));
  }

  // Apply shadow to amount container
  if (shadow) {
    Object.assign(node.selectors['.elCountdownAmountContainer'].params, shadowToParams(shadow));
  }

  return node;
}
