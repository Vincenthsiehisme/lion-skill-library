import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // 部署到 GitHub Pages 時改成：
  // site: 'https://YOUR-ORG.github.io',
  // base: '/lion-skill-library',
  site: 'https://Vincenthsiehisme.github.io',
  base: '/lion-skill-library/',
  output: 'static',
  build: {
    assets: '_assets',
  },
});
