import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  output: 'static',
  base: '/~s2422069/', // 学校サーバーの public_html
  trailingSlash: 'always',
  integrations: [preact()],
});
