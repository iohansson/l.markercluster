/* global L, LMarkerCluster */
// put after Leaflet files as imagePath can't be detected in a PhantomJS env
L.Icon.Default.imagePath = '../dist/images';
LMarkerCluster.extendLeaflet(L);
