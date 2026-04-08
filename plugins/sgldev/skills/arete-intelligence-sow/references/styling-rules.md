# Areté Intelligence SOW — Structural Conventions

The Liberty Waste / PetWise SOW template family follows specific
structural patterns beyond raw color and typography. These rules
distinguish a well-formed Areté SOW from a generic Word document with
the right brand colors. Match every rule below.

## Document Structure

The SOW always has these top-level sections in this order:

1. **Title block** — STATEMENT OF WORK / engagement title / parties+date+duration+dollars
2. **Background** — current state, the gap, what this engagement closes
3. **(optional) Industry Research** — prior art at named competitors / public benchmarks. Include when the engagement involves modeling, ML, or anything where peer practice is meaningful evidence.
4. **Scope** — what the engagement will and will not do
5. **Deliverables** — numbered table of concrete outputs
6. **Timeline** — milestones in order, each with an activity table + a Milestone achievement paragraph
7. **Requirements** — From Client / From Areté Intelligence
8. **Working Cadence** — meeting / check-in pattern
9. **Assumptions** — preconditions and out-of-scope notes
10. **Investment** — milestone × amount × due-date table
11. **Accepted by:** — signature block

The order is fixed. Sections may be omitted if they don't apply (e.g.
small engagements may skip Industry Research) but never reordered.

## Milestones Live OUTSIDE the Activity Table

This is the single most-violated convention.

**Wrong** — Milestone as the last row of the activity table:

```
| Activity            | Detail                          |
|---------------------|---------------------------------|
| Kickoff             | …                               |
| Data integration    | …                               |
| **Achievement**     | Validated pipeline. Brief done. |
```

**Right** — Milestone as a *separate paragraph after* the table:

```
| Activity            | Detail                          |
|---------------------|---------------------------------|
| Kickoff             | …                               |
| Data integration    | …                               |

**Milestone:** Validated pipeline. Brief done.
```

In docx terms, the Milestone is a `Paragraph` with two runs:
- `"Milestone: "` (bold, dark gray, 9pt)
- The achievement text (regular, dark gray, 9pt)

Spacing: `before: 120`, `after: 240`.

The build script's `milestone(text)` helper produces exactly this.

## Prose Paragraphs, Not Bullet Lists

Liberty does *not* use bullet lists for the From X / Working Cadence /
Assumptions sections. Each item is its own short prose paragraph with
8pt spacing-after between paragraphs.

**Wrong** — bullet list:

```
- Weekly check-in with operational contact.
- Bi-weekly leadership review.
- Executive briefing at day 45.
```

**Right** — paragraph per item:

```
Weekly check-in with operational contact.

Bi-weekly leadership review.

Executive briefing at day 45.
```

In docx terms, each "bullet" becomes a `Paragraph` with `spacing: { after: 120 }`.
The build script's `item(children)` helper does exactly this. Do not
use docx-js's `numbering` configuration; the SOW template doesn't use
Word's list machinery.

The only places this rule applies:
- Requirements → From Client
- Requirements → From Areté Intelligence (often a single paragraph anyway)
- Working Cadence
- Assumptions

The Deliverables and Investment sections use tables. Activity tables
inside Timeline obviously use rows. Industry Research uses paragraphs
with bold inline sub-heads (`**Pet-industry peers.** ...`).

## Table Column Widths (DXA, must sum to 9360)

Use these exact values. They were measured from the Liberty source XML.

| Table | Columns | Widths (DXA) |
|---|---|---|
| **Deliverables** (3 col: # / Deliverable / Description) | 3 | `[540, 2200, 6620]` |
| **Activity** (2 col: Activity / Detail) | 2 | `[2800, 6560]` |
| **Investment** (3 col: Milestone / Amount / Due) | 3 | `[4680, 2340, 2340]` |
| **Signature** (2 col: PetWise / Areté) | 2 | `[4680, 4680]` |

The signature table is special — see below.

## Table Cell Styling

All non-signature tables use the same cell styling:

- **Borders**: single 4pt size, color `#CCCCCC`, on top / bottom / left / right
- **Cell margins** (internal padding): `top: 100, bottom: 100, left: 140, right: 140`
- **Header row**: white text on navy fill (`shading: { fill: "1B2A4A", type: ShadingType.CLEAR }`), bold

Body cells use the standard body text color `#333333` at 9pt. Some
cells have inline bold (e.g. the deliverable name in column 2 of the
Deliverables table is bold; the activity name in column 1 of the
activity tables is bold).

## Signature Block Conventions

The signature block is a single-row, two-column table with **no
borders**. Each cell contains four short paragraphs:

1. **Company name** — 9pt bold navy
2. **Person name** — 8pt regular gray
3. **Title** — 8pt italic gray
4. **Date placeholder** — 8pt regular gray, e.g. `Date: _______________`

Spacing inside the cell: `after: 40` between each line, `after: 0` on
the last line. Cell margins: `top: 80, bottom: 80, left: 120, right: 120`.

Set borders to `BorderStyle.NONE` on every side (top, bottom, left,
right) of every cell *and* on the table itself. The build script's
`signatureCell()` and `signatureTable()` helpers do this.

## "Accepted by:" — With the Colon

The signature section H1 header is `Accepted by:` (with the colon),
not `Accepted by` or `Acceptance` or `Signatures`. Match Liberty.

## Header Line Format

The third line of the title block, between the engagement title and
the Background section, is a single paragraph in this exact format:

```
Areté Intelligence → [Client Name] | [Month Year] | [N Days] | [$Amount or $TBD]
```

- Aeonik 9pt regular gray for everything except the dollar amount
- Aeonik 9pt **bold navy** for the dollar amount
- Use the right-arrow `→` (U+2192), not `->`
- Use spaces around the pipe separators
- Use `$TBD` (literal) when the price isn't locked yet — Adam fills it in later

## Body Paragraph Spacing

Body paragraphs use `spacing: { before: 0, after: 160 }` (8pt after,
no before). This is what Liberty uses; do *not* use 120 / 6pt — it
visually compresses sections in a way that doesn't match the template.

The single exception is the bullet-replacement `item()` paragraphs in
Requirements / Cadence / Assumptions, which use 120 / 6pt for tighter
visual grouping.

## Inline Bold vs. Italic

- **Bold** (`bold: true`) for emphasis on key terms, defined acronyms,
  product names, and the inline sub-heads in Industry Research
  (`**Pet-industry peers.** ...`). Bold inherits the surrounding color
  by default.
- *Italics* (`italics: true`) only for the connector word "and" inside
  a list of two items (an Areté style choice), titles of works, and
  position titles in the signature block.

Avoid italic body text otherwise — it doesn't render well in Aeonik
fallbacks and reads as a stylistic over-reach.

## Smart Quotes and Em Dashes

Use proper Unicode characters:

- Em dash: `—` (U+2014), never `--`
- En dash (for date ranges): `–` (U+2013), e.g. `Days 1–20`
- Curly double quotes: `"…"` (U+201C / U+201D)
- Curly single quote: `'` (U+2019)
- Plus / minus: `±` (U+00B1)
- Times: `×` (U+00D7)
- Greater-or-equal: `≥` (U+2265)
- Right arrow: `→` (U+2192)
- Sigma: `Σ` (U+03A3)

In JavaScript strings inside the build script, escape with the `\u`
form when the literal character would be ambiguous.

## Out-of-Scope Items in the Scope Section

If the engagement is gated or has known follow-on work, *call out the
out-of-scope items in a second paragraph of the Scope section*. The
words "out of scope" should be **bold inline**. Refer the reader
forward to the gate-review deliverable in Milestone N.

Example:

> Cross-sectional reconciliation, planner-facing override workflow,
> and promo-lift decomposition are explicitly **out of scope** for
> this engagement and will be scoped in Milestone 3's gate-review
> deliverable, contingent on the Milestone 2 results.

## Achievement Sentences

Each milestone's achievement (the text after "Milestone:") is one to
three sentences describing what the client receives at the end of that
milestone. Concrete and verifiable. Avoid target ranges or hypothetical
language.

**Good**: "Validated data pipeline across all three facilities. SKU
master loaded. KPI scorecard reproducing the SIOP deck's headline
numbers. First-pass review with Matt."

**Bad**: "Should achieve approximately 50% within ±25% accuracy on the
top SKUs." (Target ranges should not be quoted as deliverables.)

## What Liberty's "All outputs are owned by [client] upon completion" Line Does

After the Deliverables table, Liberty has a single bold sentence:

```
All outputs and data infrastructure are owned by [Client] upon completion.
```

Always include this. It's a contractual ownership clause and goes in
bold dark gray immediately after the deliverables table.
