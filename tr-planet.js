
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { TexturePass } from "three/examples/jsm/postprocessing/TexturePass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

const EARTH_TEXTURE_URL = "recursos/imagenes/earth_specular_2048.jpg";
const IS_SMALL_SCREEN = window.matchMedia("(max-width: 900px)").matches;

const THEME = {
  core: [
    new THREE.Color(0.1, 0.0, 0.0),
    new THREE.Color(0.9, 0.05, 0.0),
    new THREE.Color(1.0, 0.4, 0.0),
    new THREE.Color(1.0, 0.9, 0.2),
  ],
  vein: {
    surface: new THREE.Color(0.0, 0.8, 1.0),
    coreA: new THREE.Color(0.8, 0.1, 0.0),
    coreB: new THREE.Color(1.0, 0.6, 0.0),
  },
  boundary: new THREE.Color(0.0, 1.5, 3.0),
  volcano: new THREE.Color(0xff5500),
  dust: new THREE.Color(0x223355),
  bg: new THREE.Color(0x010102),
};

const CORE_RADIUS = 2.2;
const OUTER_RADIUS = 10.0;
const NUM_VEINS = IS_SMALL_SCREEN ? 500 : 1200;
const POINTS_PER_VEIN = 45;

const snoise3GLSL = `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }
`;

function getPointOnSphere(radius) {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );
}

function init() {
  const container = document.querySelector(".tr__planet");
  const canvas = document.querySelector(".tr__planet-canvas");
  const loaderEl = document.getElementById("trPlanetLoader");
  if (!container || !canvas) return;

  let mounted = false;
  let sectionVisible = false;
  let rafId = null;
  let renderer, composer, camera, controls, clock;
  let startLoopImpl = null;

  function mountEffect() {
    if (mounted) return;
    mounted = true;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,

        alpha: true,
        powerPreference: "low-power",
      });
    } catch (err) {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_SMALL_SCREEN ? 1 : 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(THEME.bg.getHex(), 0.012);

    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(15, 10, 25);

    const sceneRT = new THREE.WebGLRenderTarget(1, 1, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });
    const texturePass = new TexturePass(sceneRT.texture);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), IS_SMALL_SCREEN ? 0.035 : 0.05, 0.25, 0.82);

    const alphaFixPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        tOriginal: { value: sceneRT.texture },
      },
      vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
      fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform sampler2D tOriginal;
                varying vec2 vUv;
                void main() {
                    vec3 bloomedColor = texture2D(tDiffuse, vUv).rgb;
                    float sceneAlpha = texture2D(tOriginal, vUv).a;
                    gl_FragColor = vec4(bloomedColor, sceneAlpha);
                }
            `,
    });

    composer = new EffectComposer(renderer);
    composer.addPass(texturePass);
    composer.addPass(bloomPass);
    composer.addPass(alphaFixPass);

    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.maxDistance = 50;
    controls.minDistance = 12;

    controls.enableZoom = false;
    controls.enablePan = false;

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    const textureLoader = new THREE.TextureLoader();

    const uniforms = {
      time: { value: 0 },
      cDark: { value: THEME.core[0].clone() },
      cRed: { value: THEME.core[1].clone() },
      cOrange: { value: THEME.core[2].clone() },
      cYellow: { value: THEME.core[3].clone() },
      cSurface: { value: THEME.vein.surface.clone() },
      cCoreA: { value: THEME.vein.coreA.clone() },
      cCoreB: { value: THEME.vein.coreB.clone() },
      boundaryColor: { value: THEME.boundary.clone() },
      tEarth: { value: null },
    };

    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = [];
    for (let i = 0; i < 2000; i++) {
      dustPositions.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
    }
    dustGeo.setAttribute("position", new THREE.Float32BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: THEME.dust.clone(),
      size: 0.1,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });
    const dustMesh = new THREE.Points(dustGeo, dustMat);
    scene.add(dustMesh);

    const coreGeo = new THREE.SphereGeometry(CORE_RADIUS, 128, 128);
    const coreMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
                uniform float time;
                varying vec3 vPosition;
                varying vec3 vNormal;
                ${snoise3GLSL}
                void main() {
                    vPosition = position;
                    vNormal = normal;
                    float displacement = snoise(position * 1.8 + time * 0.4) * 0.15;
                    vec3 newPosition = position + normal * displacement;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
      fragmentShader: `
                uniform float time;
                uniform vec3 cDark;
                uniform vec3 cRed;
                uniform vec3 cOrange;
                uniform vec3 cYellow;
                varying vec3 vPosition;
                varying vec3 vNormal;
                ${snoise3GLSL}
                void main() {
                    float n1 = snoise(vPosition * 1.5 - time * 0.5);
                    float n2 = snoise(vPosition * 4.0 + time * 0.3);
                    float noiseVal = n1 * 0.6 + n2 * 0.4;
                    vec3 color;
                    if (noiseVal < -0.1) {
                        color = mix(cDark, cRed, smoothstep(-0.5, -0.1, noiseVal));
                    } else if (noiseVal < 0.3) {
                        color = mix(cRed, cOrange, smoothstep(-0.1, 0.3, noiseVal));
                    } else {
                        color = mix(cOrange, cYellow, smoothstep(0.3, 0.8, noiseVal));
                    }
                    float fresnel = dot(vNormal, vec3(0.0, 0.0, 1.0));
                    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
                    color += cOrange * pow(fresnel, 2.0) * 0.8;
                    color *= 1.5;
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    mainGroup.add(coreMesh);

    const volcanoPoints = [];
    for (let i = 0; i < 150; i++) {
      volcanoPoints.push(getPointOnSphere(OUTER_RADIUS));
    }

    const veinPositions = [];
    const veinProgress = [];
    const veinOffsets = [];
    const veinRands = [];

    for (let i = 0; i < NUM_VEINS; i++) {
      const start = getPointOnSphere(OUTER_RADIUS);
      const end = start.clone().normalize().multiplyScalar(CORE_RADIUS * 0.85);
      const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
      mid.normalize().multiplyScalar(OUTER_RADIUS * 0.55);
      const tangent = new THREE.Vector3().crossVectors(start, new THREE.Vector3(0, 1, 0)).normalize();
      const bitangent = new THREE.Vector3().crossVectors(start, tangent).normalize();
      mid.add(tangent.multiplyScalar((Math.random() - 0.5) * 6));
      mid.add(bitangent.multiplyScalar((Math.random() - 0.5) * 6));

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(POINTS_PER_VEIN);
      const offset = Math.random();
      const randSeed = Math.random();

      for (let j = 0; j < POINTS_PER_VEIN; j++) {
        veinPositions.push(points[j].x, points[j].y, points[j].z);
        veinPositions.push(points[j + 1].x, points[j + 1].y, points[j + 1].z);
        veinProgress.push(j / POINTS_PER_VEIN, (j + 1) / POINTS_PER_VEIN);
        veinOffsets.push(offset, offset);
        veinRands.push(randSeed, randSeed);
      }
    }

    const veinGeo = new THREE.BufferGeometry();
    veinGeo.setAttribute("position", new THREE.Float32BufferAttribute(veinPositions, 3));
    veinGeo.setAttribute("progress", new THREE.Float32BufferAttribute(veinProgress, 1));
    veinGeo.setAttribute("offset", new THREE.Float32BufferAttribute(veinOffsets, 1));
    veinGeo.setAttribute("randomSeed", new THREE.Float32BufferAttribute(veinRands, 1));

    const veinMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
                attribute float progress;
                attribute float offset;
                attribute float randomSeed;
                varying float vProgress;
                varying float vOffset;
                varying float vRandom;
                void main() {
                    vProgress = progress;
                    vOffset = offset;
                    vRandom = randomSeed;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
      fragmentShader: `
                uniform float time;
                uniform vec3 cSurface;
                uniform vec3 cCoreA;
                uniform vec3 cCoreB;
                varying float vProgress;
                varying float vOffset;
                varying float vRandom;
                void main() {
                    vec3 targetCoreColor = mix(cCoreA, cCoreB, vRandom);
                    vec3 color = mix(cSurface, targetCoreColor, pow(vProgress, 1.5));
                    float speed = 0.3;
                    float phase = vProgress - time * speed + vOffset * 10.0;
                    float flow = fract(phase);
                    float pulse = exp(-flow * 10.0);
                    vec3 pulseGlow = color * pulse * 10.0;
                    color += pulseGlow;
                    float alphaBase = 0.02;
                    float alphaPulse = pulse * 0.9;
                    float alpha = alphaBase + alphaPulse;
                    alpha *= smoothstep(0.0, 0.05, vProgress) * smoothstep(1.0, 0.8, vProgress);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const veinMesh = new THREE.LineSegments(veinGeo, veinMat);
    mainGroup.add(veinMesh);

    const earthGlobeGeo = new THREE.SphereGeometry(OUTER_RADIUS * 0.995, 128, 128);
    const earthGlobeMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
      fragmentShader: `
                uniform sampler2D tEarth;
                uniform vec3 boundaryColor;
                varying vec2 vUv;
                varying vec3 vNormal;
                void main() {
                    vec2 texel = vec2(1.5 / 2048.0, 1.5 / 1024.0);
                    float c = texture2D(tEarth, vUv).r;
                    float r = texture2D(tEarth, vUv + vec2(texel.x, 0.0)).r;
                    float u = texture2D(tEarth, vUv + vec2(0.0, texel.y)).r;
                    float l = texture2D(tEarth, vUv + vec2(-texel.x, 0.0)).r;
                    float d = texture2D(tEarth, vUv + vec2(0.0, -texel.y)).r;
                    float edge = abs(4.0 * c - r - u - l - d);
                    float outline = smoothstep(0.1, 0.8, edge);
                    vec3 color = boundaryColor * outline;
                    color *= 2.5;
                    float fresnel = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
                    color += boundaryColor * fresnel * 0.5;
                    float alpha = outline * 0.8 + fresnel * 0.2;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const earthGlobeMesh = new THREE.Mesh(earthGlobeGeo, earthGlobeMat);
    mainGroup.add(earthGlobeMesh);

    const volcanoGeo = new THREE.BufferGeometry().setFromPoints(volcanoPoints);
    const volcanoMat = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: THEME.volcano.clone() },
        size: { value: 7.0 * Math.min(window.devicePixelRatio || 1, 2) },
        time: uniforms.time,
      },
      vertexShader: `
                uniform float size;
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (20.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
      fragmentShader: `
                uniform vec3 color;
                uniform float time;
                void main() {
                    vec2 pt = gl_PointCoord - vec2(0.5);
                    if(abs(pt.x) > 0.35 || abs(pt.y) > 0.35) discard;
                    float throb = sin(time * 3.0 + gl_FragCoord.x) * 0.5 + 0.5;
                    gl_FragColor = vec4(color * (1.5 + throb), 0.9);
                }
            `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const volcanoMesh = new THREE.Points(volcanoGeo, volcanoMat);
    mainGroup.add(volcanoMesh);

    renderer.setClearColor(scene.fog.color, 0);

    function resize() {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      sceneRT.setSize(width, height);
      composer.setSize(width, height);
      bloomPass.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    function renderFrame() {
      renderer.setRenderTarget(sceneRT);
      renderer.setClearColor(scene.fog.color, 0);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      composer.render();
    }

    clock = new THREE.Clock();
    function tick() {
      rafId = requestAnimationFrame(tick);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      uniforms.time.value = elapsedTime;
      dustMesh.rotation.y += 0.02 * delta;
      controls.update();
      renderFrame();
    }

    textureLoader.load(
      EARTH_TEXTURE_URL,
      (tex) => {
        uniforms.tEarth.value = tex;
        canvas.classList.add("is-ready");
        if (loaderEl) loaderEl.classList.add("is-hidden");
        if (sectionVisible) startLoop();
        else renderFrame();
      },
      undefined,
      () => {

        canvas.classList.add("is-ready");
        if (loaderEl) loaderEl.classList.add("is-hidden");
        if (sectionVisible) startLoop();
        else renderFrame();
      }
    );

    startLoopImpl = function startLoopInner() {
      if (rafId !== null) return;
      clock.getDelta();
      rafId = requestAnimationFrame(tick);
    };
  }

  function startLoop() {
    if (startLoopImpl) startLoopImpl();
  }
  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  const cardsWindow = document.getElementById("trCards");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        sectionVisible = entry.isIntersecting;
        if (sectionVisible) {
          if (!mounted) mountEffect();
          else startLoop();
        } else {
          stopLoop();
        }
      });
    },
    { root: cardsWindow, rootMargin: "300px" }
  );
  io.observe(container);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
