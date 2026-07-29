/* ============================================================
   Modelo 3D "SM_PCB_Modern_06_Low.glb" — card "Quiénes somos" de
   Trayectoria (pedido explícito, "entre el bloque de texto y el texto
   que va debajo"). Versión LOW del asset (no High/Med) a propósito,
   pedido explícito "para no penalizar el peso de la página".
   ----------------------------------------------------------------
   Módulo ES aparte y autocontenido (mismo criterio que "earth-hero.js"
   del Hero): WebGL clásico, no WebGPU. Cero acoplamiento con script.js
   ni con el resto de las cards de Trayectoria — vive 100% adentro de
   ".tr__pcb" (ver index.html/style.css, card índice 0 nada más).

   COMPRESIÓN (pedido explícito, "comprimir con Draco/meshopt antes de
   subir a producción"): el .glb original pesaba 19.66MB, pero casi
   todo eso (~17.9MB) eran sus 3 texturas embebidas a 4096x4096 — para
   un canvas que se muestra a ~300x300px esa resolución no aporta nada
   visible, solo peso. Se generó "SM_PCB_Modern_06_Low.opt.glb" con
   "gltf-transform optimize" (texturas reescaladas a 1024px + recodificadas
   a WebP, geometría comprimida con meshopt — la geometría en sí ya era
   chica, meshopt ahí es casi simbólico) → 515KB, 97% menos peso, mismo
   resultado visual (comparado a mano, sin diferencia perceptible al
   tamaño real que se muestra en la card). El archivo ".glb" original
   se deja intacto en la carpeta (no se pisa) por si hace falta
   reprocesarlo con otros parámetros más adelante.
   ============================================================ */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const GLB_URL = "recursos/glb/PCB_Modern_06_GLB/SM_PCB_Modern_06_Low.opt.glb";
const AUTO_ROTATE_SPEED = 0.7; // "autoRotateSpeed bajo" (pedido explícito — default de OrbitControls es 2)
const RESUME_IDLE_MS = 3500; // "reanudar tras 3-4seg de inactividad" (pedido explícito)

function init() {
  const container = document.querySelector(".tr__pcb");
  const canvas = document.querySelector(".tr__pcb-canvas");
  const loaderEl = document.getElementById("trPcbLoader");
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
    return; // sin WebGL disponible: el resto de la card sigue intacta
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 100);

  // Luces básicas (pedido explícito, "ambiental + direccional") — el
  // material es PBR (metallic/roughness, ver .glb), no se lee bien con
  // solo la textura de color; una direccional de relleno tenue de
  // menor intensidad evita que la cara no iluminada quede negra al
  // rotar (sigue siendo un setup simple, 3 luces chicas, no un rig
  // elaborado).
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2, 3, 2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcfe8ff, 0.45);
  fill.position.set(-2, -1, -2);
  scene.add(fill);

  // OrbitControls (pedido explícito): drag de mouse + swipe touch
  // rotan la cámara; sin zoom/pan (pedido explícito
  // "enableZoom=false, enablePan=false") — este canvas vive chico,
  // adentro de una página con scroll normal, no tiene sentido que la
  // rueda del mouse o un gesto de pinch le hagan algo.
  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.6;
  controls.autoRotate = true;
  controls.autoRotateSpeed = AUTO_ROTATE_SPEED;

  // Pausa la auto-rotación mientras el usuario interactúa y la
  // reanuda recién después de un rato quieto (pedido explícito) — los
  // eventos "start"/"end" de OrbitControls cubren tanto drag de mouse
  // como touch por igual, sin código aparte para cada uno.
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

  // Centra la placa en su propio origen y ubica la cámara a la
  // distancia justa (según su FOV y la dimensión máxima real del
  // modelo) para que entre COMPLETA y centrada, sin recortarse —
  // ángulo 3/4 fijo (una PCB de frente/plana se ve como una línea):
  // se normaliza la dirección para que la distancia real a cámara sea
  // exactamente "fitDist" sea cual sea el ángulo elegido.
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
  let sectionVisible = false;
  let loadStarted = false;

  function loadModel() {
    if (loadStarted) return;
    loadStarted = true;

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder); // requerido por el .glb comprimido (EXT_meshopt_compression)
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
        // Falla de red/parseo: no rompe nada — el título y el párrafo
        // de la card siguen intactos, el modelo simplemente no
        // aparece (y el spinner se oculta para no quedar colgado).
        if (loaderEl) loaderEl.classList.add("is-hidden");
      }
    );
  }

  resize();
  window.addEventListener("resize", () => {
    resize();
    frameCamera();
  });

  // Carga diferida + gating del render loop (pedido explícito, "cargar
  // solo cuando la card entra en viewport" / "pausar auto-rotación y
  // render loop cuando la card sale del viewport") — un solo observer
  // cubre las dos cosas: dispara la carga la primera vez que entra, y
  // en cada cambio de visibilidad prende/apaga el loop de rAF.
  // "root: #trCards" (la "ventana" fija donde se recortan las cards
  // que ciclan, ".tr__cards"/"overflow:hidden") en vez del viewport
  // default: esta card sigue existiendo en el DOM (y geométricamente
  // "en viewport") aunque el mazo ya la haya scrolleado fuera de la
  // ventana visible — sin esto, el render loop seguiría corriendo de
  // fondo mientras la card está tapada por el "overflow:hidden".
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
