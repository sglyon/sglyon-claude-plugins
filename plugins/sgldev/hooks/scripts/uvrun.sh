#!/bin/sh
# Wrapper that ensures uv is available before running a Python script.
if ! command -v uv >/dev/null 2>&1; then
  echo "Error: uv is required but not found." >&2
  echo "Install it with: curl -LsSf https://astral.sh/uv/install.sh | sh" >&2
  echo "Or see: https://docs.astral.sh/uv/getting-started/installation/" >&2
  exit 1
fi
exec uv run "$@"
