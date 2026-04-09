// =====================================================================
// Areté Intelligence SOW Build Script — REFERENCE EXAMPLE
// =====================================================================
//
// This file is a complete, working build script for the PetWise Brands
// SOW. It is included in the arete-intelligence-sow skill as a copyable
// reference for building new SOWs in the same style.
//
// HOW TO USE THIS FILE FOR A NEW ENGAGEMENT:
//
//   1. Copy this file next to your engagement's markdown source, e.g.
//      `proposal/build_docx.js`.
//   2. Leave the helpers section (lines ~30 through ~600) UNTOUCHED.
//      It encodes the brand spec and Liberty styling rules — those
//      values are not for tuning per engagement.
//   3. Replace the content section (the `sections: [{ children: [...] }]`
//      array inside `new Document()`) with the new engagement's content.
//      Keep the section order: title block → Background → Industry
//      Research → Scope → Deliverables → Timeline (with milestones) →
//      Requirements → Working Cadence → Assumptions → Investment →
//      Accepted by:.
//   4. Replace the deliverables / activity / investment / signature
//      content inside the corresponding helper functions with the new
//      engagement's content. The COLS arrays (table column widths)
//      should NOT change — they are part of the brand spec.
//   5. Update the output filename at the bottom of the file.
//   6. Run with:
//        cd $(dirname build_docx.js) && \
//          NODE_PATH=$(npm root -g) node build_docx.js
//   7. Validate with the docx-skill validator (see SKILL.md Step 5).
//
// DO NOT change:
//   - The color palette constants (NAVY, BLUE, GRAY, TEXT, WHITE, BORDER_GRAY)
//   - The FONT constant ("Aeonik")
//   - Helper function bodies (run, h1, h2, body, item, milestone, etc.)
//   - Table COLS arrays (deliverables: [540,2200,6620], activity:
//     [2800,6560], investment: [4680,2340,2340], signature: [4680,4680])
//   - The buildHeader() and buildFooter() function contents
//   - The page size, margins, header/footer offsets
//
// DO change (per engagement):
//   - The title block strings
//   - The Background, Industry Research, Scope paragraph contents
//   - The deliverables row data inside deliverablesTable()
//   - The activity rows inside each activityTable() call
//   - The milestone() text after each table
//   - The Requirements / Working Cadence / Assumptions paragraphs
//   - The investmentTable() row data
//   - The signatureCell() data (company name, person, title)
//   - The output filename
//
// =====================================================================
//
// Build the PetWise SOW .docx, matching the styling of the Liberty
// Waste SOW. Run with: NODE_PATH=$(npm root -g) node build_docx.js

const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  HeightRule,
  Header,
  Footer,
  TabStopType,
  TabStopPosition,
} = require("docx");

// ---- color palette (matched to sample_proposal.docx) ---------------
const NAVY = "1B2A4A";   // titles, H1, accent bold
const BLUE = "2E74B5";   // subtitle, H2 (milestone names)
const GRAY = "666666";   // header line
const TEXT = "333333";   // body, table cells, bullet text
const WHITE = "FFFFFF";  // table header text
const BORDER_GRAY = "CCCCCC"; // matches Liberty cell borders

// ---- typography helpers --------------------------------------------
// Areté Intelligence's brand font is Aeonik (CoType Foundry). The .docx
// references it by name; Word resolves the actual glyphs from whatever
// the recipient has installed. PetWise / Areté machines should have
// Aeonik licensed; on machines without it, Word will substitute and the
// document will still render legibly in a sans-serif fallback.
const FONT = "Aeonik";

function run(text, opts = {}) {
  return new TextRun({
    text,
    font: FONT,
    size: opts.size ?? 18,        // 9pt default (sizes are half-points)
    bold: opts.bold ?? false,
    italics: opts.italics ?? false,
    color: opts.color ?? TEXT,
  });
}

function emptyP() {
  return new Paragraph({ children: [run("")], spacing: { before: 0, after: 0 } });
}

function title(text) {
  return new Paragraph({
    children: [run(text, { size: 28, bold: true, color: NAVY })], // 14pt
    spacing: { before: 0, after: 80 },
  });
}

function subtitle(text) {
  return new Paragraph({
    children: [run(text, { size: 22, bold: true, color: BLUE })], // 11pt
    spacing: { before: 0, after: 80 },
  });
}

// header line: "Areté Intelligence → PetWise Brands | April 2026 | 45 Days | $TBD"
// $TBD is bold and navy
function headerLine() {
  return new Paragraph({
    children: [
      run("Areté Intelligence → PetWise Brands | April 2026 | 45 Days | ", {
        size: 18,
        color: GRAY,
      }),
      run("$TBD", { size: 18, bold: true, color: NAVY }),
    ],
    spacing: { before: 0, after: 240 },
  });
}

function h1(text) {
  return new Paragraph({
    children: [run(text, { size: 24, bold: true, color: NAVY })], // 12pt
    spacing: { before: 280, after: 140 },
  });
}

function h2(text) {
  return new Paragraph({
    children: [run(text, { size: 20, bold: true, color: BLUE })], // 10pt
    spacing: { before: 200, after: 100 },
  });
}

// Body paragraph from a list of TextRuns (for inline bold/italic mixing)
function body(children, opts = {}) {
  return new Paragraph({
    children,
    spacing: { before: 0, after: 160, ...opts.spacing },
    alignment: opts.alignment,
  });
}

// Body paragraph with a single plain string
function bodyText(text, opts = {}) {
  return body([run(text, opts)], opts);
}

// Liberty doesn't use bulleted lists — each item that would have been a
// bullet is its own short paragraph. Use this for items in From PetWise /
// Working Cadence / Assumptions blocks.
function item(children) {
  return new Paragraph({
    children,
    spacing: { before: 0, after: 160 },
  });
}

// "Milestone:" paragraph that follows each activity table.
// Bold "Milestone: " in dark gray, then the achievement text in regular.
function milestone(text) {
  return new Paragraph({
    children: [
      run("Milestone: ", { bold: true }),
      run(text),
    ],
    spacing: { before: 120, after: 240 },
  });
}

// ---- table helpers --------------------------------------------------
const CONTENT_WIDTH = 9360; // 8.5" page - 1" margins on each side, in DXA
const SINGLE_BORDER = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: BORDER_GRAY,
};
const ALL_BORDERS = {
  top: SINGLE_BORDER,
  bottom: SINGLE_BORDER,
  left: SINGLE_BORDER,
  right: SINGLE_BORDER,
};

function cell({ children, width, header = false, shading = null, bold = false }) {
  const para = Array.isArray(children)
    ? children
    : [
        new Paragraph({
          children: [
            run(children, {
              size: 18,
              bold: header || bold,
              color: header ? WHITE : TEXT,
            }),
          ],
          spacing: { before: 0, after: 0 },
        }),
      ];
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    borders: ALL_BORDERS,
    shading: shading
      ? { fill: shading, type: ShadingType.CLEAR, color: "auto" }
      : header
      ? { fill: NAVY, type: ShadingType.CLEAR, color: "auto" }
      : null,
    children: para,
  });
}

// Build a paragraph from rich content for use inside a cell.
// Each item in `parts` is either a string (treated as plain text)
// or { text, bold, italics } for inline formatting.
function cellRich(parts, opts = {}) {
  const runs = parts.map((p) => {
    if (typeof p === "string") return run(p, { size: 18 });
    return run(p.text, {
      size: 18,
      bold: p.bold ?? false,
      italics: p.italics ?? false,
      color: TEXT,
    });
  });
  return [
    new Paragraph({
      children: runs,
      spacing: { before: 0, after: 0 },
    }),
  ];
}

// ---- specific tables ------------------------------------------------

// Deliverables table: # / Deliverable / Description
// Column widths match Liberty exactly: 540 / 2200 / 6620 (sums to 9360)
function deliverablesTable() {
  const COLS = [540, 2200, 6620];
  const headerRow = new TableRow({
    children: [
      cell({ children: "#", width: COLS[0], header: true }),
      cell({ children: "Deliverable", width: COLS[1], header: true }),
      cell({ children: "Description", width: COLS[2], header: true }),
    ],
  });

  const rows = [
    {
      n: "1",
      name: "Unified data warehouse",
      desc: [
        "Cloud-native warehouse (DuckDB / Snowflake / BigQuery, fitted to PetWise's environment) with ",
        { text: "automated, scheduled-refresh connectors", bold: true },
        " to Walmart Luminate, Petco OneView, NIQ Discover, the Safio Planning System, and Power BI. No manual Excel re-exports.",
      ],
    },
    {
      n: "2",
      name: "Canonical 13-digit SKU master",
      desc: "Cross-reference table mapping PetWise's internal 13-digit SKU (the canonical key per the SOP) to Walmart Prime Item Nbr, Petco SKU_ID/UPC, NIQ UPC, and Amazon ASIN. The data backbone for everything downstream.",
    },
    {
      n: "3",
      name: "Point-in-time forecast back-test corpus",
      desc: "Weekly snapshots of PetWise's Safio 120-day forecast joined to the actuals that landed on the corresponding weeks. The first time PetWise has a queryable history of forecast accuracy at SKU × week × customer grain. This is the measurement infrastructure that makes every later improvement claim defensible.",
    },
    {
      n: "4",
      name: "Standardized KPI scorecard",
      desc: "Automated reproduction of PetWise's existing operations KPIs — % of top SKUs within ±25% / ±15% of forecast, fill rate, OOS%, days of supply, inventory turns, E&O% — in the same definitions Matt uses in the monthly SIOP deck. Replaces hand-maintained spreadsheets.",
    },
    {
      n: "5",
      name: "First hierarchical forecasting model — all 3 facilities, full active SKU population",
      desc: [
        "Trained on every active SKU PetWise ships across Novato, Ferndale, and Mundelein. Built using the Nixtla open-source stack — statsforecast for the statistical baselines (auto_arima, ets, theta, seasonal_naive for the smooth and seasonal series; croston_sba, tsb, imapa, adida for the intermittent and lumpy long tail) and mlforecast for a Tweedie-loss global LightGBM panel built on three rails of features: internal POS history, retailer-side store / traffic / in-stock signals, and consumer / environmental signals (NIQ category share, competitor share by account, promo-lift multiplier). SKUs are first segmented by demand pattern (Syntetos-Boylan quadrant) so each gets the right model class. A stage-by-stage Forecast-Value-Added (FVA) scorecard compares the model against PetWise's current 120-day Safio forecast on a real out-of-sample backtest. ",
        { text: "The headline accuracy metric is WMAPE on the full portfolio", bold: true },
        "; PetWise's existing \u201C% of SKUs within \u00B125%\u201D KPI is reported as a continuity view for the SIOP deck. Results are broken out at ",
        { text: "four cuts", bold: true },
        ": (1) the ",
        { text: "top-293 SKUs", bold: true },
        " PetWise's monthly SIOP deck currently tracks, so leadership can compare apples-to-apples against the existing 32% / 38% within-goal numbers; (2) the ",
        { text: "full active SKU population", bold: true },
        ", the headline number leadership does not currently have; (3) per ",
        { text: "Syntetos-Boylan demand-pattern segment", bold: true },
        ", so we can show where the model adds value vs where Croston-family baselines suffice; and (4) per ",
        { text: "facility", bold: true },
        " and per ",
        { text: "top customer", bold: true },
        ", matching the breakouts already in the SIOP deck.",
      ],
    },
    {
      n: "6",
      name: "Gate review and follow-on scoping recommendation",
      desc: "Written recommendation, based on what Milestones 1 and 2 actually surface, on whether and how to proceed with hierarchical reconciliation (Nixtla hierarchicalforecast with MinT cross-sectional + THieF temporal), planner-facing override workflow with reason codes, Safio Tableau integration, deep-learning hero-SKU sub-models (NHITS / TFT via neuralforecast), foundation-model cold-start (Chronos-2 / TimesFM 2.5), and promo-lift decomposition (PyMC-Marketing). This is the gate for any follow-on engagement.",
    },
  ];

  const dataRows = rows.map(
    (r) =>
      new TableRow({
        children: [
          cell({ children: r.n, width: COLS[0], bold: true }),
          cell({
            children: [
              new Paragraph({
                children: [run(r.name, { size: 18, bold: true })],
                spacing: { before: 0, after: 0 },
              }),
            ],
            width: COLS[1],
          }),
          cell({
            children: cellRich(Array.isArray(r.desc) ? r.desc : [r.desc]),
            width: COLS[2],
          }),
        ],
      }),
  );

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: COLS,
    rows: [headerRow, ...dataRows],
  });
}

// Activity tables (Milestones): 2 columns, Activity / Detail
// Column widths match Liberty: 2800 / 6560 (sums to 9360)
function activityTable(rows) {
  const COLS = [2800, 6560];
  const headerRow = new TableRow({
    children: [
      cell({ children: "Activity", width: COLS[0], header: true }),
      cell({ children: "Detail", width: COLS[1], header: true }),
    ],
  });

  const dataRows = rows.map((r) => {
    // r.activity may have inline bold; r.detail too
    const activityRuns = Array.isArray(r.activity)
      ? r.activity
      : [{ text: r.activity, bold: true }];
    const detailRuns = Array.isArray(r.detail) ? r.detail : [r.detail];
    return new TableRow({
      children: [
        cell({ children: cellRich(activityRuns), width: COLS[0] }),
        cell({ children: cellRich(detailRuns), width: COLS[1] }),
      ],
    });
  });

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: COLS,
    rows: [headerRow, ...dataRows],
  });
}

// Investment table: 3 cols, Milestone / Amount / Due
// Column widths match Liberty: 4680 / 2340 / 2340 (sums to 9360)
function investmentTable() {
  const COLS = [4680, 2340, 2340];
  const headerRow = new TableRow({
    children: [
      cell({ children: "Milestone", width: COLS[0], header: true }),
      cell({ children: "Amount", width: COLS[1], header: true }),
      cell({ children: "Due", width: COLS[2], header: true }),
    ],
  });

  const lines = [
    ["Milestone 1 — Data Foundation", "$TBD", "Day 20"],
    ["Milestone 2 — Forecasting Model & Backtest", "$TBD", "Day 40"],
    ["Milestone 3 — Deliver, Brief & Gate", "$TBD", "Day 45"],
  ];

  const dataRows = lines.map(
    (line) =>
      new TableRow({
        children: [
          cell({ children: line[0], width: COLS[0], bold: true }),
          cell({ children: line[1], width: COLS[1] }),
          cell({ children: line[2], width: COLS[2] }),
        ],
      }),
  );

  const totalRow = new TableRow({
    children: [
      cell({ children: "Total", width: COLS[0], bold: true }),
      cell({ children: "$TBD", width: COLS[1], bold: true }),
      cell({ children: "", width: COLS[2] }),
    ],
  });

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: COLS,
    rows: [headerRow, ...dataRows, totalRow],
  });
}

// Signature table: 1 row, 2 cols, no borders.
// Each cell: company name (9pt navy bold) / person name (8pt gray) /
// title (8pt gray italic) / date placeholder (8pt gray).
function signatureCell(company, name, title) {
  return [
    new Paragraph({
      children: [run(company, { size: 18, bold: true, color: NAVY })],
      spacing: { before: 0, after: 40 },
    }),
    new Paragraph({
      children: [run(name, { size: 16, color: GRAY })],
      spacing: { before: 0, after: 40 },
    }),
    new Paragraph({
      children: [run(title, { size: 16, italics: true, color: GRAY })],
      spacing: { before: 0, after: 40 },
    }),
    new Paragraph({
      children: [run("Date: _______________", { size: 16, color: GRAY })],
      spacing: { before: 0, after: 0 },
    }),
  ];
}

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
};

function signatureTable() {
  const COL = CONTENT_WIDTH / 2;
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [COL, COL],
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            borders: NO_BORDERS,
            children: signatureCell(
              "PetWise Brands",
              "Aaron Lamstein",
              "Chief Executive Officer",
            ),
          }),
          new TableCell({
            width: { size: COL, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            borders: NO_BORDERS,
            children: signatureCell(
              "Areté Intelligence",
              "Spencer Lyon",
              "Head of Areté Intelligence",
            ),
          }),
        ],
      }),
    ],
  });
}

// ---- header & footer (matched to Liberty exactly) -------------------

// Liberty's "logo" is a typographic wordmark, not an image:
//   "A R E T É" (10pt navy bold) + "  I N T E L L I G E N C E" (6pt blue)
//   tab-aligned right: "CONFIDENTIAL" (6pt gray)
function buildHeader() {
  return new Header({
    children: [
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: 9026 }],
        children: [
          run("A R E T É", { size: 20, bold: true, color: NAVY }),
          run("  I N T E L L I G E N C E", { size: 12, color: BLUE }),
          new TextRun({
            text: "\tCONFIDENTIAL",
            font: FONT,
            size: 12,
            color: GRAY,
          }),
        ],
      }),
    ],
  });
}

// Footer: top border (single 4pt #CCCCCC) + "Areté Intelligence — A
// Division of Areté Capital Partners" in 6pt gray.
function buildFooter() {
  return new Footer({
    children: [
      new Paragraph({
        border: {
          top: {
            color: BORDER_GRAY,
            space: 4,
            style: BorderStyle.SINGLE,
            size: 4,
          },
        },
        spacing: { before: 80 },
        children: [
          run(
            "Areté Intelligence \u2014 A Division of Areté Capital Partners",
            { size: 12, color: GRAY },
          ),
        ],
      }),
    ],
  });
}

// ---- assemble the document ------------------------------------------

const doc = new Document({
  creator: "Areté Intelligence",
  title: "Hierarchical Demand Forecasting for PetWise Brands — Foundation & First Model",
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 18, color: TEXT },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
            header: 708,
            footer: 708,
          },
        },
      },
      headers: { default: buildHeader() },
      footers: { default: buildFooter() },
      children: [
        // ---- Title block ----
        title("STATEMENT OF WORK"),
        subtitle("Hierarchical Demand Forecasting for PetWise Brands — Foundation & First Model"),
        headerLine(),

        // ---- Background ----
        h1("Background"),
        body([
          run(
            "PetWise runs a monthly SIOP cycle on the Safio Planning System across three facilities (Novato, Ferndale, Mundelein) with a top-293 SKU set that contributes 80% of revenue. Per the March 2026 SIOP Executive Review, the published forecast accuracy of those top SKUs is ",
          ),
          run("32% within \u00B125% of actual on a 120-day horizon", { bold: true }),
          run(" and "),
          run("38% within \u00B125% on the current forecast", { bold: true }),
          run(". Ferndale is the worst facility at "),
          run("17% within goal", { bold: true }),
          run(
            " on the 120-day horizon, with the highest out-of-stock rate (21% of ordered dollars) and the most over-stocked inventory (215 days of supply against a 162-day goal). The financial cost of these forecast errors is visible on the balance sheet: ",
          ),
          run(
            "$11.8M of inventory (30% of $38.7M total) is either excess (>365 days old) or obsolete",
            { bold: true },
          ),
          run("."),
        ]),
        body([
          run(
            "The existing demand-planning process is analyst-driven, supported by Safio (system of record), Safio Tableau (analyst reporting), Power BI (downstream sales reporting), and Excel for analysis. There is no statistical or machine-learning component in the forecasting loop today.",
          ),
        ]),
        body([
          run(
            "This engagement builds the data foundation and delivers the first measurable forecast-accuracy improvement against PetWise's own published KPIs, modeled across the ",
          ),
          run("full active SKU population at all three facilities", { bold: true }),
          run(
            " and reported at multiple cuts so the results land cleanly in PetWise's existing top-293 monthly SIOP review ",
          ),
          run("and", { italics: true }),
          run(" extend to the long tail that today has no statistical forecast at all."),
        ]),

        // ---- Industry Research ----
        h1("Industry Research"),
        body([
          run(
            "The methodology is grounded in a prior-art review of CPG demand-forecasting approaches at PetWise's named competitors and the closest public retail benchmark. The full literature and tooling survey is available on request.",
          ),
        ]),
        body([
          run("Pet-industry peers.", { bold: true }),
          run(
            " Mars Petcare publicly uses Microsoft Azure ML, Vizit, and Harmonya for animal-health diagnostics and ecommerce optimization, but its internal demand-forecasting architecture is not publicly disclosed. Hill's, Central Garden & Pet, and Chewy do not publish detailed forecasting case studies — their work is internal. Chewy's stack is inferable from engineering blog signals and job postings as ",
          ),
          run("Snowflake + dbt + Airflow + LightGBM + DeepAR", { bold: true }),
          run(
            " for replenishment forecasting, which is functionally equivalent to the Nixtla mlforecast + neuralforecast pattern this engagement proposes. The honest finding is that ",
          ),
          run(
            "PetWise's named competitors do not publish enough about their forecasting practice to copy them directly",
            { bold: true },
          ),
          run(
            " — the opportunity is to apply the modeling pattern proven at scale on the closest public benchmark to PetWise's specific data and KPIs.",
          ),
        ]),
        body([
          run("Public benchmark.", { bold: true }),
          run(" The Walmart "),
          run("M5 competition", { bold: true }),
          run(
            " (42,840-series hierarchical SKU \u00D7 store \u00D7 week panel) is the closest public reference for the modeling approach in Milestone 2. M5 winners universally used global LightGBM panel models with rich exogenous features — the same architecture proposed here.",
          ),
        ]),
        body([
          run("Industry data.", { bold: true }),
          run(" PetWise already subscribes to "),
          run("NielsenIQ Pet Channel Plus", { bold: true }),
          run(
            " (~$350K/yr), the de facto industry-standard input for pet category baseline and lift modeling and the same syndicated source Mars Petcare uses. This is part of why the data foundation in Milestone 1 is build-out work, not data-acquisition work.",
          ),
        ]),

        // ---- Scope ----
        h1("Scope"),
        body([
          run("Stand up a unified data warehouse with "),
          run("automated, direct integrations", { bold: true }),
          run(
            " to PetWise's customer point-of-sale systems, syndicated panel data, and the Safio Planning System; build a real point-in-time forecast back-test corpus (which does not exist today); and deliver a first hierarchical demand-forecasting model trained on ",
          ),
          run(
            "PetWise's full active SKU population across Novato, Ferndale, and Mundelein",
            { bold: true },
          ),
          run(
            ". The Forecast-Value-Added scorecard is reported at multiple cuts so it lands cleanly in PetWise's existing SIOP review (the top-293 leadership-tracked subset) ",
          ),
          run("and", { italics: true }),
          run(" extends to the full SKU population that today has no statistical forecast at all."),
        ]),
        body([
          run(
            "Cross-sectional and temporal hierarchical reconciliation, planner-facing override workflow with reason codes, Safio Tableau integration as a \u201CSuggested Forecast\u201D column next to the analyst-tuned forecast, and promo-lift decomposition are explicitly ",
          ),
          run("out of scope", { bold: true }),
          run(
            " for this engagement and will be scoped in Milestone 3's gate-review deliverable, contingent on the Milestone 2 results.",
          ),
        ]),

        // ---- Deliverables ----
        h1("Deliverables"),
        deliverablesTable(),
        emptyP(),
        new Paragraph({
          children: [
            run("All outputs and data infrastructure are owned by PetWise upon completion.", {
              bold: true,
            }),
          ],
          spacing: { before: 80, after: 120 },
        }),

        // ---- Timeline ----
        h1("Timeline"),

        h2("Milestone 1 — Data Foundation (Days 1\u201320)"),
        activityTable([
          {
            activity: "Kickoff & access provisioning",
            detail:
              "90-minute kickoff with Matt Nyiri (SIOP / Demand Planning Manager) and the executive sponsor. Access arranged for Safio, Walmart Luminate, Petco OneView, NIQ Discover, and Power BI.",
          },
          {
            activity: "Data integration build-out",
            detail:
              "Direct, automated connectors for each source. Ingestion runs on a schedule (daily for transactional feeds, weekly for syndicated panel data). Raw landing zone is immutable; transformed layer is canonical.",
          },
          {
            activity: "Canonical 13-digit SKU master",
            detail:
              "Intake from Matt's team, normalized into the warehouse with cross-references to every customer's SKU vocabulary (Walmart Prime Item Nbr, Petco SKU_ID/UPC, NIQ UPC, Amazon ASIN).",
          },
          {
            activity: "Consumer-insights inventory with Priya",
            detail:
              "Working session with Priya Singhal (Director, Consumer Data Insights) to inventory the existing $350K/yr NielsenIQ subscription contents and identify the environmental signals — store counts, retailer traffic trends, category tailwinds, competitor share by account — that are already harvestable from data PetWise pays for today.",
          },
          {
            activity: "Forecast snapshot capture",
            detail:
              "Either ingest Matt's existing forecast archive (if available) or stand up the snapshotting workflow that captures the Safio 120-day forecast weekly going forward. Both paths covered.",
          },
          {
            activity: "KPI standardization",
            detail:
              "Reproduce PetWise's existing operations KPIs against the warehouse data — same metric definitions as the SIOP deck.",
          },
        ]),
        milestone(
          "Validated data pipeline across all three facilities. SKU master loaded. KPI scorecard reproducing the SIOP deck's headline numbers. Environmental signal inventory complete. First-pass review with Matt.",
        ),

        h2("Milestone 2 — Forecasting Model & Backtest (Days 21\u201340)"),
        activityTable([
          {
            activity: "Scope confirmation",
            detail: [
              "Pull the ",
              { text: "full active SKU list", bold: true },
              " from PetWise's item master across all three facilities (we don't yet know the exact count — the SIOP deck only reports the top-293 leadership-tracked subset). Confirm with Matt and lock the rolling-origin holdout window for the backtest.",
            ],
          },
          {
            activity: "Demand-pattern segmentation",
            detail:
              "Classify every active SKU by Syntetos-Boylan quadrant (smooth / erratic / intermittent / lumpy) so each gets the right model class. The long tail is expected to be heavily intermittent / lumpy and needs Croston-family methods, not LightGBM.",
          },
          {
            activity: "Statistical baselines",
            detail:
              "Implement seasonal_naive, auto_arima, ets, and theta for the smooth and seasonal series, plus croston_sba, tsb, imapa, and adida for the intermittent and lumpy series — all via Nixtla statsforecast. The numba-accelerated implementations make fitting thousands of series practical in minutes. These are the accuracy floor we measure every later improvement against.",
          },
          {
            activity: "ML panel model — three-rail features",
            detail: [
              "Implement a global LightGBM panel via Nixtla mlforecast with Tweedie loss (handles the zero-inflation in the slow-mover tail). Feature roster covers three rails: ",
              { text: "(internal)", bold: true },
              " lagged POS, rolling means and stds, item attributes, customer-channel one-hots, trailing-90-day vs. same-90-day-prior-year YoY rolling features; ",
              { text: "(retailer / customer)", bold: true },
              " store-count trend by banner, retailer traffic-count trend, in-stock %, and Valid POD share from each customer's POS feed; ",
              { text: "(consumer / environmental)", bold: true },
              " NIQ category share by account, NIQ-derived competitor share for the top SKUs in each category, week-of-year and holiday calendar, and a lightweight ",
              { text: "promo-lift multiplier feature", bold: true },
              " (a regression-based estimate from PetWise's historical promo events; full causal lift modeling stays in the follow-on engagement). Trained per facility to control heterogeneity between Novato (B&M heavy) and Ferndale / Mundelein (more ecom). The global panel trains on the full active SKU set in one pass — model size doesn't grow linearly with SKU count.",
            ],
          },
          {
            activity: "Backtest & FVA scorecard",
            detail: [
              "Rolling 13-week-origin backtest across the full active SKU set. Stage-by-stage Forecast-Value-Added scorecard: PetWise current 120-day Safio forecast \u2192 seasonal naive \u2192 statistical ensemble \u2192 ML panel. ",
              { text: "The headline metric is WMAPE", bold: true },
              " — ",
              { text: "Weighted Mean Absolute Percentage Error", italics: true },
              ", the dollar-weighted average miss between forecast and actual, computed as \u03A3|actual \u2212 forecast| / \u03A3|actual|. Lower is better; this is the standard CPG accuracy metric and the one that maps directly to inventory-dollar exposure on the balance sheet. ",
              { text: "Signed bias", bold: true },
              " is reported alongside WMAPE so leadership can see whether the model systematically over- or under-forecasts. PetWise's existing ",
              { text: "\u201C% of SKUs within \u00B125%\u201D KPI", bold: true },
              " is reported as a continuity view that maps back to Matt's monthly SIOP deck — but it is not the success criterion, since it is a threshold metric that can be gamed by tightening borderline SKUs without actually improving accuracy. The full scorecard is broken out at ",
              { text: "four cuts", bold: true },
              " (top-293 leadership subset, full active population, Syntetos-Boylan segment, facility \u00D7 top customer) so leadership can see where the model adds value across their existing reporting cut ",
              { text: "and", italics: true },
              " across the long tail their current process doesn't measure.",
            ],
          },
        ]),
        milestone(
          "Measured FVA scorecard at four cuts across the full active SKU population in Novato, Ferndale, and Mundelein. Concrete, defensible numbers — not target ranges.",
        ),

        h2("Milestone 3 — Deliver, Brief & Gate (Days 41\u201345)"),
        activityTable([
          {
            activity: "Final report",
            detail:
              "Written summary of the data foundation, the forecasting model, and the FVA results. Aimed at Matt's team for technical depth and at executive leadership for the headline numbers.",
          },
          {
            activity: "Executive briefing",
            detail:
              "60-minute findings presentation to Aaron, Steve, Matt, Adam, and the Areté team. Headline KPIs in PetWise's own definitions, FVA story, what worked, what didn't, what's next.",
          },
          {
            activity: "Gate-review scoping recommendation",
            detail: [
              "Written recommendation: scope, sequencing, requirements, and a budget range for the follow-on workstreams — hierarchical reconciliation (hierarchicalforecast MinT + THieF), planner-facing override workflow, Safio Tableau integration, deep-learning hero-SKU sub-models (neuralforecast NHITS / TFT), foundation-model cold-start (Chronos-2 / TimesFM 2.5), and promo-lift decomposition (PyMC-Marketing). ",
              { text: "This is the gate.", bold: true },
            ],
          },
        ]),
        milestone(
          "Findings briefing complete. Follow-on scoping recommendation delivered. Decision point for any next engagement.",
        ),

        // ---- Requirements ----
        h1("Requirements"),

        new Paragraph({
          children: [run("From PetWise", { size: 20, bold: true, color: BLUE })],
          spacing: { before: 80, after: 80 },
        }),
        item([
          run("Read access to the "),
          run("Safio Planning System", { bold: true }),
          run(" (API, scheduled export, or direct database read — see Assumptions)."),
        ]),
        item([
          run("Read access to "),
          run("Walmart Luminate", { bold: true }),
          run(", "),
          run("Petco OneView", { bold: true }),
          run(", and "),
          run("NIQ Discover", { bold: true }),
          run(" (PetWise's existing subscriptions)."),
        ]),
        item([
          run("The "),
          run("canonical 13-digit SKU master", { bold: true }),
          run(
            " file covering every active SKU (one-time, from Matt's team), ideally within the first 5 days of engagement start. We need the full active population, not just the top-tracked subset, since the model is built against the full portfolio.",
          ),
        ]),
        item([
          run("The "),
          run("120-day forecast snapshot archive", { bold: true }),
          run(
            " for the prior 12 months if Matt's team keeps one. If not, see the Milestone 1 contingency in Assumptions.",
          ),
        ]),
        item([
          run("The "),
          run("trade-promo / Customer Need Forecast (CNF) launch ledger", { bold: true }),
          run(
            " in any structured form. Not a hard blocker for this engagement, but accelerates the model's promo-aware features.",
          ),
        ]),
        item([
          run("Matt Nyiri (SIOP / Demand Planning Manager)", { bold: true }),
          run(
            " as the primary technical counterparty. Estimated time commitment: 2 hours per week for the duration of the engagement.",
          ),
        ]),
        item([
          run("Priya Singhal (Director, Consumer Data Insights)", { bold: true }),
          run(
            " for a one-time working session in Milestone 1 (~2 hours) to inventory the existing NielsenIQ subscription and identify the environmental signals (store counts, retailer traffic, competitor share) that are already harvestable.",
          ),
        ]),
        item([
          run("An "),
          run("executive sponsor", { bold: true }),
          run(
            " (Aaron Lamstein, CEO, or Steve Jones, Operations) for the milestone reviews and the day-45 executive briefing.",
          ),
        ]),

        new Paragraph({
          children: [run("From Areté Intelligence", { size: 20, bold: true, color: BLUE })],
          spacing: { before: 200, after: 80 },
        }),
        body([
          run(
            "A team of three engineers — one engagement lead and two senior software engineers — covering data engineering, model implementation, and project management. Areté owns the methodology, pipeline construction, modeling choices, and iteration. No additional workload on PetWise's team beyond data access, the named technical counterparty, and the executive sponsor.",
          ),
        ]),

        // ---- Working Cadence ----
        h1("Working Cadence"),
        item([
          run("Weekly", { bold: true }),
          run(" check-in with Matt Nyiri (60 minutes, technical)."),
        ]),
        item([
          run("Milestone reviews", { bold: true }),
          run(
            " with Aaron Lamstein and Steve Jones at the end of Milestones 1 and 2 (30 minutes each, status + decisions needed).",
          ),
        ]),
        item([
          run("Day 45", { bold: true }),
          run(
            " executive briefing covering findings, the FVA scorecard, the gate-review scoping recommendation, and the gate decision.",
          ),
        ]),
        item([
          run(
            "Pre-work: data-source access provisioning and a 90-minute kickoff with Matt within the first 5 days.",
          ),
        ]),

        // ---- Assumptions ----
        h1("Assumptions"),
        item([
          run("PetWise has active "),
          run("Walmart Luminate", { bold: true }),
          run(", "),
          run("Petco OneView", { bold: true }),
          run(", and "),
          run("NIQ Discover", { bold: true }),
          run(
            " subscriptions (per the data files we have already reviewed). Read access for the Areté team will be provisioned at engagement start.",
          ),
        ]),
        item([
          run("The "),
          run("Safio Planning System", { bold: true }),
          run(
            " exposes either an API, a scheduled export mechanism, or direct database read access. If none of these is available, weekly Excel exports from Matt's team are an acceptable fallback during this engagement, with the understanding that automating that ingestion would have to be added in a follow-on workstream.",
          ),
        ]),
        item([
          run("A "),
          run("historical 120-day forecast archive", { bold: true }),
          run(
            " exists in Matt's team's records or in Safio. If it does not, Milestone 1 will instead stand up the snapshotting workflow that captures forecasts going forward, and the day-45 FVA scorecard will be measured on the ~6 weeks of forecast-vs-actual data accumulated during the engagement (rather than retrospectively against ~52 weeks of history). The headline finding still holds either way; the data depth is what changes, and the scorecard is correspondingly shallower under this contingency.",
          ),
        ]),
        item([
          run("The model is trained on PetWise's "),
          run("full active SKU population", { bold: true }),
          run(
            " across all three facilities, not the top-293 subset PetWise's SIOP deck currently tracks. The exact SKU count is unknown today (the SIOP deck only reports the top-revenue Pareto cut; the slices we have are per-customer subsets) and will be confirmed when we get access to PetWise's item master in the first week of Milestone 1. Order-of-magnitude estimate: low thousands.",
          ),
        ]),
        item([
          run(
            "Hierarchical reconciliation, planner-facing override workflow with reason codes, Safio Tableau integration, deep-learning hero-SKU sub-models, foundation-model cold-start, and promo-lift decomposition",
            { bold: true },
          ),
          run(
            " are all out of scope for this engagement. They will be scoped in Milestone 3's gate-review deliverable, contingent on Milestone 2 outcomes, and would form a separate Statement of Work.",
          ),
        ]),
        item([
          run(
            "Scope changes that would require additional headcount or duration will be addressed by mutual amendment.",
          ),
        ]),

        // ---- Investment ----
        h1("Investment"),
        investmentTable(),
        emptyP(),

        // ---- Acceptance ----
        h1("Accepted by:"),
        signatureTable(),
      ],
    },
  ],
});

const outPath = path.join(__dirname, "sow_petwise_foundation_and_first_model.docx");
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log(`Wrote ${outPath} (${buffer.length} bytes)`);
});
