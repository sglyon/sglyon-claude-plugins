---
name: chartroom
description: Create charts from data files using the chartroom CLI. Use when asked to visualize data, plot a bar/line/scatter/pie/histogram chart, or embed charts in Showboat demo documents. Accepts CSV, TSV, JSON, JSONL, or SQLite input. Designed to pair with showboat (embed output as markdown/HTML images) and rodney. Triggers on "create a chart", "plot this data", "visualize", "bar chart", "line chart", "scatter plot", "pie chart", "histogram".
---

# chartroom: CLI Chart Generator

Create matplotlib charts from CSV, TSV, JSON, JSONL, or SQLite data. Outputs a PNG image with auto-generated descriptive alt text.

## Setup Check

```bash
command -v chartroom >/dev/null 2>&1 && echo "Installed" || echo "NOT INSTALLED — run: uvx chartroom or pip install chartroom"
```

## Chart Types

```bash
chartroom bar       # Vertical bar chart (supports grouped bars with multiple -y)
chartroom line      # Line chart (supports multiple series)
chartroom scatter   # Scatter plot
chartroom pie       # Pie chart
chartroom histogram # Distribution histogram (requires -y; use --bins to control bucket count)
```

## Input Sources

All chart types accept the same input options:

```bash
# Auto-detect format from file extension
chartroom bar data.csv

# Explicit format flags
chartroom bar --csv data.csv
chartroom bar --tsv data.tsv
chartroom bar --json data.json
chartroom bar --jsonl data.jsonl

# Stdin
cat data.csv | chartroom bar --csv

# SQLite query
chartroom bar --sql mydb.sqlite "SELECT name, count FROM items"
```

## Column Selection

Columns are auto-detected from common names (`name`/`label`/`x` → x-axis; `value`/`count`/`y` → y-axis). Specify explicitly with `-x` / `-y`:

```bash
chartroom bar --csv -x region -y revenue data.csv

# Multiple -y creates grouped/overlaid series
chartroom bar --csv -x region -y q1 -y q2 -y q3 data.csv
```

## Output Options

Default output file is `chart.png` (auto-increments to avoid overwrites). Control with `-o`:

```bash
chartroom bar --csv data.csv -o sales.png
```

Control what is printed to stdout with `-f` / `--output-format`:

```bash
-f path      # (default) Absolute path to output file
-f markdown  # ![alt text](/path/to/chart.png)
-f html      # <img src="/path/to/chart.png" alt="...">
-f json      # {"path": "...", "alt": "..."}
-f alt       # Just the auto-generated alt text
```

Alt text is auto-generated from chart type and data. Override with `--alt "My description"`.

## Styling

```bash
chartroom bar --csv data.csv \
  --title "Sales by Region" \
  --xlabel "Region" --ylabel "Revenue" \
  --width 12 --height 8 --dpi 150 \
  --style ggplot
```

List available styles:

```bash
chartroom styles
```

Popular styles: `ggplot`, `fivethirtyeight`, `bmh`, `seaborn-v0_8`, `dark_background`, `grayscale`

## Integration with Showboat

chartroom output formats are designed to embed directly into Showboat documents:

```bash
showboat init demo.md "Revenue Analysis"

showboat note demo.md "Bar chart of Q1 revenue by region."
chartroom bar --csv data.csv -x region -y revenue -o /tmp/revenue.png
showboat image demo.md '![Revenue by Region](/tmp/revenue.png)'

# Or use -f markdown to generate the embed line automatically
showboat note demo.md "Monthly trend:"
chartroom line --csv sales.csv -x month -y revenue -f markdown | showboat note demo.md
```

## Common Patterns

```bash
# Quick chart from CSV, embed as markdown
chartroom bar --csv data.csv -f markdown

# Grouped bar from SQLite
chartroom bar --sql mydb.sqlite "SELECT dept, q1, q2, q3 FROM sales" -x dept -y q1 -y q2 -y q3 -o grouped.png

# Histogram from JSON values
chartroom histogram --json -y score data.json --bins 20 -f alt

# Pie chart with custom title
chartroom pie --csv data.csv -x category -y amount --title "Budget Breakdown" -f markdown
```

## Reference

GitHub: https://github.com/simonw/chartroom  
Run `uvx chartroom <command> --help` for full options on any subcommand.
