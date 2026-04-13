import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow) {
  // Create a simple 16x16 tray icon (will be replaced with proper icon)
  const icon = nativeImage.createEmpty()

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
