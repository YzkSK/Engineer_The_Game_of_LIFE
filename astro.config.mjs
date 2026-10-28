import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  output: 'static',
  base: '/~s2422069/dist/', // 学校サーバーの public_html/dist に置く(直下は別課題が使用中)
  trailingSlash: 'always',
  integrations: [preact()],
});
