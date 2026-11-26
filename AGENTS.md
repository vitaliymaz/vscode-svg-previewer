# AGENTS.md

VS Code extension **SVG Previewer** (`vitaliymaz.vscode-svg-previewer`). Shows a live preview of `.svg` files in a webview, either beside the editor or as a custom editor ("Image Viewer"). Last released as 0.7.0 (VS Code API ^1.52); the codebase and toolchain are old.

## Layout

There are two separate TypeScript programs:

- `src/`: **extension host** (Node, CommonJS). Compiled by `tsc` to `out/`. Entry point: `src/extension.ts`.
  - `features/previewManager.ts`: tracks the side-panel previews, auto-open, the `svgPreviewFocus` context key, and webview restore (serializer for `svg-preview`).
  - `features/preview.ts`: one `WebviewPanel` preview. It builds the HTML and CSP, posts updates, and queues messages while the panel is hidden.
  - `features/previewEditor.ts`: `CustomTextEditorProvider` for `svgPreviewer.customEditor`. It repeats much of the code in `preview.ts`.
  - `commands/`: `svg.showPreview`, `svg.showPreviewToSide`, `svg.showSource`, registered through `commandManager.ts`.
  - `webViewMessaging.ts`: builds the host→webview messages (`source:update`, `theme:changed`).
  - `telemetry/`: wrapper around `vscode-extension-telemetry` (App Insights key is hardcoded).
- `preview-src/`: **webview UI** (Preact + redux-zero), bundled by webpack into `media/index.js`. That bundle is gitignored and loaded by the webview.
  - `store/` holds state and actions (zoom, background, bounding box, transparency grid). `components/` and `containers/` hold the toolbar and preview UI.
  - `messaging/` contains the `MessageBroker` (listens to `window` messages and sends via `acquireVsCodeApi().postMessage`) plus the webview telemetry.
  - The SVG is rendered as `<img src="data:image/svg+xml,...">`.
- `media/` holds static webview assets (CSS, icons) and is the webview's `localResourceRoots`.
- `package.json` defines all contributions (commands, menus, keybindings, the custom editor, and the `svg.preview.*` settings). UI strings live in `package.nls.json`.

## Message protocol

- Host → webview: `source:update { uri, data, settings }` and `theme:changed`.
- Webview → host: `sendTelemetryEvent`, `changeBoundingBoxVisibility`, `changeTransparencyGridVisibility`. The last two write the global `svg.preview.*` settings.

## Commands

```sh
npm install       # needs Node 20.9+
npm run compile   # tsc (src -> out) + webpack (preview-src -> media/index.js)
npm run lint      # standardx (JS Standard style, 2 spaces, no semicolons)
npm run test:e2e  # end-to-end test in a real VS Code: dev mode, then the packaged .vsix trusted and untrusted (see below)
npm run test:e2e:dev  # quick run: development mode only
npx vsce package  # build the .vsix (publishing is manual)
```

Debug with F5 using `.vscode/launch.json`. `npm test` only compiles.

`npm run test:e2e` downloads VS Code into `.vscode-test/`, launches it with the extension and a copy of `test/e2e/fixtures/`, and drives it with Playwright (`playwright-core` Electron API). It checks the preview, toolbar, live update, error state and custom editor, and saves screenshots to `test/e2e/screenshots/` (gitignored). The script is `test/e2e/run.mjs` (flags `--vsix <file>` and `--untrusted`). Add a check there when fixing a bug.

There is no working CI and none is planned: releases are packaged and published manually with `vsce`. The old `.travis.yml` (Node 12, publishes on `[ci-publish]` commit messages) no longer runs.

## Conventions

- Follow the existing style: Standard JS, 2-space indent, no semicolons, a space before function parens.
- Keep the host and webview code separate. They have separate tsconfigs and share no code, so message shapes are duplicated on both sides.
- A new setting needs updates in three places: `package.json` contributes, `package.nls.json`, and the code that reads it (`getConfiguration('svg')`).

## Known rough edges (good starting points)

- The build uses TypeScript 5, webpack 5 and webpack-cli 7, so it needs Node 20.9 or newer. Still outdated: `@types/node` 7, `@typescript-eslint` 3, `standardx` 5 (eslint 6; its dev-only `tmp` and `flatted` advisories need standardx 7, which fails on this code), and the deprecated `vscode-extension-telemetry` 0.1.x.
- `preview.ts` and `previewEditor.ts` duplicate the HTML/CSP and message handling.
- `preview.ts` loads `media/images/preview.svg`, but the file on disk is `Preview.svg`. The case mismatch breaks the icon on case-sensitive filesystems.
- Current VS Code opens `.svg` in its built-in Image Preview (editor id `workbench.editor.imagePreview`) by default. The preview button and Cmd+K V work there too: the commands fall back to the active tab's URI (`tabGroups`, feature-detected because the typings are 1.52). `svg.preview.autoOpen` still only reacts to text editors. Most e2e steps set `workbench.editorAssociations` to open SVGs as text; step 9 covers the Image Preview.
- SVG detection is by file extension only (`isSvgUri`, and `resourceExtname =~ /^\.svg$/i` in menus and keybindings), not by language id, because other extensions set the language of `.svg` files to `svg` (#78). The e2e test covers this with the stub extension in `test/e2e/svg-language-extension/`.
- The webpack build runs in `development` mode with inline source maps, even for the published package.
