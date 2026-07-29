/* ============================================================
   Modelo 3D "sci_fi_hud_quillvr.glb" — card "Hoy" de Trayectoria
   (pedido explícito, "entre el texto superior de la card y el texto de
   abajo, mismo criterio que las cards anteriores"). HUD sci-fi con
   anillos/círculos en materiales emisivos (cian, azul, naranja, rojo).
   ----------------------------------------------------------------
   Módulo ES aparte y autocontenido (mismo criterio que "tr-pcb.js"/
   "tr-arm.js"/"tr-planet.js"/"earth-hero.js"). Cero acoplamiento con
   script.js ni con el resto de las cards.

   MATERIALES: todos "KHR_materials_unlit" + "KHR_materials_emissive_strength"
   (confirmado inspeccionando el .glb a mano) — no hace falta NINGUNA
   luz, los colores brillan solos (pedido explícito, "no necesita luces
   para verse"). "NoToneMapping" en el renderer (mismo criterio que
   "tr-arm.js"/"tr-planet.js": ya se probó en otro modelo de este sitio
   que un emissive_strength alto + tone mapping cinemático quema el
   color y lo corre de tono).

   ANIMACIÓN: el clip incluido ("Action") tiene un solo canal y anima
   "CameraShakify.v2_Cameraup01_0_0" — un nodo de cámara del rig
   original de Sketchfab, no visible ni relevante acá (usamos nuestra
   propia cámara). Se lo deja reproduciendo igual, en loop, porque el
   pedido explícito es "reproducir el clip incluido" — no tiene efecto
   visible pero tampoco rompe nada. Como el HUD se vería inerte sin
   más, se agrega la rotación/pulso manual que sugiere el pedido
   (opcional, se decidió que sí hace falta): los nodos "Circlespeed*"
   giran continuo sobre su propio eje, los "Yoyo*" laten (escala
   oscilante) — mismo criterio de nombres que ya trae el archivo.

   PIVOTE: mismo caso que "tr-arm.js" — es un export "Fixed_T" (todos
   los nodos con transform identidad, cada mesh con sus vértices ya
   con la posición final horneada adentro). Girar/escalar un nodo así
   tal cual lo haría alrededor del ORIGEN DEL MUNDO, no de su propio
   centro — cada anillo se re-envuelve en un grupo pivote ubicado en el
   centro de SU bounding box antes de animarlo (ver "wrapWithPivotCenter()").
   ============================================================ */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const GLB_URL = "recursos/glb/sci_fi_hud_quillvr.glb";

// Velocidad base de giro de los anillos "Circlespeed*" (rad/s) y
// amplitud/velocidad del latido de los "Yoyo*" — constantes chicas,
// pensadas para un movimiento sutil ("vivo" pero no distractivo).
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
    return; // sin WebGL disponible: el resto de la card sigue intacta
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  // Verificado (pedido explícito): NO se usa la cámara embebida del
  // .glb ("CameraShakify.v2_Cameraup01", el mismo nodo que anima el
  // clip "Action" — ver comentario grande arriba) — el .glb ni siquiera
  // se cargó con "gltf.cameras" en ningún lado de este archivo. Esta es
  // una "THREE.PerspectiveCamera" nueva, propia, encuadrada a mano en
  // "frameCamera()" más abajo.
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 100);

  // Sin luces (pedido explícito): materiales unlit + emissive, brillan
  // solos.
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
    // FIX (encontrado a mano probando): el bounding box del modelo
    // COMPLETO queda deformado por un par de piezas sueltas — un mesh
    // decorativo ("Hexagon", adentro de "Graphic-elts_35") con una
    // extensión gigante fuera de escala (Y hasta -93 cuando el resto
    // del HUD vive entre -27 y -18) y unas etiquetas de texto en un
    // espacio de coordenadas totalmente distinto — encuadrar contra
    // ESE box dejaba el HUD real como una franja chica en una esquina.
    // "Circlesbaked_30" es el nodo que agrupa los 4 clusters de
    // anillos reales (los "círculos/anillos" que pide mostrar) — se
    // usa ESE bounding box para centrar/encuadrar la cámara (con fallback
    // al modelo completo si por algún motivo no aparece con ese
    // nombre), sin sacar el resto de la geometría de la escena.
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
    // FIX (pedido explícito: "se ve recortada del lado derecho... en
    // ángulo acostado, en vez de una vista frontal completa"): la
    // dirección anterior, "(0.4, 0.35, 1)", tenía una componente en X
    // — nada la compensaba del otro lado, así que la cámara quedaba
    // corrida hacia un costado (el HUD es un disco bastante ANCHO y
    // CHATO, x:34/y:2.9/z:19.5 medido — con esa asimetría alcanzaba
    // para recortar el panel de barras del lado derecho). "dx:0" centra
    // la cámara en el eje X (sin sesgo a ningún costado) — la elevación
    // en Y (0.6) alcanza para que se note que es un modelo 3D con
    // profundidad real, no una vista cenital plana, sin llegar a un
    // ángulo tan bajo/acostado como el anterior.
    const dir = new THREE.Vector3(0, 0.6, 1).normalize();
    camera.position.copy(dir.multiplyScalar(fitDist));
    camera.lookAt(0, 0, 0);
    // FIX (encontrado a mano probando): "near/far" fijos (0.05/100) del
    // constructor asumían una escala parecida a la del PCB/brazo —
    // este modelo viene mucho más grande (maxDim ~75) y "fitDist"
    // terminaba MÁS ALLÁ del plano "far", así que la cámara recortaba
    // el modelo entero (canvas vacío, sin ningún error en consola).
    // Se recalculan los dos en función de "fitDist" real, así funciona
    // sea cual sea la escala del .glb.
    camera.near = Math.max(0.01, fitDist * 0.01);
    camera.far = fitDist * 10;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.update();
  }

  function render() {
    renderer.render(scene, camera);
  }

  // Envuelve "node" en un grupo pivote ubicado en el CENTRO de su
  // bounding box (a diferencia de "tr-arm.js", que usa el punto
  // superior — ahí hacía falta para articular una bisagra; acá cada
  // anillo tiene que girar/pulsar sobre su propio centro). Ver
  // comentario grande arriba sobre el export "Fixed_T".
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

  // Recorre el modelo y separa los nodos "Circlespeed*"/"CircleSpeed*"
  // (giro continuo) de los "Yoyo*" (latido/pulso) por nombre — mismo
  // criterio de nombres que ya trae el archivo, sin coordenadas a
  // mano. Cada uno se envuelve en su propio pivote antes de guardarlo.
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
      // Dirección alternada + variación chica de velocidad por índice
      // (pedido explícito "que el HUD se sienta más vivo" — todos
      // girando igual se vería mecánico/repetitivo).
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

        // Clip incluido en loop (pedido explícito) — ver comentario
        // grande arriba: no tiene efecto visible (anima un nodo de
        // cámara del rig original, no una parte del HUD), pero se deja
        // reproduciendo igual.
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

  // Carga diferida + pausa de mixer/render loop fuera de viewport
  // (pedido explícito) — "root: #trCards" (mismo criterio que
  // "tr-pcb.js"/"tr-arm.js"/"tr-planet.js": la "ventana" fija donde
  // se recortan las cards que ciclan, no el viewport de la página).
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
