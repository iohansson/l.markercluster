import {
  Point,
  Polyline,
  Path,
  DomUtil,
  Browser,
  extend,
} from 'leaflet/dist/leaflet-src.esm.js';

const SpiderfierClusterBase = {
  _2PI: Math.PI * 2,
  _circleFootSeparation: 25, //related to circumference of circle
  _circleStartAngle: 0,

  _spiralFootSeparation:  28, //related to size of spiral (experiment!)
  _spiralLengthStart: 11,
  _spiralLengthFactor: 5,

  _circleSpiralSwitchover: 9, //show spiral instead of circle from this marker count upwards.
  // 0 -> always spiral; Infinity -> always circle

  spiderfy() {
    if (this._group._spiderfied === this || this._group._inZoomAnimation) {
      return;
    }

    var childMarkers = this.getAllChildMarkers(null, true);
    var group = this._group;
    var map = group._map;
    var center = map.latLngToLayerPoint(this._latlng);
    var positions;

    this._group._unspiderfy();
    this._group._spiderfied = this;

    //TODO Maybe: childMarkers order by distance to center

    if (this._group.options.spiderfyShapePositions) {
      positions = this._group.options.spiderfyShapePositions(childMarkers.length, center);
    } else if (childMarkers.length >= this._circleSpiralSwitchover) {
      positions = this._generatePointsSpiral(childMarkers.length, center);
    } else {
      center.y += 10; // Otherwise circles look wrong => hack for standard blue icon, renders differently for other icons.
      positions = this._generatePointsCircle(childMarkers.length, center);
    }

    this._animationSpiderfy(childMarkers, positions);
  },

  unspiderfy(zoomDetails) {
    /// <param Name="zoomDetails">Argument from zoomanim if being called in a zoom animation or null otherwise</param>
    if (this._group._inZoomAnimation) {
      return;
    }
    this._animationUnspiderfy(zoomDetails);

    this._group._spiderfied = null;
  },

  _generatePointsCircle(count, centerPt) {
    var circumference = this._group.options.spiderfyDistanceMultiplier * this._circleFootSeparation * (2 + count);
    var legLength = circumference / this._2PI;  //radius from circumference
    var angleStep = this._2PI / count;
    var res = [];
    var i; var angle;

    legLength = Math.max(legLength, 35); // Minimum distance to get outside the cluster icon.

    res.length = count;

    for (i = 0; i < count; i++) { // Clockwise, like spiral.
      angle = this._circleStartAngle + i * angleStep;
      res[i] = new Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle))._round();
    }

    return res;
  },

  _generatePointsSpiral(count, centerPt) {
    var spiderfyDistanceMultiplier = this._group.options.spiderfyDistanceMultiplier;
    var legLength = spiderfyDistanceMultiplier * this._spiralLengthStart;
    var separation = spiderfyDistanceMultiplier * this._spiralFootSeparation;
    var lengthFactor = spiderfyDistanceMultiplier * this._spiralLengthFactor * this._2PI;
    var angle = 0;
    var res = [];
    var i;

    res.length = count;

    // Higher index, closer position to cluster center.
    for (i = count; i >= 0; i--) {
      // Skip the first position, so that we are already farther from center and we avoid
      // being under the default cluster icon (especially important for Circle Markers).
      if (i < count) {
        res[i] = new Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle))._round();
      }
      angle += separation / legLength + i * 0.0005;
      legLength += lengthFactor / angle;
    }
    return res;
  },

  _noanimationUnspiderfy() {
    var group = this._group;
    var map = group._map;
    var fg = group._featureGroup;
    var childMarkers = this.getAllChildMarkers(null, true);
    var m; var i;

    group._ignoreMove = true;

    this.setOpacity(1);
    for (i = childMarkers.length - 1; i >= 0; i--) {
      m = childMarkers[i];

      fg.removeLayer(m);

      if (m._preSpiderfyLatlng) {
        m.setLatLng(m._preSpiderfyLatlng);
        delete m._preSpiderfyLatlng;
      }
      if (m.setZIndexOffset) {
        m.setZIndexOffset(0);
      }

      if (m._spiderLeg) {
        map.removeLayer(m._spiderLeg);
        delete m._spiderLeg;
      }
    }

    group.fire('unspiderfied', {
      cluster: this,
      markers: childMarkers,
    });
    group._ignoreMove = false;
    group._spiderfied = null;
  },
};

//Non Animated versions of everything
const SpiderfierClusterNoAnimation = {
  _animationSpiderfy(childMarkers, positions) {
    var group = this._group;
    var map = group._map;
    var fg = group._featureGroup;
    var legOptions = this._group.options.spiderLegPolylineOptions;
    var i; var m; var leg; var newPos;

    group._ignoreMove = true;

    // Traverse in ascending order to make sure that inner circleMarkers are on top of further legs. Normal markers are re-ordered by newPosition.
    // The reverse order trick no longer improves performance on modern browsers.
    for (i = 0; i < childMarkers.length; i++) {
      newPos = map.layerPointToLatLng(positions[i]);
      m = childMarkers[i];

      // Add the leg before the marker, so that in case the latter is a circleMarker, the leg is behind it.
      leg = new Polyline([this._latlng, newPos], legOptions);
      map.addLayer(leg);
      m._spiderLeg = leg;

      // Now add the marker.
      m._preSpiderfyLatlng = m._latlng;
      m.setLatLng(newPos);
      if (m.setZIndexOffset) {
        m.setZIndexOffset(1000000); //Make these appear on top of EVERYTHING
      }

      fg.addLayer(m);
    }
    this.setOpacity(0.3);

    group._ignoreMove = false;
    group.fire('spiderfied', {
      cluster: this,
      markers: childMarkers,
    });
  },

  _animationUnspiderfy() {
    this._noanimationUnspiderfy();
  },
};

//Animated versions here
const SpiderfierClusterAnimation = {
  _animationSpiderfy(childMarkers, positions) {
    var me = this;
    var group = this._group;
    var map = group._map;
    var fg = group._featureGroup;
    var thisLayerLatLng = this._latlng;
    var thisLayerPos = map.latLngToLayerPoint(thisLayerLatLng);
    var svg = Path.SVG;
    var legOptions = extend({}, this._group.options.spiderLegPolylineOptions); // Copy the options so that we can modify them for animation.
    var finalLegOpacity = legOptions.opacity;
    var i; var m; var leg; var legPath; var legLength; var newPos;

    if (finalLegOpacity === undefined) {
      finalLegOpacity = 0.5;
    }

    if (svg) {
      // If the initial opacity of the spider leg is not 0 then it appears before the animation starts.
      legOptions.opacity = 0;

      // Add the class for CSS transitions.
      legOptions.className = (legOptions.className || '') + ' leaflet-cluster-spider-leg';
    } else {
      // Make sure we have a defined opacity.
      legOptions.opacity = finalLegOpacity;
    }

    group._ignoreMove = true;

    // Add markers and spider legs to map, hidden at our center point.
    // Traverse in ascending order to make sure that inner circleMarkers are on top of further legs. Normal markers are re-ordered by newPosition.
    // The reverse order trick no longer improves performance on modern browsers.
    for (i = 0; i < childMarkers.length; i++) {
      m = childMarkers[i];

      newPos = map.layerPointToLatLng(positions[i]);

      // Add the leg before the marker, so that in case the latter is a circleMarker, the leg is behind it.
      leg = new Polyline([thisLayerLatLng, newPos], legOptions);
      map.addLayer(leg);
      m._spiderLeg = leg;

      // Explanations: https://jakearchibald.com/2013/animated-line-drawing-svg/
      // In our case the transition property is declared in the CSS file.
      if (svg) {
        legPath = leg._path;
        legLength = legPath.getTotalLength() + 0.1; // Need a small extra length to avoid remaining dot in Firefox.
        legPath.style.strokeDasharray = legLength; // Just 1 length is enough, it will be duplicated.
        legPath.style.strokeDashoffset = legLength;
      }

      // If it is a marker, add it now and we'll animate it out
      if (m.setZIndexOffset) {
        m.setZIndexOffset(1000000); // Make normal markers appear on top of EVERYTHING
      }
      if (m.clusterHide) {
        m.clusterHide();
      }
			
      // Vectors just get immediately added
      fg.addLayer(m);

      if (m._setPos) {
        m._setPos(thisLayerPos);
      }
    }

    group._forceLayout();
    group._animationStart();

    // Reveal markers and spider legs.
    for (i = childMarkers.length - 1; i >= 0; i--) {
      newPos = map.layerPointToLatLng(positions[i]);
      m = childMarkers[i];

      //Move marker to new position
      m._preSpiderfyLatlng = m._latlng;
      m.setLatLng(newPos);
			
      if (m.clusterShow) {
        m.clusterShow();
      }

      // Animate leg (animation is actually delegated to CSS transition).
      if (svg) {
        leg = m._spiderLeg;
        legPath = leg._path;
        legPath.style.strokeDashoffset = 0;
        leg.setStyle({ opacity: finalLegOpacity });
      }
    }
    this.setOpacity(0.3);

    group._ignoreMove = false;

    setTimeout(function () {
      group._animationEnd();
      group.fire('spiderfied', {
        cluster: me,
        markers: childMarkers,
      });
    }, 200);
  },

  _animationUnspiderfy(zoomDetails) {
    var me = this;
    var group = this._group;
    var map = group._map;
    var fg = group._featureGroup;
    var thisLayerPos = zoomDetails ? map._latLngToNewLayerPoint(this._latlng, zoomDetails.zoom, zoomDetails.center) : map.latLngToLayerPoint(this._latlng);
    var childMarkers = this.getAllChildMarkers(null, true);
    var svg = Path.SVG;
    var m; var i; var leg; var legPath; var legLength; var nonAnimatable;

    group._ignoreMove = true;
    group._animationStart();

    //Make us visible and bring the child markers back in
    this.setOpacity(1);
    for (i = childMarkers.length - 1; i >= 0; i--) {
      m = childMarkers[i];

      //Marker was added to us after we were spiderfied
      if (!m._preSpiderfyLatlng) {
        continue;
      }

      //Close any popup on the marker first, otherwise setting the location of the marker will make the map scroll
      m.closePopup();

      //Fix up the location to the real one
      m.setLatLng(m._preSpiderfyLatlng);
      delete m._preSpiderfyLatlng;

      //Hack override the location to be our center
      nonAnimatable = true;
      if (m._setPos) {
        m._setPos(thisLayerPos);
        nonAnimatable = false;
      }
      if (m.clusterHide) {
        m.clusterHide();
        nonAnimatable = false;
      }
      if (nonAnimatable) {
        fg.removeLayer(m);
      }

      // Animate the spider leg back in (animation is actually delegated to CSS transition).
      if (svg) {
        leg = m._spiderLeg;
        legPath = leg._path;
        legLength = legPath.getTotalLength() + 0.1;
        legPath.style.strokeDashoffset = legLength;
        leg.setStyle({ opacity: 0 });
      }
    }

    group._ignoreMove = false;

    setTimeout(function () {
      //If we have only <= one child left then that marker will be shown on the map so don't remove it!
      var stillThereChildCount = 0;
      for (i = childMarkers.length - 1; i >= 0; i--) {
        m = childMarkers[i];
        if (m._spiderLeg) {
          stillThereChildCount++;
        }
      }


      for (i = childMarkers.length - 1; i >= 0; i--) {
        m = childMarkers[i];

        if (!m._spiderLeg) { //Has already been unspiderfied
          continue;
        }

        if (m.clusterShow) {
          m.clusterShow();
        }
        if (m.setZIndexOffset) {
          m.setZIndexOffset(0);
        }

        if (stillThereChildCount > 1) {
          fg.removeLayer(m);
        }

        map.removeLayer(m._spiderLeg);
        delete m._spiderLeg;
      }
      group._animationEnd();
      group.fire('unspiderfied', {
        cluster: me,
        markers: childMarkers,
      });
    }, 200);
  },
};

export const includeClusterSpiderfier = MarkerCluster => MarkerCluster.include({
  ...SpiderfierClusterBase,
  ...SpiderfierClusterAnimation,
});

export const getExtendedWithoutAnimation = MarkerCluster => MarkerCluster.extend(SpiderfierClusterNoAnimation);

export const includeClusterGroupSpiderfier = MarkerClusterGroup => MarkerClusterGroup.include({
  //The MarkerCluster currently spiderfied (if any)
  _spiderfied: null,

  unspiderfy() {
    this._unspiderfy.apply(this, arguments);
  },

  _spiderfierOnAdd() {
    this._map.on('click', this._unspiderfyWrapper, this);

    if (this._map.options.zoomAnimation) {
      this._map.on('zoomstart', this._unspiderfyZoomStart, this);
    }
    //Browsers without zoomAnimation or a big zoom don't fire zoomstart
    this._map.on('zoomend', this._noanimationUnspiderfy, this);

    if (!Browser.touch) {
      this._map.getRenderer(this);
      //Needs to happen in the pageload, not after, or animations don't work in webkit
      //  http://stackoverflow.com/questions/8455200/svg-animate-with-dynamically-added-elements
      //Disable on touch browsers as the animation messes up on a touch zoom and isn't very noticable
    }
  },

  _spiderfierOnRemove() {
    this._map.off('click', this._unspiderfyWrapper, this);
    this._map.off('zoomstart', this._unspiderfyZoomStart, this);
    this._map.off('zoomanim', this._unspiderfyZoomAnim, this);
    this._map.off('zoomend', this._noanimationUnspiderfy, this);

    //Ensure that markers are back where they should be
    // Use no animation to avoid a sticky leaflet-cluster-anim class on mapPane
    this._noanimationUnspiderfy();
  },

  //On zoom start we add a zoomanim handler so that we are guaranteed to be last (after markers are animated)
  //This means we can define the animation they do rather than Markers doing an animation to their actual location
  _unspiderfyZoomStart() {
    if (!this._map) { //May have been removed from the map by a zoomEnd handler
      return;
    }

    this._map.on('zoomanim', this._unspiderfyZoomAnim, this);
  },

  _unspiderfyZoomAnim(zoomDetails) {
    //Wait until the first zoomanim after the user has finished touch-zooming before running the animation
    if (DomUtil.hasClass(this._map._mapPane, 'leaflet-touching')) {
      return;
    }

    this._map.off('zoomanim', this._unspiderfyZoomAnim, this);
    this._unspiderfy(zoomDetails);
  },

  _unspiderfyWrapper() {
    /// <summary>_unspiderfy but passes no arguments</summary>
    this._unspiderfy();
  },

  _unspiderfy(zoomDetails) {
    if (this._spiderfied) {
      this._spiderfied.unspiderfy(zoomDetails);
    }
  },

  _noanimationUnspiderfy() {
    if (this._spiderfied) {
      this._spiderfied._noanimationUnspiderfy();
    }
  },

  //If the given layer is currently being spiderfied then we unspiderfy it so it isn't on the map anymore etc
  _unspiderfyLayer(layer) {
    if (layer._spiderLeg) {
      this._featureGroup.removeLayer(layer);

      if (layer.clusterShow) {
        layer.clusterShow();
      }
      //Position will be fixed up immediately in _animationUnspiderfy
      if (layer.setZIndexOffset) {
        layer.setZIndexOffset(0);
      }

      this._map.removeLayer(layer._spiderLeg);
      delete layer._spiderLeg;
    }
  },
});