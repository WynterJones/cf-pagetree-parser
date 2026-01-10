/**
 * ============================================================================
 * PAGETREE PARSER - Form Element Parsers
 * ============================================================================
 *
 * Input/V1, TextArea/V1, SelectBox/V1, Checkbox/V1
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
} from '../utils.js';

import {
  parseSpacing,
  spacingToAttrsAndParams,
  parseBorderRadius,
  parseBorder,
  borderToParams,
  parseShadow,
  shadowToParams,
  parseBackground,
} from '../styles.js';

/**
 * Parse Input/V1
 */
export function parseInput(element, parentId, index) {
  const id = generateId();

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  // Get input type from data attribute
  const inputType = element.getAttribute('data-input-type') || 'email';
  const inputName = element.getAttribute('data-input-name') || inputType;
  const isRequired = element.getAttribute('data-required') === 'true';
  const widthAttr = element.getAttribute('data-width');
  const alignAttr = element.getAttribute('data-align') || 'center';
  const placeholder = element.getAttribute('data-placeholder') || '';
  const fontSizeAttr = element.getAttribute('data-font-size');
  const colorAttr = element.getAttribute('data-color');

  // Find the container div
  const container = element.querySelector('div');
  const containerStyles = container ? parseInlineStyle(container.getAttribute('style') || '') : {};

  const background = parseBackground(containerStyles);
  const border = parseBorder(containerStyles);
  const borderRadius = parseBorderRadius(containerStyles);
  const shadow = parseShadow(containerStyles['box-shadow']);

  const paddingHorizontal = parseValueWithUnit(containerStyles['padding-left'] || '16px');
  const paddingVertical = parseValueWithUnit(containerStyles['padding-top'] || '12px');

  // Width percentage
  const width = widthAttr ? parseFloat(widthAttr) : 100;

  // Map align to CF format
  const alignMap = { 'left': 'left', 'center': 'center', 'right': 'right' };
  const marginAlign = alignMap[alignAttr] || 'center';

  // Parse margin-top with default of 0
  const marginTop = parseValueWithUnit(wrapperStyles['margin-top'] || '0px');

  const node = {
    type: 'Input/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      'data-skip-shadow-settings': shadow ? 'false' : 'true',
      type: inputType === 'phone_number' ? 'tel' : (inputType === 'email' ? 'email' : 'text'),
      style: {
        width,
        'margin-top': marginTop.value,
      },
    },
    params: {
      label: placeholder,
      labelType: 'on-border',
      type: inputType,
      '--style-background-color': background.color || '#ffffff',
      'width--unit': '%',
      '--style-margin-align': marginAlign,
      'margin-top--unit': marginTop.unit,
    },
    selectors: {
      '.elInput': {
        attrs: {
          name: inputName,
          type: inputType,
          className: isRequired ? 'required1' : 'required0',
          style: {},
        },
        params: {
          'font-size--unit': 'px',
        },
      },
      '.inputHolder, .borderHolder': {
        attrs: {
          style: {
            'padding-top': paddingVertical ? paddingVertical.value : 12,
            'padding-bottom': paddingVertical ? paddingVertical.value : 12,
          },
        },
        params: {
          '--style-padding-horizontal': paddingHorizontal ? paddingHorizontal.value : 16,
          '--style-padding-horizontal--unit': paddingHorizontal ? paddingHorizontal.unit : 'px',
          'padding-top--unit': 'px',
          'padding-bottom--unit': 'px',
        },
      },
      '&.elFormItemWrapper, .inputHolder, .borderHolder': {
        attrs: {
          style: {},
          'data-skip-corners-settings': borderRadius ? 'false' : 'true',
        },
      },
      '.borderHolder': {
        params: {
          '--style-background-color': background.color || '#ffffff',
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
    Object.assign(node.selectors['.inputHolder, .borderHolder'].params, borderToParams(border));
  } else {
    // Default border
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-width'] = 1;
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-style'] = 'solid';
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-color'] = 'rgba(0, 0, 0, 0.2)';
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-width--unit'] = 'px';
  }

  // Apply border-radius
  if (borderRadius) {
    node.selectors['&.elFormItemWrapper, .inputHolder, .borderHolder'].attrs.style['border-radius'] = borderRadius.value;
    node.selectors['&.elFormItemWrapper, .inputHolder, .borderHolder'].params = {
      'border-radius--unit': borderRadius.unit,
    };
  }

  // Handle custom type
  if (inputType === 'custom_type') {
    node.selectors['.elInput'].attrs['data-custom-type'] = inputName;
  }

  // Apply shadow
  if (shadow) {
    Object.assign(node.params, shadowToParams(shadow));
  }

  // Parse font-size - prefer data attribute, fallback to inline style
  const inputEl = container ? container.querySelector('input') : null;
  const inputStyles = inputEl ? parseInlineStyle(inputEl.getAttribute('style') || '') : {};
  const fontSize = fontSizeAttr
    ? parseValueWithUnit(fontSizeAttr)
    : parseValueWithUnit(inputStyles['font-size'] || '16px');
  if (fontSize) {
    node.selectors['.elInput'].attrs.style['font-size'] = fontSize.value;
    node.selectors['.elInput'].params['font-size--unit'] = fontSize.unit;
  }

  // Parse color - prefer data attribute, fallback to inline style
  const textColor = colorAttr
    ? normalizeColor(colorAttr)
    : (inputStyles.color ? normalizeColor(inputStyles.color) : null);
  if (textColor) {
    node.selectors['.elInput'].attrs.style.color = textColor;
  }

  return node;
}

/**
 * Parse TextArea/V1
 */
export function parseTextArea(element, parentId, index) {
  const id = generateId();

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  const textareaName = element.getAttribute('data-textarea-name') || 'message';
  const isRequired = element.getAttribute('data-required') === 'true';
  const widthAttr = element.getAttribute('data-width');
  const heightAttr = element.getAttribute('data-height');
  const alignAttr = element.getAttribute('data-align') || 'center';
  const placeholder = element.getAttribute('data-placeholder') || '';
  const fontSizeAttr = element.getAttribute('data-font-size');
  const colorAttr = element.getAttribute('data-color');

  // Find the container div
  const container = element.querySelector('div');
  const containerStyles = container ? parseInlineStyle(container.getAttribute('style') || '') : {};

  const background = parseBackground(containerStyles);
  const border = parseBorder(containerStyles);
  const borderRadius = parseBorderRadius(containerStyles);
  const shadow = parseShadow(containerStyles['box-shadow']);

  const paddingHorizontal = parseValueWithUnit(containerStyles['padding-left'] || '16px');
  const paddingVertical = parseValueWithUnit(containerStyles['padding-top'] || '12px');

  const width = widthAttr ? parseFloat(widthAttr) : 100;
  const height = heightAttr ? parseFloat(heightAttr) : 120;

  // Map align to CF format
  const alignMap = { 'left': 'left', 'center': 'center', 'right': 'right' };
  const marginAlign = alignMap[alignAttr] || 'center';

  // Parse margin-top with default of 0
  const marginTop = parseValueWithUnit(wrapperStyles['margin-top'] || '0px');

  const node = {
    type: 'TextArea/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      'data-skip-shadow-settings': shadow ? 'false' : 'true',
      style: {
        width,
        'margin-top': marginTop.value,
      },
    },
    params: {
      label: placeholder,
      labelType: 'on-border',
      '--style-background-color': background.color || '#ffffff',
      'width--unit': '%',
      '--style-margin-align': marginAlign,
      'margin-top--unit': marginTop.unit,
      height,
      'height--unit': 'px',
    },
    selectors: {
      '.elTextarea': {
        attrs: {
          name: textareaName,
          type: 'custom_type',
          'data-custom-type': textareaName,
          className: isRequired ? 'required1' : 'required0',
          style: {
            height,
          },
        },
        params: {
          'height--unit': 'px',
          'font-size--unit': 'px',
        },
      },
      '.inputHolder, .borderHolder': {
        attrs: {
          style: {
            'padding-top': paddingVertical ? paddingVertical.value : 12,
            'padding-bottom': paddingVertical ? paddingVertical.value : 12,
          },
        },
        params: {
          '--style-padding-horizontal': paddingHorizontal ? paddingHorizontal.value : 16,
          '--style-padding-horizontal--unit': paddingHorizontal ? paddingHorizontal.unit : 'px',
          'padding-top--unit': 'px',
          'padding-bottom--unit': 'px',
        },
      },
      '&.elFormItemWrapper, .inputHolder, .borderHolder': {
        attrs: {
          style: {},
          'data-skip-corners-settings': borderRadius ? 'false' : 'true',
        },
      },
      '.borderHolder': {
        params: {
          '--style-background-color': background.color || '#ffffff',
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
    Object.assign(node.selectors['.inputHolder, .borderHolder'].params, borderToParams(border));
  } else {
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-width'] = 1;
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-style'] = 'solid';
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-color'] = 'rgba(0, 0, 0, 0.2)';
    node.selectors['.inputHolder, .borderHolder'].params['--style-border-width--unit'] = 'px';
  }

  // Apply border-radius
  if (borderRadius) {
    node.selectors['&.elFormItemWrapper, .inputHolder, .borderHolder'].attrs.style['border-radius'] = borderRadius.value;
    node.selectors['&.elFormItemWrapper, .inputHolder, .borderHolder'].params = {
      'border-radius--unit': borderRadius.unit,
    };
  }

  // Apply shadow
  if (shadow) {
    Object.assign(node.params, shadowToParams(shadow));
  }

  // Parse font-size - prefer data attribute, fallback to inline style
  const textareaEl = container ? container.querySelector('textarea') : null;
  const textareaStyles = textareaEl ? parseInlineStyle(textareaEl.getAttribute('style') || '') : {};
  const fontSize = fontSizeAttr
    ? parseValueWithUnit(fontSizeAttr)
    : parseValueWithUnit(textareaStyles['font-size'] || '16px');
  if (fontSize) {
    node.selectors['.elTextarea'].attrs.style['font-size'] = fontSize.value;
    node.selectors['.elTextarea'].params['font-size--unit'] = fontSize.unit;
  }

  // Parse color - prefer data attribute, fallback to inline style
  const textColor = colorAttr
    ? normalizeColor(colorAttr)
    : (textareaStyles.color ? normalizeColor(textareaStyles.color) : null);
  if (textColor) {
    node.selectors['.elTextarea'].attrs.style.color = textColor;
  }

  return node;
}

/**
 * Parse SelectBox/V1
 */
export function parseSelectBox(element, parentId, index) {
  const id = generateId();

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  const selectName = element.getAttribute('data-select-name') || 'option';
  const selectType = element.getAttribute('data-select-type') || 'custom_type';
  const isRequired = element.getAttribute('data-required') === 'true';
  const widthAttr = element.getAttribute('data-width');
  const alignAttr = element.getAttribute('data-align') || 'center';
  const placeholder = element.getAttribute('data-placeholder') || '';
  const fontSizeAttr = element.getAttribute('data-font-size');
  const colorAttr = element.getAttribute('data-color');

  // Find the container div
  const container = element.querySelector('div');
  const containerStyles = container ? parseInlineStyle(container.getAttribute('style') || '') : {};

  const background = parseBackground(containerStyles);
  const border = parseBorder(containerStyles);
  const borderRadius = parseBorderRadius(containerStyles);
  const shadow = parseShadow(containerStyles['box-shadow']);

  const paddingHorizontal = parseValueWithUnit(containerStyles['padding-left'] || '16px');
  const paddingVertical = parseValueWithUnit(containerStyles['padding-top'] || '12px');

  // Find select element and options
  const select = element.querySelector('select');
  const options = select ? Array.from(select.querySelectorAll('option')) : [];

  const width = widthAttr ? parseFloat(widthAttr) : 100;

  // Map align to CF format
  const alignMap = { 'left': 'left', 'center': 'center', 'right': 'right' };
  const marginAlign = alignMap[alignAttr] || 'center';

  // Parse margin-top with default of 0
  const marginTop = parseValueWithUnit(wrapperStyles['margin-top'] || '0px');

  // Build children array from options
  const children = options.map((opt, optIndex) => {
    const optionId = generateId();
    const textId = generateId();
    return {
      type: 'option',
      attrs: { value: opt.value || '' },
      id: optionId,
      version: 0,
      parentId: id,
      fractionalIndex: generateFractionalIndex(optIndex),
      children: [
        {
          type: 'text',
          innerText: opt.textContent || '',
          id: textId,
          version: 0,
          parentId: optionId,
          fractionalIndex: 'a0',
        },
      ],
    };
  });

  const node = {
    type: 'SelectBox/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      style: {
        width,
        'margin-top': marginTop.value,
      },
    },
    params: {
      label: placeholder,
      labelType: 'on-border',
      'width--unit': '%',
      'margin-top--unit': marginTop.unit,
      '--style-margin-align': marginAlign,
      '--style-padding-horizontal': 0,
      '--style-padding-horizontal--unit': 'px',
      'padding-top--unit': 'px',
      'padding-bottom--unit': 'px',
    },
    selectors: {
      '.elSelectWrapper': {
        attrs: { 'data-type': selectType },
      },
      '.elSelect': {
        attrs: {
          'data-skip-corners-settings': borderRadius ? 'false' : 'true',
          'data-skip-shadow-settings': shadow ? 'false' : 'true',
          name: selectType,
          'data-custom-type': selectName,
          className: isRequired ? 'required1' : 'required0',
          style: {
            'padding-top': paddingVertical ? paddingVertical.value : 12,
            'padding-bottom': paddingVertical ? paddingVertical.value : 12,
          },
        },
        params: {
          '--style-background-color': background.color || '#ffffff',
          '--style-padding-horizontal': paddingHorizontal ? paddingHorizontal.value : 16,
          '--style-padding-horizontal--unit': paddingHorizontal ? paddingHorizontal.unit : 'px',
          'padding-top--unit': 'px',
          'padding-bottom--unit': 'px',
        },
      },
      '.elSelect, .elSelectLabel': {
        attrs: {
          style: {},
        },
        params: {
          'font-size--unit': 'px',
        },
      },
    },
    children,
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  // Apply border to .elSelect
  if (border.width || border.style || border.color) {
    Object.assign(node.selectors['.elSelect'].params, borderToParams(border));
  } else {
    node.selectors['.elSelect'].params['--style-border-width'] = 1;
    node.selectors['.elSelect'].params['--style-border-style'] = 'solid';
    node.selectors['.elSelect'].params['--style-border-color'] = 'rgba(0, 0, 0, 0.2)';
  }

  // Apply border-radius to .elSelect
  if (borderRadius) {
    node.selectors['.elSelect'].attrs.style['border-radius'] = borderRadius.value;
    node.selectors['.elSelect'].params['border-radius--unit'] = borderRadius.unit;
  }

  // Apply shadow to .elSelect
  if (shadow) {
    Object.assign(node.selectors['.elSelect'].params, shadowToParams(shadow));
  }

  // Parse font-size - prefer data attribute, fallback to inline style
  const selectEl = container ? container.querySelector('select') : null;
  const selectStyles = selectEl ? parseInlineStyle(selectEl.getAttribute('style') || '') : {};
  const fontSize = fontSizeAttr
    ? parseValueWithUnit(fontSizeAttr)
    : parseValueWithUnit(selectStyles['font-size'] || '16px');
  if (fontSize) {
    node.selectors['.elSelect, .elSelectLabel'].attrs.style['font-size'] = fontSize.value;
    node.selectors['.elSelect, .elSelectLabel'].params['font-size--unit'] = fontSize.unit;
  }

  // Parse color - prefer data attribute, fallback to inline style
  const textColor = colorAttr
    ? normalizeColor(colorAttr)
    : (selectStyles.color ? normalizeColor(selectStyles.color) : null);
  if (textColor) {
    node.selectors['.elSelect, .elSelectLabel'].attrs.style.color = textColor;
  }

  return node;
}

/**
 * Parse Checkbox/V1
 */
export function parseCheckbox(element, parentId, index) {
  const id = generateId();

  const wrapperStyles = parseInlineStyle(element.getAttribute('style') || '');
  const spacing = parseSpacing(wrapperStyles);

  const checkboxName = element.getAttribute('data-name') || 'agree';
  const isChecked = element.getAttribute('data-checked') === 'true';
  const isRequired = element.getAttribute('data-required') === 'true';

  // Find checkbox label and text
  const label = element.querySelector('label');
  const textSpan = label ? label.querySelector('span:last-child') : null;
  const labelText = textSpan ? textSpan.innerHTML : '';

  // Find the checkbox box styling
  const checkboxBox = label ? label.querySelector('span:first-of-type') : null;
  const boxStyles = checkboxBox ? parseInlineStyle(checkboxBox.getAttribute('style') || '') : {};

  const boxSize = parseValueWithUnit(boxStyles.width || '20px');
  const boxBgColor = normalizeColor(boxStyles['background-color'] || '#ffffff');
  const boxBorderMatch = (boxStyles.border || '').match(/(\d+)px\s+\w+\s+(.+)/);
  const boxBorderWidth = boxBorderMatch ? parseInt(boxBorderMatch[1], 10) : 2;
  const boxBorderColor = boxBorderMatch ? normalizeColor(boxBorderMatch[2]) : 'rgb(229, 231, 235)';
  const boxBorderRadius = parseBorderRadius(boxStyles);

  // Label text styling
  const textStyles = textSpan ? parseInlineStyle(textSpan.getAttribute('style') || '') : {};
  const labelColor = normalizeColor(textStyles.color || '#334155');
  const labelFontSize = parseValueWithUnit(textStyles['font-size'] || '16px');

  // Gap between checkbox and label
  const labelStyles = label ? parseInlineStyle(label.getAttribute('style') || '') : {};
  const gap = parseValueWithUnit(labelStyles.gap || '12px', 'em');

  const node = {
    type: 'Checkbox/V1',
    id,
    version: 0,
    parentId,
    fractionalIndex: generateFractionalIndex(index),
    attrs: {
      style: {},
    },
    params: {
      isFormItem: true,
      name: checkboxName,
      checked: isChecked,
      useCheckboxIcon: true,
      required: isRequired,
    },
    selectors: {
      '.elCheckboxLabel': {
        attrs: {
          style: {
            gap: gap ? gap.value : 1,
          },
        },
        params: {
          'gap--unit': gap ? gap.unit : 'em',
        },
      },
      '.elCheckboxLabel .elCheckboxInput ~ .elCheckbox': {
        attrs: {
          style: {
            'font-size': boxSize ? boxSize.value : 20,
            'border-radius': boxBorderRadius ? boxBorderRadius.value : 4,
            'background-color': boxBgColor,
          },
        },
        params: {
          'font-size--unit': boxSize ? boxSize.unit : 'px',
          '--style-border-style': 'solid',
          '--style-border-width': boxBorderWidth,
          '--style-border-width--unit': 'px',
          '--style-border-color': boxBorderColor,
          'border-radius--unit': boxBorderRadius ? boxBorderRadius.unit : 'px',
        },
      },
      '.elCheckboxLabel .elCheckboxInput:checked ~ .elCheckbox': {
        attrs: {
          style: {
            'background-color': 'rgb(59, 130, 246)',
          },
        },
        params: {
          '--style-border-color': 'rgb(59, 130, 246)',
        },
      },
      '.elCheckboxLabel .elCheckboxInput:checked ~ .elCheckboxText': {
        attrs: {
          style: {
            color: labelColor,
          },
        },
      },
      '.elCheckboxLabel .elCheckboxInput ~ .elCheckboxText': {
        attrs: {
          style: {
            color: labelColor,
          },
        },
      },
      '.elCheckboxText': {
        attrs: {
          style: {
            'font-weight': textStyles['font-weight'] || '400',
            'font-size': labelFontSize ? labelFontSize.value : 16,
          },
        },
        params: {
          'font-size--unit': labelFontSize ? labelFontSize.unit : 'px',
        },
      },
    },
    children: [
      {
        type: 'ContentEditableNode',
        slotName: 'label',
        id: '',
        version: 0,
        parentId: '',
        fractionalIndex: 'a0',
        children: parseHtmlToTextNodes(labelText),
      },
    ],
  };

  // Apply spacing
  const { attrs: spacingAttrs, params: spacingParams } = spacingToAttrsAndParams(spacing);
  Object.assign(node.attrs.style, spacingAttrs.style);
  Object.assign(node.params, spacingParams);

  return node;
}
