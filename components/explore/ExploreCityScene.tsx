import { useEffect, useRef } from "react";
import * as THREE from "three";

type TowerSpec = {
	x: number;
	z: number;
	w: number;
	d: number;
	h: number;
	color: string;
	seed: number;
};

function makeMat(color: string, metalness = 0.24, roughness = 0.68) {
	return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

function makeBox(parent: THREE.Object3D, size: [number, number, number], position: [number, number, number], material: THREE.Material) {
	const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
	mesh.position.set(...position);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	parent.add(mesh);
	return mesh;
}

function addTower(parent: THREE.Object3D, spec: TowerSpec, index: number, litMaterials: THREE.MeshStandardMaterial[]) {
	const tower = new THREE.Group();
	tower.position.set(spec.x, 0, spec.z);
	const shellMat = makeMat(spec.color, 0.42, 0.48);
	const trimMat = makeMat(index % 2 === 0 ? "#c68d54" : "#9caa99", 0.5, 0.42);
	const darkGlassMat = new THREE.MeshStandardMaterial({ color: "#153b40", metalness: 0.72, roughness: 0.24 });
	const warmGlassMat = new THREE.MeshStandardMaterial({ color: "#c9945d", emissive: "#dc9e56", emissiveIntensity: 0.72, metalness: 0.16, roughness: 0.36 });
	litMaterials.push(warmGlassMat);

	const podium = makeBox(tower, [spec.w + 0.42, 0.26, spec.d + 0.42], [0, 0.13, 0], trimMat);
	podium.castShadow = false;
	makeBox(tower, [spec.w, spec.h, spec.d], [0, spec.h / 2, 0], shellMat);
	const frontZ = spec.d / 2 + 0.016;
	const floorCount = Math.max(3, Math.floor(spec.h / 0.72));
	const windowH = Math.min(0.38, spec.h / floorCount * 0.5);
	const columns = Math.max(3, Math.floor(spec.w / 0.34));
	for (let floor = 0; floor < floorCount; floor += 1) {
		const y = 0.4 + floor * (spec.h - 0.64) / Math.max(1, floorCount - 1);
		for (let column = 0; column < columns; column += 1) {
			const x = -spec.w / 2 + (column + 0.5) * spec.w / columns;
			const warm = (floor * 7 + column * 3 + spec.seed) % 6 === 0;
			const window = makeBox(tower, [Math.min(0.2, spec.w / columns * 0.58), windowH, 0.035], [x, y, frontZ], warm ? warmGlassMat : darkGlassMat);
			window.castShadow = false;
			window.receiveShadow = false;
		}
		const sideColumnCount = Math.max(2, Math.floor(spec.d / 0.48));
		for (let column = 0; column < sideColumnCount; column += 1) {
			const z = -spec.d / 2 + (column + 0.5) * spec.d / sideColumnCount;
			const sideWindow = makeBox(tower, [0.035, windowH, Math.min(0.24, spec.d / sideColumnCount * 0.56)], [spec.w / 2 + 0.016, y, z], (column + floor + spec.seed) % 5 === 0 ? warmGlassMat : darkGlassMat);
			sideWindow.castShadow = false;
			sideWindow.receiveShadow = false;
		}
	}

	// Narrow vertical fins and floor bands give the silhouettes a crafted facade.
	for (const side of [-1, 1]) {
		makeBox(tower, [0.035, spec.h + 0.04, 0.045], [side * (spec.w / 2 - 0.08), spec.h / 2, frontZ + 0.018], trimMat);
	}
	for (let floor = 1; floor < floorCount; floor += 1) {
		const y = floor * spec.h / floorCount;
		makeBox(tower, [spec.w + 0.04, 0.035, 0.045], [0, y, frontZ + 0.02], trimMat);
		if (spec.h < 5.1 && floor % 2 === 0) {
			const balconyDepth = Math.min(0.28, spec.d * 0.18);
			makeBox(tower, [spec.w * 0.52, 0.055, balconyDepth], [0, y - 0.12, frontZ + balconyDepth / 2], trimMat);
			makeBox(tower, [spec.w * 0.52, 0.035, 0.025], [0, y + 0.22, frontZ + balconyDepth], trimMat);
			for (const postX of [-spec.w * 0.24, 0, spec.w * 0.24]) {
				makeBox(tower, [0.025, 0.32, 0.025], [postX, y + 0.04, frontZ + balconyDepth], trimMat);
			}
		}
	}
	if (spec.h > 6.5) {
		for (const finX of [-spec.w * 0.34, spec.w * 0.34]) {
			makeBox(tower, [0.075, spec.h + 0.08, 0.07], [finX, spec.h / 2, frontZ + 0.055], trimMat);
		}
	}

	const roof = makeBox(tower, [spec.w + 0.16, 0.13, spec.d + 0.16], [0, spec.h + 0.035, 0], trimMat);
	roof.castShadow = false;
	const crownHeight = index % 3 === 0 ? 0.8 : 0.34;
	makeBox(tower, [spec.w * 0.46, crownHeight, spec.d * 0.48], [0, spec.h + crownHeight / 2 + 0.09, 0], shellMat);
	parent.add(tower);
	return tower;
}

export default function ExploreCityScene() {
	const mountRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const mount = mountRef.current;
		if (!mount) return;

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
		let renderer: THREE.WebGLRenderer;
		try {
			renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
		} catch {
			mount.style.background = "radial-gradient(ellipse at 72% 50%, rgba(60,123,115,.42), transparent 52%)";
			return;
		}
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.2;
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
		renderer.setClearColor(0x000000, 0);
		renderer.domElement.setAttribute("aria-label", "Animated illustration of a city skyline with illuminated routes and buildings.");
		Object.assign(renderer.domElement.style, { display: "block", width: "100%", height: "100%", pointerEvents: "none", userSelect: "none" });
		mount.appendChild(renderer.domElement);

		const ambient = new THREE.HemisphereLight("#fff0d5", "#28515a", 2.05);
		scene.add(ambient);
		const key = new THREE.DirectionalLight("#ffe1b0", 2.45);
		key.position.set(-4, 11, 8);
		scene.add(key);
		const rim = new THREE.PointLight("#79d0c5", 13, 26, 2);
		rim.position.set(7, 6, -3);
		scene.add(rim);
		const city = new THREE.Group();
		scene.add(city);

		const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), makeMat("#17383a", 0.12, 0.9));
		ground.rotation.x = -Math.PI / 2;
		ground.position.y = -0.1;
		ground.receiveShadow = true;
		city.add(ground);

		// A fine street grid recedes through the district to give the scene depth.
		const gridPoints: THREE.Vector3[] = [];
		for (let x = -8; x <= 12; x += 1.1) {
			gridPoints.push(new THREE.Vector3(x, -0.075, -11), new THREE.Vector3(x, -0.075, 8));
		}
		for (let z = -11; z <= 8; z += 1.1) {
			gridPoints.push(new THREE.Vector3(-8, -0.075, z), new THREE.Vector3(12, -0.075, z));
		}
		const gridGeometry = new THREE.BufferGeometry().setFromPoints(gridPoints);
		const grid = new THREE.LineSegments(gridGeometry, new THREE.LineBasicMaterial({ color: "#75aaa0", transparent: true, opacity: 0.2 }));
		city.add(grid);

		const litMaterials: THREE.MeshStandardMaterial[] = [];
		const towers: TowerSpec[] = [
			{ x: -1.1, z: -3.0, w: 1.6, d: 1.65, h: 5.3, color: "#34615c", seed: 2 },
			{ x: 1.0, z: -3.5, w: 1.55, d: 1.7, h: 7.1, color: "#28535a", seed: 4 },
			{ x: 3.15, z: -2.9, w: 2.0, d: 2.05, h: 9.0, color: "#356a6b", seed: 1 },
			{ x: 5.55, z: -3.2, w: 1.55, d: 1.7, h: 6.0, color: "#285057", seed: 5 },
			{ x: 7.35, z: -2.1, w: 1.35, d: 1.5, h: 4.2, color: "#486b60", seed: 3 },
			{ x: -0.3, z: -0.25, w: 1.7, d: 1.65, h: 3.7, color: "#587569", seed: 6 },
			{ x: 2.0, z: 0.25, w: 1.8, d: 1.7, h: 4.6, color: "#3a625f", seed: 7 },
			{ x: 4.45, z: 0.05, w: 1.6, d: 1.6, h: 3.4, color: "#527569", seed: 8 },
			{ x: 6.55, z: 0.8, w: 1.8, d: 1.5, h: 4.6, color: "#35605b", seed: 9 },
		];
		towers.forEach((tower, index) => addTower(city, tower, index, litMaterials));

		// Warm property markers sit above selected rooftops and pulse gently.
		const markers: Array<{ halo: THREE.Mesh; beacon: THREE.Mesh; phase: number }> = [];
		for (const [index, spec] of [towers[1], towers[2], towers[5], towers[7]].entries()) {
			const halo = new THREE.Mesh(
				new THREE.TorusGeometry(0.38, 0.018, 8, 48),
				new THREE.MeshBasicMaterial({ color: "#efbd69", transparent: true, opacity: 0.68 }),
			);
			halo.rotation.x = Math.PI / 2;
			halo.position.set(spec.x, spec.h + 0.24, spec.z);
			city.add(halo);
			const beacon = new THREE.Mesh(
				new THREE.SphereGeometry(0.075, 14, 10),
				new THREE.MeshBasicMaterial({ color: "#ffe1a0", transparent: true, opacity: 0.95 }),
			);
			beacon.position.set(spec.x, spec.h + 0.24, spec.z);
			city.add(beacon);
			markers.push({ halo, beacon, phase: index * 1.3 });
		}

		// Golden routes connect homes, offices and local destinations across the map.
		const routeDefinitions = [
			[[-2.8, 0.16, 1.4], [-0.5, 0.32, 1.0], [1.7, 0.48, -0.2], [3.1, 0.34, -1.4], [3.1, 0.16, -2.65]],
			[[1.0, 0.18, -2.8], [1.9, 0.5, -1.8], [3.2, 0.72, -1.0], [4.5, 0.42, -1.0], [5.5, 0.18, -2.65]],
			[[2.0, 0.2, 0.9], [3.2, 0.42, 0.2], [4.4, 0.68, -0.15], [5.2, 0.48, 0.35], [6.55, 0.2, 0.7]],
		] as const;
		const routeDots: Array<{ trail: THREE.Mesh[]; curve: THREE.CatmullRomCurve3; phase: number; speed: number }> = [];
		const routeDotGeometry = new THREE.SphereGeometry(1, 14, 10);
		for (const [index, points] of routeDefinitions.entries()) {
			const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
			const routeColor = index === 1 ? "#68a99d" : "#e2b25f";
			const line = new THREE.Mesh(
				new THREE.TubeGeometry(curve, 150, 0.024, 6, false),
				new THREE.MeshBasicMaterial({ color: routeColor, transparent: true, opacity: 0.55 }),
			);
			city.add(line);
			const glowLine = new THREE.Mesh(
				new THREE.TubeGeometry(curve, 150, 0.075, 6, false),
				new THREE.MeshBasicMaterial({ color: routeColor, transparent: true, opacity: 0.075, depthWrite: false }),
			);
			city.add(glowLine);
			const dotMaterial = new THREE.MeshBasicMaterial({ color: index === 1 ? "#c5eee3" : "#ffe0a0", transparent: true });
			for (let dot = 0; dot < 3; dot += 1) {
				const trail = [0, 1, 2, 3].map((tailIndex) => {
					const mesh = new THREE.Mesh(routeDotGeometry, dotMaterial);
					mesh.scale.setScalar([0.09, 0.061, 0.043, 0.029][tailIndex]);
					city.add(mesh);
					return mesh;
				});
				routeDots.push({ trail, curve, phase: dot / 3 + index * 0.17, speed: 0.062 + index * 0.01 });
			}
		}

		// A handful of subdued stars add scale without competing with page copy.
		const starPositions = new Float32Array(96 * 3);
		for (let index = 0; index < 96; index += 1) {
			starPositions[index * 3] = -4 + ((index * 37) % 120) / 10;
			starPositions[index * 3 + 1] = 4 + ((index * 19) % 62) / 10;
			starPositions[index * 3 + 2] = -7 + ((index * 29) % 80) / 10;
		}
		const starGeometry = new THREE.BufferGeometry();
		starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
		const starMaterial = new THREE.PointsMaterial({ color: "#f1cf91", size: 0.035, transparent: true, opacity: 0.45, sizeAttenuation: true });
		const stars = new THREE.Points(starGeometry, starMaterial);
		city.add(stars);

		let width = 0;
		let height = 0;
		const target = new THREE.Vector3(3.25, 2.35, 0);
		const resize = () => {
			width = mount.clientWidth;
			height = mount.clientHeight;
			if (!width || !height) return;
			camera.aspect = width / height;
			camera.fov = width < 620 ? 43 : 39;
			const mobile = width < 620;
			const lookAt = mobile ? new THREE.Vector3(3.2, 2.1, -0.3) : target;
			const offset = mobile ? new THREE.Vector3(2.1, 8.5, 21) : new THREE.Vector3(3.4, 7.2, 15.2);
			camera.position.copy(lookAt).add(offset);
			camera.lookAt(lookAt);
			camera.updateProjectionMatrix();
			renderer.setSize(width, height, false);
		};
		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(mount);
		resize();

		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		let frame = 0;
		let visible = false;
		const render = (time: number) => {
			if (!reduceMotion) {
				const seconds = time / 1000;
				const idleTurn = Math.sin(seconds * 0.22) * 0.055;
				city.rotation.y += (idleTurn - city.rotation.y) * 0.025;
				for (const route of routeDots) {
					const progress = (seconds * route.speed + route.phase) % 1;
					route.trail.forEach((mesh, trailIndex) => {
						const trailProgress = (progress - trailIndex * 0.017 + 1) % 1;
						mesh.position.copy(route.curve.getPointAt(trailProgress));
						mesh.position.y += Math.sin(seconds * 2.2 + route.phase * 8 - trailIndex * 0.5) * 0.035;
					});
				}
				markers.forEach(({ halo, beacon, phase }) => {
					const pulse = (Math.sin(seconds * 1.5 + phase) + 1) / 2;
					halo.scale.setScalar(0.78 + pulse * 0.48);
					(halo.material as THREE.MeshBasicMaterial).opacity = 0.28 + pulse * 0.58;
					beacon.scale.setScalar(0.76 + pulse * 0.48);
					(beacon.material as THREE.MeshBasicMaterial).opacity = 0.64 + pulse * 0.35;
				});
				litMaterials.forEach((material, index) => {
					material.emissiveIntensity = 0.5 + (Math.sin(seconds * 0.72 + index * 0.27) + 1) * 0.32;
				});
				starMaterial.opacity = 0.34 + (Math.sin(seconds * 0.7) + 1) * 0.06;
			}
			renderer.render(scene, camera);
		};
		const animate = (time: number) => {
			frame = window.requestAnimationFrame(animate);
			render(time);
		};
		const update = () => {
			const shouldAnimate = visible && document.visibilityState === "visible" && !reduceMotion;
			if (shouldAnimate && !frame) {
				frame = window.requestAnimationFrame(animate);
			} else if (!shouldAnimate && frame) {
				window.cancelAnimationFrame(frame);
				frame = 0;
			}
			if (reduceMotion && visible) render(0);
		};
		const visibilityObserver = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
			visible = entries.some((entry) => entry.isIntersecting);
			update();
		}, { threshold: 0.01 }) : null;
		visibilityObserver?.observe(mount);
		if (!visibilityObserver) {
			visible = true;
			update();
		}
		document.addEventListener("visibilitychange", update);

		return () => {
			window.cancelAnimationFrame(frame);
			visibilityObserver?.disconnect();
			resizeObserver.disconnect();
			document.removeEventListener("visibilitychange", update);
			const geometries = new Set<THREE.BufferGeometry>();
			const materials = new Set<THREE.Material>();
			scene.traverse((object) => {
				if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Points) {
					geometries.add(object.geometry);
					const material = object.material;
					if (Array.isArray(material)) material.forEach((entry) => materials.add(entry));
					else materials.add(material);
				}
			});
			geometries.forEach((geometry) => geometry.dispose());
			materials.forEach((material) => material.dispose());
			renderer.dispose();
			if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
		};
	}, []);

	return (
		<div className="explore-city-scene" style={{ position: "relative", width: "100%", height: "100%", minHeight: 360, overflow: "hidden", background: "transparent", isolation: "isolate" }}>
			<div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
			<div aria-hidden="true" className="explore-city-shade" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(90deg,rgba(15,43,46,.82) 0%,rgba(15,43,46,.68) 34%,rgba(15,43,46,.24) 58%,rgba(15,43,46,.02) 100%)" }} />
			<style>{`@media(max-width:900px){.explore-city-shade{background:linear-gradient(180deg,rgba(15,43,46,.08) 0%,rgba(15,43,46,.16) 32%,rgba(15,43,46,.48) 72%,rgba(15,43,46,.78) 100%)!important}}`}</style>
		</div>
	);
}
