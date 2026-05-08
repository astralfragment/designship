import { config as loadEnv } from 'dotenv'
import { join } from 'path'
loadEnv({ path: join(__dirname, '../../.env') })

import { app, BrowserWindow, nativeImage, shell } from 'electron'
import { initDatabase } from './db/schema'
import { createTray } from './tray'
import { registerIPCHandlers } from './ipc/handlers'
import { maybeSeedOnFirstRun } from './db/sample-workspace'

let mainWindow: BrowserWindow | null = null

function getAppIcon() {
  const iconPath = join(__dirname, '../../build/icon.png')
  try {
    const img = nativeImage.createFromPath(iconPath)
    if (!img.isEmpty()) return img
  } catch {}
  return undefined
}

function createWindow() {
  const icon = getAppIcon()
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 900,
    minHeight: 640,
    icon,
    backgroundColor: '#FFFAF5',
    show: false,
    autoHideMenuBar: true,
    frame: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    if (process.env.ELECTRON_RENDERER_URL) {
      mainWindow?.webContents.openDevTools({ mode: 'bottom' })
    }
  })

  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  const db = initDatabase()
  registerIPCHandlers(db)

  // Seed the "Welcome to Fragment" project on first launch
  maybeSeedOnFirstRun(db)

  createWindow()
  createTray(mainWindow!)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('before-quit', () => {
  mainWindow?.removeAllListeners('close')
  mainWindow?.close()
})

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}
