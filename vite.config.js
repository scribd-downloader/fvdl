import { defineConfig } from 'vite';
import vitePluginSitemap from 'vite-plugin-sitemap';
import { resolve } from 'path';
import copy from 'rollup-plugin-copy';

/**
 * Helper to resolve files from project root
 */
const r = (file) => resolve(__dirname, file);

export default defineConfig({
  plugins: [
    /**
     * Sitemap for multilingual clean URLs
     */
    vitePluginSitemap({
      hostname: 'https://fvideosdownloader.com',
      routes: [
        '/',
        '/es',
        '/pt',
        '/de',
        '/fr',
        '/it',
        '/id',
        '/disclaimer',
        '/privacy-policy',
        '/terms-of-service',
        '/contact-us',
        '/about-us',
      ],
    }),

    /**
     * Copy static & verification files
     */
    copy({
      targets: [
        { src: 'sw.js', dest: 'dist' },
        { src: 'public/**/*', dest: 'dist' },
        { src: 'main.js', dest: 'dist' },
        { src: 'bundle.js', dest: 'dist' },
        { src: 'src/styles.css', dest: 'dist' },
        { src: 'google*.html', dest: 'dist' },
        { src: 'BingSiteAuth.xml', dest: 'dist' },
      ],
      hook: 'closeBundle',
    }),
  ],

  /**
   * Multi-page HTML build (ALL FILES IN ROOT)
   */
  build: {
    rollupOptions: {
      input: {
        main: r('index.html'),
        es: r('es.html'),
        pt: r('pt.html'),
        de: r('de.html'),
        fr: r('fr.html'),
        it: r('it.html'),
        id: r('id.html'),
        disclaimer: r('disclaimer.html'),
        privacyPolicy: r('privacy-policy.html'),
        termsOfService: r('terms-of-service.html'),
        contactUs: r('contact-us.html'),
        aboutUs: r('about-us.html'),
      },
    },
  },

  /**
   * Clean URL support in dev (NO file-system tricks)
   */
  server: {
    middlewareMode: false,
    fs: { strict: false },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const map = {
          '/': '/index.html',
          '/es': '/es.html',
          '/pt': '/pt.html',
          '/de': '/de.html',
          '/fr': '/fr.html',
          '/it': '/it.html',
          '/id': '/id.html',
          '/disclaimer': '/disclaimer.html',
          '/privacy-policy': '/privacy-policy.html',
          '/terms-of-service': '/terms-of-service.html',
          '/contact-us': '/contact-us.html',
          '/about-us': '/about-us.html',
        };

        const clean = req.url.replace(/\/$/, '') || '/';
        if (map[clean]) {
          req.url = map[clean];
        }

        next();
      });
    },
  },
});
