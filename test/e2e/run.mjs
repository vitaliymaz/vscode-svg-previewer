// End-to-end smoke test: launches a clean VS Code with this extension loaded,
// drives it with Playwright, checks the preview, and saves screenshots.
//
// Usage: npm run test:e2e   (compiles first)
// Screenshots: test/e2e/screenshots/

import { _electron as electron } from 'playwright-core'
import { downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath } from '@vscode/test-electron'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const fixturesDir = path.join(root, 'test/e2e/fixtures')
const screenshotsDir = path.join(root, 'test/e2e/screenshots')
const isMac = process.platform === 'darwin'
// --untrusted: open the workspace in Restricted Mode (Workspace Trust on, folder not trusted)
const untrusted = process.argv.includes('--untrusted')
// --vsix <file>: install a packaged .vsix like a user would, instead of loading
// the source folder in development mode (development extensions bypass Workspace Trust)
const vsixArg = process.argv.indexOf('--vsix')
const vsix = vsixArg !== -1 ? path.resolve(process.argv[vsixArg + 1]) : null
const mod = isMac ? 'Meta' : 'Control'

const results = []
let shot = 0

function check (name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
}

async function waitFor (fn, { timeout = 15000, interval = 250 } = {}) {
  const end = Date.now() + timeout
  let last
  while (Date.now() < end) {
    try {
      last = await fn()
      if (last) return last
    } catch (e) { last = undefined }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  return last
}

async function screenshot (page, name) {
  shot += 1
  const prefix = untrusted ? 'untrusted-' : ''
  const file = path.join(screenshotsDir, `${prefix}${String(shot).padStart(2, '0')}-${name}.png`)
  await page.screenshot({ path: file })
  console.log(`      screenshot: ${path.relative(root, file)}`)
}

async function runCommand (page, title) {
  await page.keyboard.press(`${mod}+Shift+P`)
  const input = page.locator('.quick-input-widget input')
  await input.waitFor({ state: 'visible' })
  await input.fill(`>${title}`)
  await page.locator('.quick-input-list .monaco-list-row').first().waitFor()
  await page.keyboard.press('Enter')
}

async function quickOpen (page, fileName) {
  await page.keyboard.press(`${mod}+P`)
  const input = page.locator('.quick-input-widget input')
  await input.waitFor({ state: 'visible' })
  await input.fill(fileName)
  const row = page.locator('.quick-input-list .monaco-list-row', { hasText: fileName }).first()
  await row.waitFor()
  await row.click()
  await page.locator('.tab.active', { hasText: fileName }).first().waitFor()
}

// The preview lives in a nested webview iframe. Return the visible frame that
// renders our UI (it contains `.layout`).
async function findPreviewFrame (page) {
  return waitFor(async () => {
    for (const frame of page.frames()) {
      const visible = await frame.evaluate(() => {
        const el = document.querySelector('.layout')
        return !!el && el.getBoundingClientRect().width > 0 && document.visibilityState === 'visible'
      }).catch(() => false)
      if (visible) return frame
    }
    return undefined
  })
}

async function previewState (frame) {
  return frame.evaluate(() => {
    const preview = document.querySelector('.preview')
    const img = document.querySelector('.preview img')
    const size = document.querySelector('.toolbar .size')
    return {
      classes: preview ? preview.className : null,
      hasError: !!document.querySelector('.error-container'),
      imgLoaded: !!img && img.complete && img.naturalWidth > 0,
      width: img ? img.getBoundingClientRect().width : 0,
      height: img ? img.getBoundingClientRect().height : 0,
      src: img ? decodeURIComponent(img.getAttribute('src') || '') : '',
      fileSize: size ? size.textContent : null
    }
  })
}

// Rendered image size against the space inside the preview area
async function fitState (frame) {
  return frame.evaluate(() => {
    const preview = document.querySelector('.preview')
    const img = document.querySelector('.preview img')
    const style = window.getComputedStyle(preview)
    const button = document.querySelector('button[name="fit-to-window"]')
    return {
      width: img.getBoundingClientRect().width,
      height: img.getBoundingClientRect().height,
      availableWidth: preview.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
      availableHeight: preview.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
      scrolls: preview.scrollWidth > preview.clientWidth || preview.scrollHeight > preview.clientHeight,
      buttonDisabled: button.disabled
    }
  })
}

function isFitted (s) {
  return !s.scrolls && s.width <= s.availableWidth && s.height <= s.availableHeight &&
    (s.availableWidth - s.width < 2 || s.availableHeight - s.height < 2)
}

// Color in the middle of the rendered preview image, read from a screenshot
// (so it is what is on screen) and named 'blue', 'lime' or the raw rgb value.
async function imageColor (page, frame) {
  const png = await frame.locator('.preview img').screenshot()
  const [r, g, b] = await page.evaluate(async (base64) => {
    const img = new Image()
    img.src = `data:image/png;base64,${base64}`
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const context = canvas.getContext('2d')
    context.drawImage(img, 0, 0)
    return Array.from(context.getImageData(Math.floor(img.width / 2), Math.floor(img.height / 2), 1, 1).data)
  }, png.toString('base64'))
  // Loose ranges: screenshots go through the display's color profile
  if (b > 180 && r < 120 && g < 120) return 'blue'
  if (g > 180 && r < 160 && b < 120) return 'lime'
  return `rgb(${r}, ${g}, ${b})`
}

async function main () {
  console.log(`Mode: ${untrusted ? 'untrusted workspace (Restricted Mode)' : 'trusted workspace'}, ${vsix ? 'installed .vsix' : 'development mode'}`)
  fs.mkdirSync(screenshotsDir, { recursive: true })
  for (const file of fs.readdirSync(screenshotsDir)) {
    if (file.startsWith('untrusted-') === untrusted) fs.rmSync(path.join(screenshotsDir, file))
  }

  // Work on copies of the fixtures so the live-update check can edit files.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-previewer-e2e-'))
  const workspace = path.join(tmp, 'workspace')
  fs.cpSync(fixturesDir, workspace, { recursive: true })

  const userDataDir = path.join(tmp, 'user-data')
  fs.mkdirSync(path.join(userDataDir, 'User'), { recursive: true })
  fs.writeFileSync(path.join(userDataDir, 'User', 'settings.json'), JSON.stringify({
    'telemetry.telemetryLevel': 'off',
    'telemetry.enableTelemetry': false,
    'workbench.startupEditor': 'none',
    'workbench.colorTheme': 'Default Dark Modern',
    'window.restoreWindows': 'none',
    'security.workspace.trust.enabled': untrusted,
    'security.workspace.trust.startupPrompt': 'never',
    'security.workspace.trust.banner': 'never',
    'update.mode': 'none',
    'extensions.autoUpdate': false,
    'chat.disableAIFeatures': true,
    'workbench.secondarySideBar.defaultVisibility': 'hidden',
    // Recent VS Code opens .svg in its built-in image preview; the extension
    // works with the text editor, so open SVGs as text.
    'workbench.editorAssociations': { '*.svg': 'default' }
  }, null, 2))

  const executablePath = await downloadAndUnzipVSCode('stable')
  const extensionsDir = path.join(tmp, 'extensions')

  if (vsix) {
    const [cli, ...cliArgs] = resolveCliArgsFromVSCodeExecutablePath(executablePath)
    const install = spawnSync(cli, [...cliArgs, '--extensions-dir', extensionsDir, '--user-data-dir', userDataDir, '--install-extension', vsix], { encoding: 'utf8' })
    if (install.status !== 0) throw new Error(`Installing ${vsix} failed:\n${install.stdout}${install.stderr}`)
    console.log(`Installed ${path.basename(vsix)}`)
  }

  // Don't let the child VS Code attach to a parent VS Code instance.
  const env = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !key.startsWith('VSCODE_') && key !== 'ELECTRON_RUN_AS_NODE'))

  const app = await electron.launch({
    executablePath,
    env,
    args: [
      workspace,
      ...(vsix ? [] : [`--extensionDevelopmentPath=${root}`]),
      `--extensionDevelopmentPath=${path.join(root, 'test/e2e/svg-language-extension')}`,
      `--user-data-dir=${userDataDir}`,
      `--extensions-dir=${extensionsDir}`,
      ...(untrusted ? [] : ['--disable-workspace-trust']),
      '--skip-welcome',
      '--skip-release-notes',
      '--disable-telemetry',
      '--new-window'
    ]
  })

  const consoleErrors = []
  let page
  try {
    page = await app.firstWindow()
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', err => consoleErrors.push(`pageerror: ${err.message}`))

    await page.setViewportSize({ width: 1400, height: 900 }).catch(() => {})
    await page.locator('.monaco-workbench').waitFor({ timeout: 60000 })
    await page.waitForTimeout(2000)

    // 0. An .svg file whose language another extension set to `svg` (#78).
    // Opened first so it also checks that the extension activates for it.
    const previewButton = page.locator('.editor-actions .action-label[aria-label^="Open Preview to the Side"]')
    await quickOpen(page, 'other-language.svg')
    await page.locator('.monaco-editor .view-lines').first().waitFor()
    check('preview button shows for language `svg`', await waitFor(() => previewButton.isVisible(), { timeout: 5000 }) || false)
    await page.keyboard.press(`${mod}+K`)
    await page.keyboard.press('V')
    let frame = await findPreviewFrame(page)
    let state = frame ? (await waitFor(async () => { const s = await previewState(frame); return s.src.includes('#1abc9c') && s.imgLoaded ? s : undefined }) || await previewState(frame)) : null
    check('Cmd/Ctrl+K V previews language `svg`', !!state && state.imgLoaded)
    await screenshot(page, 'other-language')
    await runCommand(page, 'View: Close All Editors')
    await page.waitForTimeout(500)

    // A plain XML file must not get the button
    await quickOpen(page, 'not-svg.xml')
    await page.locator('.monaco-editor .view-lines').first().waitFor()
    await page.waitForTimeout(500)
    check('no preview button for .xml', !(await previewButton.isVisible()))
    await runCommand(page, 'View: Close All Editors')
    await page.waitForTimeout(500)

    // Same-column shortcut and the return path to the original source.
    await quickOpen(page, 'square.svg')
    const sourceGroup = page.locator('.editor-group-container').filter({ has: page.locator('.tab', { hasText: /^square\.svg$/ }) })
    await page.keyboard.press(`${mod}+Shift+V`)
    frame = await findPreviewFrame(page)
    check('Open Preview uses the source column', !!frame && await sourceGroup.locator('.tab.active', { hasText: 'Preview square.svg' }).isVisible())
    await runCommand(page, 'Svg: Show Source')
    await sourceGroup.locator('.monaco-editor .view-lines').waitFor()
    check('Show Source returns to square.svg', await sourceGroup.locator('.tab.active', { hasText: /^square\.svg$/ }).isVisible())
    await runCommand(page, 'View: Close All Editors')
    await page.locator('.tab').first().waitFor({ state: 'detached' })

    // 1. Open preview to the side
    await quickOpen(page, 'square.svg')
    await page.locator('.monaco-editor .view-lines').first().waitFor()
    await runCommand(page, 'Svg: Open Preview to the Side')
    frame = await findPreviewFrame(page)
    check('preview to the side opens', !!frame)
    if (!frame) { await screenshot(page, 'no-preview'); return }

    state = await waitFor(async () => {
      const s = await previewState(frame)
      return s.imgLoaded ? s : undefined
    }) || await previewState(frame)
    check('square.svg renders', state.imgLoaded, `${state.width}x${state.height}`)
    check('square.svg has 100x100 size', state.width === 100 && state.height === 100, `${state.width}x${state.height}`)
    check('toolbar shows file size', !!state.fileSize && state.fileSize !== '0 B', state.fileSize)
    await screenshot(page, 'preview-square')

    // 2. Zoom
    const zoomReset = frame.locator('button[name="zoom-reset"]')
    check('zoom reset disabled at 100%', await zoomReset.isDisabled())
    await frame.locator('button[name="zoom-in"]').click()
    state = await waitFor(async () => { const s = await previewState(frame); return s.width === 150 ? s : undefined }) || await previewState(frame)
    check('zoom in scales to 150%', state.width === 150, `width ${state.width}`)
    await screenshot(page, 'zoom-in')
    await frame.locator('button[name="zoom-out"]').click()
    state = await waitFor(async () => { const s = await previewState(frame); return s.width === 75 ? s : undefined }) || await previewState(frame)
    check('zoom out scales to 75%', state.width === 75, `width ${state.width}`)
    await zoomReset.click()
    state = await waitFor(async () => { const s = await previewState(frame); return s.width === 100 ? s : undefined }) || await previewState(frame)
    check('zoom reset returns to 100%', state.width === 100, `width ${state.width}`)

    await frame.locator('.preview img').hover()
    await page.keyboard.down(mod)
    try {
      await page.mouse.wheel(0, -120)
    } finally {
      await page.keyboard.up(mod)
    }
    check('modifier + mouse wheel zooms the preview', !!await waitFor(async () => (await previewState(frame)).width > 100))
    await zoomReset.click()

    // 2b. Fit to window (#60)
    const fitButton = frame.locator('button[name="fit-to-window"]')
    check('fit to window enabled when the image does not fit', !(await fitState(frame)).buttonDisabled)
    await fitButton.click()
    let fit = await waitFor(async () => { const s = await fitState(frame); return isFitted(s) ? s : undefined }) || await fitState(frame)
    check('fit to window enlarges square.svg to the panel', isFitted(fit) && fit.width > 100, JSON.stringify(fit))
    check('fit to window disabled once fitted', fit.buttonDisabled)
    await screenshot(page, 'fit-to-window')
    await frame.locator('button[name="zoom-in"]').click()
    fit = await fitState(frame)
    check('zooming enables fit to window again', !fit.buttonDisabled && fit.scrolls, JSON.stringify(fit))
    await zoomReset.click()
    await waitFor(async () => (await previewState(frame)).width === 100)

    // 3. Background
    const userSettingsPath = path.join(userDataDir, 'User', 'settings.json')
    const userSettings = () => JSON.parse(fs.readFileSync(userSettingsPath, 'utf8'))
    await frame.locator('button[name="light"]').click()
    state = await previewState(frame)
    check('light background applied', /\blight\b/.test(state.classes), state.classes)
    check('background choice saved to user settings (#56)', !!await waitFor(() => userSettings()['svg.preview.background'] === 'light'))
    await screenshot(page, 'background-light')
    await frame.locator('button[name="dark"]').click()
    state = await previewState(frame)
    check('dark background applied', /\bdark\b/.test(state.classes), state.classes)

    // 4. Transparency grid and bounding box toggles
    await frame.locator('button[name="transparency-grid"]').click()
    await frame.locator('button[name="bounding-box"]').click()
    state = await previewState(frame)
    check('transparency grid turns on', state.classes.includes('transparency-grid'), state.classes)
    check('bounding box turns on', state.classes.includes('bounding-box'), state.classes)
    await screenshot(page, 'grid-and-bounding-box')
    await frame.locator('button[name="transparency-grid"]').click()
    await frame.locator('button[name="bounding-box"]').click()
    state = await previewState(frame)
    check('toggles turn off again', !state.classes.includes('transparency-grid') && !state.classes.includes('bounding-box'), state.classes)

    // 5. Live update when the file changes on disk
    fs.writeFileSync(path.join(workspace, 'square.svg'),
      fs.readFileSync(path.join(workspace, 'square.svg'), 'utf8').replace('#e74c3c', '#2ecc71'))
    state = await waitFor(async () => { const s = await previewState(frame); return s.src.includes('#2ecc71') ? s : undefined }) || await previewState(frame)
    check('preview updates when file changes', state.src.includes('#2ecc71'))
    await screenshot(page, 'live-update')

    // Insert a text node immediately after the opening tag, without saving.
    const sourceEditor = page.locator('.editor-group-container').first().locator('.monaco-editor')
    await sourceEditor.locator('.view-line').first().click({ position: { x: 4, y: 5 } })
    await page.keyboard.press(isMac ? 'Meta+ArrowRight' : 'End')
    const marker = 'unsavedPreviewEdit'
    await page.keyboard.insertText(marker)
    check('unsaved edits update the preview', !!await waitFor(async () => (await previewState(frame)).src.includes(marker)) &&
      !fs.readFileSync(path.join(workspace, 'square.svg'), 'utf8').includes(marker))
    await runCommand(page, 'File: Revert File')

    // 6. Preview follows the active editor; non-square image keeps its aspect ratio
    await page.locator('.editor-group-container').first().click({ position: { x: 200, y: 200 } })
    await quickOpen(page, 'wide.svg')
    state = await waitFor(async () => { const s = await previewState(frame); return s.src.includes('#3498db') && s.imgLoaded ? s : undefined }) || await previewState(frame)
    check('preview follows active editor (wide.svg)', state.src.includes('#3498db'))
    check('wide.svg keeps 200x100 size', state.width === 200 && state.height === 100, `${state.width}x${state.height}`)
    await screenshot(page, 'preview-wide')

    // 6b. Diagrams are not squeezed (#59): the preview box must match the SVG size,
    // including preserveAspectRatio="none" (PlantUML), units and look-alike attributes
    for (const [file, color, width, height] of [
      ['diagram.svg', '#f1c40f', 400, 150], // 400px x 150px
      ['attributes.svg', '#9b59b6', 400, 160] // 300pt x 120pt, after stroke-width/data-height
    ]) {
      await page.locator('.editor-group-container').first().click({ position: { x: 200, y: 200 } })
      await quickOpen(page, file)
      state = await waitFor(async () => { const s = await previewState(frame); return s.src.includes(color) && s.imgLoaded ? s : undefined }) || await previewState(frame)
      check(`${file} keeps ${width}x${height} size`, state.width === width && state.height === height, `${state.width}x${state.height}`)
      await screenshot(page, `preview-${path.basename(file, '.svg')}`)
    }

    // 6b2. Fit mode stays on when the preview switches to another file
    await fitButton.click()
    await waitFor(async () => isFitted(await fitState(frame)))
    await page.locator('.editor-group-container').first().click({ position: { x: 200, y: 200 } })
    await quickOpen(page, 'large.svg')
    await waitFor(async () => { const s = await previewState(frame); return s.src.includes('#16a085') && s.imgLoaded ? s : undefined })
    fit = await waitFor(async () => { const s = await fitState(frame); return isFitted(s) ? s : undefined }) || await fitState(frame)
    check('fit to window shrinks large.svg (3000x1500) to the panel', isFitted(fit) && fit.width < 3000 && Math.abs(fit.width / fit.height - 2) < 0.05, JSON.stringify(fit))
    check('fit to window stays disabled after switching files', fit.buttonDisabled)
    await screenshot(page, 'fit-to-window-large')
    await zoomReset.click()

    // 6c. prefers-color-scheme inside the SVG follows the preview background, not the OS (#80)
    await page.locator('.editor-group-container').first().click({ position: { x: 200, y: 200 } })
    await quickOpen(page, 'color-scheme.svg')
    state = await waitFor(async () => { const s = await previewState(frame); return s.src.includes('lime') && s.imgLoaded ? s : undefined }) || await previewState(frame)
    for (const [os, background, expected] of [['light', 'dark', 'lime'], ['dark', 'light', 'blue']]) {
      await page.emulateMedia({ colorScheme: os })
      await frame.locator(`button[name="${background}"]`).click()
      await page.waitForTimeout(300)
      const color = await imageColor(page, frame)
      check(`${background} background renders ${expected} with ${os} OS`, color === expected, color)
      await screenshot(page, `color-scheme-${background}`)
    }
    await page.emulateMedia({ colorScheme: null })
    await frame.locator('button[name="dark"]').click()

    // 7. Broken SVG shows an error
    await page.locator('.editor-group-container').first().click({ position: { x: 200, y: 200 } })
    await quickOpen(page, 'broken.svg')
    state = await waitFor(async () => { const s = await previewState(frame); return s.hasError ? s : undefined }) || await previewState(frame)
    check('broken.svg shows error message', state.hasError)
    await screenshot(page, 'preview-broken')

    const brokenFile = path.join(workspace, 'broken.svg')
    fs.copyFileSync(path.join(fixturesDir, 'square.svg'), brokenFile)
    await frame.locator('button[name="zoom-in"]').click()
    check('repaired SVG renders and zoom works', !!await waitFor(async () => {
      const repaired = await previewState(frame)
      return repaired.imgLoaded && repaired.width === 150
    }))
    fs.copyFileSync(path.join(fixturesDir, 'broken.svg'), brokenFile)
    check('a second invalid edit shows the error again', !!await waitFor(() => frame.locator('.error-container').isVisible()))

    // 8. Custom editor ("Image Viewer")
    await runCommand(page, 'View: Close All Editors')
    await page.waitForTimeout(500)
    await quickOpen(page, 'square.svg')
    await page.locator('.monaco-editor .view-lines').first().waitFor()
    await runCommand(page, 'View: Reopen Editor With...')
    const viewer = page.locator('.quick-input-list .monaco-list-row', { hasText: 'Image Viewer' }).first()
    await viewer.waitFor({ timeout: 5000 }).catch(() => {})
    if (await viewer.count()) {
      await viewer.click()
      frame = await findPreviewFrame(page)
      state = frame ? (await waitFor(async () => { const s = await previewState(frame); return s.imgLoaded ? s : undefined }) || await previewState(frame)) : null
      check('custom editor (Image Viewer) renders', !!state && state.imgLoaded)
    } else {
      check('custom editor (Image Viewer) is offered', false, 'not in "Reopen Editor With" list')
      await page.keyboard.press('Escape')
    }
    await screenshot(page, 'custom-editor')

    // 9. VS Code's built-in Image Preview (the default editor for .svg on current VS Code).
    // The preview must be reachable from there by the button and by Cmd/Ctrl+K V.
    for (const via of ['button', 'keybinding']) {
      await runCommand(page, 'View: Close All Editors')
      await page.waitForTimeout(500)
      await quickOpen(page, 'wide.svg')
      await page.waitForTimeout(1000)
      // VS Code remembers the editor chosen for the file, so this is only needed the first time
      if (await page.locator('.editor-group-container .monaco-editor .view-lines').first().isVisible()) {
        await runCommand(page, 'Image Preview: Reopen as Image Preview')
        await page.waitForTimeout(1000)
      }
      if (via === 'button') {
        const visible = await waitFor(() => previewButton.isVisible(), { timeout: 5000 }) || false
        check('preview button shows in built-in Image Preview', visible)
        if (visible) await previewButton.click()
      } else {
        await page.keyboard.press(`${mod}+K`)
        await page.keyboard.press('V')
      }
      frame = await findPreviewFrame(page)
      state = frame ? (await waitFor(async () => { const s = await previewState(frame); return s.src.includes('#3498db') && s.imgLoaded ? s : undefined }) || await previewState(frame)) : null
      check(`preview opens from built-in Image Preview (${via})`, !!state && state.imgLoaded)
      await screenshot(page, `from-image-preview-${via}`)
    }

    // 10. The preview reloads when the file changes on disk and no text editor has it open (#79)
    await page.locator('.tab', { hasText: /^wide\.svg/ }).first().click()
    await page.keyboard.press(`${mod}+W`)
    await page.waitForTimeout(500)
    check('only the preview is left open', await page.locator('.tab').count() === 1, `${await page.locator('.tab').count()} tabs`)
    fs.writeFileSync(path.join(workspace, 'wide.svg'),
      fs.readFileSync(path.join(workspace, 'wide.svg'), 'utf8').replace('#3498db', '#e67e22'))
    frame = await findPreviewFrame(page)
    state = frame ? (await waitFor(async () => { const s = await previewState(frame); return s.src.includes('#e67e22') ? s : undefined }) || await previewState(frame)) : null
    check('preview reloads file changed on disk (no editor open)', !!state && state.src.includes('#e67e22'))
    await screenshot(page, 'reload-from-disk')

    // Persist both toggles and a light background (in a dark theme), then reload VS Code with only the preview open.
    await frame.locator('button[name="transparency-grid"]').click()
    await frame.locator('button[name="bounding-box"]').click()
    await frame.locator('button[name="light"]').click()
    check('grid, bounding box and background saved to user settings', !!await waitFor(() => {
      const settings = userSettings()
      return settings['svg.preview.transparencyGrid'] && settings['svg.preview.boundingBox'] && settings['svg.preview.background'] === 'light'
    }))

    fs.mkdirSync(path.join(workspace, '.vscode'), { recursive: true })
    fs.writeFileSync(path.join(workspace, '.vscode', 'settings.json'), JSON.stringify({ 'svg.preview.autoOpen': true }))
    await Promise.all([
      page.waitForEvent('framedetached', { predicate: detached => detached === frame, timeout: 30000 }),
      runCommand(page, 'Developer: Reload Window')
    ])
    frame = await findPreviewFrame(page)
    check('reload restores the preview and its source', !!frame && !!await waitFor(async () => {
      const restored = await previewState(frame)
      return restored.src.includes('#e67e22') && restored.imgLoaded
    }))
    await runCommand(page, 'View: Close All Editors')
    await page.locator('.tab').first().waitFor({ state: 'detached' })
    await quickOpen(page, 'diagram.svg')
    frame = await findPreviewFrame(page)
    check('auto-open displays the SVG beside its editor', !!frame && await page.locator('.editor-group-container').count() === 2 &&
      !!await waitFor(async () => (await previewState(frame)).src.includes('#f1c40f')))
    check('new previews use the saved grid and bounding box', !!frame && await frame.locator('.preview.transparency-grid.bounding-box').isVisible())
    check('new previews use the saved light background in a dark theme (#56)', !!frame && await frame.locator('.preview.light').isVisible())

    // 11. With background "auto" the preview follows the color theme
    fs.writeFileSync(userSettingsPath, JSON.stringify({ ...userSettings(), 'svg.preview.background': 'auto' }, null, 2))
    await page.waitForTimeout(1000)
    fs.writeFileSync(path.join(workspace, 'diagram.svg'),
      fs.readFileSync(path.join(workspace, 'diagram.svg'), 'utf8').replace('#f1c40f', '#c0392b'))
    check('background "auto" uses the dark theme', !!await waitFor(async () => {
      const s = await previewState(frame)
      return s.src.includes('#c0392b') && /\bdark\b/.test(s.classes)
    }))
    fs.writeFileSync(userSettingsPath, JSON.stringify({ ...userSettings(), 'workbench.colorTheme': 'Default Light Modern' }, null, 2))
    check('background "auto" follows a switch to a light theme', !!await waitFor(async () => /\blight\b/.test((await previewState(frame)).classes)))
    await screenshot(page, 'background-auto-light-theme')
  } catch (err) {
    if (page) await screenshot(page, 'failure').catch(() => {})
    throw err
  } finally {
    const relevant = consoleErrors.filter(text => /svg|preview|webview|vitaliymaz/i.test(text))
    if (relevant.length) {
      console.log(`\nConsole errors mentioning the extension (${relevant.length}):`)
      relevant.slice(0, 20).forEach(text => console.log(`  - ${text.slice(0, 300)}`))
    }
    await app.close().catch(() => {})
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

main()
  .catch(err => {
    console.error(err)
    check('test run completed', false, err.message)
  })
  .finally(() => {
    const failed = results.filter(r => !r.ok)
    console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
    process.exitCode = failed.length ? 1 : 0
  })
