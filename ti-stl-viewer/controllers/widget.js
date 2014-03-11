var args = arguments[0] || {};

$.viewer.addEventListener('load', function viewerLoad(e) {
	$.viewer.removeEventListener('load', viewerLoad);
	load(args);
});

exports.load = function load(opts) {

	// process options
	if (!opts) {
		opts = null;
	} else if (isString(opts)) {
		opts = { stl: opts };
	} else if (!isObject(opts)) {
		throw new Error('Invalid parameter for load. Must be a string or object.');
	}

	// send opts to webview
	Ti.App.fireEvent('ti-stl-viewer:load', opts);
}

exports.reload = function reload() {
	load();
}

// helpers
function isObject(o) {
	return o === Object(o);
}

function isString(o) {
	return Object.prototype.toString.call(o) === '[object String]';
}