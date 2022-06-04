import { Util } from 'leaflet/dist/leaflet-src.esm.js';

export var DistanceGrid = function (cellSize) {
  this._cellSize = cellSize;
  this._sqCellSize = cellSize * cellSize;
  this._grid = {};
  this._objectPoint = { };
};

DistanceGrid.prototype = {

  addObject(obj, point) {
    var x = this._getCoord(point.x);
    var y = this._getCoord(point.y);
    var grid = this._grid;
    var row = grid[y] = grid[y] || {};
    var cell = row[x] = row[x] || [];
    var stamp = Util.stamp(obj);

    this._objectPoint[stamp] = point;

    cell.push(obj);
  },

  updateObject(obj, point) {
    this.removeObject(obj);
    this.addObject(obj, point);
  },

  //Returns true if the object was found
  removeObject(obj, point) {
    var x = this._getCoord(point.x);
    var y = this._getCoord(point.y);
    var grid = this._grid;
    var row = grid[y] = grid[y] || {};
    var cell = row[x] = row[x] || [];
    var i; var len;

    delete this._objectPoint[Util.stamp(obj)];

    for (i = 0, len = cell.length; i < len; i++) {
      if (cell[i] === obj) {

        cell.splice(i, 1);

        if (len === 1) {
          delete row[x];
        }

        return true;
      }
    }

  },

  eachObject(fn, context) {
    var i; var j; var k; var len; var row; var cell; var removed;
    var grid = this._grid;

    for (i in grid) {
      row = grid[i];

      for (j in row) {
        cell = row[j];

        for (k = 0, len = cell.length; k < len; k++) {
          removed = fn.call(context, cell[k]);
          if (removed) {
            k--;
            len--;
          }
        }
      }
    }
  },

  getNearObject(point) {
    var x = this._getCoord(point.x);
    var y = this._getCoord(point.y);
    var i; var j; var k; var row; var cell; var len; var obj; var dist;
    var objectPoint = this._objectPoint;
    var closestDistSq = this._sqCellSize;
    var closest = null;

    for (i = y - 1; i <= y + 1; i++) {
      row = this._grid[i];
      if (row) {

        for (j = x - 1; j <= x + 1; j++) {
          cell = row[j];
          if (cell) {

            for (k = 0, len = cell.length; k < len; k++) {
              obj = cell[k];
              dist = this._sqDist(objectPoint[Util.stamp(obj)], point);
              if (dist < closestDistSq
								|| dist <= closestDistSq && closest === null) {
                closestDistSq = dist;
                closest = obj;
              }
            }
          }
        }
      }
    }
    return closest;
  },

  _getCoord(x) {
    var coord = Math.floor(x / this._cellSize);
    return isFinite(coord) ? coord : x;
  },

  _sqDist(p, p2) {
    var dx = p2.x - p.x;
    var dy = p2.y - p.y;
    return dx * dx + dy * dy;
  },
};
