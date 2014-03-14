var args = arguments[0] || {},
	state = {
		animate: false,
		stats: false
	};

var EVENT_LOAD = 'ti-stl-viewer:load',
	EVENT_CONFIGURE = 'ti-stl-viewer:configure';

// widget controller interface
exports.load = load;
exports.animate = animate;
exports.stats = stats;

// auto-load the stl if it's in the <Widget> attributes/TSS
$.viewer.addEventListener('load', function viewerLoad(e) {
	$.viewer.removeEventListener('load', viewerLoad);
	if (args.stl) {
		for (var prop in state) {
			makeBoolean(args, prop);
		}
		load(args.stl, args);
	}
});

// no args - gets current state of animation
// boolean - sets current state of animation
function animate(value) {
	if (typeof value === 'undefined') {
		return state.animate;
	} else {
		state.animate = !!value;
		Ti.App.fireEvent(EVENT_CONFIGURE, { animate: state.animate });
	}
}

// no args - gets current state of stats
// boolean - sets current state of stats
function stats(value) {
	if (typeof value === 'undefined') {
		return state.stats;
	} else {
		state.stats = !!value;
		Ti.App.fireEvent(EVENT_CONFIGURE, { stats: state.stats });
	}
}

// load an stl into the webview
function load(stl, opts) {

	// prepare arguments
	if (!stl || !isString(stl)) {
		throw new Error('stl is required and must be a string');
	} else if (!opts) {
		opts = { stl: stl };
	} else if (isString(opts)) {
		opts = { stl: stl, format: opts };
	} else if (isObject(opts)) {
		opts.stl = stl;
	} else {
		throw new Error('If defined, opts must be a string or object.');
	}

	// send opts to webview
	Ti.App.fireEvent(EVENT_LOAD, opts);
}

// helpers
function isObject(o) {
	return o === Object(o);
}

function isString(o) {
	return Object.prototype.toString.call(o) === '[object String]';
}

function makeBoolean(o, prop) {
	o[prop] = o && o[prop] && o[prop] !== 'false';
}
