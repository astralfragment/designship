import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow) {
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
  tray.setToolTip('Fragment')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Fragment',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      },
    },
    { type: 'separator' },
    {
      label: 'New fragment',
      click: () => {
        mainWindow.show()
        mainWindow.webContents.send('action:new-fragment')
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Fragment',
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
