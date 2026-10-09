# Tasks for the blueprint repo itself. CI runs `just lint` and `just test`.
set shell := ["bash", "-euo", "pipefail", "-c"]

zizmor_version := "1.30.1"

# Run lint and tests.
default: lint test

# Lint workflows (actionlint, zizmor) and JS/JSON (Biome).
lint:
    actionlint .github/workflows/*.yml examples/workflows/*.yml
    uvx zizmor@{{ zizmor_version }} --offline .github/workflows actions examples/workflows/*.yml
    pnpm exec biome ci .

# Run all tests in tests/ (Biome, golangci-lint, ruff, mypy configs and the feature-doc checker).
test:
    node --test 'tests/*.test.mjs'
