// End-to-end smoke test: launches a clean VS Code with this extension loaded,
// drives it with Playwright, checks the preview, and saves screenshots.
//
// Usage: npm run test:e2e   (compiles first)
// Screenshots: test/e2e/screenshots/

import { _electron as electron } from 'playwright-core'
import { downloadAndUnzipVSCode } from '@vscode/test-electron'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const fixturesDir = path.join(root, 'test/e2e/fixtures')
const screenshotsDir = path.join(root, 'test/e2e/screenshots')
const isMac = process.platform === 'darwin'
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
  const file = path.join(screenshotsDir, `${String(shot).padStart(2, '0')}-${name}.png`)
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

async function main () {
  fs.rmSync(screenshotsDir, { recursive: true, force: true })
  fs.mkdirSync(screenshotsDir, { recursive: true })

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
    'security.workspace.trust.enabled': false,
    'update.mode': 'none',
    'extensions.autoUpdate': false,
    'chat.disableAIFeatures': true,
    'workbench.secondarySideBar.defaultVisibility': 'hidden',
    // Recent VS Code opens .svg in its built-in image preview; the extension
    // works with the text editor, so open SVGs as text.
    'workbench.editorAssociations': { '*.svg': 'default' }
  }, null, 2))

  const executablePath = await downloadAndUnzipVSCode('stable')

  // Don't let the child VS Code attach to a parent VS Code instance.
  const env = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !key.startsWith('VSCODE_') && key !== 'ELECTRON_RUN_AS_NODE'))

  const app = await electron.launch({
    executablePath,
    env,
    args: [
      workspace,
      `--extensionDevelopmentPath=${root}`,
      `--user-data-dir=${userDataDir}`,
      `--extensions-dir=${path.join(tmp, 'extensions')}`,
      '--disable-workspace-trust',
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

    // 1. Open preview to the side
    await quickOpen(page, 'square.svg')
    await page.locator('.monaco-editor .view-lines').first().waitFor()
    await runCommand(page, 'Svg: Open Preview to the Side')
    let frame = await findPreviewFrame(page)
    check('preview to the side opens', !!frame)
    if (!frame) { await screenshot(page, 'no-preview'); return }

    let state = await waitFor(async () => {
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

    // 3. Background
    await frame.locator('button[name="light"]').click()
    state = await previewState(frame)
    check('light background applied', /\blight\b/.test(state.classes), state.classes)
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

    // 6. Preview follows the active editor; non-square image keeps its aspect ratio
    await page.locator('.editor-group-container').first().click({ position: { x: 200, y: 200 } })
    await quickOpen(page, 'wide.svg')
    state = await waitFor(async () => { const s = await previewState(frame); return s.src.includes('#3498db') && s.imgLoaded ? s : undefined }) || await previewState(frame)
    check('preview follows active editor (wide.svg)', state.src.includes('#3498db'))
    check('wide.svg keeps 200x100 size', state.width === 200 && state.height === 100, `${state.width}x${state.height}`)
    await screenshot(page, 'preview-wide')

    // 7. Broken SVG shows an error
    await page.locator('.editor-group-container').first().click({ position: { x: 200, y: 200 } })
    await quickOpen(page, 'broken.svg')
    state = await waitFor(async () => { const s = await previewState(frame); return s.hasError ? s : undefined }) || await previewState(frame)
    check('broken.svg shows error message', state.hasError)
    await screenshot(page, 'preview-broken')

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
