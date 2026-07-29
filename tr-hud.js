
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const GLB_URL = "recursos/glb/sci_fi_hud_quillvr.glb";

const SPIN_BASE_SPEED = 0.35;
const PULSE_SPEED = 1.6;
const PULSE_AMPLITUDE = 0.06;

function init() {
  const container = document.querySelector(".tr__hud");
  const canvas = document.querySelector(".tr__hud-canvas");
  const loaderEl = document.getElementById("trHudLoader");
  if (!container || !canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch (err) {
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 100);

  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.6;

  let hud = null;
  let mixer = null;
  let width = 0;
  let height = 0;
  const spinGroups = [];
  const pulseGroups = [];

  function resize() {
    const rect = container.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  }

  function frameCamera() {
    if (!hud) return;

    const fitTarget = hud.getObjectByName("Circlesbaked_30") || hud;
    const box = new THREE.Box3().setFromObject(fitTarget);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    hud.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const fov = (camera.fov * Math.PI) / 180;
    const fitDist = (maxDim / 2 / Math.tan(fov / 2)) * 1.15;

    const dir = new THREE.Vector3(0, 0.6, 1).normalize();
    camera.position.copy(dir.multiplyScalar(fitDist));
    camera.lookAt(0, 0, 0);

    camera.near = Math.max(0.01, fitDist * 0.01);
    camera.far = fitDist * 10;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.update();
  }

  function render() {
    renderer.render(scene, camera);
  }

  function wrapWithPivotCenter(node) {
    node.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(node);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const parent = node.parent;
    const group = new THREE.Group();
    group.position.copy(center);
    parent.add(group);
    group.add(node);
    node.position.copy(center).multiplyScalar(-1);
    return group;
  }

  function buildRings() {
    const spinNodes = [];
    const pulseNodes = [];
    hud.traverse((node) => {
      const name = node.name || "";
      if (/^circlespeed/i.test(name)) spinNodes.push(node);
      else if (/^yoyo/i.test(name)) pulseNodes.push(node);
    });

    spinNodes.forEach((node, i) => {
      const group = wrapWithPivotCenter(node);

      const dir = i % 2 === 0 ? 1 : -1;
      const speed = SPIN_BASE_SPEED * (0.7 + ((i * 37) % 5) / 10) * dir;
      spinGroups.push({ group, speed });
    });

    pulseNodes.forEach((node, i) => {
      const group = wrapWithPivotCenter(node);
      const phase = (i * 1.7) % (Math.PI * 2);
      pulseGroups.push({ group, phase });
    });
  }

  let rafId = null;
  const clock = new THREE.Clock();
  function tick() {
    rafId = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.getElapsedTime();
    if (mixer) mixer.update(dt);
    spinGroups.forEach(({ group, speed }) => {
      group.rotation.z += dt * speed;
    });
    pulseGroups.forEach(({ group, phase }) => {
      const s = 1 + Math.sin(t * PULSE_SPEED + phase) * PULSE_AMPLITUDE;
      group.scale.setScalar(s);
    });
    controls.update();
    render();
  }
  function startLoop() {
    if (rafId !== null) return;
    clock.getDelta();
    rafId = requestAnimationFrame(tick);
  }
  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  let modelReady = false;
  let sectionVisible = false;
  let loadStarted = false;

  function loadModel() {
    if (loadStarted) return;
    loadStarted = true;
    if (loaderEl) loaderEl.classList.remove("is-hidden");

    const loader = new GLTFLoader();
    loader.load(
      GLB_URL,
      (gltf) => {
        hud = gltf.scene;
        scene.add(hud);
        hud.updateMatrixWorld(true);
        buildRings();
        frameCamera();

        if (gltf.animations && gltf.animations.length) {
          mixer = new THREE.AnimationMixer(hud);
          const action = mixer.clipAction(gltf.animations[0]);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
        }

        modelReady = true;
        canvas.classList.add("is-ready");
        if (loaderEl) loaderEl.classList.add("is-hidden");
        if (sectionVisible) startLoop();
        else render();
      },
      undefined,
      () => {
        if (loaderEl) loaderEl.classList.add("is-hidden");
      }
    );
  }

  resize();
  window.addEventListener("resize", () => {
    resize();
    frameCamera();
  });

  const cardsWindow = document.getElementById("trCards");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        sectionVisible = entry.isIntersecting;
        if (sectionVisible) {
          if (!modelReady) loadModel();
          else startLoop();
        } else {
          stopLoop();
        }
      });
    },
    { root: cardsWindow, rootMargin: "30% 0px" }
  );
  io.observe(container);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
