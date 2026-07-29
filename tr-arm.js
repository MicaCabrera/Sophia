/* ============================================================
   Modelo 3D "black_honey_robotic_arm" — card "De la idea a la
   producción" de Trayectoria (pedido explícito, "entre el texto
   superior de la card y el texto de abajo, igual que se hizo en la
   primera card con el PCB"). A diferencia de la PCB (".tr__pcb", ver
   "tr-pcb.js"), este modelo SÍ trae su propia animación (~8.3s, un solo
   clip llamado "Animation") — se reproduce con THREE.AnimationMixer en
   loop, sin ningún movimiento programado a mano.
   ----------------------------------------------------------------
   Módulo ES aparte y autocontenido (mismo criterio que "earth-hero.js"
   del Hero / "tr-pcb.js" de la card 1). Cero acoplamiento con
   script.js ni con el resto de las cards.

   ORIGEN DEL ASSET Y COMPRESIÓN (pedido explícito: "convertir a un
   único .glb con texturas embebidas antes de subirlo... optimizar
   texturas, los metallicRoughness en PNG (18-22MB) deberían
   convertirse a JPEG o reducirse de resolución"): el original
   ("black_honey_robotic_arm_gltf/scene.gltf" + "scene.bin" + carpeta
   "textures/", que se dejan intactos en el repo como fuente) pesaba
   90.8MB — casi todo en 8 texturas a 4096×4096 (dos sets
   baseColor/metallicRoughness/emissive/normal, uno por material). Se
   generó "robotic_arm.opt.glb" con "gltf-transform optimize"
   (texturas reescaladas a 1024px + recodificadas a WebP, geometría
   comprimida con meshopt, UN SOLO archivo con todo embebido — pedido
   explícito "simplifica el hosting, evita rutas rotas") → 1.43MB, 98%
   menos peso. Se verificó a mano que el clip de animación sigue
   intacto (mismos 180 canales antes/después) y que el resultado visual
   no cambió.
   ============================================================ */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const GLB_URL = "recursos/glb/black_honey_robotic_arm_gltf/robotic_arm.opt.glb";
// Cantidad de poses de la animación que se muestrean para encuadrar la
// cámara (pedido explícito: "probar que no se salga de cuadro en los
// extremos del recorrido del brazo") — más muestras = encuadre más
// preciso, 24 alcanza de sobra para un clip de ~8s sin trabarse.
const FRAME_FIT_SAMPLES = 24;

// FIX de orientación (pedido explícito: "se ve acostado/inclinado...
// la orientación del propio modelo al exportarse, no solo el ángulo de
// cámara"). Se inspeccionó a mano "scene.gltf" (el original, antes de
// comprimir): los 65 nodos de malla ("roboarm.001_low_0" en adelante)
// tienen TODOS, sin excepción, la MISMA rotación exacta — no es una
// pose real, es un residuo del pipeline de conversión
// ("fab-model-conversion") aplicado de forma pareja a cada parte, como
// si todo el modelo hubiera quedado "tumbado" de una vez. Como los 65
// comparten la rotación, alcanza con invertirla UNA vez en la raíz para
// cancelarla en las 65 a la vez — resultado verificado a mano contra
// varios puntos del clip completo (~8.3s): la base queda apoyada abajo
// y el cuerpo se levanta en vertical en vez de tirado de costado.
const ROOT_ORIENTATION_FIX = new THREE.Quaternion(
  -0.09587103873491287,
  0.9037415981292725,
  0.2807658016681671,
  0.3085941970348358
).invert();

function init() {
  const container = document.querySelector(".tr__arm");
  const canvas = document.querySelector(".tr__arm-canvas");
  const loaderEl = document.getElementById("trArmLoader");
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

  // Luces básicas (mismo criterio que "tr-pcb.js") — el material
  // "robot_base" trae "KHR_materials_emissive_strength" bastante alto;
  // ya se probó en otro modelo de este sitio que combinar eso con tone
  // mapping cinemático quema el color y lo corre de tono — por eso
  // "NoToneMapping" arriba, no es casualidad.
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2, 3, 2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcfe8ff, 0.45);
  fill.position.set(-2, -1, -2);
  scene.add(fill);

  // OrbitControls (pedido explícito: drag/swipe rotan la cámara, sin
  // zoom/pan). A diferencia de la PCB, ACÁ NO se pidió auto-rotación:
  // el modelo ya tiene su propio movimiento (el brazo animándose), un
  // giro de cámara automático encima sería redundante/distractivo. La
  // animación del brazo y la rotación manual de cámara son cosas
  // completamente independientes (pedido explícito) — ninguna de las
  // dos pausa ni afecta a la otra mientras la card está visible.
  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.6;

  let arm = null;
  let mixer = null;
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

  // Encuadra la cámara para que el brazo entre COMPLETO durante TODO
  // el ciclo de animación, no solo en su pose de reposo: se muestrea
  // el clip en "FRAME_FIT_SAMPLES" puntos, se calcula el bounding box
  // en cada uno y se unen todos ("unionBox") — la cámara se ubica para
  // que ese volumen total (el "barrido" completo del brazo) entre
  // entero. Al final se deja el mixer en t=0 para arrancar la
  // animación real desde el principio.
  function frameCameraAcrossClip(clip) {
    const unionBox = new THREE.Box3();
    for (let i = 0; i <= FRAME_FIT_SAMPLES; i++) {
      const t = (clip.duration * i) / FRAME_FIT_SAMPLES;
      mixer.setTime(t);
      arm.updateMatrixWorld(true);
      unionBox.union(new THREE.Box3().setFromObject(arm));
    }
    mixer.setTime(0);

    const size = new THREE.Vector3();
    unionBox.getSize(size);
    const center = new THREE.Vector3();
    unionBox.getCenter(center);
    arm.position.sub(center);

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
  const clock = new THREE.Clock();
  function tick() {
    rafId = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.1);
    if (mixer) mixer.update(dt);
    controls.update();
    render();
  }
  function startLoop() {
    if (rafId !== null) return;
    clock.getDelta(); // descarta el tiempo acumulado mientras estuvo pausado
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
        arm = gltf.scene;
        arm.quaternion.copy(ROOT_ORIENTATION_FIX);
        scene.add(arm);

        // Clip incluido en loop continuo (pedido explícito:
        // "THREE.AnimationMixer... THREE.LoopRepeat... no hace falta
        // programar movimiento manual").
        mixer = new THREE.AnimationMixer(arm);
        const clip = gltf.animations[0];
        if (clip) {
          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
          frameCameraAcrossClip(clip);
        }

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
  window.addEventListener("resize", resize);

  // Carga diferida + pausa de mixer/render loop fuera de viewport
  // (pedido explícito en ambos casos) — un solo observer cubre las dos
  // cosas, mismo criterio que "tr-pcb.js". "root: #trCards" (la
  // "ventana" fija donde se recortan las cards que ciclan, ver
  // ".tr__cards"/"overflow:hidden" en style.css y "updateTrack()" en
  // script.js) en vez del viewport default: esta card sigue existiendo
  // en el DOM (y geométricamente "en viewport") aunque el mazo ya la
  // haya scrolleado fuera de la ventana visible — sin esto, el render
  // loop seguiría corriendo de fondo mientras la card está tapada por
  // el "overflow:hidden", exactamente el gasto de más que pide evitar.
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
