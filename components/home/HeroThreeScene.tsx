import { useEffect, useRef } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

function ease(value: number) {
	const t = THREE.MathUtils.clamp(value, 0, 1);
	return t * t * (3 - 2 * t);
}

function setCarArrival(car: THREE.Group, progress: number, mobile = false) {
	const t = ease(progress);
	car.position.set((mobile ? 3.35 : 3.7) - 0.6 * t, 0.34, -1.8 + 1.5 * t);
	car.rotation.y = 2.18 - t * 0.08;
}

const makeSurface = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
	new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.05, ...extra });

function addBox(
	parent: THREE.Object3D,
	geometry: [number, number, number],
	position: [number, number, number],
	material: THREE.Material,
	assemblyStage = 0,
) {
	const mesh = new THREE.Mesh(new THREE.BoxGeometry(...geometry), material);
	mesh.position.set(...position);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.userData.feature = "HOME";
	mesh.userData.assemblyStage = assemblyStage;
	parent.add(mesh);
	return mesh;
}

function addShrub(parent: THREE.Object3D, position: [number, number, number], material: THREE.Material, assemblyStage: number) {
	const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), material);
	mesh.position.set(...position);
	mesh.scale.set(1.2, 0.7, 0.8);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.userData.feature = "HOME";
	mesh.userData.assemblyStage = assemblyStage;
	parent.add(mesh);
	return mesh;
}

function buildApartment(scene: THREE.Scene, plasterTexture: THREE.Texture) {
	const building = new THREE.Group();
	building.name = "Contemporary apartment residence";
	building.position.set(-0.96, 0.34, -0.18);
	building.scale.setScalar(1.1);

	const stone = makeSurface("#47372d", { roughness: 0.93 });
	const stoneBand = makeSurface("#6b5747", { roughness: 0.85 });
	const charcoal = makeSurface("#211711", { roughness: 0.82 });
	const sideWall = makeSurface("#766b66", { map: plasterTexture, roughness: 0.94 });
	const frame = makeSurface("#281b14", { metalness: 0.35, roughness: 0.42 });
	const bronze = makeSurface("#815e42", { metalness: 0.48, roughness: 0.46 });
	const rail = new THREE.MeshPhysicalMaterial({ color: "#75563a", metalness: 0.34, roughness: 0.2, transparent: true, opacity: 0.72, depthWrite: false });
	const planter = makeSurface("#3b332e", { roughness: 0.94 });
	const foliage = makeSurface("#293f35", { roughness: 0.95 });
	const glass = new THREE.MeshPhysicalMaterial({ color: "#38281e", metalness: 0.48, roughness: 0.16, clearcoat: 0.74, clearcoatRoughness: 0.12 });
	const litGlass = new THREE.MeshPhysicalMaterial({ color: "#282b2a", metalness: 0.15, roughness: 0.28, emissive: "#70482e", emissiveIntensity: 0.14, clearcoat: 0.3 });

	const box = (size: [number, number, number], position: [number, number, number], material: THREE.Material, stage: number) => {
		const mesh = addBox(building, size, position, material, stage);
		return mesh;
	};
	const window = (x: number, y: number, z: number, width: number, lit = false) => {
		box([width + 0.11, 0.73, 0.09], [x, y, z], frame, 4);
		box([width, 0.63, 0.025], [x, y, z + 0.058], lit ? litGlass : glass, 4);
		box([0.023, 0.65, 0.035], [x, y, z + 0.078], bronze, 4);
		box([width + 0.13, 0.035, 0.15], [x, y - 0.39, z + 0.02], charcoal, 4);
	};
	const terrace = (x: number, y: number, z: number, width: number, plant: boolean) => {
		box([width, 0.12, 0.7], [x, y, z], charcoal, 5);
		box([width - 0.1, 0.27, 0.045], [x, y + 0.2, z + 0.32], rail, 5);
		box([width, 0.025, 0.06], [x, y + 0.35, z + 0.32], bronze, 5);
		for (const edge of [-1, 1]) box([0.045, 0.34, 0.055], [x + edge * (width / 2 - 0.04), y + 0.19, z + 0.32], frame, 5);
		if (!plant) return;
		const plantX = x + width * 0.3;
		box([0.31, 0.14, 0.22], [plantX, y + 0.15, z + 0.06], planter, 5);
		addShrub(building, [plantX, y + 0.32, z + 0.06], foliage, 5);
	};

	// Two unequal volumes make a clear silhouette without the repeated slab stack.
	box([3.7, 0.18, 2.74], [0.02, 0.09, -0.08], charcoal, 0);
	box([2.42, 3.98, 1.96], [-0.55, 2.18, -0.28], stone, 1);
	box([1.3, 3.02, 1.76], [1.08, 1.7, -0.47], sideWall, 1);
	box([0.26, 4.18, 2.08], [-1.67, 2.2, -0.24], charcoal, 1);
	box([0.17, 3.15, 0.15], [0.44, 1.7, 0.41], charcoal, 3);
	box([0.055, 3.8, 0.11], [0.52, 2.17, 0.73], bronze, 3);
	for (let floor = 0; floor < 4; floor += 1) {
		const y = 0.66 + floor * 0.97;
		if (floor > 0) {
			box([2.54, 0.09, 2.06], [-0.55, y - 0.51, -0.25], stoneBand, 2);
			box([2.4, 0.1, 0.11], [-0.55, y - 0.43, 0.76], charcoal, 2);
		}
		if (floor > 0) {
			window(-1.14, y, 0.75, 0.73, floor === 2);
			window(-0.19, y, 0.75, 0.73, floor === 1);
		}
		if (floor < 3) {
			if (floor > 0) box([1.39, 0.08, 1.84], [1.08, y - 0.51, -0.46], stoneBand, 2);
			window(1.08, y, 0.46, 0.86, floor === 1);
		}
	}
	// Bronze fins and deep side glazing keep the façades legible at hero size.
	for (const x of [-1.59, -0.67, 0.28]) box([0.055, 3.78, 0.15], [x, 2.18, 0.83], bronze, 3);
	for (const x of [0.57, 1.6]) box([0.075, 2.85, 0.1], [x, 1.7, 0.54], charcoal, 3);
	for (let floor = 0; floor < 3; floor += 1) {
		box([0.03, 0.58, 0.72], [1.76, 0.66 + floor * 0.97, -0.4], frame, 4);
		box([0.026, 0.52, 0.65], [1.79, 0.66 + floor * 0.97, -0.4], floor === 2 ? litGlass : glass, 4);
	}
	terrace(-0.99, 1.14, 0.99, 1.47, false);
	terrace(-0.08, 3.09, 0.99, 1.45, true);
	terrace(1.08, 2.12, 0.71, 1.36, true);
	// Ground-floor lobby and a shallow canopy anchor the building to the street.
	box([1.82, 0.84, 0.11], [-0.55, 0.6, 0.79], frame, 3);
	box([1.71, 0.74, 0.025], [-0.55, 0.6, 0.86], glass, 4);
	box([0.05, 0.78, 0.04], [-0.55, 0.6, 0.9], bronze, 4);
	box([0.08, 0.16, 0.07], [-0.38, 0.59, 0.94], bronze, 4);
	box([1.74, 0.1, 0.72], [-0.55, 1.1, 1.04], charcoal, 5);
	box([1.62, 0.026, 0.07], [-0.55, 1.11, 1.42], bronze, 5);
	box([1.4, 0.06, 0.43], [-0.55, 0.05, 1.56], stoneBand, 0);
	// A recessed roof deck replaces the bright floating canopy.
	box([2.58, 0.14, 2.18], [-0.55, 4.23, -0.25], charcoal, 6);
	box([1.55, 0.24, 0.1], [-0.85, 4.38, 0.77], charcoal, 6);
	box([1.55, 0.025, 0.065], [-0.85, 4.51, 0.8], bronze, 6);
	box([0.85, 0.2, 0.08], [0.17, 4.36, 0.77], rail, 6);
	box([1.35, 0.12, 0.24], [1.05, 3.31, 0.26], charcoal, 6);
	box([1.0, 0.19, 0.19], [1.05, 3.45, 0.3], planter, 6);
	for (const x of [0.76, 1.1, 1.43]) addShrub(building, [x, 3.61, 0.29], foliage, 6);

	building.traverse((object) => { object.userData.feature = "HOME"; });
	scene.add(building);
	return { building };
}

function buildCar(scene: THREE.Scene) {
	const car = new THREE.Group();
	car.name = "Cinematic arrival car";
	setCarArrival(car, 0);
	scene.add(car);
	return car;
}

export default function HeroThreeScene() {
	const host = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const mount = host.current;
		if (!mount) return;
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
		camera.position.set(5.6, 8.1, 13.6);
		const mobilePerformanceMode = window.matchMedia("(max-width: 768px)").matches || window.matchMedia("(pointer: coarse)").matches;
		const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !mobilePerformanceMode, powerPreference: "high-performance" });
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.14;
		renderer.shadowMap.enabled = !mobilePerformanceMode;
		renderer.shadowMap.type = THREE.PCFShadowMap;
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobilePerformanceMode ? 1 : 1.6));
		renderer.domElement.setAttribute("aria-hidden", "true");
		Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block", pointerEvents: "none", userSelect: "none" });
		mount.appendChild(renderer.domElement);
		const room = new RoomEnvironment();
		const pmrem = new THREE.PMREMGenerator(renderer);
		const environment = pmrem.fromScene(room, 0.035);
		scene.environment = environment.texture;

		const ambient = new THREE.HemisphereLight("#f7eee4", "#3b2b22", 0.92);
		scene.add(ambient);
		const keyLight = new THREE.DirectionalLight("#ffe5c5", 1.75);
		keyLight.position.set(-5, 10, 7);
		keyLight.castShadow = true;
		keyLight.shadow.mapSize.set(1024, 1024);
		keyLight.shadow.camera.left = -9;
		keyLight.shadow.camera.right = 9;
		keyLight.shadow.camera.top = 9;
		keyLight.shadow.camera.bottom = -9;
		keyLight.shadow.bias = -0.0003;
		scene.add(keyLight);
		const fillLight = new THREE.DirectionalLight("#ddbd91", 0.54);
		fillLight.position.set(7, 5, -6);
		scene.add(fillLight);
		// CC0 photographed plaster from https://polyhaven.com/a/modular_urban_apartments_facade.
		const plasterTexture = new THREE.TextureLoader().load("/assets/3d/apartment-plaster.jpg");
		plasterTexture.colorSpace = THREE.SRGBColorSpace;
		const { building } = buildApartment(scene, plasterTexture);
		building.updateMatrixWorld(true);
		const apartmentParts: Array<{ mesh: THREE.Mesh; position: THREE.Vector3; scale: THREE.Vector3; stage: number; delay: number }> = [];
		let apartmentPartIndex = 0;
		building.traverse((object) => {
			if (!(object instanceof THREE.Mesh)) return;
			const stage = Number(object.userData.assemblyStage ?? 0);
			apartmentParts.push({
				mesh: object,
				position: object.position.clone(),
				scale: object.scale.clone(),
				stage,
				delay: stage * 480 + (apartmentPartIndex++ % 5) * 32,
			});
			object.visible = false;
		});
		const car = buildCar(scene);
		const portalMaterials: THREE.MeshBasicMaterial[] = [];
		for (let index = 0; index < 3; index += 1) {
			const width = 1.95 + index * 0.15;
			const height = 5.18 + index * 0.12;
			const path = new THREE.CatmullRomCurve3([
				new THREE.Vector3(-width, 0.3, 0),
				new THREE.Vector3(-width, height - 0.72, 0),
				new THREE.Vector3(-width + 0.68, height, 0),
				new THREE.Vector3(width - 0.68, height, 0),
				new THREE.Vector3(width, height - 0.72, 0),
				new THREE.Vector3(width, 0.3, 0),
			], false, "centripetal", 0.5);
			const material = new THREE.MeshBasicMaterial({ color: index % 2 ? "#c9a46b" : "#d7a27a", transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
			const arch = new THREE.Mesh(new THREE.TubeGeometry(path, 72, 0.025, 6, false), material);
			arch.position.set(-1.55, 0, -2.65 - index * 1.2);
			portalMaterials.push(material);
			scene.add(arch);
		}
		const floorCanvas = document.createElement("canvas");
		floorCanvas.width = floorCanvas.height = 128;
		const floorContext = floorCanvas.getContext("2d");
		if (floorContext) {
			const fade = floorContext.createRadialGradient(64, 64, 10, 64, 64, 64);
			fade.addColorStop(0, "#ffffff");
			fade.addColorStop(0.58, "#b4b4b4");
			fade.addColorStop(1, "#000000");
			floorContext.fillStyle = fade;
			floorContext.fillRect(0, 0, 128, 128);
		}
		const floorAlpha = new THREE.CanvasTexture(floorCanvas);
		const floor = new THREE.Mesh(
			new THREE.PlaneGeometry(13, 9),
			new THREE.MeshStandardMaterial({ color: "#17252d", roughness: 0.78, alphaMap: floorAlpha, transparent: true, opacity: 0.48, depthWrite: false }),
		);
		floor.rotation.x = -Math.PI / 2;
		floor.position.set(0, 0.30, 0);
		floor.receiveShadow = true;
		scene.add(floor);
		const contactShadow = new THREE.Mesh(
			new THREE.PlaneGeometry(3.5, 1.7),
			new THREE.MeshBasicMaterial({ color: "#080c13", alphaMap: floorAlpha, transparent: true, opacity: 0.34, depthWrite: false }),
		);
		contactShadow.rotation.x = -Math.PI / 2;
		contactShadow.position.y = 0.325;
		scene.add(contactShadow);
		const lightPath = new THREE.Group();
		const lightMaterial = new THREE.MeshBasicMaterial({ color: "#e7b274", transparent: true, opacity: 0.28, depthWrite: false, toneMapped: false });
		for (const offset of [-0.8, 0.8]) {
			const path = new THREE.CatmullRomCurve3([
				new THREE.Vector3(3.0 + offset, 0.33, -2.2),
				new THREE.Vector3(2.8 + offset, 0.33, -1.8),
				new THREE.Vector3(2.6 + offset, 0.33, -1.0),
				new THREE.Vector3(2.4 + offset, 0.33, -0.3),
			]);
			lightPath.add(new THREE.Mesh(new THREE.TubeGeometry(path, 40, 0.018, 5, false), lightMaterial));
		}
		scene.add(lightPath);
		const carLight = new THREE.SpotLight("#d5e8f0", 24, 12, Math.PI / 3.5, 0.72, 1.2);
		carLight.position.set(3.8, 5.8, 3.6);
		carLight.target.position.set(2.4, 0.7, -0.3);
		scene.add(carLight, carLight.target);
		const cameraTarget = new THREE.Vector3(-4.5, 2.0, 0.05);
		const viewDirection = new THREE.Vector3(7.75, 6.1, 13.55).normalize();
		const cameraBase = new THREE.Vector3();
		let mobile = false;
		const resize = () => {
			const width = mount.clientWidth;
			const height = mount.clientHeight;
			if (!width || !height) return;
			camera.aspect = width / height;
			mobile = width < 768;
			building.position.x = mobile ? -1.16 : -0.96;
			building.scale.setScalar(mobile ? 0.88 : 1.1);
			cameraTarget.set(mobile ? 0.05 : -4.5, mobile ? -3.4 : 2.0, 0.05);
			cameraBase.copy(cameraTarget).addScaledVector(viewDirection, mobile ? 31 : width < 900 ? 20 : 17.2);
			camera.position.copy(cameraBase);
			camera.lookAt(cameraTarget);
			camera.updateProjectionMatrix();
			renderer.setSize(width, height, false);
		};
		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(mount);
		resize();

		const carMaterials = new Map<THREE.Material, { opacity: number; transparent: boolean; depthWrite: boolean }>();
		const carOutlines: Array<{ geometry: THREE.EdgesGeometry; material: THREE.LineBasicMaterial }> = [];
		const carAssemblyParts: Array<{ object: THREE.Object3D; position: THREE.Vector3; scale: THREE.Vector3; offset: THREE.Vector3; delay: number; duration: number }> = [];
		let carLoaded = false;
		let carArrivalStarted = performance.now();
		let disposed = false;
		const draco = new DRACOLoader();
		draco.setDecoderPath("/assets/3d/");
		const loader = new GLTFLoader();
		loader.setDRACOLoader(draco);
		loader.load("/assets/3d/ferrari.glb", (gltf) => {
			if (disposed) return;
			const model = gltf.scene;
			const bounds = new THREE.Box3().setFromObject(model);
			const size = bounds.getSize(new THREE.Vector3());
			const center = bounds.getCenter(new THREE.Vector3());
			const scale = 2.6 / Math.max(size.x, size.z);
			model.scale.setScalar(scale);
			model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
			const body = model.getObjectByName("body") as THREE.Mesh | undefined;
			if (body) body.material = new THREE.MeshPhysicalMaterial({ color: "#7e1c33", metalness: 0.58, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.06 });
			for (const name of ["trim", "rim_fl", "rim_fr", "rim_rl", "rim_rr"]) {
				const mesh = model.getObjectByName(name) as THREE.Mesh | undefined;
				if (mesh) mesh.material = new THREE.MeshStandardMaterial({ color: "#67737a", metalness: 0.69, roughness: 0.3 });
			}
			const glass = model.getObjectByName("glass") as THREE.Mesh | undefined;
			if (glass) glass.material = new THREE.MeshPhysicalMaterial({ color: "#38281e", metalness: 0.22, roughness: 0.16, clearcoat: 0.45 });
			model.traverse((object) => {
				if (!(object instanceof THREE.Mesh)) return;
				object.castShadow = true;
				const materials = Array.isArray(object.material) ? object.material : [object.material];
				materials.forEach((material) => {
					if (!carMaterials.has(material)) {
						carMaterials.set(material, { opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite });
						material.transparent = true;
						material.depthWrite = false;
						material.opacity = 0;
						material.needsUpdate = true;
					}
				});
			});
			for (const name of ["body", "glass", "rim_fl", "rim_fr", "rim_rl", "rim_rr"]) {
				const part = model.getObjectByName(name) as THREE.Mesh | undefined;
				if (!part) continue;
				const geometry = new THREE.EdgesGeometry(part.geometry, 30);
				const material = new THREE.LineBasicMaterial({ color: name === "body" ? "#c9a46b" : "#e6c492", transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
				const outline = new THREE.LineSegments(geometry, material);
				outline.renderOrder = 30;
				part.add(outline);
				carOutlines.push({ geometry, material });
			}
			const main = model.getObjectByName("main");
			for (const part of main?.children || []) {
				const name = part.name.toLowerCase();
				const wheel = name.startsWith("wheel_");
				const body = name === "body";
				const glass = name === "glass";
				const lighting = name.includes("light") || name.includes("led") || name.includes("chrome");
				const delay = body ? 0 : wheel ? 1000 : glass ? 1450 : lighting ? 1750 : 530;
				const offset = wheel
					? new THREE.Vector3(name.endsWith("l") ? -0.5 : 0.5, -0.42, name.includes("_f") ? 0.3 : -0.3)
					: new THREE.Vector3(0, body ? -0.65 : glass ? 0.7 : lighting ? 0.35 : -0.25, body ? 0 : 0.16);
				carAssemblyParts.push({ object: part, position: part.position.clone(), scale: part.scale.clone(), offset, delay, duration: body ? 1000 : wheel ? 880 : 720 });
				part.visible = false;
			}
			car.add(model);
			carLoaded = true;
			carArrivalStarted = performance.now();
			if (reduceMotion) animate(carArrivalStarted + 5000);
			else renderer.render(scene, camera);
		}, undefined, () => { carLoaded = false; });
		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		let frame = 0;
		let inViewport = false;
		let lastDraw = 0;
		const drawingStarted = performance.now();
		let drawingComplete = reduceMotion;
		const animate = (time: number) => {
			if (!reduceMotion) frame = window.requestAnimationFrame(animate);
			if (!reduceMotion && time - lastDraw < (mobile && drawingComplete && carLoaded && time - carArrivalStarted > 4000 ? 100 : 32)) return;
			lastDraw = time;
			const drawTime = reduceMotion ? 5000 : Math.max(0, time - drawingStarted);
			if (!drawingComplete || reduceMotion) {
				apartmentParts.forEach(({ mesh, position, scale, stage, delay }) => {
					const progress = ease((drawTime - delay) / 680);
					mesh.visible = progress > 0.005;
					mesh.position.copy(position);
					mesh.position.y -= (1 - progress) * (stage === 6 ? 0.82 : 0.46);
					mesh.scale.copy(scale);
					mesh.scale.y *= 0.14 + progress * 0.86;
				});
			}
			const carTime = reduceMotion ? 5000 : carLoaded ? Math.max(0, time - carArrivalStarted) : 0;
			const carProgress = ease((carTime - 2450) / 1900);
			setCarArrival(car, carProgress, mobile);
			car.scale.setScalar(mobile ? 0.92 : 1);
			carAssemblyParts.forEach(({ object, position, scale, offset, delay, duration }) => {
				const progress = ease((carTime - delay) / duration);
				object.visible = progress > 0.005;
				object.position.copy(position).addScaledVector(offset, 1 - progress);
				object.scale.copy(scale);
				if (object.name === "body") object.scale.y *= 0.45 + progress * 0.55;
				else object.scale.multiplyScalar(0.12 + progress * 0.88);
			});
			const solidProgress = ease((carTime - 120) / 1550);
			const outlineProgress = ease(carTime / 650) * (1 - ease((carTime - 1050) / 950));
			carMaterials.forEach((state, material) => {
				if (solidProgress >= 1) {
					const changed = material.transparent !== state.transparent;
					material.opacity = state.opacity;
					material.transparent = state.transparent;
					material.depthWrite = state.depthWrite;
					if (changed) material.needsUpdate = true;
				} else {
					material.opacity = state.opacity * solidProgress;
				}
			});
			carOutlines.forEach(({ geometry, material }) => {
				const count = geometry.getAttribute("position").count;
				geometry.setDrawRange(0, Math.floor(count * ease((carTime - 250) / 2050) / 2) * 2);
				material.opacity = outlineProgress * 0.85;
			});
			contactShadow.position.set(car.position.x, 0.325, car.position.z);
			(contactShadow.material as THREE.MeshBasicMaterial).opacity = 0.34 * ease((carTime - 1000) / 1350);
			lightMaterial.opacity = 0.12 + 0.19 * ease(carTime / 2700);
			portalMaterials.forEach((material, index) => { material.opacity = 0.04 + 0.17 * ease((drawTime - index * 230) / 1800); });
			carLight.position.x = 3.8 - 0.2 * carProgress;
			camera.position.copy(cameraBase);
			if (!mobile && !reduceMotion) {
				camera.position.x += Math.sin(drawTime * 0.00028) * 0.12;
				camera.position.z -= 0.32 * ease(drawTime / 3900);
			}
			camera.lookAt(cameraTarget);
			if (!reduceMotion && !drawingComplete && drawTime >= 3800) {
				drawingComplete = true;
			}
			renderer.render(scene, camera);
		};
		const updateAnimationState = () => {
			const shouldAnimate = inViewport && document.visibilityState === "visible" && !reduceMotion;
			if (inViewport && reduceMotion) animate(drawingStarted + 5000);
			if (shouldAnimate && !frame) {
				lastDraw = 0;
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
			disposed = true;
			window.cancelAnimationFrame(frame);
			visibilityObserver?.disconnect();
			document.removeEventListener("visibilitychange", updateAnimationState);
			resizeObserver.disconnect();
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
			plasterTexture.dispose();
			floorAlpha.dispose();
			draco.dispose();
			environment.dispose();
			pmrem.dispose();
			room.dispose();
			renderer.dispose();
			mount.removeChild(renderer.domElement);
		};
	}, []);

	return (
		<div style={{ position: "relative", width: "100%", height: "100%", minHeight: 360, overflow: "hidden", background: "transparent", isolation: "isolate" }}>
			<div ref={host} style={{ position: "absolute", inset: 0 }} />
			<div className="scene-shade" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(90deg,rgba(27,25,25,.82) 0%,rgba(27,25,25,.68) 34%,rgba(27,25,25,.24) 58%,rgba(27,25,25,.02) 100%)" }} />
			<style>{`@media(max-width:900px){.scene-shade{background:linear-gradient(90deg,rgba(27,25,25,.9) 0%,rgba(27,25,25,.58) 58%,rgba(27,25,25,.16) 100%)!important}}@media(max-width:767px){.scene-shade{background:linear-gradient(180deg,rgba(27,25,25,.02) 0%,rgba(27,25,25,.08) 30%,rgba(27,25,25,.86) 43%,rgba(27,25,25,.98) 100%)!important}}`}</style>
		</div>
	);
}
