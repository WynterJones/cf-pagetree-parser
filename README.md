# cf-pagetree-parser

Parse FunnelWind HTML to ClickFunnels PageTree JSON.

## Installation

```bash
npm install cf-pagetree-parser
```

## Usage

### ES Modules (Next.js, Node.js)

```javascript
import { parsePageTree, exportPageTreeJSON } from 'cf-pagetree-parser';

// Parse a DOM element to PageTree
const rootElement = document.querySelector('[data-type="ContentNode"]');
const pageTree = parsePageTree(rootElement, styleguideData);

// Export as JSON string
const json = exportPageTreeJSON(rootElement, true, styleguideData);
```

### Browser (Standalone Bundle)

```html
<script src="dist/cf-pagetree-parser.js"></script>
<script>
  const { parsePageTree } = CFPageTreeParser;
  const pageTree = parsePageTree(rootElement);
</script>
```

### Chrome Extension (Sandboxed)

The `dist/cf-pagetree-parser.js` bundle can be used in sandboxed extension contexts.

## API

### Main Functions

- `parsePageTree(rootElement, styleguideData?)` - Parse DOM to PageTree object
- `parseElement(element, parentId, index, styleguideData?)` - Parse single element
- `extractPageSettings(rootElement, styleguideData?)` - Extract page settings
- `exportPageTreeJSON(rootElement, formatted?, styleguideData?)` - Export as JSON string
- `downloadPageTreeJSON(rootElement, filename?, styleguideData?)` - Download JSON file
- `copyPageTreeToClipboard(rootElement, styleguideData?)` - Copy to clipboard

### Utilities

- `generateId()` - Generate unique ID
- `generateFractionalIndex(index)` - Generate fractional index for ordering
- `parseValueWithUnit(value, defaultUnit?)` - Parse CSS value with unit
- `normalizeColor(color)` - Normalize color to consistent format
- `parseInlineStyle(styleString)` - Parse inline style string to object

### Style Parsers

- `parseShadow(shadowString)` - Parse box-shadow
- `shadowToParams(shadow)` - Convert shadow to CF params
- `parseBorder(styles)` - Parse border styles
- `borderToParams(border)` - Convert border to CF params
- `parseBackground(styles)` - Parse background styles
- `backgroundToParams(background)` - Convert background to CF params

## Development

```bash
# Build standalone bundle
npm run build

# Output: dist/cf-pagetree-parser.js
```

## License

MIT
