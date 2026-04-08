# Areté Intelligence Brand Spec for SOW Documents

Authoritative styling values for the Liberty / PetWise SOW template
family. Every value here was extracted by inspecting the source XML of
the original Liberty Waste Solutions SOW (`sample_proposal.docx`).
Treat these as exact — they are not approximations.

## Color Palette

| Token | Hex | Used For |
|---|---|---|
| **Navy** | `#1B2A4A` | Title (`STATEMENT OF WORK`), section H1 headers, accent bold inline runs, table header cell shading, the "ARETÉ" portion of the wordmark, company names in the signature block |
| **Blue** | `#2E74B5` | Subtitle (engagement title), milestone H2 headers (e.g. "Milestone 1 — …"), "From X" sub-headers in the Requirements section, the "INTELLIGENCE" portion of the wordmark |
| **Gray** | `#666666` | Header line (parties / dates / dollars), header "CONFIDENTIAL" tab, footer attribution line, signature block placeholder text (name / title / date) |
| **Body** | `#333333` | Default body text, table cell text |
| **White** | `#FFFFFF` | Table header row text (rendered on the navy fill) |
| **Border gray** | `#CCCCCC` | All cell borders, the footer's top border line |

## Typography

### Font

**Aeonik** (CoType Foundry). The brand font for Areté Intelligence.

The .docx references the font by name in `<w:rFonts w:ascii="Aeonik" .../>`.
Recipients with Aeonik installed render correctly; others get a
sans-serif fallback (typically Calibri or Arial). The font is *not*
embedded in the .docx — embedding may not be permitted by the CoType
license, and a brand-font document should never be sent to a recipient
who can't read the brand font without the embedding question being
considered explicitly.

### Sizes (half-points in docx-js, which means 2 × point size)

| Element | docx-js `size` value | Pt size |
|---|---|---|
| Title (`STATEMENT OF WORK`) | 28 | 14 pt |
| Subtitle (engagement name) | 22 | 11 pt |
| H1 section header | 24 | 12 pt |
| H2 milestone header | 20 | 10 pt |
| H2 "From X" Requirements sub-header | 20 | 10 pt |
| Body text | 18 | 9 pt |
| Header wordmark "A R E T É" | 20 | 10 pt |
| Header wordmark "I N T E L L I G E N C E" | 12 | 6 pt |
| Header "CONFIDENTIAL" | 12 | 6 pt |
| Footer attribution line | 12 | 6 pt |
| Signature block placeholder lines | 16 | 8 pt |

### Weight

- Title, subtitle, H1, H2, "From X" sub-headers: **bold**
- Body text: regular
- Inline emphasis within body: **bold** (same color as surrounding body)
- Table header cells: **bold** white on navy
- First column of activity tables: **bold** dark gray
- "Milestone:" prefix in milestone paragraphs: **bold**
- Signature block company name: **bold** navy
- Signature block person name / date: regular gray
- Signature block title: italic gray

## Page Layout

| Setting | Value |
|---|---|
| Page size | US Letter (12240 × 15840 DXA) |
| Margins (all four sides) | 1 inch (1440 DXA) |
| Header offset from top | 708 DXA (~0.49 inch) |
| Footer offset from bottom | 708 DXA |
| Content width | 9360 DXA (12240 − 2 × 1440) |

## Header (every page)

A single paragraph with two parts:

```
A R E T É  I N T E L L I G E N C E                              CONFIDENTIAL
```

Parts:

- `"A R E T É"` (Aeonik 10pt bold navy) — letter-spacing achieved by literal spaces
- `"  I N T E L L I G E N C E"` (Aeonik 6pt regular blue) — note the leading double space
- A right tab to position 9026 DXA
- `"CONFIDENTIAL"` (Aeonik 6pt regular gray)

The wordmark is *typographic*, not an image. There is no logo file.

## Footer (every page)

A single paragraph with a top border + attribution text:

```
─────────────────────────────────────────────────────────────────────────────
Areté Intelligence — A Division of Areté Capital Partners
```

Parts:

- Top border: single line, 4pt size, 4pt space, color `#CCCCCC`
- Spacing before paragraph: 80 DXA
- Text: `"Areté Intelligence — A Division of Areté Capital Partners"`
  (Aeonik 6pt regular gray, em-dash not hyphen)

## Title Block (page 1 only)

Three paragraphs in sequence at the top of the document:

1. **Title**: `STATEMENT OF WORK` — Aeonik 14pt bold navy
2. **Subtitle**: the engagement title — Aeonik 11pt bold blue
3. **Header line**: `[Areté Intelligence → Client Name] | [Month Year] | [N Days] | [$Total]`
   - All in Aeonik 9pt gray, except the dollar amount which is **bold navy**
   - Em-dash separators (`|` is fine too — both are used)

Spacing: title `after: 80`, subtitle `after: 80`, header line `after: 240`.

## Section H1 (Background, Scope, Deliverables, Timeline, etc.)

- Aeonik 12pt **bold** navy
- Spacing: `before: 280`, `after: 140`

## Section H2 (Milestone titles, "From X" sub-headers)

- Aeonik 10pt **bold** blue
- Spacing: `before: 200`, `after: 100`

## Body Paragraph

- Aeonik 9pt regular `#333333`
- Spacing: `before: 0`, `after: 160` (8pt — important, this is what
  Liberty uses; do not use 120 / 6pt)
