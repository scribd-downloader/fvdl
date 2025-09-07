import terser from "@rollup/plugin-terser";

export default {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife',
    name: 'fbVideoDownloader',
    globals: {}
  },
  external: [],
  plugins: [terser()]
};
