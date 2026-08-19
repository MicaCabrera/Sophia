
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createNoise3D, createNoise4D } from "simplex-noise";

const PARTICLE_COUNT = 8000;
const SHAPE_SIZE = 3.2;
const HUE_MIN = 190;
const HUE_MAX = 210;

const CONFIG = {
  swarmDistanceFactor: 1.5,
  swirlFactor: 2.4,
  noiseFrequency: 0.45,
  noiseTimeScale: 0.05,
  noiseMaxStrength: 0.6,
  idleFlowStrength: 0.16,
  idleFlowSpeed: 0.18,
  particleSizeRange: [0.03, 0.08],
  morphSizeFactor: 0.5,
  morphBrightnessFactor: 0.6,
  positionLerp: 0.16,
  resumeIdleMs: 3500,
};

// Simple particle cloud: points distributed inside a sphere volume (denser
// toward the center). No specific figure is formed — the particles just
// drift/flow via the noise-driven movement in tick() below.
function generateField(count, size) {
  const points = new Float32Array(count * 3);
  const R = size * 0.85;
  for (let i = 0; i < count; i++) {
    const radius = R * Math.cbrt(Math.random());
    const costheta = Math.random() * 2 - 1;
    const theta = Math.acos(costheta);
    const phi = Math.random() * Math.PI * 2;
    const x = radius * Math.sin(theta) * Math.cos(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(theta);
    points[i * 3] = x;
    points[i * 3 + 1] = y;
    points[i * 3 + 2] = z;
  }
  return points;
}

const SHAPE_GENERATORS = [generateField, generateField, generateField];

// Mirrors the step-activation thresholds from initConsultingScroll() in script.js,
// where idx = Math.round(scaled) flips the active step at scaled = 0.5, 1.5, ...
// Remaps the linear 0..numSegments scroll progress so each shape finishes forming
// exactly when its step becomes active, instead of at the next whole number.
function remapProgress(scaled, numSegments) {
  const clamped = THREE.MathUtils.clamp(scaled, 0, numSegments);
  let mapped = 0;
  for (let s = 0; s < numSegments; s++) {
    const segStart = s === 0 ? 0 : s - 0.5;
    const segEnd = s + 0.5;
    const t = THREE.MathUtils.clamp((clamped - segStart) / (segEnd - segStart), 0, 1);
    mapped = s + t;
    if (clamped <= segEnd) break;
  }
  return mapped;
}

function createParticleTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.85)");
  gradient.addColorStop(0.7, "rgba(255,255,255,0.35)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

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
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 100);

  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.5;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;

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
    }, CONFIG.resumeIdleMs);
  });

  const noise3D = createNoise3D();
  const noise4D = createNoise4D();

  const shapePositions = SHAPE_GENERATORS.map((gen) => gen(PARTICLE_COUNT, SHAPE_SIZE));

  const tempVec = new THREE.Vector3();
  const sourceVec = new THREE.Vector3();
  const targetVec = new THREE.Vector3();
  const swarmVec = new THREE.Vector3();
  const noiseOffset = new THREE.Vector3();
  const flowVec = new THREE.Vector3();
  const flowVec2 = new THREE.Vector3();
  const bezPos = new THREE.Vector3();
  const swirlAxis = new THREE.Vector3();
  const currentVec = new THREE.Vector3();

  const swarmControls = [];
  for (let s = 0; s < shapePositions.length - 1; s++) {
    const src = shapePositions[s];
    const tgt = shapePositions[s + 1];
    const swarm = new Float32Array(PARTICLE_COUNT * 3);
    const centerOffset = SHAPE_SIZE * CONFIG.swarmDistanceFactor;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      sourceVec.fromArray(src, i3);
      targetVec.fromArray(tgt, i3);
      swarmVec.lerpVectors(sourceVec, targetVec, 0.5);
      const offsetDir = tempVec
        .set(
          noise3D(i * 0.05 + s * 50, 10, 10),
          noise3D(20, i * 0.05 + s * 50, 20),
          noise3D(30, 30, i * 0.05 + s * 50)
        )
        .normalize();
      const distFactor = sourceVec.distanceTo(targetVec) * 0.1 + centerOffset;
      const jitter = 0.5 + ((i * 37) % 100) / 100 * 0.8;
      swarmVec.addScaledVector(offsetDir, distFactor * jitter);
      swarm[i3] = swarmVec.x;
      swarm[i3 + 1] = swarmVec.y;
      swarm[i3 + 2] = swarmVec.z;
    }
    swarmControls.push(swarm);
  }

  const currentPositions = new Float32Array(shapePositions[0]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(currentPositions, 3));

  const sizes = new Float32Array(PARTICLE_COUNT);
  const opacities = new Float32Array(PARTICLE_COUNT);
  const effectStrengths = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    sizes[i] = THREE.MathUtils.randFloat(CONFIG.particleSizeRange[0], CONFIG.particleSizeRange[1]);
    opacities[i] = 0.95;
    effectStrengths[i] = 0.0;
  }
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("opacity", new THREE.BufferAttribute(opacities, 1));
  geometry.setAttribute("aEffectStrength", new THREE.BufferAttribute(effectStrengths, 1));

  const colors = new Float32Array(PARTICLE_COUNT * 3);
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  function paintColors(positionsArray) {
    const colorArr = geometry.attributes.color.array;
    const maxRadius = SHAPE_SIZE * 1.15;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      tempVec.fromArray(positionsArray, i3);
      const dist = tempVec.length();
      const hue = THREE.MathUtils.mapLinear(dist, 0, maxRadius, HUE_MIN, HUE_MAX);
      const noiseValue = (noise3D(tempVec.x * 0.25, tempVec.y * 0.25, tempVec.z * 0.25) + 1) * 0.5;
      let saturation = THREE.MathUtils.clamp(0.95 * (0.85 + noiseValue * 0.2), 0.85, 1.0);
      let lightness = THREE.MathUtils.clamp(0.4 * (0.75 + noiseValue * 0.5), 0.25, 0.55);
      if (noiseValue > 0.93) {
        saturation = 1.0;
        lightness = 0.22;
      }
      const color = new THREE.Color().setHSL(hue / 360, saturation, lightness);
      color.toArray(colorArr, i3);
    }
    geometry.attributes.color.needsUpdate = true;
  }
  paintColors(shapePositions[0]);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      pointTexture: { value: createParticleTexture() },
    },
    vertexShader: `
      attribute float size;
      attribute float opacity;
      attribute float aEffectStrength;
      varying vec3 vColor;
      varying float vOpacity;
      varying float vEffectStrength;

      void main() {
        vColor = color;
        vOpacity = opacity;
        vEffectStrength = aEffectStrength;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

        float sizeScale = 1.0 - vEffectStrength * ${CONFIG.morphSizeFactor.toFixed(2)};
        gl_PointSize = size * sizeScale * (480.0 / -mvPosition.z);

        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D pointTexture;
      varying vec3 vColor;
      varying float vOpacity;
      varying float vEffectStrength;

      void main() {
        float alpha = texture2D(pointTexture, gl_PointCoord).a;
        if (alpha < 0.05) discard;

        vec3 finalColor = vColor * (1.0 + vEffectStrength * ${CONFIG.morphBrightnessFactor.toFixed(2)});

        gl_FragColor = vec4(finalColor, alpha * vOpacity);
      }
    `,
    blending: THREE.NormalBlending,
    depthTest: true,
    depthWrite: false,
    transparent: true,
    vertexColors: true,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  const box = new THREE.Box3();
  shapePositions.forEach((arr) => {
    for (let i = 0; i < arr.length; i += 3) {
      tempVec.set(arr[i], arr[i + 1], arr[i + 2]);
      box.expandByPoint(tempVec);
    }
  });
  const boxSize = new THREE.Vector3();
  box.getSize(boxSize);
  const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z) || 1;
  const fov = (camera.fov * Math.PI) / 180;
  const fitDist = (maxDim / 2 / Math.tan(fov / 2)) * 1.8;
  const dir = new THREE.Vector3(0.55, 0.6, 0.75).normalize();
  camera.position.copy(dir.multiplyScalar(fitDist));
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);
  controls.update();

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

  function render() {
    renderer.render(scene, camera);
  }

  let currentP = 0;
  let lastColorSegment = -1;
  const numSegments = shapePositions.length - 1;

  let rafId = null;
  const clock = new THREE.Clock();

  function tick() {
    rafId = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.1);
    const elapsed = clock.getElapsedTime();

    const mappedP = remapProgress(currentP, numSegments);
    let sA = Math.floor(mappedP);
    if (sA > numSegments - 1) sA = numSegments - 1;
    if (sA < 0) sA = 0;
    const sB = sA + 1;
    const localT = THREE.MathUtils.clamp(mappedP - sA, 0, 1);

    if (sA !== lastColorSegment) {
      lastColorSegment = sA;
      paintColors(shapePositions[sA]);
    }

    const effectStrength = Math.sin(localT * Math.PI);
    const currentSwirl = effectStrength * CONFIG.swirlFactor * dt * 50;
    const currentNoise = effectStrength * CONFIG.noiseMaxStrength;
    const timeScaled = elapsed * CONFIG.idleFlowSpeed;
    const breathScale = 1 + Math.sin(elapsed * 0.5) * 0.02;

    const src = shapePositions[sA];
    const tgt = shapePositions[sB];
    const ctrl = swarmControls[sA];
    const invT = 1 - localT;
    const invT2 = invT * invT;
    const t2 = localT * localT;

    const positions = geometry.attributes.position.array;
    const effArr = geometry.attributes.aEffectStrength.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      sourceVec.fromArray(src, i3);
      targetVec.fromArray(tgt, i3);
      swarmVec.fromArray(ctrl, i3);

      bezPos.copy(sourceVec).multiplyScalar(invT2);
      bezPos.addScaledVector(swarmVec, 2 * invT * localT);
      bezPos.addScaledVector(targetVec, t2);

      if (currentSwirl > 0.0008) {
        tempVec.subVectors(bezPos, sourceVec);
        swirlAxis
          .set(
            noise3D(i * 0.02, elapsed * 0.1, 0),
            noise3D(0, i * 0.02, elapsed * 0.1 + 5),
            noise3D(elapsed * 0.1 + 10, 0, i * 0.02)
          )
          .normalize();
        tempVec.applyAxisAngle(swirlAxis, currentSwirl);
        bezPos.copy(sourceVec).add(tempVec);
      }

      if (currentNoise > 0.001) {
        const nt = elapsed * CONFIG.noiseTimeScale;
        noiseOffset.set(
          noise4D(bezPos.x * CONFIG.noiseFrequency, bezPos.y * CONFIG.noiseFrequency, bezPos.z * CONFIG.noiseFrequency, nt),
          noise4D(bezPos.x * CONFIG.noiseFrequency + 100, bezPos.y * CONFIG.noiseFrequency + 100, bezPos.z * CONFIG.noiseFrequency + 100, nt),
          noise4D(bezPos.x * CONFIG.noiseFrequency + 200, bezPos.y * CONFIG.noiseFrequency + 200, bezPos.z * CONFIG.noiseFrequency + 200, nt)
        );
        bezPos.addScaledVector(noiseOffset, currentNoise);
      }

      tempVec.copy(bezPos).multiplyScalar(breathScale);
      flowVec.set(
        noise4D(tempVec.x * 0.12, tempVec.y * 0.12, tempVec.z * 0.12, timeScaled),
        noise4D(tempVec.x * 0.12 + 10, tempVec.y * 0.12 + 10, tempVec.z * 0.12 + 10, timeScaled),
        noise4D(tempVec.x * 0.12 + 20, tempVec.y * 0.12 + 20, tempVec.z * 0.12 + 20, timeScaled)
      );
      flowVec2.set(
        noise4D(tempVec.x * 0.3 + 50, tempVec.y * 0.3 + 50, tempVec.z * 0.3 + 50, timeScaled * 1.7),
        noise4D(tempVec.x * 0.3 + 60, tempVec.y * 0.3 + 60, tempVec.z * 0.3 + 60, timeScaled * 1.7),
        noise4D(tempVec.x * 0.3 + 70, tempVec.y * 0.3 + 70, tempVec.z * 0.3 + 70, timeScaled * 1.7)
      );
      flowVec.addScaledVector(flowVec2, 0.3);
      tempVec.addScaledVector(flowVec, CONFIG.idleFlowStrength);

      currentVec.fromArray(positions, i3);
      currentVec.lerp(tempVec, CONFIG.positionLerp);
      positions[i3] = currentVec.x;
      positions[i3 + 1] = currentVec.y;
      positions[i3 + 2] = currentVec.z;

      effArr[i] = effectStrength;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aEffectStrength.needsUpdate = true;

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

  resize();
  window.addEventListener("resize", resize);

  canvas.classList.add("is-ready");
  if (loaderEl) loaderEl.classList.add("is-hidden");

  let sectionVisible = true;
  startLoop();

  return {
    setProgress(scaled) {
      currentP = scaled;
    },
    onVisible() {
      sectionVisible = true;
      startLoop();
    },
    onHidden() {
      sectionVisible = false;
      stopLoop();
    },
  };
}

function boot() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  if (isMobile || prefersReducedMotion) return;

  const container = document.querySelector(".consulting__particles");
  const canvas = document.querySelector(".consulting__particles-canvas");
  const loaderEl = document.getElementById("consultingParticlesLoader");
  const section = document.getElementById("consultoria");
  if (!container || !canvas) return;

  let scene = null;
  let lastScaled = 0;

  window.addEventListener("consultoria:progress", (e) => {
    lastScaled = e.detail.scaled;
    if (scene) scene.setProgress(lastScaled);
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!scene) {
            scene = initScene(container, canvas, loaderEl);
            if (scene) scene.setProgress(lastScaled);
          } else {
            scene.onVisible();
          }
        } else if (scene) {
          scene.onHidden();
        }
      });
    },
    { root: null, rootMargin: "300px" }
  );
  io.observe(section || container);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
