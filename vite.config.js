import { defineConfig } from 'vite';
import vitePluginSitemap from 'vite-plugin-sitemap';
import { resolve } from 'path';
import copy from 'rollup-plugin-copy';

export default defineConfig({
  plugins: [
    // Sitemap plugin with multilingual routes
    vitePluginSitemap({
      hostname: 'https://fvideosdownloader.com/',
      routes: [
        '/',           // English (default)
        '/es',         // Spanish
        '/pt',         // Portuguese
        '/de',         // German
        '/fr',         // French
        '/it',         // Italian
        '/id',         // Indonesian
        '/disclaimer',
        '/privacy-policy',
        '/terms-of-service',
        '/contact-us',
        '/about-us'
      ],
    }),
    copy({
      targets: [
        { src: 'sw.js', dest: 'dist' }, // Copy service worker
        { src: 'public/**/*', dest: 'dist' }, // Copy public assets
        { src: 'main.js', dest: 'dist' }, // Copy main JavaScript
        { src: 'bundle.js', dest: 'dist' }, // Copy bundled JavaScript
        { src: 'src/styles.css', dest: 'dist' }, // Copy CSS file
        { src: 'google*.html', dest: 'dist' }, // Copy Google Search Console verification files
        { src: 'BingSiteAuth.xml', dest: 'dist' }, // Copy Bing Webmaster verification file
      ],
      hook: 'closeBundle',
    }),
  ],
  build: {
    rollupOptions: {
      // Include all HTML pages as entry points for proper building
      input: {
        main: resolve(__dirname, 'index.html'),        // English (default)
        es: resolve(__dirname, 'es.html'),             // Spanish
        pt: resolve(__dirname, 'pt.html'),             // Portuguese
        de: resolve(__dirname, 'de.html'),             // German
        fr: resolve(__dirname, 'fr.html'),             // French
        it: resolve(__dirname, 'it.html'),             // Italian
        id: resolve(__dirname, 'id.html'),             // Indonesian
        disclaimer: resolve(__dirname, 'disclaimer.html'),
        privacyPolicy: resolve(__dirname, 'privacy-policy.html'),
        termsOfService: resolve(__dirname, 'terms-of-service.html'),
        contactUs: resolve(__dirname, 'contact-us.html'),
        aboutUs: resolve(__dirname, 'about-us.html'),
      },
    },
  },
  server: {
    fs: { strict: false },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Route mapping for clean URLs to HTML files
        const routeToHtml = {
          '/': '/index.html',           // English (default)
          '/es': '/es.html',            // Spanish
          '/pt': '/pt.html',            // Portuguese
          '/de': '/de.html',            // German
          '/fr': '/fr.html',            // French
          '/it': '/it.html',            // Italian
          '/id': '/id.html',            // Indonesian
          '/disclaimer': '/disclaimer.html',
          '/privacy-policy': '/privacy-policy.html',
          '/terms-of-service': '/terms-of-service.html',
          '/contact-us': '/contact-us.html',
          '/about-us': '/about-us.html',
        };

        const sanitizedUrl = req.url.replace(/\/$/, ''); // Remove trailing slash

        if (routeToHtml[sanitizedUrl]) {
          req.url = routeToHtml[sanitizedUrl]; // Rewrite to the correct HTML file
          console.log(`Redirecting to ${req.url}`); // Add this for debugging
        }
        next();
      });

      // Serve HTML files as static assets in development mode
      // Multilingual pages
      server.middlewares.use('/es.html', (req, res) => {
        res.sendFile(resolve(__dirname, 'es.html'));
      });
      server.middlewares.use('/pt.html', (req, res) => {
        res.sendFile(resolve(__dirname, 'pt.html'));
      });
      server.middlewares.use('/de.html', (req, res) => {
        res.sendFile(resolve(__dirname, 'de.html'));
      });
      server.middlewares.use('/fr.html', (req, res) => {
        res.sendFile(resolve(__dirname, 'fr.html'));
      });
      server.middlewares.use('/it.html', (req, res) => {
        res.sendFile(resolve(__dirname, 'it.html'));
      });
      server.middlewares.use('/id.html', (req, res) => {
        res.sendFile(resolve(__dirname, 'id.html'));
      });
      // Other pages
      server.middlewares.use('/disclaimer.html', (req, res) => {
        res.sendFile(resolve(__dirname, 'disclaimer.html'));
      });
      server.middlewares.use('/privacy-policy.html', (req, res) => {
        res.sendFile(resolve(__dirname, 'privacy-policy.html'));
      });
      server.middlewares.use('/terms-of-service.html', (req, res) => {
        res.sendFile(resolve(__dirname, 'terms-of-service.html'));
      });
      server.middlewares.use('/contact-us.html', (req, res) => {
        res.sendFile(resolve(__dirname, 'contact-us.html'));
      });
      server.middlewares.use('/about-us.html', (req, res) => {
        res.sendFile(resolve(__dirname, 'about-us.html'));
      });
    },
  },
});
