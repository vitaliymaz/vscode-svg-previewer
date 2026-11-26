import { _electron as electron } from 'playwright-core'
import { downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath } from '@vscode/test-electron'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const workspaceSource = path.join(root, 'test/e2e/demo-workspace')
const output = path.join(root, 'media/demo.gif')
const vsix = process.argv[2] ? path.resolve(process.argv[2]) : null
const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
const width = 1200
const height = 750

if (!vsix) {
  console.error('Usage: node test/e2e/record-demo.mjs <extension.vsix>')
  process.exit(1)
}

const pause = (page, ms) => page.waitForTimeout(ms)

async function waitFor (fn, { timeout = 15000, interval = 100 } = {}) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    try {
      const value = await fn()
      if (value) return value
    } catch (e) {}
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  throw new Error('Timed out')
}

async function findPreviewFrame (page) {
  return waitFor(async () => {
    for (const frame of page.frames()) {
      const ready = await frame.evaluate(() => {
        const img = document.querySelector('.preview img')
        return !!img && img.complete && img.naturalWidth > 0 && document.visibilityState === 'visible'
      }).catch(() => false)
      if (ready) return frame
    }
  })
}

async function installCursor (page) {
  await page.evaluate(({ x, y }) => {
    const ns = 'http://www.w3.org/2000/svg'
    const cursor = document.createElement('div')
    cursor.id = 'demo-cursor'
    Object.assign(cursor.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '22px',
      height: '22px',
      zIndex: '2147483647',
      pointerEvents: 'none',
      transform: `translate(${x}px, ${y}px)`,
      transitionProperty: 'transform',
      transitionTimingFunction: 'cubic-bezier(0.45, 0, 0.25, 1)'
    })
    const svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('width', '22')
    svg.setAttribute('height', '22')
    svg.setAttribute('viewBox', '0 0 22 22')
    const arrow = document.createElementNS(ns, 'path')
    arrow.setAttribute('d', 'M2 1 L2 17 L6.5 13 L9.5 20 L12.5 18.7 L9.6 12 L15.5 12 Z')
    arrow.setAttribute('fill', '#ffffff')
    arrow.setAttribute('stroke', '#000000')
    arrow.setAttribute('stroke-width', '1.3')
    arrow.setAttribute('stroke-linejoin', 'round')
    svg.appendChild(arrow)
    cursor.appendChild(svg)
    const ripple = document.createElement('div')
    ripple.id = 'demo-ripple'
    Object.assign(ripple.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '36px',
      height: '36px',
      margin: '-18px 0 0 -18px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.35)',
      border: '2px solid rgba(255, 255, 255, 0.8)',
      boxSizing: 'border-box',
      zIndex: '2147483646',
      pointerEvents: 'none',
      opacity: '0'
    })
    document.body.appendChild(ripple)
    document.body.appendChild(cursor)
  }, { x: width / 2, y: height / 2 })
}

async function moveCursor (page, x, y, duration = 550) {
  await page.evaluate(({ x, y, duration }) => {
    const cursor = document.getElementById('demo-cursor')
    cursor.style.transitionDuration = `${duration}ms`
    cursor.style.transform = `translate(${x}px, ${y}px)`
  }, { x, y, duration })
  await page.mouse.move(x, y)
  await pause(page, duration + 80)
}

async function ripple (page, x, y) {
  await page.evaluate(({ x, y }) => {
    const ripple = document.getElementById('demo-ripple')
    ripple.style.transform = `translate(${x}px, ${y}px)`
    ripple.animate([
      { opacity: 1, scale: '0.4' },
      { opacity: 0, scale: '1.2' }
    ], { duration: 450, easing: 'ease-out' })
  }, { x, y })
}

async function center (locator) {
  const box = await locator.boundingBox()
  return { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) }
}

async function click (page, locator, { duration, dblclick = false } = {}) {
  await locator.waitFor({ state: 'visible' })
  const { x, y } = await center(locator)
  await moveCursor(page, x, y, duration)
  await ripple(page, x, y)
  if (dblclick) await page.mouse.dblclick(x, y)
  else await page.mouse.click(x, y)
}

function startCapture (cdp, dir) {
  const frames = []
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    const file = path.join(dir, `frame-${String(frames.length).padStart(5, '0')}.png`)
    fs.writeFileSync(file, Buffer.from(data, 'base64'))
    frames.push({ file, time: metadata.timestamp })
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  return {
    frames,
    start: () => cdp.send('Page.startScreencast', { format: 'png', maxWidth: width, maxHeight: height, everyNthFrame: 1 }),
    stop: () => cdp.send('Page.stopScreencast')
  }
}

function encodeGif (frames, end, dir) {
  const list = []
  frames.forEach((frame, index) => {
    const next = index + 1 < frames.length ? frames[index + 1].time : end
    list.push(`file '${frame.file}'`, `duration ${Math.max(next - frame.time, 0.001).toFixed(3)}`)
  })
  list.push(`file '${frames[frames.length - 1].file}'`)
  const listFile = path.join(dir, 'frames.txt')
  fs.writeFileSync(listFile, list.join('\n'))
  const filter = `fps=15,scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=256:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`
  const result = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-vf', filter, '-loop', '0', output], { stdio: 'inherit' })
  if (result.status !== 0) throw new Error('ffmpeg failed')
}

async function runCommand (page, title) {
  await page.keyboard.press(`${mod}+Shift+P`)
  const input = page.locator('.quick-input-widget input')
  await input.waitFor({ state: 'visible' })
  await pause(page, 250)
  await page.keyboard.type(title, { delay: 30 })
  await page.locator('.quick-input-list .monaco-list-row').first().waitFor()
  await pause(page, 350)
  await page.keyboard.press('Enter')
}

async function demo (page) {
  const previewButton = page.locator('.editor-actions .action-label[aria-label^="Open Preview to the Side"]')
  await click(page, previewButton, { duration: 800 })
  const frame = await findPreviewFrame(page)
  await pause(page, 1100)

  const button = name => frame.locator(`button[name="${name}"]`)
  await click(page, button('zoom-in'), { duration: 650 })
  await pause(page, 450)
  await click(page, button('zoom-in'), { duration: 150 })
  await pause(page, 800)
  await click(page, button('fit-to-window'))
  await pause(page, 1000)
  await click(page, button('zoom-reset'))
  await pause(page, 800)

  await click(page, button('light'))
  await pause(page, 1000)
  await click(page, button('dark'))
  await pause(page, 700)
  await click(page, button('transparency-grid'))
  await pause(page, 700)
  await click(page, button('bounding-box'))
  await pause(page, 1100)

  const previewTab = page.locator('.tab', { hasText: 'Preview sunset.svg' })
  await previewTab.hover()
  await click(page, previewTab.locator('.tab-actions .action-label'), { duration: 650 })
  await page.locator('.editor-group-container').nth(1).waitFor({ state: 'detached' }).catch(() => {})
  await pause(page, 500)

  await runCommand(page, 'View: Reopen Editor With...')
  const viewer = page.locator('.quick-input-list .monaco-list-row', { hasText: 'Image Viewer' }).first()
  await viewer.waitFor()
  await pause(page, 500)
  await click(page, viewer, { duration: 650 })
  await findPreviewFrame(page)
  await moveCursor(page, width - 140, height - 120, 800)
  await pause(page, 1800)
}

async function main () {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-previewer-demo-'))
  const workspace = path.join(tmp, 'demo')
  fs.cpSync(workspaceSource, workspace, { recursive: true })
  const framesDir = path.join(tmp, 'frames')
  fs.mkdirSync(framesDir)

  const userDataDir = path.join(tmp, 'user-data')
  fs.mkdirSync(path.join(userDataDir, 'User'), { recursive: true })
  fs.writeFileSync(path.join(userDataDir, 'User', 'settings.json'), JSON.stringify({
    'telemetry.telemetryLevel': 'off',
    'workbench.startupEditor': 'none',
    'workbench.colorTheme': 'Default Dark Modern',
    'window.restoreWindows': 'none',
    'security.workspace.trust.enabled': false,
    'update.mode': 'none',
    'extensions.autoUpdate': false,
    'extensions.ignoreRecommendations': true,
    'chat.disableAIFeatures': true,
    'workbench.secondarySideBar.defaultVisibility': 'hidden',
    'workbench.tips.enabled': false,
    'workbench.layoutControl.enabled': false,
    'workbench.editor.empty.hint': 'hidden',
    'window.commandCenter': false,
    'editor.minimap.enabled': false,
    'editor.stickyScroll.enabled': false,
    'editor.fontSize': 13,
    'breadcrumbs.enabled': false,
    'git.enabled': false,
    'workbench.editorAssociations': { '*.svg': 'default' }
  }, null, 2))

  const executablePath = await downloadAndUnzipVSCode('stable')
  const extensionsDir = path.join(tmp, 'extensions')
  const [cli, ...cliArgs] = resolveCliArgsFromVSCodeExecutablePath(executablePath)
  const install = spawnSync(cli, [...cliArgs, '--extensions-dir', extensionsDir, '--user-data-dir', userDataDir, '--install-extension', vsix], { encoding: 'utf8' })
  if (install.status !== 0) throw new Error(`Installing ${vsix} failed:\n${install.stdout}${install.stderr}`)

  const env = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !key.startsWith('VSCODE_') && key !== 'ELECTRON_RUN_AS_NODE'))

  const app = await electron.launch({
    executablePath,
    env,
    args: [
      workspace,
      `--user-data-dir=${userDataDir}`,
      `--extensions-dir=${extensionsDir}`,
      '--disable-workspace-trust',
      '--skip-welcome',
      '--skip-release-notes',
      '--disable-telemetry',
      '--new-window'
    ]
  })

  try {
    const page = await app.firstWindow()
    await app.evaluate(({ BrowserWindow }, size) => {
      const window = BrowserWindow.getAllWindows()[0]
      window.unmaximize()
      window.setContentSize(size.width, size.height)
      window.center()
    }, { width, height })
    await page.locator('.monaco-workbench').waitFor({ timeout: 60000 })
    await page.locator('.explorer-folders-view .monaco-list-row', { hasText: /^sunset\.svg$/ }).dblclick()
    await page.locator('.editor-actions .action-label[aria-label^="Open Preview to the Side"]').waitFor()
    await page.mouse.move(0, 0)
    await pause(page, 3000)
    await page.evaluate(() => document.querySelectorAll('.notifications-toasts .codicon-notifications-clear').forEach(el => el.click()))
    await installCursor(page)

    const cdp = await page.context().newCDPSession(page)
    const capture = startCapture(cdp, framesDir)
    await capture.start()
    await pause(page, 600)
    await demo(page)
    await capture.stop()
    const end = Date.now() / 1000
    console.log(`Captured ${capture.frames.length} frames over ${(end - capture.frames[0].time).toFixed(1)}s`)
    encodeGif(capture.frames, end, tmp)
    console.log(`Wrote ${path.relative(root, output)} (${(fs.statSync(output).size / 1024 / 1024).toFixed(2)} MB)`)
  } finally {
    await app.close().catch(() => {})
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
