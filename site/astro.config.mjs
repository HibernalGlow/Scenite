import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// 项目页部署在 https://hibernalglow.github.io/Scenite/
// 构建输出到仓库根的 docs/，作为 GitHub Pages 的发布目录（main /docs）。
export default defineConfig({
  site: 'https://hibernalglow.github.io',
  base: '/Scenite',
  outDir: '../docs',
  integrations: [svelte()],
  vite: {
    // 使用全新缓存目录，避免构建时清理 node_modules/.vite 触发环境的批量删除保护
    cacheDir: '.vite',
  },
});
