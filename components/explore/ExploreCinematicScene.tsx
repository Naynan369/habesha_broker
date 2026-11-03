import { useEffect, useRef } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const CAR_MODEL = "/assets/3d/ferrari.glb";
const FALLBACK_IMAGE = "/assets/images/supercar-showcase.jpg";

function ease(value: number) {
	const t = THREE.MathUtils.clamp(value, 0, 1);
	return t * t * (3 - 2 * t);
}

function glowMaterial(color: string, opacity: number) {
	return new THREE.ShaderMaterial({
		uniforms: { color: { value: new THREE.Color(color) }, opacity: { value: opacity } },
		vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
		fragmentShader: "uniform vec3 color;uniform float opacity;varying vec2 vUv;void main(){float d=length((vUv-.5)*vec2(1.0,1.15));float a=pow(max(0.0,1.0-d*2.0),2.2)*opacity;gl_FragColor=vec4(color,a);}",
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
	});
}

function portal(index: number) {
	const frame = new THREE.Group();
	const material = new THREE.MeshBasicMaterial({
		color: index % 2 === 0 ? "#d48a66" : "#6daeb2",
		transparent: true,
		opacity: 0,
		depthWrite: false,
		toneMapped: false,
	});
	const width = 3.38 - index * 0.06;
	const height = 4.5 - index * 0.07;
	const outline = [
		new THREE.Vector3(-width, 0, 0),
		new THREE.Vector3(-width, height - 0.8, 0),
		new THREE.Vector3(-width + 0.72, height, 0),
		new THREE.Vector3(width - 0.72, height, 0),
		new THREE.Vector3(width, height - 0.8, 0),
		new THREE.Vector3(width, 0, 0),
	];
	const curve = new THREE.CatmullRomCurve3(outline, false, "centripetal", 0.5);
	const arch = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, 0.038, 6, false), material);
	frame.add(arch);
	frame.position.z = -1.85 - index * 1.55;
	frame.rotation.z = (index % 2 === 0 ? 1 : -1) * 0.016;
	return { frame, material };
}

export default function ExploreCinematicScene() {
	const mountRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const mount = mountRef.current;
		if (!mount) return;

		let renderer: THREE.WebGLRenderer;
		try {
			renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
		} catch {
			mount.style.backgroundImage = `linear-gradient(90deg,#1b1c20 0%,rgba(27,28,32,.15) 100%),url('${FALLBACK_IMAGE}')`;
			mount.style.backgroundSize = "cover";
			mount.style.backgroundPosition = "right center";
			return;
		}

		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
		renderer.setClearColor(0x000000, 0);
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 0.96;
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		renderer.domElement.setAttribute("aria-hidden", "true");
		Object.assign(renderer.domElement.style, { display: "block", width: "100%", height: "100%", pointerEvents: "none" });
		mount.appendChild(renderer.domElement);

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
		camera.position.set(0, 2.35, 12.6);
		camera.lookAt(0, 0.75, -1.2);
		const room = new RoomEnvironment();
		const pmrem = new THREE.PMREMGenerator(renderer);
		const environment = pmrem.fromScene(room, 0.035);
		scene.environment = environment.texture;
		const stage = new THREE.Group();
		scene.add(stage);

		const ambient = new THREE.AmbientLight(0xffffff, 0.78);
		const key = new THREE.SpotLight(0xffbe8b, 72, 28, Math.PI / 3, 0.78, 1.2);
		key.position.set(-3.8, 6.8, 5.5);
		key.target.position.set(0, 0.7, -1.2);
		key.castShadow = true;
		key.shadow.mapSize.set(512, 512);
		key.shadow.bias = -0.0004;
		const rim = new THREE.PointLight(0x68c4ca, 35, 19);
		rim.position.set(3.6, 3.2, -3.7);
		stage.add(ambient, key, key.target, rim);

		const atmosphere = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), glowMaterial("#a45e55", 0.45));
		atmosphere.position.set(0, 1.3, -11.5);
		stage.add(atmosphere);
		const portals = Array.from({ length: 5 }, (_, index) => portal(index));
		portals.forEach(({ frame }) => stage.add(frame));
		const floorCanvas = document.createElement("canvas");
		floorCanvas.width = 128;
		floorCanvas.height = 128;
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
			new THREE.PlaneGeometry(7.4, 17),
			new THREE.MeshStandardMaterial({ color: "#171c23", metalness: 0.47, roughness: 0.52, alphaMap: floorAlpha, transparent: true, opacity: 0.6, depthWrite: false }),
		);
		floor.rotation.x = -Math.PI / 2;
		floor.position.set(0, -0.08, -3.45);
		floor.receiveShadow = true;
		stage.add(floor);
		const contactShadow = new THREE.Mesh(
			new THREE.PlaneGeometry(5.1, 2.45),
			new THREE.MeshBasicMaterial({ color: "#07080c", alphaMap: floorAlpha, transparent: true, opacity: 0, depthWrite: false }),
		);
		contactShadow.rotation.x = -Math.PI / 2;
		contactShadow.position.y = -0.045;
		stage.add(contactShadow);
		const railMaterial = new THREE.MeshBasicMaterial({ color: "#c98a68", transparent: true, opacity: 0.5, toneMapped: false });
		const coolRailMaterial = new THREE.MeshBasicMaterial({ color: "#6eb5b8", transparent: true, opacity: 0.48, toneMapped: false });
		for (const side of [-1, 1]) {
			const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.014, 16), side < 0 ? railMaterial : coolRailMaterial);
			rail.position.set(side * 2.9, -0.058, -3.5);
			stage.add(rail);
		}
		const segmentMaterial = new THREE.MeshBasicMaterial({ color: "#d9b58f", transparent: true, opacity: 0.45, toneMapped: false });
		for (let index = 0; index < 9; index += 1) {
			const segment = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.38), segmentMaterial);
			segment.position.set(0, -0.052, -8.3 + index * 1.36);
			stage.add(segment);
		}
		const dustCount = 75;
		const dustPositions = new Float32Array(dustCount * 3);
		const dustGeometry = new THREE.BufferGeometry();
		dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
		const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: "#dfb998", size: 0.045, transparent: true, opacity: 0.52, depthWrite: false, blending: THREE.AdditiveBlending }));
		stage.add(dust);

		const carPivot = new THREE.Group();
		stage.add(carPivot);
		const outlineMaterials: THREE.LineBasicMaterial[] = [];
		const outlines: THREE.EdgesGeometry[] = [];
		const solidMaterials = new Map<THREE.Material, number>();
		const wheels: THREE.Object3D[] = [];
		let disposed = false;
		let carLoaded = false;
		let arrivalStart = performance.now();
		const draco = new DRACOLoader();
		draco.setDecoderPath("/assets/3d/");
		const loader = new GLTFLoader();
		loader.setDRACOLoader(draco);
		loader.load(CAR_MODEL, (gltf) => {
			if (disposed) return;
			const model = gltf.scene;
			const bounds = new THREE.Box3().setFromObject(model);
			const size = bounds.getSize(new THREE.Vector3());
			const center = bounds.getCenter(new THREE.Vector3());
			const scale = 6.35 / Math.max(size.x, size.z);
			model.scale.setScalar(scale);
			model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
			const body = model.getObjectByName("body") as THREE.Mesh | undefined;
			if (body) body.material = new THREE.MeshPhysicalMaterial({ color: "#981629", metalness: 0.65, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.06 });
			for (const name of ["trim", "rim_fl", "rim_fr", "rim_rl", "rim_rr"]) {
				const mesh = model.getObjectByName(name) as THREE.Mesh | undefined;
				if (mesh) mesh.material = new THREE.MeshStandardMaterial({ color: "#535b62", metalness: 0.72, roughness: 0.32 });
			}
			const glass = model.getObjectByName("glass") as THREE.Mesh | undefined;
			if (glass) glass.material = new THREE.MeshPhysicalMaterial({ color: "#2a4149", metalness: 0.22, roughness: 0.16, transparent: true, opacity: 0.75 });
			for (const name of ["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"]) {
				const wheel = model.getObjectByName(name);
				if (wheel) wheels.push(wheel);
			}
			model.traverse((object) => {
				if (!(object instanceof THREE.Mesh)) return;
				object.castShadow = true;
				const materials = Array.isArray(object.material) ? object.material : [object.material];
				materials.forEach((material) => {
					if (!solidMaterials.has(material)) {
						solidMaterials.set(material, material.opacity);
						material.transparent = true;
					}
				});
			});
			for (const name of ["body", "glass", "rim_fl", "rim_fr", "rim_rl", "rim_rr"]) {
				const part = model.getObjectByName(name) as THREE.Mesh | undefined;
				if (!part) continue;
				const geometry = new THREE.EdgesGeometry(part.geometry, 30);
				const material = new THREE.LineBasicMaterial({ color: name === "body" ? "#8fe5dd" : "#d9af80", transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
				const outline = new THREE.LineSegments(geometry, material);
				outline.renderOrder = 30;
				part.add(outline);
				outlines.push(geometry);
				outlineMaterials.push(material);
			}
			carPivot.add(model);
			carLoaded = true;
			arrivalStart = performance.now();
			renderer.render(scene, camera);
		}, undefined, () => {
			if (!disposed) {
				mount.style.backgroundImage = `linear-gradient(90deg,#1b1c20 0%,rgba(27,28,32,.14) 100%),url('${FALLBACK_IMAGE}')`;
				mount.style.backgroundSize = "cover";
				mount.style.backgroundPosition = "right center";
			}
		});

		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		let compact = false;
		let mobile = false;
		const resize = () => {
			const width = mount.clientWidth;
			const height = mount.clientHeight;
			if (!width || !height) return;
			compact = width < 992;
			mobile = width < 680;
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			stage.scale.setScalar(mobile ? 0.4 : compact ? 0.67 : width < 1150 ? 0.83 : 1);
			stage.position.set(mobile ? 0 : compact ? 1.9 : 4.0, compact ? (mobile ? 2.83 : 2.9) : -0.35, 0);
			portals.forEach(({ frame }, index) => { frame.visible = !mobile || index < 3; });
			renderer.setSize(width, height, false);
			renderer.render(scene, camera);
		};
		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(mount);
		resize();

		let frame = 0;
		let visible = false;
		let lastDraw = 0;
		const render = (time: number) => {
			const seconds = reducedMotion ? 6 : Math.max(0, (time - arrivalStart) / 1000);
			const arrival = ease(seconds / 3.4);
			const solid = ease((seconds - 0.9) / 2.35);
			const trace = ease(seconds / 2.15) * (1 - ease((seconds - 2.1) / 1.25));
			if (carLoaded) {
				carPivot.position.set(-0.5 * (1 - arrival), -0.015, -5.0 + arrival * 5.55);
				contactShadow.position.z = carPivot.position.z;
				(contactShadow.material as THREE.MeshBasicMaterial).opacity = arrival * 0.43;
				carPivot.rotation.y = 2.18 + Math.sin(seconds * 0.27) * 0.13;
				solidMaterials.forEach((baseOpacity, material) => { material.opacity = baseOpacity * solid; });
				outlines.forEach((geometry, index) => {
					const count = geometry.getAttribute("position").count;
					geometry.setDrawRange(0, Math.floor(count * ease(seconds / 2.1) / 2) * 2);
					outlineMaterials[index].opacity = trace * 0.9;
				});
				wheels.forEach((wheel) => { wheel.rotation.x = arrival * 6.2; });
			}
			portals.forEach(({ frame: portalFrame, material }, index) => {
				const reveal = ease((seconds - index * 0.19) / 1.4);
				material.opacity = 0.08 + reveal * (0.25 + Math.sin(seconds * 0.75 - index * 0.7) * 0.035);
				portalFrame.position.z = -1.85 - index * 1.55 + Math.sin(seconds * 0.32 + index) * 0.035;
			});
			for (let index = 0; index < dustCount; index += 1) {
				const progress = (index * 0.618033 + seconds * (0.02 + index % 5 * 0.003)) % 1;
				dustPositions[index * 3] = Math.sin(index * 2.39) * (1.4 + index % 7 * 0.29);
				dustPositions[index * 3 + 1] = 0.45 + ((index * 0.173) % 1) * 3.7;
				dustPositions[index * 3 + 2] = -9 + progress * 10;
			}
			dustGeometry.attributes.position.needsUpdate = true;
			key.position.x = -3.8 + Math.sin(seconds * 0.52) * 2.15;
			rim.position.x = 3.6 + Math.cos(seconds * 0.42) * 0.7;
			segmentMaterial.opacity = 0.36 + Math.sin(seconds * 0.65) * 0.07;
			camera.position.x = Math.sin(seconds * 0.24) * 0.18;
			camera.lookAt(0, 0.75, -1.2);
			stage.position.y = (compact ? mobile ? 2.83 : 2.9 : -0.35) + Math.sin(seconds * 0.4) * 0.025;
			renderer.render(scene, camera);
		};
		const animate = (time: number) => {
			frame = window.requestAnimationFrame(animate);
			if (time - lastDraw < 32) return;
			lastDraw = time;
			render(time);
		};
		const update = () => {
			const shouldAnimate = visible && document.visibilityState === "visible" && !reducedMotion;
			if (shouldAnimate && !frame) frame = window.requestAnimationFrame(animate);
			if (!shouldAnimate && frame) { window.cancelAnimationFrame(frame); frame = 0; }
			if (reducedMotion && visible) render(arrivalStart + 6000);
		};
		const visibilityObserver = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
			visible = entries.some((entry) => entry.isIntersecting);
			update();
		}, { threshold: 0.01 }) : null;
		visibilityObserver?.observe(mount);
		if (!visibilityObserver) { visible = true; update(); }
		document.addEventListener("visibilitychange", update);

		return () => {
			disposed = true;
			window.cancelAnimationFrame(frame);
			visibilityObserver?.disconnect();
			resizeObserver.disconnect();
			document.removeEventListener("visibilitychange", update);
			const geometries = new Set<THREE.BufferGeometry>();
			const materials = new Set<THREE.Material>();
			scene.traverse((object) => {
				if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Points) {
					geometries.add(object.geometry);
					if (Array.isArray(object.material)) object.material.forEach((material) => materials.add(material));
					else materials.add(object.material);
				}
			});
			geometries.forEach((geometry) => geometry.dispose());
			materials.forEach((material) => material.dispose());
			draco.dispose();
			floorAlpha.dispose();
			environment.dispose();
			pmrem.dispose();
			room.dispose();
			renderer.dispose();
			if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
		};
	}, []);

	return (
		<div aria-hidden="true" style={{ position: "relative", width: "100%", height: "100%", minHeight: 360, overflow: "hidden", background: "radial-gradient(ellipse at 81% 55%, rgba(87,71,83,.26), transparent 59%)" }}>
			<div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
			<div className="explore-cinematic-shade" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(90deg,rgba(27,28,32,.98) 0%,rgba(27,28,32,.88) 30%,rgba(27,28,32,.39) 51%,rgba(27,28,32,.02) 100%)" }} />
			<style>{"@media(max-width:992px){.explore-cinematic-shade{background:linear-gradient(90deg,rgba(27,28,32,.88) 0%,rgba(27,28,32,.54) 54%,rgba(27,28,32,.12) 100%)!important}}@media(max-width:620px){.explore-cinematic-shade{background:linear-gradient(180deg,rgba(27,28,32,.04) 0%,rgba(27,28,32,.16) 29%,rgba(27,28,32,.88) 45%,rgba(27,28,32,.98) 100%)!important}}"}</style>
		</div>
	);
}
