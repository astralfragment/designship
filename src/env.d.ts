import type { FragmentAPI } from '../electron/preload'

declare global {
  interface Window {
    fragment: FragmentAPI
  }
}
