import { defineConfig } from 'vite';
import vitePluginSitemap from 'vite-plugin-sitemap';
import { resolve } from 'path';
import copy from 'rollup-plugin-copy';

export default defineConfig({
  plugins: [
    vitePluginSitemap({
      hostname: 'https://facebookvideo-downloader.com/',
      routes: [
        '/',
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
      ],
      hook: 'closeBundle',
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
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
        const routeToHtml = {
          '/': '/index.html',
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
