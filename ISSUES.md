# Issues tracker

Maintenance work before the next release. Scope: security, VS Code API/platform changes, real bugs. Feature requests are parked (see bottom).

Status: ✅ done (committed) · 🔲 to do · ⏸ needs owner decision

## Release blockers

| Status | Item | Notes |
|---|---|---|
| ✅ | README uses SVG badges | `vsce package` rejected them and the badge service (vsmarketplacebadge.apphb.com) is dead. Replaced with a plain Marketplace link. |
| ✅ | `"main": "./out/extension"` has no `.js` | Turned out not to block: `vsce` 4.1.1 packages it and the installed `.vsix` works. Changed to `./out/extension.js` anyway (exact path). |
| ✅ | No license ([#58](https://github.com/vitaliymaz/vscode-svg-previewer/issues/58)) | MIT (owner's choice): `LICENSE` added, `"license": "MIT"` in package.json. Close the issue after release. |

## Important

| Status | Item | Notes |
|---|---|---|
| ✅ | Build broken on Node 17+ | webpack 4 crashed (`ERR_OSSL_EVP_UNSUPPORTED`). Upgraded to webpack 5 / TypeScript 5. PR [#81](https://github.com/vitaliymaz/vscode-svg-previewer/pull/81). |
| ✅ | Non-square SVGs laid out in a square box | Height was taken from width. Fixed in PR #81. |
| ✅ | Workspace Trust ([#55](https://github.com/vitaliymaz/vscode-svg-previewer/issues/55)) | Extension was disabled in Restricted Mode. Declared `untrustedWorkspaces: supported: true`. Branch `fix-workspace-trust`. Close the issue after release. |
| ✅ | Image "compressed horizontally" ([#59](https://github.com/vitaliymaz/vscode-svg-previewer/issues/59)) | Confirmed: PlantUML-style SVGs (`preserveAspectRatio="none"`) were stretched by the square-box bug fixed in #81. The size regex also matched `stroke-width`/`data-height` and ignored units (`pt`, `mm`, ...). Fixed in `PreviewContainer.tsx`; e2e fixtures `diagram.svg` and `attributes.svg` added. Close the issue after release. |
| ✅ | Preview button hidden by other SVG extensions ([#78](https://github.com/vitaliymaz/vscode-svg-previewer/issues/78)) | Menus and keybindings required `editorLangId == xml`; other extensions set the language to `svg`, and the extension also didn't activate then. Fixed: `when` clauses use `resourceExtname =~ /^\.svg$/i` (which also hides the button on plain `.xml` files), and `onLanguage:svg` + `onCommand:` activation events were added. e2e covers it with a stub language extension. Close the issue after release. |
| ✅ | VS Code opens `.svg` in its built-in Image Preview | Since the #78 fix the button also shows in the Image Preview (its `when` uses the file extension). Cmd+K V did nothing there because the commands only read `activeTextEditor`; they now fall back to the active tab's URI. e2e step 9 covers both. |
| ✅ | `semver` security advisory | `npm audit --omit=dev`: high severity, ReDoS, in `semver` 5.7.1 pulled in by `vscode-extension-telemetry` 0.1.x → `applicationinsights`. Bumped to 5.7.3 in the lockfile; production audit is clean. The deprecated telemetry package itself is still there. |
| ✅ | Preview stops updating for files not open in an editor ([#79](https://github.com/vitaliymaz/vscode-svg-previewer/issues/79)) | Only `onDidChangeTextDocument` was used, which stops once VS Code releases the text model (a few minutes after the editor is closed; reproduced with a 4-minute wait). Each side preview now watches its file and reads it from disk unless the editor has unsaved changes. Also guards against updating a preview closed mid-read. e2e step 10 checks the reload (the 4-minute case was verified once by hand, it is too slow for the suite). Close the issue after release. |
| ✅ | SVG `prefers-color-scheme` follows the OS, not the chosen background ([#80](https://github.com/vitaliymaz/vscode-svg-previewer/issues/80)) | Added `color-scheme: light/dark` to `.preview.light/.dark` (the reporter's fix). e2e step 6c emulates the opposite OS scheme and checks the rendered pixel color for both backgrounds. Close the issue after release. |

## Housekeeping

| Status | Item | Notes |
|---|---|---|
| ✅ | Run untrusted + installed `.vsix` checks automatically | `npm run test:e2e` now runs development mode, then packages `.vscode-test/e2e.vsix` and runs it installed, trusted and in Restricted Mode. `test:e2e:dev` is the quick development-mode run. |
| ✅ | Package contains unneeded files | `.vscodeignore` now excludes `preview-src/`, `scripts/`, `webpack.config.js` and the README GIFs (vsce points README images to GitHub). `preact`/`redux-zero` moved to devDependencies (bundled by webpack). `.vsix` went from 8.3 MB to 0.66 MB. The rest is the telemetry package's dependencies. |
| — | CI is dead | Won't fix: the owner publishes manually. `.travis.yml` is left as is (Travis no longer runs it). |

## Parked (feature requests, not planned now)

- Open VSX publishing ([#64](https://github.com/vitaliymaz/vscode-svg-previewer/issues/64), [#77](https://github.com/vitaliymaz/vscode-svg-previewer/issues/77)): distribution, owner decision.
- `<image>` with external href ([#51](https://github.com/vitaliymaz/vscode-svg-previewer/issues/51)), light background by default ([#56](https://github.com/vitaliymaz/vscode-svg-previewer/issues/56)), fit to window ([#60](https://github.com/vitaliymaz/vscode-svg-previewer/issues/60)), pick `currentColor` ([#75](https://github.com/vitaliymaz/vscode-svg-previewer/issues/75)), editor below preview ([#76](https://github.com/vitaliymaz/vscode-svg-previewer/issues/76)).
