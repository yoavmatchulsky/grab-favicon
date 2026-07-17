# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-07-17

### Added

- `preferVector` option to prefer SVG favicons when available.

## [1.0.1] - 2026-07-16

### Added

- Repository, homepage, and bugs links to `package.json`.

## [1.0.0] - 2026-07-16

Initial release.

### Added

- Find the best favicon for a website URL.
- `fast` mode that short-circuits on the first candidate.
- Streamed page fetch that stops at `</head>` or `<body>`.
