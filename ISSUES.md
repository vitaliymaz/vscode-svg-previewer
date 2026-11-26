# Issues tracker

Maintenance work before the next release. Scope: security, VS Code API/platform changes, real bugs. Feature requests are parked (see bottom).

Status: ✅ done (committed) · 🔲 to do · ⏸ needs owner decision

## Release blockers

| Status | Item | Notes |
|---|---|---|
| 🔲 | README uses SVG badges | `vsce package` rejects SVG images in README; the badge service (vsmarketplacebadge.apphb.com) is dead. Remove or replace the badges. |
| 🔲 | `"main": "./out/extension"` has no `.js` | Current `vsce` requires the exact entry file path. Change to `./out/extension.js`. |
| ⏸ | No license ([#58](https://github.com/vitaliymaz/vscode-svg-previewer/issues/58)) | Owner picks a license (MIT is typical). `vsce` also warns without one. |

## Important

| Status | Item | Notes |
|---|---|---|
| ✅ | Build broken on Node 17+ | webpack 4 crashed (`ERR_OSSL_EVP_UNSUPPORTED`). Upgraded to webpack 5 / TypeScript 5. PR [#81](https://github.com/vitaliymaz/vscode-svg-previewer/pull/81). |
| ✅ | Non-square SVGs laid out in a square box | Height was taken from width. Fixed in PR #81. |
| ✅ | Workspace Trust ([#55](https://github.com/vitaliymaz/vscode-svg-previewer/issues/55)) | Extension was disabled in Restricted Mode. Declared `untrustedWorkspaces: supported: true`. Branch `fix-workspace-trust`. Close the issue after release. |
| ✅ | Image "compressed horizontally" ([#59](https://github.com/vitaliymaz/vscode-svg-previewer/issues/59)) | Confirmed: PlantUML-style SVGs (`preserveAspectRatio="none"`) were stretched by the square-box bug fixed in #81. The size regex also matched `stroke-width`/`data-height` and ignored units (`pt`, `mm`, ...). Fixed in `PreviewContainer.tsx`; e2e fixtures `diagram.svg` and `attributes.svg` added. Close the issue after release. |
| ✅ | Preview button hidden by other SVG extensions ([#78](https://github.com/vitaliymaz/vscode-svg-previewer/issues/78)) | Menus and keybindings required `editorLangId == xml`; other extensions set the language to `svg`, and the extension also didn't activate then. Fixed: `when` clauses use `resourceExtname =~ /^\.svg$/i` (which also hides the button on plain `.xml` files), and `onLanguage:svg` + `onCommand:` activation events were added. e2e covers it with a stub language extension. Close the issue after release. |
| ✅ | VS Code opens `.svg` in its built-in Image Preview | Since the #78 fix the button also shows in the Image Preview (its `when` uses the file extension). Cmd+K V did nothing there because the commands only read `activeTextEditor`; they now fall back to the active tab's URI. e2e step 9 covers both. |
| 🔲 | `svg.preview.autoOpen` ignores the built-in Image Preview | Found while fixing the item above. Auto-open listens to `onDidChangeActiveTextEditor` only, so it doesn't fire when an `.svg` opens in the Image Preview (the default on current VS Code). |
| 🔲 | `semver` security advisory | `npm audit --omit=dev`: high severity, ReDoS. Most likely from the deprecated `vscode-extension-telemetry` 0.1.x. |
| 🔲 | Preview stops updating for files not open in an editor ([#79](https://github.com/vitaliymaz/vscode-svg-previewer/issues/79)) | Only `onDidChangeTextDocument` is used; add a file watcher. |
| 🔲 | SVG `prefers-color-scheme` follows the OS, not the chosen background ([#80](https://github.com/vitaliymaz/vscode-svg-previewer/issues/80)) | Add `color-scheme: light/dark` to `.preview.light/.dark` (fix tested by the reporter). |

## Housekeeping

| Status | Item | Notes |
|---|---|---|
| 🔲 | Run untrusted + installed `.vsix` checks automatically | `test:e2e` should package the extension and also run `--untrusted --vsix`. Needs the release blockers fixed first. |
| 🔲 | Package contains unneeded files | `preview-src/`, `scripts/deploy.sh` end up in the `.vsix`. Extend `.vscodeignore`. |
| 🔲 | CI is dead | Travis is pinned to Node 12. Replace with GitHub Actions (build + lint + e2e). |

## Parked (feature requests, not planned now)

- Open VSX publishing ([#64](https://github.com/vitaliymaz/vscode-svg-previewer/issues/64), [#77](https://github.com/vitaliymaz/vscode-svg-previewer/issues/77)): distribution, owner decision.
- `<image>` with external href ([#51](https://github.com/vitaliymaz/vscode-svg-previewer/issues/51)), light background by default ([#56](https://github.com/vitaliymaz/vscode-svg-previewer/issues/56)), fit to window ([#60](https://github.com/vitaliymaz/vscode-svg-previewer/issues/60)), pick `currentColor` ([#75](https://github.com/vitaliymaz/vscode-svg-previewer/issues/75)), editor below preview ([#76](https://github.com/vitaliymaz/vscode-svg-previewer/issues/76)).
