# Changelog

All notable changes to this project are documented here. Releases are tagged
`v<version>`; the moving `v1` tag follows minor and patch releases.

## 1.0.1 - 2026-10-09

### Fixed

- `actions/feature-doc`: deleted files (`D`) and pure renames (`R100`) no longer
  count as source changes. A rename with a content change (`R<100`) counts under
  its new path. A pure-rename or deletion-only PR now passes the check.

## 1.0.0 - 2026-10-09

Initial release: reusable CI workflows (TS/Go/Python/image/feature-doc), lint
configs, `@synthwerk/biome-config`, templates, the `/feature-doc` skill and
checker.
