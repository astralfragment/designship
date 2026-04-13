import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { initDatabase } from './db/schema'
import { createTray } from './tray'
import { WatcherManager } from './watchers/watcher-manager'
import { registerIPCHandlers } from './ipc/handlers'

let mainWindow: BrowserWindow | null = null
let watcherManager: WatcherManager | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f0f14',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', (e) => {
    // Minimize to tray instead of quitting
    e.preventDefault()
    mainWindow?.hide()
  })

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Load renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  // Init SQLite
  const db = initDatabase()

  // Setup IPC handlers
  registerIPCHandlers(db)

  // Create window
  createWindow()

  // Create tray
  createTray(mainWindow!)

  // Start watchers
  watcherManager = new WatcherManager(db)
  watcherManager.start()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('before-quit', () => {
  watcherManager?.stop()
  // Allow actual quit
  mainWindow?.removeAllListeners('close')
  mainWindow?.close()
})

// Prevent multiple instances
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
