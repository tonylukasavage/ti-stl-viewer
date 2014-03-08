// Notes:
// - STL file format: http://en.wikipedia.org/wiki/STL_(file_format)
// - 80 byte unused header
// - All binary STLs are assumed to be little endian, as per wiki doc

/* jshint -W032 */
;
/* jshint +W032 */
(function() {
	var camera, scene, renderer, mesh, stats, stlLocation, stlFormat;

	// let's light this candle...
	init();
	animate();

	function animate() {
		// note: three.js includes requestAnimationFrame shim
		requestAnimationFrame(animate);
		render();
		stats.update();
	}

	function getStl(format) {
		if (!format || (format !== 'ascii' && format !== 'binary')) {
			throw new Error('Invalid stl format "' + format + '". Must be "ascii" or "binary"');
		}

		// create xhr
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				if (xhr.status === 200 || xhr.status === 0) {
					// xhr.mozResponseArrayBuffer;
					if (format === 'binary') {
						parseStlBinary(xhr.response);
					} else if (format === 'ascii') {
						parseStlAscii(xhr.responseText);
					}
				}
			}
		};
		xhr.onerror = function(e) {
			throw new Error(e);
		};

		// open get request
		xhr.open('GET', stlLocation, true);

		// set headers based on format
		if (format === 'binary') {
			xhr.responseType = "arraybuffer";
		} else {
			xhr.setRequestHeader("Accept","text/plain");
			xhr.setRequestHeader("Content-Type","text/plain");
			xhr.setRequestHeader('charset', 'x-user-defined');
		}

		// send request
		xhr.send(null);
	}

	// initialize the 3D scene
	function init() {

		// listen for the load event
		Ti.App.addEventListener('ti-stl-viewer:load', function(e) {
			Ti.API.debug('"' + e.type + '" fired with ' + JSON.stringify(e));

			// Determine what stl variables to use
			if (!e.stl && !stlLocation) { return; }
			stlLocation = e.stl ? '../' + e.stl.replace(/^\//, '') : stlLocation;
			stlFormat = e.format || (!e.stl && stlFormat) || 'binary';
			Ti.API.info('loading stl at "' + stlLocation + '" with format "' + stlFormat + '"');

			// remove existing mesh
			if (scene && mesh) {
				scene.remove(mesh);
			}

			// retrieve the stl
			getStl(stlFormat);

		});

		// create the three.js scene
		scene = new THREE.Scene();

		// configure the camera
		camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 10000);
		camera.position.z = 70;
		camera.position.y = 0;
		scene.add(camera);

		// configure a basic directional light for the scene
		var directionalLight = new THREE.DirectionalLight(0xffffff);
		directionalLight.position.x = 0;
		directionalLight.position.y = 0;
		directionalLight.position.z = 1;
		directionalLight.position.normalize();
		scene.add(directionalLight);

		// Create a renderer element. We'll favor WebGL, but often will
		// need to fall back to the Canvas.
		renderer = new THREE.CanvasRenderer(); //new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);

		// Add the rendering stats (FPS and such) to the display
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		document.body.appendChild(stats.domElement);
	}

	function parseStlBinary(stl) {
		var geo = new THREE.Geometry();
		var dv = new DataView(stl, 80); // 80 == unused header
		var isLittleEndian = true;
		var triangles = dv.getUint32(0, isLittleEndian);

		// console.log('arraybuffer length:  ' + stl.byteLength);
		// console.log('number of triangles: ' + triangles);

		var offset = 4;
		for (var i = 0; i < triangles; i++) {

			// Get the normal for this triangle
			var normal = new THREE.Vector3(
				dv.getFloat32(offset, isLittleEndian),
				dv.getFloat32(offset+4, isLittleEndian),
				dv.getFloat32(offset+8, isLittleEndian)
			);
			offset += 12;

			// Get all 3 vertices for this triangle
			for (var j = 0; j < 3; j++) {
				geo.vertices.push(
					new THREE.Vector3(
						dv.getFloat32(offset, isLittleEndian),
						dv.getFloat32(offset+4, isLittleEndian),
						dv.getFloat32(offset+8, isLittleEndian)
					)
				);
				offset += 12;
			}

			// there's also a Uint16 "attribute byte count" that we
			// don't need, it should always be zero.
			offset += 2;

			// Create a new face for from the vertices and the normal
			geo.faces.push(new THREE.Face3(i*3, i*3+1, i*3+2, normal));
		}

		// The binary STL I'm testing with seems to have all
		// zeroes for the normals, unlike its ASCII counterpart.
		// We can use three.js to compute the normals for us, though,
		// once we've assembled our geometry. This is a relatively
		// expensive operation, but only needs to be done once.
		geo.computeFaceNormals();

		mesh = new THREE.Mesh(
			geo,
			new THREE.MeshLambertMaterial({
				overdraw: false,
				color: 0xaa0000,
				shading: THREE.FlatShading
			}
		));
		scene.add(mesh);

		stl = null;
	}

	function parseStlAscii(stl) {
		var state = '';
		var lines = stl.split('\n');
		var geo = new THREE.Geometry();
		var name, parts, line, normal, done;
		var vCount = 0;
		stl = null;

		for (var len = lines.length, i = 0; i < len; i++) {
			if (done) {
				break;
			}
			line = trim(lines[i]);
			parts = line.split(' ');

			switch (state) {
				case '':
					if (parts[0] !== 'solid') {
						console.error(line);
						console.error('Invalid state "' + parts[0] + '", should be "solid"');
						return;
					} else {
						name = parts[1];
						state = 'solid';
					}
					break;
				case 'solid':
					if (parts[0] !== 'facet' || parts[1] !== 'normal') {
						console.error(line);
						console.error('Invalid state "' + parts[0] + '", should be "facet normal"');
						return;
					} else {
						normal = [
							parseFloat(parts[2]),
							parseFloat(parts[3]),
							parseFloat(parts[4])
						];
						state = 'facet normal';
					}
					break;
				case 'facet normal':
					if (parts[0] !== 'outer' || parts[1] !== 'loop') {
						console.error(line);
						console.error('Invalid state "' + parts[0] + '", should be "outer loop"');
						return;
					} else {
						state = 'vertex';
					}
					break;
				case 'vertex':
					if (parts[0] === 'vertex') {
						geo.vertices.push(new THREE.Vector3(
							parseFloat(parts[1]),
							parseFloat(parts[2]),
							parseFloat(parts[3])
						));
					} else if (parts[0] === 'endloop') {
						geo.faces.push( new THREE.Face3( vCount*3, vCount*3+1, vCount*3+2, new THREE.Vector3(normal[0], normal[1], normal[2]) ) );
						vCount++;
						state = 'endloop';
					} else {
						console.error(line);
						console.error('Invalid state "' + parts[0] + '", should be "vertex" or "endloop"');
						return;
					}
					break;
				case 'endloop':
					if (parts[0] !== 'endfacet') {
						console.error(line);
						console.error('Invalid state "' + parts[0] + '", should be "endfacet"');
						return;
					} else {
						state = 'endfacet';
					}
					break;
				case 'endfacet':
					if (parts[0] === 'endsolid') {
						//mesh = new THREE.Mesh( geo, new THREE.MeshNormalMaterial({overdraw:true}));
						mesh = new THREE.Mesh(
							geo,
							new THREE.MeshLambertMaterial({
								overdraw: false,
								color: 0xaa0000,
								shading: THREE.FlatShading
							}
						));
						scene.add(mesh);
						done = true;
					} else if (parts[0] === 'facet' && parts[1] === 'normal') {
						normal = [
							parseFloat(parts[2]),
							parseFloat(parts[3]),
							parseFloat(parts[4])
						];
						state = 'facet normal';
					} else {
						console.error(line);
						console.error('Invalid state "' + parts[0] + '", should be "endsolid" or "facet normal"');
						return;
					}
					break;
				default:
					console.error('Invalid state "' + state + '"');
					break;
			}
		}
	}

	function render() {
		if (mesh) {
			mesh.rotation.x += 0.01;
			mesh.rotation.z += 0.02;
		}
		renderer.render(scene, camera);
	}

	function trim (str) {
		str = str.replace(/^\s+/, '');
		for (var i = str.length - 1; i >= 0; i--) {
			if (/\S/.test(str.charAt(i))) {
				str = str.substring(0, i + 1);
				break;
			}
		}
		return str;
	}

})();