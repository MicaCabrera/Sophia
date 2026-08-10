
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const GLB_URL = "recursos/glb/PCB_Modern_06_GLB/SM_PCB_Modern_06_Low.opt.glb";
const AUTO_ROTATE_SPEED = 0.7;
const RESUME_IDLE_MS = 3500;

function initScene(container, canvas, loaderEl) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch (err) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 100);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2, 3, 2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcfe8ff, 0.45);
  fill.position.set(-2, -1, -2);
  scene.add(fill);

  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.6;
  controls.autoRotate = true;
  controls.autoRotateSpeed = AUTO_ROTATE_SPEED;

  let resumeTimer = null;
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
    if (resumeTimer) {
      clearTimeout(resumeTimer);
      resumeTimer = null;
    }
  });
  controls.addEventListener("end", () => {
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      controls.autoRotate = true;
      resumeTimer = null;
    }, RESUME_IDLE_MS);
  });

  let pcb = null;
  let width = 0;
  let height = 0;

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
    if (!pcb) return;
    const box = new THREE.Box3().setFromObject(pcb);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    pcb.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const fov = (camera.fov * Math.PI) / 180;
    const fitDist = (maxDim / 2 / Math.tan(fov / 2)) * 1.5;

    const dir = new THREE.Vector3(0.55, 0.6, 0.75).normalize();
    camera.position.copy(dir.multiplyScalar(fitDist));
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  }

  function render() {
    renderer.render(scene, camera);
  }

  let rafId = null;
  function tick() {
    rafId = requestAnimationFrame(tick);
    controls.update();
    render();
  }
  function startLoop() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(tick);
  }
  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  let modelReady = false;
  let sectionVisible = true;
  let loadStarted = false;

  function loadModel() {
    if (loadStarted) return;
    loadStarted = true;

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      GLB_URL,
      (gltf) => {
        pcb = gltf.scene;
        scene.add(pcb);
        frameCamera();

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

  loadModel();

  return {
    onVisible() {
      sectionVisible = true;
      if (!modelReady) loadModel();
      else startLoop();
    },
    onHidden() {
      sectionVisible = false;
      stopLoop();
    },
  };
}

function boot() {
  const container = document.querySelector(".tr__pcb");
  const canvas = document.querySelector(".tr__pcb-canvas");
  const loaderEl = document.getElementById("trPcbLoader");
  if (!container || !canvas) return;

  const cardsWindow = document.getElementById("trCards");
  let scene = null;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!scene) scene = initScene(container, canvas, loaderEl);
          else scene.onVisible();
        } else if (scene) {
          scene.onHidden();
        }
      });
    },
    { root: cardsWindow, rootMargin: "300px" }
  );
  io.observe(container);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
