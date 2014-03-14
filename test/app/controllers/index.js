var loads = [
	[ 'test-binary.stl' ],
	[ 'test-ascii.stl', 'ascii' ],
	[ 'test-ascii.stl', { format: 'ascii' } ]
], ctr = 0;

function nextModel() {
	if (loads.length === ctr) { ctr = 0; }
	Ti.API.debug('load() with ' + JSON.stringify(loads[ctr]));
	$.viewer.load.apply($.viewer, loads[ctr++]);
}

function animate() {
	$.viewer.animate(!$.viewer.animate());
}

function stats() {
	$.viewer.stats(!$.viewer.stats());
}

$.index.open();