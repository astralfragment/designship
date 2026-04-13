import type { DesignShipAPI } from '../electron/preload'

declare global {
  interface Window {
    ds: DesignShipAPI
  }
}
