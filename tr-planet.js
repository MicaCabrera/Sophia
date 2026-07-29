/* ============================================================
   Efecto "Planet Interior Energy Flow" — card "Nace Sophia" de
   Trayectoria (pedido explícito, "entre el texto superior de la card
   y el texto de abajo, mismo criterio que las cards 1 y 2"). Núcleo
   planetario con venas de energía animadas, shaders GLSL propios +
   post-processing de bloom (UnrealBloomPass) — efecto autocontenido,
   adaptado del original en
   "recursos/glb/planet-interior-energy-flow-three-js (2)/.../src/index.html"
   (pensado para pantalla completa) a un canvas chico embebido en una
   card.
   ----------------------------------------------------------------
   Módulo ES aparte y autocontenido (mismo criterio que "tr-pcb.js"/
   "tr-arm.js"/"earth-hero.js"). Cero acoplamiento con script.js ni con
   el resto de las cards.

   ADAPTACIONES respecto del original (todas pedidos explícitos):
   1) Versión de Three.js: el efecto original traía SU PROPIO import
      map con three@0.170.0 aparte — un import map es único por
      página, así que cargar ese además del que ya usan
      "earth-hero.js"/"tr-pcb.js"/"tr-arm.js" (three@0.184.0) hubiera
      significado DOS instancias de Three.js corriendo a la vez. Acá
      se importa directo de "three"/"three/examples/jsm/..." — el
      MISMO import map ya declarado en <head> de index.html — sin
      import map propio. Se verificó a mano que la API que usa el
      efecto (ShaderMaterial, LineSegments, EffectComposer/
      UnrealBloomPass, OrbitControls) sigue igual en r184.
   2) Panel de temas ("#theme-panel", 3 paletas de color
      seleccionables): se sacó — pedido explícito "evaluar si se
      mantiene o se remueve... a 300px probablemente no entra bien". Se
      dejó fijo el primer tema ("Magma & Cyan") sin el sistema de lerp
      entre temas (con uno solo no hace falta animarlo).
   3. Textura remota (antes un raw.githubusercontent.com) bajada a
      "recursos/imagenes/earth_specular_2048.jpg" — más robusto que
      depender de un host externo en producción.
   4) Cámara/renderer/composer dimensionados contra el contenedor
      (~300px) en vez de "window.innerWidth/innerHeight".
   5) Rendimiento en pantallas chicas (pedido explícito): menos venas
      y "pixel ratio" tope más bajo por debajo de 900px (mismo corte
      "mobile" que ya usa el resto del sitio) — el bloom en sí ya es
      barato acá porque el canvas es chico (pocos píxeles a difuminar),
      lo que más pesa es la cantidad de geometría de las venas.
   6) Fondo transparente (pedido explícito, "no negro"): "UnrealBloomPass"
      de Three.js, cuando es el último pass de un "EffectComposer"
      (nuestro caso), escribe alpha=1 a TODA la pantalla sin importar
      el alpha real de la escena — es una limitación conocida del pass
      en sí (su "blendMaterial" interno compone el brillo con
      "AdditiveBlending" sobre un buffer de brillo que sale con
      "alpha" fijo en 1.0, ver su fuente en
      "examples/jsm/postprocessing/UnrealBloomPass.js"), no algo
      arreglable solo con "alpha:true" en el renderer. La solución:
      renderizar la escena una vez aparte, en un render target propio
      con su alpha real intacto ("sceneRT"), inyectarlo en la cadena
      del composer con "TexturePass", dejar que "UnrealBloomPass" haga
      lo suyo (su RGB final es correcto, solo el alpha no), y en un
      "ShaderPass" final propio recombinar: color = el RGB que salió
      del bloom, alpha = el de "sceneRT" (el real). Así el brillo del
      bloom se sigue viendo perfecto y el fondo, donde no hay
      geometría, queda transparente de verdad.
   ============================================================ */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { TexturePass } from "three/examples/jsm/postprocessing/TexturePass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

const EARTH_TEXTURE_URL = "recursos/imagenes/earth_specular_2048.jpg";
const IS_SMALL_SCREEN = window.matchMedia("(max-width: 900px)").matches;

// Tema único fijo ("Magma & Cyan", el primero del efecto original —
// ver adaptación #2 arriba).
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
        // Pedido explícito: fondo transparente (no negro/opaco) — así
        // se integra con el fondo oscuro de la card en vez de mostrar
        // un cuadrado propio, mismo criterio que ".tr__pcb"/".tr__arm".
        alpha: true,
        powerPreference: "low-power",
      });
    } catch (err) {
      return; // sin WebGL disponible: el resto de la card sigue intacta
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_SMALL_SCREEN ? 1 : 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(THEME.bg.getHex(), 0.012);

    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(15, 10, 25);

    // "sceneRT": la escena renderizada aparte, a mano, con su alpha
    // real intacto (ver adaptación #6 en el comentario grande de
    // arriba) — esto es lo que reemplaza a "RenderPass" dentro del
    // composer: en vez de que el composer renderice la escena por su
    // cuenta, se la inyecta ya renderizada vía "TexturePass".
    const sceneRT = new THREE.WebGLRenderTarget(1, 1, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });
    const texturePass = new TexturePass(sceneRT.texture);

    // FIX (encontrado a mano probando en el contenedor real): el efecto
    // original usa "strength:2.0" pensado para pantalla completa — a
    // ~300px el blur de "UnrealBloomPass" corre sobre una cadena de
    // mips de tamaño FIJO (no proporcional al canvas), así que a esta
    // resolución esos mismos mips cubren una fracción mucho más grande
    // del cuadro y el bloom termina "quemando" toda la escena a blanco
    // en vez de dar solo un halo alrededor del núcleo. Se bajó
    // strength/radius/threshold hasta que el resultado se lee igual
    // que el original (núcleo + venas visibles, con un glow sutil) en
    // vez de un blob blanco — pedido explícito, además, "reducir la
    // intensidad del bloom... en pantallas chicas".
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), IS_SMALL_SCREEN ? 0.035 : 0.05, 0.25, 0.82);

    // Recompone alpha real (ver adaptación #6): toma el RGB que salió
    // del bloom (correcto) y el alpha de "sceneRT" (el real, sin tocar
    // por el bloom).
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
    controls.autoRotate = true; // pedido explícito "mantener el OrbitControls que ya trae"
    controls.autoRotateSpeed = 0.8;
    controls.maxDistance = 50;
    controls.minDistance = 12;
    // Pedido explícito, consistencia con las otras dos cards.
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

    // Alpha 0 (no el color de fog): el fog en sí sigue funcionando
    // igual (los elementos lejanos se siguen desvaneciendo hacia ese
    // color), pero lo que se ve DETRÁS de todo (donde no hay geometría)
    // ahora es transparente en vez de un cuadrado sólido de ese color.
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

    // Renderiza la escena a mano en "sceneRT" (con su alpha real, ver
    // adaptación #6 arriba) y recién ahí corre el composer (que la lee
    // vía "texturePass" y le suma el bloom) — reemplaza los llamados
    // sueltos a "composer.render()".
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

    // La textura solo se usa para el contorno del globo exterior — el
    // resto del efecto (núcleo + venas) no depende de ella, así que se
    // arranca a rotar/animar apenas está lista (no hace falta esperarla
    // para mostrar "algo": en la práctica, siendo un archivo local de
    // ~220KB, la espera es imperceptible).
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
        // Sin la textura, el contorno del globo exterior no dibuja
        // nada (queda transparente) pero el núcleo + venas siguen
        // andando igual — no rompe el resto del efecto.
        canvas.classList.add("is-ready");
        if (loaderEl) loaderEl.classList.add("is-hidden");
        if (sectionVisible) startLoop();
        else renderFrame();
      }
    );

    startLoopImpl = function startLoopInner() {
      if (rafId !== null) return;
      clock.getDelta(); // descarta el tiempo acumulado mientras estuvo pausado
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

  // Carga diferida (pedido explícito: "montar el efecto solo cuando la
  // card entra en viewport") + pausa de render loop fuera de vista —
  // "root: #trCards" (la "ventana" fija donde se recortan las cards
  // que ciclan, ".tr__cards"/"overflow:hidden") en vez del viewport
  // default, mismo criterio que "tr-pcb.js"/"tr-arm.js": esta card
  // sigue existiendo en el DOM (y geométricamente "en viewport") aunque
  // el mazo ya la haya scrolleado fuera de la ventana visible.
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
    { root: cardsWindow, rootMargin: "30% 0px" }
  );
  io.observe(container);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
