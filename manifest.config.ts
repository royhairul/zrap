import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  permissions: [
    'scripting',
    'sidePanel',
    'contentSettings',
    'tabs',
    'activeTab',
    'storage',
    'cookies',
  ],
  host_permissions: [
    'https://*.instagram.com/*',
    'https://*.cdninstagram.com/*',
    'https://*.fbcdn.net/*',
  ],
  content_scripts: [
    {
      js: ['src/content/main.tsx'],
      matches: ['https://*.instagram.com/*'],
      run_at: 'document_idle',
    },
  ],
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
})
