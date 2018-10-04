'use strict';

const toRadians = (val) => { return val * Math.PI / 180;}
const toDegrees = (val) => { return val * 180 / Math.PI;}

// Calculate a point winthin a circle
// circle ={center:LatLong, radius: number} // in metres
const pointInsideCircle = (point, circle) => {
    let center = circle.center;
    let distance = distanceBetween(point, center);
    return distance <= circle.radius; // Use '<=' if you want to get all points in the border
};

const distanceBetween = (point1, point2) => {
    var R = 6371e3; // metres
    var φ1 = toRadians(point1.lat);
    var φ2 = toRadians(point2.lat);
    var Δφ = toRadians(point2.lat - point1.lat);
    var Δλ = toRadians(point2.lon - point1.lon);
    var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const iso2epoc = (iso) => {
	var myDate = new Date(iso);
	return myDate.getTime() / 1000;
}

var ct = function(){
	this.task = null;
	this.track = [];
	this.prev_point = null;
	this.curr_point = null;
};

ct.prototype.loadTSK = function(file){
	try {
		var fs = require('fs');
		if (fs.existsSync(file)) {
			var contents = fs.readFileSync(file, 'utf8');
			this.task = JSON.parse(contents);
			return true;
		} else {
			return false;
		}
	} catch (ex) {
		return false;
	}
};

ct.prototype.loadGPX = function(file){
	try {
		var fs = require('fs');
		var parser = require('xml2json');	
		if (fs.existsSync(file)) {
			var xml = fs.readFileSync(file, 'utf8');
			var fulltrack = JSON.parse(parser.toJson(xml));
			this.track = fulltrack.gpx.trk.trkseg.trkpt;	
			for (var i=0;i < this.track.length;i++){
				this.track[i].time = iso2epoc(this.track[i].time);
			}
			return true;
		} else {
			return false;
		}
	} catch (ex) {
		return false;
	}
};

ct.prototype.addP = function (point) {
	try {
		if (point.lat !== null && point.log !== null && point.time !== null) {
			this.track.push (point);
			return true;
		} else {
			return false;
		}	
	} catch (ex) {
		return false;
	}
}


ct.prototype.pInside = function (pLat, pLng, cLat, cLng, cRad) {
	return pointInsideCircle({lat: pLat, lng: pLng}, {center:{lat:cLat,lng:cLng}, radius: cRad});
}

ct.prototype.compute = function () {
	console.log ("Computing Tasks");
	console.log ("Task turn points: " + this.task.turnpoints.length);
	console.log ("Track points: " + this.track.length);
	
	var from = 1;
	for (var i=0; i<this.task.turnpoints.length; i++) {
		var tp = this.task.turnpoints[i];
		var tp_type = 0; //0 -> enter, 1 -> exit
		
		switch (tp.type) {
			case 'sss':
				if (this.task.start_point_type != 'enter') tp_type = 1;			
				break;
			
			case 'ess':
				break;
				
			case 'sn':	
				break;
				
			default:
		}
		
		var circle = {center:{lat:tp.lat,lon:tp.lon}, radius: tp.radius};

		for (var p = from; p<this.track.length; p++) {
			var p1 = this.track[p-1];
			var p2 = this.track[p];
	
			this.prev_point = p1;
			this.curr_point = p2;
	
			p1.inside = pointInsideCircle(p1, circle);
			p2.inside = pointInsideCircle(p2, circle);
			
			if(tp_type == 0){
				if(!p1.inside && p2.inside) {
					console.log ("Enter! - " + tp.description + " time :" + p2.time + " Point :" + p);
					from = p;
					break;
				} 
			} else {
				if(p1.inside && !p2.inside) {
					console.log ("Exit! - " + tp.description+ " time :" + p2.time+ " Point :" + p);
					from = p;
					break;
				}
			}
		}
	}
	this.track = [];
	console.log (JSON.stringify(this.curr_point));
}


module.exports = ct;



