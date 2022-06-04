/*
* Extends Marker to include two extra methods: clusterHide and clusterShow.
* 
* They work as setOpacity(0) and setOpacity(1) respectively, but
* don't overwrite the options.opacity
* 
*/
import { Marker } from 'leaflet/dist/leaflet-src.esm.js';

Marker.include({
  clusterHide() {
    var backup = this.options.opacity;
    this.setOpacity(0);
    this.options.opacity = backup;
    return this;
  },
	
  clusterShow() {
    return this.setOpacity(this.options.opacity);
  },
});


