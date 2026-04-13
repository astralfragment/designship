import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow) {
  // Load tray icon — try resources dir first, fall back to build dir
  const iconPath = join(__dirname, '../../resources/tray-icon.png')
  const fallbackPath = join(__dirname, '../../build/icon-16.png')
  let icon: Electron.NativeImage
  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) icon = nativeImage.createFromPath(fallbackPath)
    if (icon.isEmpty()) icon = nativeImage.createEmpty()
  } catch {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('DesignShip')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show DesignShip',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      },
    },
    { type: 'separator' },
    {
      label: 'Generate Standup',
      click: () => {
        mainWindow.show()
        mainWindow.webContents.send('action:generate-standup')
      },
    },
    {
      label: 'Generate Weekly Digest',
      click: () => {
        mainWindow.show()
        mainWindow.webContents.send('action:generate-weekly')
      },
    },
    { type: 'separator' },
    {
      label: 'Quit DesignShip',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  return tray
}
