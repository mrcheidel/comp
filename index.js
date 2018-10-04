const ct = require('compute-task');

var x = new ct();

if (x.loadTSK (__dirname + '/task.json')) {
	if (x.loadGPX (__dirname + '/track.gpx')) {
		x.compute();
	}
}


