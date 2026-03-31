# Mental Model Schema Guide

Suggested YAML top-level keys per agent role. These are recommendations, not enforced schema — agents evolve their own structure as needed.

## Review Agents (ash, elixir, liveview, python, typescript)

```yaml
patterns_discovered:
  - date: "YYYY-MM-DD"
    pattern: "Description of the pattern or gotcha"
    severity: high|medium|low
    files:
      - path/to/relevant/file.ex
    prevention: "How to avoid the issue"

architecture:
  component_name:
    pattern: "How this component is structured"
    key_files:
      - path/to/file.ex
    observations:
      - "Notable design decisions or conventions"

codebase_observations:
  - date: "YYYY-MM-DD"
    note: "Something worth remembering about how this codebase works"

open_questions:
  - "Unresolved questions for future sessions"
```

### Field Descriptions

- **patterns_discovered**: Bugs, gotchas, or non-obvious behaviors found during reviews. Include severity so future sessions know what to prioritize.
- **architecture**: How key components are structured. Focus on things that aren't obvious from reading the code — design decisions, conventions, deviations from framework defaults.
- **codebase_observations**: General notes about the codebase — testing patterns, dependency choices, deployment considerations.
- **open_questions**: Things you noticed but didn't resolve. Future sessions can investigate.

## Team Lead

```yaml
project_patterns:
  - pattern: "How work is typically structured in this project"
    context: "Why this pattern exists"

workflow_observations:
  - date: "YYYY-MM-DD"
    note: "What worked or didn't work in orchestration"

dependency_notes:
  - area: "Feature or module name"
    dependencies: ["list", "of", "dependencies"]
    notes: "Sequencing considerations"

open_questions:
  - "Strategic questions for future planning"
```

### Field Descriptions

- **project_patterns**: Recurring patterns in how work gets done — chunking strategies, review pain points, areas that need special attention.
- **workflow_observations**: What worked well or poorly in the implement-review-compound cycle.
- **dependency_notes**: Which parts of the codebase depend on each other, affecting parallelization decisions.
- **open_questions**: Strategic questions about the project direction or architecture.
