import { DistanceGrid } from './DistanceGrid.js';
import { QuickHull } from './MarkerCluster.QuickHull.js';
import { MarkerClusterGroup, markerClusterGroup } from './MarkerClusterGroup.js';
import { MarkerCluster, MarkerClusterNonAnimated } from './MarkerCluster.js';

export const extendLeaflet = (Leaflet) => {
  Leaflet.MarkerCluster = MarkerCluster;
  Leaflet.MarkerClusterNonAnimated = MarkerClusterNonAnimated;
  Leaflet.MarkerClusterGroup = MarkerClusterGroup;
  Leaflet.markerClusterGroup = markerClusterGroup;
  Leaflet.DistanceGrid = DistanceGrid;
  Leaflet.QuickHull = QuickHull;
};
