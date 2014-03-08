var models = [
	{ stl: 'test-binary.stl' },
	{ stl: 'test-ascii.stl', format: 'ascii' }
], ctr = 0;

function reloadModel() {
	$.viewer.reload();
}

function nextModel() {
	ctr++
	if (models.length === ctr) { ctr = 0; }
	$.viewer.load(models[ctr]);
}

$.index.open();