# l.markercluster

This is a modern ESM build of [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)

## Features

- ⚡ Vite
- pnpm
- CommonJS and ESM modules
- IIFE bundle for direct browser support without bundler
- ESLint - scripts linter and formatter
- Tested with Leaflet >= 1.3.1 but the peer dependency requires ^1.7.1 since it's been around for a while now
- Can be used with Leaflet 1.8.0
- Original Karma specs kept

## Usage

### ES Module
```javascript
import { marker } from 'leaflet/dist/leaflet-src.esm';
import { markerClusterGroup } from 'leaflet.markercluster.esm';

const cluster = markerClusterGroup({
  // optional icon creation function
  iconCreateFunction(cluster) {
    return createDivIcon({
      // classes from tailwindcss
      className: `
        bg-white p-4 rounded-full
        shadow
        text-sm font-semibold text--gray-800
        flex items-center justify-center
      `,
      iconAnchor: [28, 28],
      iconSize: [56, 56],
      html: cluster.getChildCount(),
    });
  },
});

cluster.addLayer(marker(latLng));
cluster.addLayer(marker(latLng));
cluster.addLayer(marker(latLng));

map.addLayer(cluster);
```

### IIFE
```html
<script src="leaflet-src.js"></script>
<script src="l.markercluster.iife.js"></script>
<script>
  LMarkerCluster.extendLeaflet(L);
  // ...
</script>
```

### Options

Please refer to the original plugin [options](https://github.com/Leaflet/Leaflet.markercluster#options)

## Development

The package contains the following scripts:

- `build` - generates the following bundles: CommonJS (`.cjs`) ESM (`.mjs`) and IIFE (`.iife.js`)
- `test` - starts karma and runs all tests
- `lint:scripts` - lint `.ts` files with eslint
- `format:scripts` - format `.ts`, `.html` and `.json` files with prettier

## Acknowledgment

All credits for the plugin functionality go to the original plugin developers

## License

MIT