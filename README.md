# cf-pagetree-parser

Parse FunnelWind HTML to ClickFunnels PageTree JSON.

**Requires [cf-elements](https://www.npmjs.com/package/cf-elements)** - This parser works on the rendered HTML output from cf-elements. The cf-elements package renders FunnelWind custom elements (like `<cf-section>`, `<cf-headline>`, `<cf-button>`) into the DOM structure that this parser reads.

## Installation

```bash
npm install cf-pagetree-parser
```

## Usage

### ES Modules (Next.js, Node.js)

```javascript
import { parsePageTree } from 'cf-pagetree-parser';

// Parse to PageTree JSON (automatically finds ContentNode)
const pageTree = parsePageTree();

// The result is ready for ClickFunnels import
console.log(JSON.stringify(pageTree, null, 2));
```

### Browser (Standalone Bundle)

```html
<script src="dist/cf-pagetree-parser.js"></script>
<script>
  const { parsePageTree } = CFPageTreeParser;

  // Automatically finds ContentNode in the document
  const pageTree = parsePageTree();
</script>
```

### Chrome Extension (Sandboxed)

The `dist/cf-pagetree-parser.js` bundle can be used in sandboxed extension contexts.

## API

### Main Functions

- `parsePageTree(rootElement?)` - Parse DOM to PageTree object. If no element provided, automatically finds ContentNode.
- `exportPageTreeJSON(rootElement?, formatted?)` - Export as JSON string
- `downloadPageTree(filename?, rootElement?)` - Download JSON file
- `copyPageTreeToClipboard(rootElement?)` - Copy to clipboard

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
| `color` | Default text color for all elements (default: #334155) |
| `text-color` | Alias for `color` |
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
