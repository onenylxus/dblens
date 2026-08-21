import type { ForgeConfig } from '@electron-forge/shared-types';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {
    force: true,
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32'],
      config: {},
    },
  ],
  plugins: [],
};

export default config;
