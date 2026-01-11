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
const pageTree = parsePageTree(rootElement);

// Export as JSON string
const json = exportPageTreeJSON(rootElement, true);
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

- `parsePageTree(rootElement)` - Parse DOM to PageTree object
- `parseElement(element, parentId, index)` - Parse single element
- `extractPageSettings(rootElement)` - Extract page settings
- `exportPageTreeJSON(rootElement, formatted?)` - Export as JSON string
- `downloadPageTreeJSON(rootElement, filename?)` - Download JSON file
- `copyPageTreeToClipboard(rootElement)` - Copy to clipboard

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

## Page Settings

The parser extracts page-level settings from cf-page attributes:

| Attribute | Description |
|-----------|-------------|
| `font` | Page font family (e.g., "Poppins"). Applied to body-level styles. |
| `font-family` | Alias for `font` |
| `text-color` | Default text color (default: #334155) |
| `link-color` | Default link color (default: #3b82f6) |
| `font-weight` | Default font weight |
| `css` | Custom CSS (URL-encoded) |
| `header-code` | Custom header HTML/scripts (URL-encoded) |
| `footer-code` | Custom footer HTML/scripts (URL-encoded) |

Font values are normalized to ClickFunnels format (e.g., `"Poppins", sans-serif`).

## Development

```bash
# Build standalone bundle
npm run build

# Output: dist/cf-pagetree-parser.js
```

## License

MIT
