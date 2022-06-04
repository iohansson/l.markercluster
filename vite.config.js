import path from 'path';
import { defineConfig } from 'vite';

const fileName = {
  es: 'l.markercluster.mjs',
  cjs: 'l.markercluster.cjs',
  iife: 'l.markercluster.iife.js',
};

export default defineConfig({
  base: './',
  build: {
    lib: {
      entry: path.resolve('src/index.js'),
      name: 'LMarkerCluster',
      formats: ['es', 'cjs', 'iife'],
      fileName: (format) => fileName[format],
    },
    rollupOptions: {
      external: [
        'leaflet/dist/leaflet-src.esm.js',
      ],
      output: {
        globals: {
          'leaflet/dist/leaflet-src.esm.js': 'L',
        },
      },
    },
    minify: false,
    target: 'modules',
  },
});
