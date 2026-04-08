---
name: arete-intelligence-sow
description: Generate Areté Intelligence-branded Statement of Work documents (.docx) in the established Liberty / PetWise visual style. Use when the user asks to "create an Arete SOW", "build a statement of work", "draft an SOW for [client]", "make an Arete Intelligence proposal", "scope of work for [engagement]", or "generate the SOW docx". Produces a properly-styled Word document with the typographic ARETÉ INTELLIGENCE wordmark, navy/blue color palette, Aeonik font, and the specific table / paragraph conventions from the Areté template family.
---

# Areté Intelligence SOW Builder

Generate consulting Statement of Work documents for Areté Intelligence
engagements with consistent brand styling. Produce both a markdown source
of truth and a rendered .docx that matches the established visual
language of prior Areté SOWs (Liberty Waste, PetWise Brands).

## Setup Check

```bash
# Required: Node.js + the docx package (globally installed)
command -v node >/dev/null && npm root -g | xargs -I{} test -d {}/docx && echo "OK" || echo "MISSING — run: npm install -g docx"

# Required: python-docx and validators for the docx-skill validator
uv pip list 2>/dev/null | grep -qi python-docx && echo "OK" || echo "MISSING — run: uv pip install python-docx defusedxml lxml"

# Optional: LibreOffice for PDF preview rendering (lets the visual fix-check pass work)
command -v soffice >/dev/null 2>&1 && echo "OK (soffice)" || command -v libreoffice >/dev/null 2>&1 && echo "OK (libreoffice)" || echo "OPTIONAL — install libreoffice for PDF preview"
```

## When to Use

Trigger this skill when the user needs to produce or update an Areté
Intelligence SOW. Typical phrases:

- "create an Arete SOW for [client]"
- "draft a statement of work for the [engagement] project"
- "build an Arete Intelligence proposal"
- "generate the SOW docx for [client]"
- "I need a new SOW that matches the Liberty / PetWise template"

Do not trigger for: generic Word document creation (use
`document-skills:docx`), other Areté deliverables that aren't SOWs, or
non-Areté SOW templates.

## Workflow

Follow these steps in order. Each step has a deliberate output before
moving on.

### Step 1 — Gather engagement details

Ask the user for the minimum information needed to populate the SOW.
Do not start writing prose before collecting at least:

- **Client name** (e.g., "PetWise Brands")
- **Engagement title** (e.g., "Hierarchical Demand Forecasting — Foundation & First Model")
- **Engagement window** (start month + total days, e.g., "April 2026 / 45 Days")
- **Total budget** (a dollar amount or `$TBD` to fill in later)
- **Team composition** (e.g., "1 engagement lead + 2 senior software engineers")
- **Number of milestones** (typically 2–4 — see styling rules)
- **Background** — 1–3 paragraphs on the client's current state and the gap this engagement closes
- **Scope** — 1–2 paragraphs on what the engagement will and will not do
- **Deliverables** — a list of 4–6 concrete deliverables, each with a one-sentence description
- **Per-milestone activities** — for each milestone, a list of 4–6 activities and an "Achievement" sentence
- **Requirements** — what the client provides and what Areté provides
- **Working cadence** — meeting / check-in pattern
- **Assumptions** — 3–6 items
- **Investment table** — milestone payments (amounts can be `$TBD`)
- **Signatories** — name + title for both sides

If the user has only a vague request, propose a draft based on the
PetWise example in `assets/build_docx_example.js` and iterate from there.

### Step 2 — Write the markdown source

Create a markdown file at `proposal/sow_<client>_<short_title>.md`
(or wherever the user prefers). Use `assets/sow_template.md` as the
starting skeleton — it contains every section in the right order with
placeholder content to replace.

The markdown is the editable source of truth. Future revisions should
edit the markdown first, then re-generate the .docx.

### Step 3 — Write the build script

Copy `assets/build_docx_example.js` to a sibling location of the markdown
(e.g. `proposal/build_docx.js`) and replace the inline content with the
new SOW's content. The build script is a Node.js file that calls
`docx-js` directly — it has all the helper functions and styling
constants pre-defined. Editing the content sections is the only thing
that should change between SOWs.

**Critical:** the build script's content is hand-written, not parsed
from the markdown. Keep both files in sync by hand. A markdown parser
would be too fragile for the inline-bold / table / mixed-content
patterns the SOW uses.

### Step 4 — Generate the .docx

Run the build script:

```bash
cd $(dirname /path/to/build_docx.js) && NODE_PATH=$(npm root -g) node build_docx.js
```

The script writes `sow_<client>_<short_title>.docx` next to the
build script.

### Step 5 — Validate and visually fix-check

Always validate before declaring done:

```bash
# Structural validation (XML schema, no broken refs)
uv run python ~/.claude/plugins/marketplaces/anthropic-agent-skills/skills/docx/scripts/office/validate.py path/to/sow.docx

# Optional visual preview (requires LibreOffice + Aeonik font, or fallback)
cd $(dirname path/to/sow.docx) && uv run python ~/.claude/plugins/marketplaces/anthropic-agent-skills/skills/docx/scripts/office/soffice.py --headless --convert-to pdf $(basename path/to/sow.docx) && pdftoppm -jpeg -r 110 sow.pdf preview && ls preview*.jpg
```

Read each preview page and confirm:
- Header wordmark renders on every page
- Footer attribution line + top border on every page
- Section headings are navy 12pt bold
- Tables don't overflow page width
- Milestone paragraphs render *after* their table, not as a row inside
- "Accepted by:" has the colon
- Signature block has no borders

If a visual issue surfaces, edit the build script and re-run.

### Step 6 — Hand off

The final deliverable is the .docx file. The markdown source and the
build script live alongside it as the editable working copy and the
re-runnable renderer. If the user wants to commit the artifacts, follow
their normal git workflow.

## Required Knowledge

Two reference files in this skill carry the styling rules:

- **`references/brand-spec.md`** — colors (navy `#1B2A4A`, blue `#2E74B5`,
  gray `#666666`, body `#333333`, white-on-navy table headers), font
  (Aeonik with sans-serif fallback), the typographic ARETÉ INTELLIGENCE
  header wordmark exact specification, and the footer attribution line.

- **`references/styling-rules.md`** — the Liberty / PetWise structural
  conventions: milestone-after-table (not as the last row inside), prose
  paragraphs not bullet lists for From X / Cadence / Assumptions, exact
  table column widths, signature block borderless with 8pt gray
  placeholder lines, "Accepted by:" with colon, body paragraph spacing.

Read both before writing the build script content. They encode the
non-obvious patterns that distinguish a "looks like an Areté SOW" doc
from "looks like a generic Word doc with the right colors."

## Asset Files

- **`assets/sow_template.md`** — blank markdown SOW skeleton with every
  section in order. Use as the starting point for Step 2.

- **`assets/build_docx_example.js`** — complete working build script
  for the PetWise SOW. Contains every helper function (`run`, `h1`,
  `h2`, `body`, `item`, `milestone`, `deliverablesTable`,
  `activityTable`, `investmentTable`, `signatureTable`, `buildHeader`,
  `buildFooter`) plus a worked example of all the section types in
  use. Use as the starting point for Step 3 — copy it, replace the
  content, keep the helpers untouched.

## Common Pitfalls

Things to watch for, in roughly the order they bite:

1. **Putting Milestones inside the activity table.** They go *after*,
   as a separate paragraph with bold "Milestone: " prefix. The Liberty
   template does this and so should every Areté SOW.
2. **Using bullet lists for From X / Cadence / Assumptions.** Liberty
   uses prose paragraphs, one paragraph per item. Bullet lists are
   visually busier and don't match the brand.
3. **Forgetting the typographic header wordmark.** Every page needs the
   "A R E T É  I N T E L L I G E N C E" header (10pt navy bold + 6pt
   blue) with right-tabbed "CONFIDENTIAL". It is built typographically
   in the build script — there is no logo image.
4. **Wrong table column widths.** Use the values in
   `references/styling-rules.md`. Deliverables: 540 / 2200 / 6620.
   Activity: 2800 / 6560. Investment: 4680 / 2340 / 2340. Signature:
   4680 / 4680 with no borders.
5. **Body font set to Arial instead of Aeonik.** Aeonik is the brand
   font. The .docx references it by name; recipients with Aeonik
   licensed render correctly, others fall back to a sans-serif.
6. **Forgetting to validate or visually preview.** Both are mandatory
   before declaring done — see Step 5.
7. **Quoting a number we haven't measured.** SOWs sometimes describe
   accuracy targets or impact ranges. Anything that isn't a measured
   result should be framed explicitly as a target, scenario, or
   reference to a specific source — not quoted as fact.

## Source of Truth

The Liberty Waste SOW (`sample_proposal.docx` in the original
PetWise project workspace) is the authoritative styling reference. All
the brand spec values in this skill were extracted by inspecting that
file's XML directly. If any future Liberty-template SOW deviates from
the spec here, update this skill rather than the new SOW.
