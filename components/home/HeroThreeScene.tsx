import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

type Feature = "HOME" | "CAR";
const CAR_TRACK = { centerX: -0.05, centerZ: 0, radiusX: 4.05, radiusZ: 3.0 };

function setCarOnTrack(car: THREE.Group, angle: number) {
	car.position.set(
		CAR_TRACK.centerX + CAR_TRACK.radiusX * Math.cos(angle),
		0.34,
		CAR_TRACK.centerZ - CAR_TRACK.radiusZ * Math.sin(angle),
	);
	// The sedan faces local +X; aim its nose along the track tangent.
	const tangentX = -CAR_TRACK.radiusX * Math.sin(angle);
	const tangentZ = -CAR_TRACK.radiusZ * Math.cos(angle);
	// The car model reads as nose-forward when flipped relative to the track tangent.
	car.rotation.y = Math.atan2(-tangentZ, tangentX) + Math.PI;
}

const makeToon = (color: string, extra: Partial<THREE.MeshToonMaterialParameters> = {}) =>
	new THREE.MeshToonMaterial({ color, ...extra });

function addBox(
	parent: THREE.Object3D,
	geometry: [number, number, number],
	position: [number, number, number],
	material: THREE.Material,
	feature: Feature = "HOME",
) {
	const mesh = new THREE.Mesh(new THREE.BoxGeometry(...geometry), material);
	mesh.position.set(...position);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.userData.feature = feature;
	parent.add(mesh);
	return mesh;
}

function addEdges(parent: THREE.Object3D, mesh: THREE.Mesh, color = "#26464a", opacity = 0.55) {
	const geometry = new THREE.EdgesGeometry(mesh.geometry, 22);
	geometry.setDrawRange(0, 0);
	const outline = new THREE.LineSegments(
		geometry,
		new THREE.LineBasicMaterial({ color, transparent: true, opacity: Math.min(0.98, opacity * 1.8) }),
	);
	outline.userData.progressiveDrawing = true;
	outline.userData.feature = mesh.userData.feature;
	mesh.add(outline);
	return outline;
}

function addCylinder(
	parent: THREE.Object3D,
	radiusTop: number,
	radiusBottom: number,
	height: number,
	position: [number, number, number],
	material: THREE.Material,
	segments = 18,
) {
	const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
	mesh.position.set(...position);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.userData.feature = "HOME";
	parent.add(mesh);
	return mesh;
}

function buildApartment(scene: THREE.Scene) {
	const building = new THREE.Group();
	building.name = "Habesha illustrated apartment";
	building.position.set(-1.55, 0.34, -0.05);
	const cream = makeToon("#b8ad94");
	const lightCream = makeToon("#d5c9ad");
	const shadowCream = makeToon("#788b82");
	const darkTeal = makeToon("#102b2b");
	const glass = makeToon("#356d70", { transparent: true, opacity: 0.7 });
	const warmGlass = makeToon("#d99a58", { emissive: "#bd7740", emissiveIntensity: 0.22 });
	const metal = makeToon("#c6a763");
	const foliage = makeToon("#63866e");
	const terra = makeToon("#a95d43");
	const frameColor = "#f0d5a1";

	// The wide oval plinth and street form one clean architectural illustration.
	const platform = new THREE.Mesh(new THREE.CylinderGeometry(5.05, 5.05, 0.3, 96), makeToon("#173432"));
	platform.scale.z = 0.72;
	platform.position.set(-0.05, 0.16, 0);
	platform.receiveShadow = true;
	platform.userData.feature = "HOME";
	addEdges(scene, platform, frameColor, 0.84);
	scene.add(platform);
	const platformEdge = new THREE.Mesh(new THREE.TorusGeometry(5.02, 0.025, 10, 100), new THREE.MeshToonMaterial({ color: "#c88758", transparent: true, opacity: 0.4 }));
	platformEdge.rotation.x = Math.PI / 2;
	platformEdge.scale.set(1, 0.72, 1);
	platformEdge.position.set(-0.05, 0.31, 0);
	scene.add(platformEdge);

	// Open-front shell shows real interior details; glazing can be toggled on demand.
	const shell = new THREE.Group();
	building.add(shell);
	addBox(building, [3.08, 0.16, 2.6], [0, 0.04, 0], terra);
	const back = addBox(shell, [2.82, 3.83, 0.13], [0, 2.02, -1.06], cream);
	addEdges(shell, back, frameColor, 0.5);
	const rightWall = addBox(shell, [0.13, 3.83, 0.78], [1.36, 2.02, -0.68], shadowCream);
	addEdges(shell, rightWall, frameColor, 0.5);
	const leftWall = addBox(shell, [0.13, 3.83, 2.18], [-1.36, 2.02, 0], lightCream);
	addEdges(shell, leftWall, frameColor, 0.5);
	const glassGroup = new THREE.Group();
	building.add(glassGroup);
	const balconyGroup = new THREE.Group();
	building.add(balconyGroup);
	const interior = new THREE.Group();
	building.add(interior);

	// Floor slabs, fine fascia, windows and balconies establish the building scale.
	for (let floor = 0; floor < 4; floor += 1) {
		const level = 0.2 + floor * 0.92;
		const slab = addBox(building, [2.92, 0.14, 2.42], [0, level, 0], floor === 0 ? terra : lightCream);
		addEdges(building, slab, frameColor, 0.45);
		for (const x of [-1.38, 0, 1.38]) {
			if (floor === 0 && x === 0) continue;
			addBox(building, [0.11, 0.78, 0.12], [x, level + 0.47, 1.06], floor === 0 ? cream : lightCream);
		}

		const y = level + 0.48;
		for (let bay = 0; bay < 3; bay += 1) {
			const x = -0.92 + bay * 0.92;
			const pane = addBox(glassGroup, [0.68, 0.62, 0.035], [x, y, 1.095], floor === 2 && bay === 1 ? warmGlass : glass);
			addEdges(glassGroup, pane, frameColor, 0.64);
			addBox(glassGroup, [0.035, 0.64, 0.055], [x, y, 1.128], metal);
			addBox(glassGroup, [0.7, 0.035, 0.055], [x, y, 1.128], metal);
			if (floor < 3 && bay !== 1) {
				const balcony = addBox(balconyGroup, [0.78, 0.09, 0.56], [x, level + 0.12, 1.34], shadowCream);
				addEdges(balconyGroup, balcony, frameColor, 0.5);
				addBox(balconyGroup, [0.79, 0.035, 0.035], [x, level + 0.51, 1.59], metal);
				for (const postX of [x - 0.36, x - 0.12, x + 0.12, x + 0.36]) {
					addBox(balconyGroup, [0.025, 0.37, 0.025], [postX, level + 0.31, 1.59], metal);
				}
				addCylinder(balconyGroup, 0.12, 0.14, 0.16, [x + 0.23, level + 0.25, 1.43], terra, 12);
				addCylinder(balconyGroup, 0.035, 0.07, 0.27, [x + 0.23, level + 0.45, 1.43], foliage, 7);
			}
		}

		// Rugs, sofas, beds and plants make the cutaway feel occupied and tangible.
		const room = new THREE.Group();
		interior.add(room);
		addBox(room, [1.48, 0.025, 1.18], [0, level + 0.17, 0.04], makeToon(floor % 2 === 0 ? "#d5a16d" : "#7b9a94"));
		if (floor === 0 || floor === 2) {
			addBox(room, [0.83, 0.34, 0.32], [-0.43, level + 0.42, 0.16], makeToon("#b86f50"));
			addBox(room, [0.83, 0.11, 0.36], [-0.43, level + 0.62, 0.16], makeToon("#d99169"));
			addBox(room, [0.48, 0.28, 0.42], [0.52, level + 0.32, -0.34], lightCream);
			addBox(room, [0.28, 0.11, 0.25], [0.52, level + 0.5, -0.34], terra);
		} else {
			addBox(room, [0.83, 0.16, 0.53], [-0.38, level + 0.28, -0.28], makeToon("#f2eadb"));
			addBox(room, [0.17, 0.08, 0.57], [-0.71, level + 0.39, -0.28], lightCream);
			addBox(room, [0.48, 0.42, 0.3], [0.55, level + 0.38, 0.14], makeToon("#9d6c4d"));
			addBox(room, [0.52, 0.055, 0.36], [0.55, level + 0.61, 0.14], makeToon("#dfb982"));
		}
		addCylinder(room, 0.11, 0.13, 0.19, [1.02, level + 0.27, -0.63], terra, 12);
		addCylinder(room, 0.075, 0.09, 0.28, [1.02, level + 0.49, -0.63], foliage, 8);
	}

	// Roof pergola, entry canopy and warm doorway complete the architectural model.
	const roof = addBox(building, [3.06, 0.18, 2.52], [0, 4.0, 0], terra);
	addEdges(building, roof, frameColor, 0.6);
	for (const x of [-0.84, 0.84]) {
		addBox(building, [0.055, 0.63, 0.055], [x, 4.4, -0.35], metal);
		addBox(building, [0.055, 0.63, 0.055], [x, 4.4, 0.4], metal);
	}
	addBox(building, [1.82, 0.055, 0.9], [0, 4.73, 0.02], metal);
	addBox(building, [1.0, 0.11, 0.26], [0, 0.55, 1.34], terra);
	addBox(building, [0.52, 0.73, 0.055], [0, 0.91, 1.13], darkTeal);
	addBox(building, [0.09, 0.12, 0.06], [0.17, 0.91, 1.18], makeToon("#e5bd72"));

	building.traverse((object) => { object.userData.feature = "HOME"; });
	scene.add(building);
	return { building, glassGroup };
}

function buildCar(scene: THREE.Scene) {
	const car = new THREE.Group();
	car.name = "Illustrated premium sedan";
	car.position.set(2.02, 0.34, 0.55);
	const paint = makeToon("#c77a50");
	const deepPaint = makeToon("#673c36");
	const glass = makeToon("#153e42", { emissive: "#214b50", emissiveIntensity: 0.08 });
	const rubber = new THREE.MeshStandardMaterial({ color: "#1e2829", roughness: 0.84 });
	const chrome = makeToon("#d9bb7c");
	const lamp = makeToon("#ffe3a2", { emissive: "#ffd071", emissiveIntensity: 0.3 });

	// A shaped, bevelled body and side glazing read as a compact premium car.
	const bodyShape = new THREE.Shape();
	bodyShape.moveTo(-1.54, 0.2);
	bodyShape.lineTo(-1.5, 0.43);
	bodyShape.quadraticCurveTo(-1.46, 0.58, -1.25, 0.62);
	bodyShape.lineTo(-0.74, 0.67);
	bodyShape.lineTo(-0.27, 1.04);
	bodyShape.quadraticCurveTo(-0.08, 1.18, 0.18, 1.17);
	bodyShape.lineTo(0.69, 1.12);
	bodyShape.quadraticCurveTo(0.91, 1.08, 1.07, 0.83);
	bodyShape.lineTo(1.43, 0.66);
	bodyShape.quadraticCurveTo(1.58, 0.59, 1.6, 0.43);
	bodyShape.lineTo(1.56, 0.2);
	bodyShape.lineTo(-1.54, 0.2);
	const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, { depth: 1.13, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.055, bevelThickness: 0.055 });
	bodyGeometry.translate(0, 0, -0.565);
	const body = new THREE.Mesh(bodyGeometry, paint);
	body.castShadow = true;
	body.receiveShadow = true;
	body.userData.feature = "CAR";
	addEdges(car, body, "#f0d5a1", 0.86);
	car.add(body);

	const windowShape = new THREE.Shape();
	windowShape.moveTo(-0.66, 0.7);
	windowShape.lineTo(-0.2, 1.04);
	windowShape.quadraticCurveTo(-0.07, 1.11, 0.12, 1.1);
	windowShape.lineTo(0.59, 1.06);
	windowShape.lineTo(0.84, 0.72);
	windowShape.lineTo(-0.66, 0.7);
	const windows = new THREE.ShapeGeometry(windowShape);
	for (const side of [-1, 1]) {
		const pane = new THREE.Mesh(windows, glass);
		pane.position.z = side * 0.574;
		pane.userData.feature = "CAR";
		car.add(pane);
		addEdges(car, pane, "#f0d5a1", 0.72);
		const pillar = addBox(car, [0.035, 0.38, 0.035], [0.18, 0.9, side * 0.59], deepPaint, "CAR");
		pillar.rotation.z = -0.08;
		addBox(car, [1.32, 0.035, 0.035], [0.08, 0.69, side * 0.59], deepPaint, "CAR");
	}

	// Wheels, illustrated alloy hubs, door lines, mirrors and lamps.
	for (const x of [-1.0, 1.03]) {
		for (const side of [-1, 1]) {
			const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.23, 32), rubber);
			wheel.rotation.x = Math.PI / 2;
			wheel.position.set(x, 0.35, side * 0.59);
			wheel.castShadow = true;
			wheel.userData.feature = "CAR";
			car.add(wheel);
			addEdges(car, wheel, "#f0d5a1", 0.82);
			for (const [radius, material] of [[0.19, chrome], [0.055, deepPaint]] as const) {
				const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.245, 24), material);
				hub.rotation.x = Math.PI / 2;
				hub.position.copy(wheel.position);
				hub.position.z += side * 0.012;
				hub.userData.feature = "CAR";
				car.add(hub);
				addEdges(car, hub, "#f0d5a1", 0.72);
			}
		}
	}
	for (const side of [-1, 1]) {
		addBox(car, [1.24, 0.035, 0.025], [-0.02, 0.48, side * 0.598], deepPaint, "CAR");
		addBox(car, [0.04, 0.34, 0.03], [0.62, 0.53, side * 0.599], deepPaint, "CAR");
		addBox(car, [0.23, 0.09, 0.12], [-0.42, 0.69, side * 0.63], chrome, "CAR");
		addBox(car, [0.2, 0.11, 0.06], [1.48, 0.57, side * 0.48], lamp, "CAR");
		addBox(car, [0.17, 0.11, 0.06], [-1.43, 0.55, side * 0.48], makeToon("#e9785e", { emissive: "#7d281e", emissiveIntensity: 0.1 }), "CAR");
	}
	addBox(car, [0.92, 0.12, 0.12], [0.02, 0.3, 0], deepPaint, "CAR");
	car.traverse((object) => { object.userData.feature = "CAR"; });

	const trackShape = new THREE.Shape();
	trackShape.absellipse(CAR_TRACK.centerX, 0, 4.55, 3.48, 0, Math.PI * 2, false, 0);
	const trackInner = new THREE.Path();
	trackInner.absellipse(CAR_TRACK.centerX, 0, 3.55, 2.55, 0, Math.PI * 2, true, 0);
	trackShape.holes.push(trackInner);
	const track = new THREE.Mesh(
		new THREE.ShapeGeometry(trackShape, 128),
		new THREE.MeshToonMaterial({ color: "#183635", side: THREE.DoubleSide }),
	);
	track.rotation.x = -Math.PI / 2;
	track.position.y = 0.32;
	track.receiveShadow = true;
	scene.add(track);
	for (let mark = 0; mark < 36; mark += 1) {
		const angle = (mark / 36) * Math.PI * 2;
		const dash = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.014, 0.045), new THREE.MeshBasicMaterial({ color: "#dfbd79", transparent: true, opacity: 0.68 }));
		dash.position.set(
			CAR_TRACK.centerX + CAR_TRACK.radiusX * Math.cos(angle),
			0.335,
			CAR_TRACK.centerZ - CAR_TRACK.radiusZ * Math.sin(angle),
		);
		dash.rotation.y = angle + Math.PI / 2;
		scene.add(dash);
	}
	car.scale.setScalar(1.02);
	setCarOnTrack(car, -Math.PI / 2);
	scene.add(car);
	return car;
}

export default function HeroThreeScene() {
	const host = useRef<HTMLDivElement>(null);
	const selectionRef = useRef<Feature>("HOME");

	useEffect(() => {
		const mount = host.current;
		if (!mount) return;
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
		camera.position.set(5.6, 8.1, 13.6);
		const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.04;
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFShadowMap;
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
		renderer.domElement.setAttribute("aria-label", "Interactive 3D apartment and car illustration. Drag to rotate and click the apartment or car to inspect.");
		Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block", cursor: "grab", touchAction: "pan-y" });
		mount.appendChild(renderer.domElement);

		const ambient = new THREE.HemisphereLight("#fff6e4", "#4d7270", 1.45);
		scene.add(ambient);
		const keyLight = new THREE.DirectionalLight("#ffe1ae", 1.85);
		keyLight.position.set(-5, 10, 7);
		keyLight.castShadow = true;
		keyLight.shadow.mapSize.set(1024, 1024);
		keyLight.shadow.camera.left = -9;
		keyLight.shadow.camera.right = 9;
		keyLight.shadow.camera.top = 9;
		keyLight.shadow.camera.bottom = -9;
		keyLight.shadow.bias = -0.0003;
		scene.add(keyLight);
		const fillLight = new THREE.DirectionalLight("#9fc5d0", 0.78);
		fillLight.position.set(7, 5, -6);
		scene.add(fillLight);
		const { building } = buildApartment(scene);
		const car = buildCar(scene);
		const homeRing = new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.018, 8, 96), new THREE.MeshBasicMaterial({ color: "#e8b75d", transparent: true, opacity: 0.84 }));
		homeRing.rotation.x = Math.PI / 2;
		homeRing.scale.set(1, 0.72, 1);
		homeRing.position.set(-1.55, 0.34, -0.05);
		scene.add(homeRing);
		const carRing = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.018, 8, 96), new THREE.MeshBasicMaterial({ color: "#e8b75d", transparent: true, opacity: 0.84 }));
		carRing.rotation.x = Math.PI / 2;
		carRing.scale.set(1, 0.72, 1);
		carRing.position.set(car.position.x, 0.35, car.position.z);
		carRing.visible = false;
		scene.add(carRing);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.07;
		controls.enablePan = false;
		controls.enableZoom = true;
		controls.minDistance = 11.5;
		controls.maxDistance = 36;
		controls.rotateSpeed = 0.72;
		controls.minPolarAngle = Math.PI * 0.22;
		controls.maxPolarAngle = Math.PI * 0.43;
		controls.target.set(-4.5, 2.0, 0.05);
		controls.update();
		const targetGoal = controls.target.clone();
		const focusFeature = (feature: Feature) => {
			selectionRef.current = feature;
			const target = feature === "HOME" ? new THREE.Vector3(-1.55, 2.15, 0) : new THREE.Vector3(car.position.x, 0.92, car.position.z);
			targetGoal.copy(target);
		};
		controls.addEventListener("end", () => targetGoal.copy(controls.target));

		let cameraConfigured = false;
		const resize = () => {
			const width = mount.clientWidth;
			const height = mount.clientHeight;
			if (!width || !height) return;
			camera.aspect = width / height;
			if (!cameraConfigured) {
				const viewDirection = new THREE.Vector3(7.75, 6.1, 13.55).normalize();
				camera.position.copy(controls.target).addScaledVector(viewDirection, width < 640 ? 25.5 : 17.2);
				cameraConfigured = true;
			}
			camera.updateProjectionMatrix();
			renderer.setSize(width, height, false);
		};
		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(mount);
		resize();

		const raycaster = new THREE.Raycaster();
		const pointer = new THREE.Vector2();
		const selectable: THREE.Object3D[] = [];
		building.traverse((object) => { if (object.userData.feature === "HOME") selectable.push(object); });
		car.traverse((object) => { if (object.userData.feature === "CAR") selectable.push(object); });
		let down: { x: number; y: number } | undefined;
		const hitTest = (event: PointerEvent) => {
			const rect = renderer.domElement.getBoundingClientRect();
			pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(pointer, camera);
			return raycaster.intersectObjects(selectable, false).find((hit) => hit.object.userData.feature)?.object.userData.feature as Feature | undefined;
		};
		const onPointerMove = (event: PointerEvent) => {
			if (!down) renderer.domElement.style.cursor = hitTest(event) ? "pointer" : "grab";
		};
		const onPointerDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY }; };
		const onPointerCancel = () => { down = undefined; };
		const onPointerUp = (event: PointerEvent) => {
			if (!down) return;
			const distance = Math.hypot(event.clientX - down.x, event.clientY - down.y);
			down = undefined;
			if (distance > 7) return;
			const feature = hitTest(event);
			if (!feature) return;
			selectionRef.current = feature;
			focusFeature(feature);
		};
		renderer.domElement.addEventListener("pointermove", onPointerMove);
		renderer.domElement.addEventListener("pointerdown", onPointerDown);
		renderer.domElement.addEventListener("pointerup", onPointerUp);
		renderer.domElement.addEventListener("pointercancel", onPointerCancel);

		const drawings: Record<Feature, THREE.LineSegments[]> = { HOME: [], CAR: [] };
		const drawingVertexCounts: Record<Feature, number> = { HOME: 0, CAR: 0 };
		const fillMaterials: Record<Feature, Set<THREE.Material>> = { HOME: new Set(), CAR: new Set() };
		const materialOpacity = new Map<THREE.Material, number>();
		scene.traverse((object) => {
			const feature = object.userData.feature as Feature | undefined;
			if (feature && object instanceof THREE.LineSegments && object.userData.progressiveDrawing) {
				drawings[feature].push(object);
				drawingVertexCounts[feature] += object.geometry.attributes.position.count;
			} else if (feature && object instanceof THREE.Mesh) {
				const materials = Array.isArray(object.material) ? object.material : [object.material];
				materials.forEach((material) => {
					fillMaterials[feature].add(material);
					if (!materialOpacity.has(material)) materialOpacity.set(material, material.opacity);
				});
			}
		});
		const revealFeature = (feature: Feature, progress: number) => {
			let remaining = Math.floor(drawingVertexCounts[feature] * progress / 2) * 2;
			for (const line of drawings[feature]) {
				const count = Math.floor(line.geometry.attributes.position.count / 2) * 2;
				const visible = Math.min(count, remaining);
				line.geometry.setDrawRange(0, visible);
				remaining -= visible;
			}
		};
		const revealFill = (feature: Feature, progress: number) => {
			for (const material of fillMaterials[feature]) {
				const finalOpacity = Math.min(materialOpacity.get(material) ?? 1, feature === "HOME" ? 0.14 : 0.32);
				material.transparent = true;
				material.depthWrite = false;
				material.opacity = Math.max(0.025, finalOpacity * progress);
			}
		};
		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (reduceMotion) {
			revealFeature("HOME", 1);
			revealFeature("CAR", 1);
			revealFill("HOME", 1);
			revealFill("CAR", 1);
		} else {
			revealFill("HOME", 0.06);
			revealFill("CAR", 0.06);
		}

		let frame = 0;
		let inViewport = false;
		let lastTime = 0;
		const drawingStarted = performance.now();
		let carAngle = -Math.PI / 2;
		const animate = (time: number) => {
			frame = window.requestAnimationFrame(animate);
			const dt = Math.min(0.05, (time - lastTime) / 1000 || 0);
			lastTime = time;
			if (!reduceMotion && time >= drawingStarted + 3800) {
				carAngle = (carAngle + dt * 0.36) % (Math.PI * 2);
				setCarOnTrack(car, carAngle);
				carRing.position.set(car.position.x, 0.35, car.position.z);
			}
			const shift = targetGoal.clone().sub(controls.target).multiplyScalar(Math.min(1, dt * 5.5));
			controls.target.add(shift);
			camera.position.add(shift);
			const drawTime = Math.max(0, time - drawingStarted);
			if (!reduceMotion && drawTime < 3800) {
				const homeProgress = THREE.MathUtils.smoothstep(drawTime, 0, 2150);
				const carProgress = THREE.MathUtils.smoothstep(drawTime - 1750, 0, 2050);
				revealFeature("HOME", homeProgress);
				revealFeature("CAR", carProgress);
				revealFill("HOME", homeProgress);
				revealFill("CAR", carProgress);
			} else if (!reduceMotion && drawTime >= 3800) {
				revealFeature("HOME", 1);
				revealFeature("CAR", 1);
				revealFill("HOME", 1);
				revealFill("CAR", 1);
			}
			homeRing.visible = selectionRef.current === "HOME";
			carRing.visible = selectionRef.current === "CAR";
			homeRing.scale.set(1, 0.72, 1);
			carRing.scale.set(1, 0.72, 1);
			controls.update();
			renderer.render(scene, camera);
		};
		const updateAnimationState = () => {
			const shouldAnimate = inViewport && document.visibilityState === "visible";
			if (shouldAnimate && !frame) {
				lastTime = 0;
				frame = window.requestAnimationFrame(animate);
			} else if (!shouldAnimate && frame) {
				window.cancelAnimationFrame(frame);
				frame = 0;
			}
		};
		const visibilityObserver = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
			inViewport = entries.some((entry) => entry.isIntersecting);
			updateAnimationState();
		}, { threshold: 0.01 }) : null;
		visibilityObserver?.observe(mount);
		if (!visibilityObserver) {
			inViewport = true;
			updateAnimationState();
		}
		document.addEventListener("visibilitychange", updateAnimationState);

		return () => {
			window.cancelAnimationFrame(frame);
			visibilityObserver?.disconnect();
			document.removeEventListener("visibilitychange", updateAnimationState);
			resizeObserver.disconnect();
			renderer.domElement.removeEventListener("pointermove", onPointerMove);
			renderer.domElement.removeEventListener("pointerdown", onPointerDown);
			renderer.domElement.removeEventListener("pointerup", onPointerUp);
			renderer.domElement.removeEventListener("pointercancel", onPointerCancel);
			controls.dispose();
			const geometries = new Set<THREE.BufferGeometry>();
			const materials = new Set<THREE.Material>();
			scene.traverse((object) => {
				if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
					geometries.add(object.geometry);
					const material = object.material;
					if (Array.isArray(material)) material.forEach((entry) => materials.add(entry));
					else materials.add(material);
				}
			});
			geometries.forEach((geometry) => geometry.dispose());
			materials.forEach((material) => material.dispose());
			renderer.dispose();
			mount.removeChild(renderer.domElement);
		};
	}, []);

	return (
		<div style={{ position: "relative", width: "100%", height: "100%", minHeight: 360, overflow: "hidden", background: "transparent", isolation: "isolate" }}>
			<div ref={host} style={{ position: "absolute", inset: 0 }} />
			<div className="scene-shade" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(90deg,rgba(7,25,24,.94) 0%,rgba(7,25,24,.87) 30%,rgba(7,25,24,.48) 49%,rgba(7,25,24,.04) 77%)" }} />
			<style>{`@media(max-width:900px){.scene-shade{background:linear-gradient(180deg,rgba(7,25,24,.34) 0%,rgba(7,25,24,.38) 30%,rgba(7,25,24,.78) 78%,rgba(7,25,24,.94) 100%)!important}}`}</style>
		</div>
	);
}
