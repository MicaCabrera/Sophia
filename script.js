/* ============ HERO — botón "Compartir" ============ */
document.addEventListener('DOMContentLoaded', () => {
  const shareBtn = document.getElementById('shareBtn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: document.title,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // El usuario canceló el share nativo: no hacemos nada más.
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        shareBtn.setAttribute('aria-label', '¡Link copiado!');
        setTimeout(() => shareBtn.setAttribute('aria-label', 'Compartir'), 2000);
      } catch (err) {
        // Silencioso: si tampoco hay clipboard, no rompemos nada.
      }
    }
  });
});

/* ============ FOOTER — año dinámico ============ */
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
});

let isOpen = false;
const expandedWidth = Math.min(window.innerWidth * 0.9, 210);
let tl;

function initMenu() {
  tl && tl.revert();
  tl = gsap.timeline({ paused: true })
    .set('.menu-overlay', { pointerEvents: 'auto' })
    .to('.island', { width: expandedWidth, duration: 0.6, ease: 'back.out(1.7)' }, 0)
    // FIX (bug reportado: "el logo queda dado vuelta/invertido" al abrir
    // el menú mobile) — tenía "rotation: 180" acá, así que terminaba
    // girado 180° (boca abajo) durante todo el tiempo que el menú
    // permanece abierto. Sin motivo funcional para que el logo de texto
    // rote: se saca por completo, queda solo el fade-in de opacidad —
    // así nunca se desvía de su orientación normal, en ningún punto de
    // la animación.
    .to('.island-logo', { opacity: 1, duration: 0.45, ease: 'back.out(1.7)' }, 0.1)
    .to('.bar-mid', { opacity: 0, duration: 0.15, ease: 'power2.in' }, 0)
    .to('.bar-top', { attr: { x1: 3, y1: 3, x2: 13, y2: 13 }, duration: 0.28, ease: 'power3.inOut' }, 0)
    .to('.bar-bot', { attr: { x1: 13, y1: 3, x2: 3, y2: 13 }, duration: 0.28, ease: 'power3.inOut' }, 0)
    .to('.menu-backdrop', { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
    .from('.menu-panel', { autoAlpha: 0, yPercent: -10, scale: 0.6, duration: 0.6, transformOrigin: 'top center', ease: 'back.out(1.7)' }, 0.1)
    // ".menu-brand" (logo Cadipel) se agrega acá aparte de ".menu-link"
    // (pedido explícito "sacarle hover y que no sea un link" le sacó esa
    // clase, ver index.html/style.css) para que la entrada en stagger del
    // menú lo siga incluyendo — sin esto quedaría visible de golpe, sin
    // fade-in, mientras el resto de las filas entran animadas.
    .from('.menu-link, .menu-brand', { opacity: 0, y: 6, duration: 0.3, ease: 'power2.out', stagger: 0.05 }, 0.2);
}
initMenu();

function toggleMenu() {
  isOpen = !isOpen;
  const btn = document.getElementById('menuToggle');
  btn.setAttribute('aria-expanded', isOpen);
  btn.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
  document.querySelectorAll('.menu-link').forEach(l => l.setAttribute('tabindex', isOpen ? '0' : '-1'));

  if (isOpen) {
    tl.timeScale(1).play();
  } else {
    tl.eventCallback('onReverseComplete', () => gsap.set('.menu-overlay', { pointerEvents: 'none' }));
    tl.timeScale(1).reverse();
  }
}

document.getElementById('menuToggle').addEventListener('click', toggleMenu);
document.querySelector('.menu-backdrop').addEventListener('click', () => { if (isOpen) toggleMenu(); });

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && isOpen) {
    toggleMenu();
    document.getElementById('menuToggle').focus();
  }
});

document.querySelector('.menu-overlay').addEventListener('keydown', e => {
  if (!isOpen || e.key !== 'Tab') return;
  const focusable = [...document.querySelectorAll('.menu-link[tabindex="0"]')];
  if (!focusable.length) return;
  const [first, last] = [focusable[0], focusable[focusable.length - 1]];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

// Cierra el menú si se agranda la ventana a un tamaño donde cambia el layout
window.addEventListener('resize', () => {
  if (isOpen) toggleMenu();
});

/* ============================================================
   NAV — Desktop 
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.dfy-nav');
  const toggle = document.getElementById('dfyNavToggle');
  const menuLabel = document.getElementById('dfyNavMenuLabel');
  const panel = document.getElementById('dfyNavPanel');
  const logo = document.querySelector('.dfy-nav__logo');
  if (!nav || !toggle || !menuLabel || !panel || typeof gsap === 'undefined') return;

  const dots = gsap.utils.toArray('.dfy-nav__dot', nav);
  if (dots.length < 5) return;

  // Estado cerrado: "quincunx" (dado-5) chico y compacto.
  const CLOSED = [
    { x: -6, y: -6, rotation: 0 },
    { x: 6, y: -6, rotation: 0 },
    { x: 0, y: 0, rotation: 0 },
    { x: -6, y: 6, rotation: 0 },
    { x: 6, y: 6, rotation: 0 },
  ];
  // Estado abierto: composición PROPIA de SophIA (no una réplica de la
  // figura de Dragonfly) — una X formada por los 5 cuadrados, mismo
  // lenguaje visual que ya usan las marcas del timeline de I+D+i. Los 4
  // brazos se trasladan a lo largo de las diagonales con una rotación
  // sutil (individual, no uniforme) para que se sienta mecánico; el
  // cuadrado central gira 45° y queda como un pequeño rombo marcando el
  // cruce — el único acento distinto del resto.
  const OPEN = [
    { x: -12, y: -12, rotation: -10 },
    { x: 12, y: -12, rotation: 10 },
    { x: 0, y: 0, rotation: 45 },
    { x: -12, y: 12, rotation: 10 },
    { x: 12, y: 12, rotation: -10 },
  ];

  dots.forEach((dot, i) => gsap.set(dot, CLOSED[i]));
  gsap.set(panel, { autoAlpha: 0, y: -14, clipPath: 'inset(0 0 100% 0)' });

  let isOpen = false;

  function setOpen(next) {
    if (next === isOpen) return;
    isOpen = next;

    toggle.setAttribute('aria-expanded', String(isOpen));
    menuLabel.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');

    const target = isOpen ? OPEN : CLOSED;
    dots.forEach((dot, i) => {
      gsap.killTweensOf(dot);
      gsap.to(dot, {
        x: target[i].x,
        y: target[i].y,
        rotation: target[i].rotation,
        scale: isOpen ? 1.1 : 1,
        duration: 0.5,
        ease: 'power3.inOut',
        delay: i * 0.035,
      });
    });

    gsap.killTweensOf(panel);
    if (isOpen) {
      gsap.fromTo(
        panel,
        { autoAlpha: 0, y: -14, clipPath: 'inset(0 0 100% 0)' },
        { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.55, ease: 'power3.out' }
      );
    } else {
      gsap.to(panel, { autoAlpha: 0, y: -14, clipPath: 'inset(0 0 100% 0)', duration: 0.4, ease: 'power3.inOut' });
    }
  }

  toggle.addEventListener('click', () => setOpen(!isOpen));
  menuLabel.addEventListener('click', () => setOpen(!isOpen));
  if (logo) logo.addEventListener('click', () => setOpen(false));

  panel.querySelectorAll('.dfy-nav__row').forEach((row) => {
    row.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('click', (e) => {
    if (isOpen && !nav.contains(e.target) && !panel.contains(e.target)) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (isOpen && e.key === 'Escape') {
      setOpen(false);
      toggle.focus();
    }
  });

  // Si el layout cambia de tamaño (ej. pasa a mobile), cierra el panel
  // para no dejarlo "abierto" atrás de la isla mobile.
  window.addEventListener('resize', () => {
    if (isOpen) setOpen(false);
  });
});

/* ============ NAV — scroll suave con GSAP (no CSS) ============ */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const targetId = link.getAttribute('href').slice(1);
  if (!targetId) return; // href="#" suelto (íconos sociales): se deja como está

  link.addEventListener('click', (e) => {
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return; // ancla todavía sin sección real: comportamiento nativo sin cambios

    e.preventDefault();
    if (isOpen && link.classList.contains('menu-link')) toggleMenu();

    gsap.to(window, {
      scrollTo: { y: targetEl, offsetY: 90, autoKill: true },
      duration: 1,
      ease: 'power2.inOut',
    });
  });
});

/* ============ HERO — entrada ============ */
document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const texts = document.querySelector('.hero__texts');

  if (!texts || prefersReducedMotion || typeof gsap === 'undefined') return;

  gsap.from(texts.children, { opacity: 0, y: 12, duration: 0.8, ease: 'power2.out', delay: 0.9, stagger: 0.1 });
});

/* ============================================================
   TRANSICIÓN ENTRE SECCIONES (GSAP ScrollTrigger) — pin + scale + fade
   ----------------------------------------------------------------
   Adaptado del patrón de referencia "Slides Pinning" de GSAP. No toca
   nada del Home (texto scramble, entrada, nav, island, side-nav): solo
   lo incluye como el primer panel de esta transición, tal cual está.

   Cómo se activa: cada panel (excepto el último) queda "pineado" en
   pantalla mientras el siguiente panel scrollea por encima; en ese
   tramo el panel de atrás se achica y se desvanece (dissolve). El
   Home participa como panel #1 → la primera transición es
   Home → Sección de prueba 2, tal como se pidió.

   Para sumar una sección real más adelante: solo hace falta que tenga
   la clase "test-section" (o agregarla a la lista de selectores de
   abajo) — no hay que tocar esta lógica.

   IMPORTANTE — orden de creación (bug fijo acá):
   El trigger de "Sección 03" usa start:'bottom bottom' + pinSpacing:
   false, así que su punto de disparo depende de la posición real de
   Sección 03 en el flujo del documento — la cual, a su vez, depende
   de que el pin largo de Capacidades (con su pin-spacer que reserva
   varias pantallas de alto) ya exista. Por eso esta función NO se
   autoejecuta acá: se define nada más, y recién se llama más abajo,
   al final del DOMContentLoaded que crea el pin de Capacidades — así
   se garantiza el orden correcto sin depender de que un refresh()
   posterior "corrija" una medición ya tomada de más temprano.
   ============================================================ */

/* Helper reutilizable (pedido explícito: "generalizar el mecanismo en
   vez de ir sección por sección a mano") — mismo patrón pin+scale+fade
   que ya venía probando su solidez a mano en Capacidades→Clarity y
   Productos→I+D+i: pinea SOLO el último tramo (un viewport) del panel
   saliente mientras el siguiente sube por detrás y lo tapa, con
   "pinSpacing:false" (no reserva espacio propio: el scroll que "gasta"
   este tramo es el mismo que ya recorre el siguiente panel entrando) +
   "scrub:true" (atado 1:1 al scroll, no a un tiempo). Se usa para TODAS
   las secciones salientes de acá en adelante, en vez de repetir el
   bloque a mano cada vez.

   "extraScroll": por defecto NO se cachea un valor fijo en el momento
   de crear el trigger — el "end" lee "window.innerHeight" EN VIVO
   dentro de su propia función, así un resize de ventana (que dispara
   ScrollTrigger.refresh(), ver más abajo) siempre mide el alto actual,
   nunca uno viejo. Mismo criterio ya usado por Capacidades→Clarity
   (que nunca cacheó nada) — a propósito NO el del mecanismo viejo de
   "fakeScrollRatio"/marginBottom cacheado que sí rompía el layout con
   un refresh() a mitad de pin (ver comentario grande de Productos más
   abajo). Queda como parámetro opcional por si algún caso puntual
   necesita un tramo de scroll distinto al default de un viewport.

   "id" propio por sección ("<id-de-la-sección>__pinFade") + se devuelve
   la instancia de ScrollTrigger creada (pedido explícito): así, código
   en OTRA parte del archivo que necesite resincronizar ESTE trigger en
   particular (ej. el acordeón "Explorar solución" de Productos, más
   abajo, cuando cambia el alto de "#s4-intro" en vivo) puede hacer
   "ScrollTrigger.getById('s4-intro__pinFade').refresh()" en vez de
   "ScrollTrigger.refresh()" global — evita recalcular TODOS los
   triggers de la página (Hero, Capacidades, I+D+i, Trayectoria...) por
   un cambio de alto que solo afecta a uno.

   "extraScroll" también acepta una FUNCIÓN (pedido explícito, colchón
   extra de scroll mientras el acordeón "Explorar solución" de Productos
   está abierto — ver "s4AccordionExtraScroll" más abajo): igual que
   "window.innerHeight" ya se leía en vivo dentro de este mismo closure,
   una función se vuelve a evaluar en cada "refresh()"/"trigger.refresh()"
   posterior, así el colchón puede crecer/volver a su valor normal sin
   recrear el ScrollTrigger. Los dos llamadores existentes (Capacidades,
   Productos) siguen pasando un número o nada — comportamiento idéntico,
   sin cambios para ellos. */
function addPinFadeTransition(sectionEl, { extraScroll } = {}) {
  if (!sectionEl) return null;
  const tl = gsap
    .timeline({
      scrollTrigger: {
        id: sectionEl.id ? sectionEl.id + '__pinFade' : undefined,
        trigger: sectionEl,
        start: 'bottom bottom',
        end: () => {
          const value = typeof extraScroll === 'function' ? extraScroll() : extraScroll;
          return '+=' + (value != null ? value : window.innerHeight);
        },
        pinSpacing: false,
        pin: true,
        scrub: true,
      },
    })
    .fromTo(sectionEl, { scale: 1, opacity: 1, pointerEvents: 'auto' }, { scale: 0.92, opacity: 0.55, duration: 0.9 })
    .to(sectionEl, { opacity: 0, pointerEvents: 'none', duration: 0.1 });
  return tl.scrollTrigger;
}

/* Colchón extra de scroll (pedido explícito, punto 2) mientras el
   acordeón "Explorar solución" de "#s4-intro" está abierto — mutable
   desde el bloque "S4 — PRODUCTOS" más abajo en este mismo archivo
   (variable de módulo, capturada por referencia en el closure de
   "end" de arriba, no por valor: por eso alcanza con reasignarla, sin
   tener que recrear el ScrollTrigger). Se declara ACÁ ARRIBA — antes
   de que "addPinFadeTransition(s4-intro, ...)" se llame más abajo — y
   antes también de que el bloque "S4" (que la reasigna al abrir/cerrar)
   se ejecute, así ninguno de los dos lados se queda con un valor
   "undefined".
     - "s4FilterExtraScroll": al filtrar a UN producto se ocultan todas
       las demás filas, así que "#s4-intro" se acorta mucho y el punto
       "bottom bottom" que dispara la transición de salida queda mucho
       más arriba en la página. Se activa apenas el filtro no es "all".
     - "s4AccordionExtraScroll": colchón adicional mientras el acordeón
       "Explorar solución" está además ABIERTO (se suma al de arriba). */
let s4FilterExtraScroll = 0;
let s4AccordionExtraScroll = 0;

function initSectionTransitions() {
  if (typeof ScrollTrigger === 'undefined') return;

  const hero = document.querySelector('.hero');
  // "Sección Claridad" (antes "#test-3") es scroll 100% nativo: sin pin,
  // sin scale, sin fade, sin superposición con lo que la rodea — por
  // eso no participa de este pin+scale+fade genérico. El Timeline
  // (id="idi-timeline") es el único "panel" real agregado a mano acá
  // abajo, solo para que "panels" tenga al menos 2 elementos (Home
  // sigue necesitando su propio scale+fade de salida, ver
  // "outgoingPanels" más abajo).
  //
  // Productos (id="s4-intro") NO se agrega a este array a propósito: se
  // probó (rompía la página) pinearlo con el mecanismo de ACÁ ABAJO
  // ("outgoingPanels") — pensado para paneles de altura FIJA, usa un
  // "fakeScrollRatio"/marginBottom calculado UNA sola vez al cargar.
  // Productos cambia de alto en vivo al filtrar; con esa altura vieja
  // cacheada, un ScrollTrigger.refresh() mientras Productos estaba
  // pineado (ej. al tocar un filtro en ese momento del scroll) dejaba
  // todo el layout corrompido. Su transición hacia I+D+i vive aparte,
  // más abajo, vía "addPinFadeTransition()" — ese helper nunca cachea
  // altura (lee todo en cada refresh), así que no tiene este problema.
  const otherPanels = [];
  const idiSection = document.getElementById('idi-timeline');
  if (idiSection) otherPanels.push(idiSection);
  const panels = hero ? [hero, ...otherPanels] : otherPanels;

  // Hace falta al menos 2 paneles para que exista una transición.
  if (panels.length < 2) return;

  // El último panel no se pinea: no hay nada todavía que lo cubra por
  // debajo (cuando se sume la siguiente sección real, va a dejar de
  // ser "el último" automáticamente y va a empezar a pinearse solo).
  const outgoingPanels = panels.slice(0, -1);

  outgoingPanels.forEach((panel) => {
    // Si el panel tiene contenido más alto que la pantalla (como la
    // Sección 2 del ejemplo original), esto compensa el "scroll extra"
    // necesario antes de pasar a la siguiente. Nuestros placeholders
    // entran en una pantalla, así que esto no hace nada por ahora.
    const innerPanel = panel.querySelector('.section-inner') || panel;
    const panelHeight = innerPanel.offsetHeight;
    const windowHeight = window.innerHeight;
    const difference = panelHeight - windowHeight;
    const fakeScrollRatio = difference > 0 ? difference / (difference + windowHeight) : 0;

    if (fakeScrollRatio) {
      panel.style.marginBottom = panelHeight * fakeScrollRatio + 'px';
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        start: 'bottom bottom',
        end: () => (fakeScrollRatio ? `+=${innerPanel.offsetHeight}` : 'bottom top'),
        pinSpacing: false,
        pin: true,
        scrub: true,
      },
    });

    if (fakeScrollRatio) {
      tl.to(innerPanel, {
        yPercent: -100,
        y: window.innerHeight,
        duration: 1 / (1 - fakeScrollRatio) - 1,
        ease: 'none',
      });
    }

    // pointerEvents:'none' al llegar a opacity:0 — opacity no saca al
    // elemento del hit-testing, así que sin esto un panel ya invisible
    // seguía "arriba" en el stacking (aunque no se viera) y tapaba los
    // clicks de lo que venga después mientras su caja siguiera
    // geométricamente dentro del viewport (pasa con paneles cortos
    // seguidos de contenido más alto que 1 pantalla, como Productos:
    // no le alcanza el scroll natural para que el panel corto termine
    // de salir de la caja del todo). Se vuelve a 'auto' en el fromTo
    // de arriba si el usuario scrollea para atrás.
    tl.fromTo(panel, { scale: 1, opacity: 1, pointerEvents: 'auto' }, { scale: 0.92, opacity: 0.55, duration: 0.9 }).to(panel, {
      opacity: 0,
      pointerEvents: 'none',
      duration: 0.1,
    });
  });

  /* --------------------------------------------------------------------
     Capacidades → Clarity → Productos → I+D+i: mismo efecto scale+fade+
     PIN en las cuatro salientes (pedido explícito: "generalizar el
     mecanismo en vez de ir sección por sección a mano"). Capacidades y
     Productos van vía "addPinFadeTransition()"; Clarity tiene su propio
     timeline a mano, un poco más abajo (mismo patrón base, con dos
     ajustes puntuales pedidos explícitamente solo para ella — dwell +
     fade de texto independiente — ver ese bloque). Ninguna cachea
     altura: "capsSection" (grilla que cambia de alto entre breakpoints
     de 3/2/1 columnas) y "s4Section" (Productos, cuyo alto cambia EN
     VIVO al aplicar filtros — ver comentario grande más abajo, "SECCIÓN
     'PRODUCTOS'") ya dependían de esto para no romperse.

     Productos → I+D+i estaba desactivada a propósito (scroll 100%
     nativo, sin pin) porque el mecanismo VIEJO de acá arriba
     (fakeScrollRatio/marginBottom cacheados, ver "outgoingPanels" más
     arriba) rompía el layout con un refresh() a mitad de pin si se
     tocaba un filtro en ese momento — el hack ".reveal-locked" en
     "#s4-intro" (antes en este archivo, ver el bloque IIFE que se
     eliminó) existía solo para tapar el fundido raro que esa
     desactivación a medias dejaba. "addPinFadeTransition()" no tiene
     ese problema (nunca cachea nada), así que se reactiva acá con el
     mismo patrón que ya probó su solidez en Capacidades.
  -------------------------------------------------------------------- */
  addPinFadeTransition(document.getElementById('s3-caps'));
  // "extraScroll" como función (pedido explícito, punto 2 — ver
  // "s4AccordionExtraScroll" arriba, cerca de "addPinFadeTransition()"):
  // normalmente da lo mismo que el default (un "window.innerHeight"),
  // pero mientras el acordeón "Explorar solución" está abierto suma el
  // colchón extra para que la transición hacia I+D+i no arranque antes
  // de que el usuario termine de leer el PDF.
  addPinFadeTransition(document.getElementById('s4-intro'), {
    extraScroll: () => window.innerHeight + s4FilterExtraScroll + s4AccordionExtraScroll,
  });

  /* Clarity → Productos: mismo patrón de "addPinFadeTransition()" pero
     con dos ajustes puntuales pedidos explícitamente SOLO para esta
     sección (no se tocó el helper — sigue igual para las otras dos de
     arriba). Por eso va aparte, con su propio timeline a mano en vez de
     llamar al helper.

     1) "dwell": un tramo quieto al principio (".to({}, {duration:0.4})"
        — un tween sin target real, solo ocupa tiempo en el timeline)
        antes de que arranque el scale/fade de salida, para dar más
        lugar a terminar de leer el título. El "end" del trigger se
        estira 1.6x (en vez de un viewport completo) para darle scroll
        real a ese tramo extra.

     2) El texto (".clarity-content") se apaga con SU PROPIO fade —
        más corto (0.3) que el de la sección (0.9) y SIN scale propio
        — arrancando en el mismo punto que el scale de la sección
        ("exitStart"). Buscamos un "filter:blur()" puntual sobre
        ".clarity-eyebrow"/".clarity-title" (pedido explícito) y no
        existe ninguno en este archivo ni en style.css: confirmado
        además en vivo, el "filter" computado de esos elementos da
        "none" en TODO el recorrido de salida. Lo que se percibe como
        desenfoque es el renderizado que hace el navegador al escalar
        texto chico vía "transform:scale()" (la sección entera se
        escala, y el texto — su hijo — hereda esa escala): no hay
        ningún filter que "sacar" del código, así que la solución real
        es que el texto ya esté invisible (su propia opacidad en 0)
        MUCHO antes de que la escala de la sección se vuelva
        perceptible — con "duration:0.3" contra el "duration:0.9" del
        scale, el texto termina de desvanecerse cuando la sección
        todavía escaló solo ~2-3%, así nunca llega a verse escalado. El
        scale+fade de la SECCIÓN sigue exactamente igual que en
        "addPinFadeTransition()" (pedido explícito "el fundido de
        sección está bien, dejalo").

     FIX sobre el pedido original (el ejemplo pedía "extraScroll*1.6"):
     probado a mano, 1.6x (1440px extra en un viewport de 900px) se comía
     el margen libre antes del propio trigger de salida de "#s4-intro"
     (Productos) — su "bottom bottom" ya arranca ~1049px después del
     final "natural" de Clarity (in extender), así que un tramo de 1.6x
     invadía ~390px DENTRO del rango de "addPinFadeTransition()" de
     Productos: a mitad del dwell/scale nuevo de Clarity, Productos ya
     estaba un ~30-40% escalado/desvanecido por su cuenta, aunque
     tapado por Clarity encima (confirmado leyendo su opacity/scale
     computados en cada scroll) — al llegar el turno de Productos ya no
     arrancaba "fresco". "1.1x" dejar un colchón real (~59px, medido)
     antes de ese trigger — no se tocó nada de "#s4-intro" ni de
     "addPinFadeTransition()" (pedido explícito), se ajustó solo este
     número acá. */
  const claritySection = document.getElementById('clarity');
  const clarityContent = claritySection ? claritySection.querySelector('.clarity-content') : null;
  if (claritySection) {
    gsap
      .timeline({
        scrollTrigger: {
          trigger: claritySection,
          start: 'bottom bottom',
          end: () => '+=' + window.innerHeight * 1.1,
          pinSpacing: false,
          pin: true,
          scrub: true,
        },
      })
      .to({}, { duration: 0.4 }) // dwell: la sección se queda quieta un rato antes de irse
      .addLabel('exitStart')
      .fromTo(claritySection, { scale: 1, opacity: 1, pointerEvents: 'auto' }, { scale: 0.92, opacity: 0.55, duration: 0.9 }, 'exitStart')
      .fromTo(clarityContent || claritySection, { opacity: 1 }, { opacity: 0, duration: 0.3 }, 'exitStart')
      .to(claritySection, { opacity: 0, pointerEvents: 'none', duration: 0.1 });
  }

  /* I+D+i → Trayectoria: NO se agrega acá. "#idi-timeline" ya tiene su
     PROPIO pin interno (la curva/nodos, ver "SCALE_FADE_VH" más abajo
     en este archivo) extendido con exactamente este mismo efecto
     scale+fade al final de su recorrido — mismo resultado visual, ya en
     producción y probado. Agregar acá un SEGUNDO ScrollTrigger con pin
     propio sobre un elemento que ya tiene uno activo es terreno no
     probado en este archivo (dos pines compitiendo por el mismo
     trigger) — pedido explícito, además, "no tocar el pin propio
     interno de #idi-timeline".

     Trayectoria → Contacto: a pedido explícito NO tiene ningún efecto
     de scroll (ni este ni ningún otro) — ver el pin del tren de cards
     de "#trayectoria", más abajo en este archivo: termina apenas las
     cards completan su recorrido, sin tramo de salida; el scroll hacia
     Contacto es 100% nativo. */

  // Recalcula las medidas si la ventana cambia de tamaño (los
  // placeholders no lo necesitan, pero es una salvaguarda barata).
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => ScrollTrigger.refresh(), 200);
  });
}

/* ============================================================
   SECCIÓN "CAPACIDADES" — grilla editorial premium
   ----------------------------------------------------------------
   Rediseño total (ver comentario en index.html y el bloque de CSS en
   style.css): reemplaza el viejo carrusel horizontal pineado por una
   grilla de 6 cards que entran en escena con scroll normal. Ya no hay
   pin propio, snap, ni gestos de swipe/wheel interceptados — el scroll
   de la página es 100% nativo a través de esta sección.

   Se agrega al final a propósito, igual que el viejo carrusel: así el
   sistema de transición (pin+scale+fade) de esta página, definido
   arriba, ya creó todos sus ScrollTrigger ANTES de que se llame acá
   abajo a ScrollTrigger.defaults(...) — por lo que ese defaults() no
   afecta ni modifica ninguno de los triggers ya existentes, solo
   aplica a los que crea este bloque (reveal/hover/tilt/parallax de las
   cards). Ambos sistemas quedan así totalmente independientes entre sí.
   ============================================================ */

/* ── Scroll reveal genérico ───────────────────────────────────────────
   Cualquier elemento con la clase "reveal-section" aparece con un
   fade + blur + leve desplazamiento hacia arriba a medida que entra en
   el viewport (y se revierte al salir, en cualquier dirección).

   FIX (bug real: blur negro asomando desde abajo durante el dwell de
   "#clarity"): Productos (#s4-intro) tenía esta clase, pero desde que
   existe la transición real Clarity→Productos (pin+scale+fade, ver
   "Clarity → Productos" en initSectionTransitions()) quedó en conflicto
   con ella — mientras Clarity todavía estaba pineada, la punta de
   arriba de Productos ya empezaba a asomar por abajo del viewport (el
   mecanismo "pinSpacing:false" deja que el siguiente panel avance en
   flujo normal por detrás) SIN haber cruzado todavía el 15% de
   intersección que le saca ".is-visible" — se veía, literalmente, su
   "filter:blur(12px)" por defecto asomando como una franja borrosa. Se
   le sacó la clase del HTML (index.html): su "entrada" ya la cubre de
   sobra la transición de Clarity, no hace falta una animación de
   revelado propia encima. El observer de acá abajo queda intacto (no
   se toca, sigue disponible para cualquier sección que use
   "reveal-section" en el futuro) — hoy no matchea ningún elemento.

   Usa IntersectionObserver en vez de ScrollTrigger a propósito: no
   depende de calcular distancias de scroll en píxeles, así que
   funciona igual de bien en secciones cortas o muy altas.
   El CSS (.reveal-section / .reveal-section.is-visible) define los
   estados inicial/final y la transición; acá solo togglear la clase.
   ──────────────────────────────────────────────────────────────────── */
(function () {
  const revealEls = document.querySelectorAll(".reveal-section");
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    },
    {
      // Se activa cuando ~15% del elemento es visible, y se desactiva
      // cuando baja de ese umbral (sirve tanto al entrar como al salir,
      // en cualquier dirección de scroll).
      threshold: 0.15,
    }
  );

  revealEls.forEach((el) => observer.observe(el));
})();

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText);
ScrollTrigger.defaults({ anticipatePin: 1, invalidateOnRefresh: true });

/* ============================================================================
   CAPACIDADES — grilla: reveal escalonado, hover, tilt de mouse, parallax
   ============================================================================ */
function initCapacidadesGrid() {
  const section = document.querySelector(".pa");
  const cards = gsap.utils.toArray(".pa__card");
  if (!section || !cards.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     1) ENTRADA — opacity 0→1 + translateY 80px→0 + blur 8px→0, con
     stagger progresivo (ScrollTrigger.batch: cada card dispara su propio
     reveal al cruzar el umbral, no hace falta que las 6 estén en
     pantalla a la vez).
  ------------------------------------------------------------------------ */
  if (prefersReducedMotion) {
    gsap.set(cards, { opacity: 1, y: 0, filter: "blur(0px)" });
  } else {
    gsap.set(cards, { opacity: 0, y: 80, filter: "blur(8px)" });

    ScrollTrigger.batch(cards, {
      start: "top 88%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.12,
        }),
    });
  }

  /* ------------------------------------------------------------------------
     2) VIDEOS — el autoplay inicial ya lo maneja el atributo HTML
     ("autoplay muted loop playsinline"); acá solo se pausan/retoman
     según visibilidad real en pantalla, para no tener 6 videos
     decodificando a la vez fuera de viewport (rendimiento/batería —
     el comportamiento visual de "autoplay + loop" no cambia).
  ------------------------------------------------------------------------ */
  const videos = gsap.utils.toArray(".pa__video", section);
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          const playPromise = video.play();
          if (playPromise !== undefined) playPromise.catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.15 }
  );
  videos.forEach((video) => videoObserver.observe(video));

  if (prefersReducedMotion) return;

  /* ------------------------------------------------------------------------
     3) PARALLAX — el video se desplaza levemente más lento que la card
     mientras se scrollea (scrub ligado al recorrido de cada card por el
     viewport, no al scroll global de la página).
  ------------------------------------------------------------------------ */
  cards.forEach((card) => {
    const video = card.querySelector(".pa__video");
    if (!video) return;
    gsap.fromTo(
      video,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: "none",
        scrollTrigger: {
          trigger: card,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  });

  /* ------------------------------------------------------------------------
     4) HOVER + TILT DE MOUSE — solo transform/opacity/color (sin
     reflow), easing Power4.out, nada brusco. El tilt usa gsap.quickTo
     (pensado para updates de alta frecuencia como mousemove) para que
     el seguimiento del cursor sea fluido a 60fps.
  ------------------------------------------------------------------------ */
  cards.forEach((card) => {
    const video = card.querySelector(".pa__video");
    const arrow = card.querySelector(".pa__card-arrow");

    const tiltX = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3.out" });
    const tiltY = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3.out" });

    card.addEventListener("mouseenter", () => {
      gsap.to(card, {
        y: -8,
        scale: 1.015,
        borderColor: "rgba(255,255,255,0.4)",
        duration: 0.6,
        ease: "power4.out",
      });
      if (video) gsap.to(video, { scale: 1.06, duration: 0.7, ease: "power4.out" });
      if (arrow) gsap.to(arrow, { borderColor: "rgba(255,255,255,0.9)", duration: 0.5, ease: "power4.out" });
    });

    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        y: 0,
        scale: 1,
        rotationX: 0,
        rotationY: 0,
        borderColor: "rgba(255,255,255,0.14)",
        duration: 0.7,
        ease: "power4.out",
      });
      if (video) gsap.to(video, { scale: 1, duration: 0.8, ease: "power4.out" });
      if (arrow) gsap.to(arrow, { borderColor: "rgba(255,255,255,0.55)", duration: 0.5, ease: "power4.out" });
    });

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      // Rango bien chico (±6°): rotación casi imperceptible, no un tilt
      // de juego de cartas.
      tiltX(px * 6);
      tiltY(py * -6);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initCapacidadesGrid();

  // La grilla de Capacidades ya no pinea, así que su altura es la altura
  // real de su layout (grid + aspect-ratio de las cards): no depende de
  // ningún pin-spacer que haya que esperar. Alcanza con construir el
  // sistema de transición pin+scale+fade (Home→Capacidades→Sección
  // 03→Sección 04) directamente acá.
  initSectionTransitions();

  // "#idi" (eyebrow + título "Para nosotros la innovación...", con su
  // propio pin) se eliminó a pedido explícito — ese contenido ahora es
  // un caption estático dentro de "#idi-timeline" (ver ".idi-caption"
  // en index.html/style.css, sin pin ni animación propia). El Spotlight
  // que seguía al mouse en esta sección (mismo efecto que usaba antes
  // "#test-3") se sacó a pedido explícito — "attachSpotlightCanvas()"
  // (más abajo en este archivo) queda sin llamadas, sin usar por ahora.
  // El <canvas class="reunimos-canvas"> sigue en el HTML sin tocar la
  // estructura, simplemente vacío/transparente al no tener contexto
  // WebGL asociado.

  // Refresh final: fuerza a que todo (grilla, transiciones, marcador)
  // termine de asentarse contra el layout definitivo antes de que el
  // usuario pueda interactuar.
  ScrollTrigger.refresh();

  window.addEventListener("resize", () => {
    ScrollTrigger.refresh();
  });
});

/* ============================================================
   INTEGRACIÓN — red de seguridad final para el sistema de transición
   ----------------------------------------------------------------
   El fix real ya está arriba: initSectionTransitions() (el sistema
   pin+scale+fade) se define pero NO se autoejecuta; se llama recién
   dentro del DOMContentLoaded de Capacidades (ver initCapacidadesGrid()),
   una vez que su grilla ya está montada — así el trigger de "Sección 03"
   siempre mide la posición real de "#s3-caps" después de resuelto su
   layout (grid + aspect-ratio de las cards).

   Este listener de acá abajo es solo una red de seguridad extra: se
   registra al final a propósito (corre después de todo lo anterior)
   y fuerza refreshes adicionales por si fuentes/videos que todavía
   están cargando llegan a cambiar el alto de alguna sección después
   del cálculo inicial.
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof ScrollTrigger === "undefined") return;

  // Refresh inmediato: el layout de Capacidades (grid + cards) ya está
  // resuelto por CSS al llegar acá, así que esto solo confirma medidas.
  ScrollTrigger.refresh();

  // Refresh extra cuando terminen de cargar fuentes/recursos (Audiowide,
  // Orbitron, videos con preload="metadata"): por si alguno de esos
  // recursos todavía corre el alto de alguna sección en ese momento.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
    syncPinSpacerBackgrounds();
  });
});

/* ============================================================
   FIX genérico — fondo del ".pin-spacer" de cada sección pineada
   ----------------------------------------------------------------
   Cualquier ScrollTrigger con "pin:true" hace que GSAP envuelva al
   elemento pineado en un <div class="pin-spacer"> propio, SIN IMPORTAR
   el valor de "pinSpacing" (se comprobó en vivo: hasta las secciones
   que usan "pinSpacing:false", como Hero/Capacidades/Productos vía
   "addPinFadeTransition()"/"outgoingPanels", también quedan envueltas
   así — un supuesto anterior decía lo contrario y era incorrecto). Ese
   "pin-spacer" no tiene fondo propio: mientras la sección pineada se
   achica/desvanece en su tramo de salida (transform: scale()), el
   margen que deja alrededor muestra lo que hay detrás — el propio
   "pin-spacer", que sin este fix cae al fondo del <body> (blanco, ver
   arriba en style.css) en vez de mostrar negro/celeste/lo que
   corresponda a esa sección puntual.

   En vez de parchear caso por caso (ese enfoque ya se probó y se pidió
   sacar explícitamente — "no quiero dos soluciones distintas
   conviviendo"), esto recorre TODOS los ScrollTrigger existentes y le
   copia a cada "pin-spacer" el "background-color" real (computado) del
   elemento que tiene adentro. Corre una sola vez en "window.load"
   (momento en el que ya se ejecutaron todos los "ScrollTrigger.create()"
   de todo el archivo, así que todos los "pin-spacer" ya existen) y
   además cada vez que ScrollTrigger re-arma sus pines (evento
   "refresh", por si algún resize recrea algún spacer). */
function syncPinSpacerBackgrounds() {
  if (typeof ScrollTrigger === "undefined") return;
  ScrollTrigger.getAll().forEach((trigger) => {
    const pinned = trigger.pin;
    if (!pinned) return;
    const spacer = pinned.parentElement;
    if (!spacer || !spacer.classList.contains("pin-spacer")) return;
    const bg = window.getComputedStyle(pinned).backgroundColor;
    if (bg) spacer.style.backgroundColor = bg;
  });
}
if (typeof ScrollTrigger !== "undefined") {
  ScrollTrigger.addEventListener("refresh", syncPinSpacerBackgrounds);
}

/* Capa de canvas WebGL + spotlight (pedido explícito: "el único
   objetivo es que la sección Timeline utilice exactamente el mismo
   efecto de cursor premium ya implementado" — antes se compartía
   también con "#test-3", sección reemplazada por "SECCIÓN CLARIDAD",
   ver index.html). Módulo aparte y autocontenido: no crea ningún
   ScrollTrigger/pin, no toca texto ni "background-color" — solo pinta
   dentro de "canvas". "getProgress" (función, no valor) desacopla esta
   capa de quien la usa — el wiring de "#idi-timeline" (más abajo en el
   DOMContentLoaded) le pasa "() => 0", así el patrón se queda siempre
   en su color revelado. El color/brillo del spotlight NO depende de
   ese valor (pedido explícito: la luz del cursor debe mantenerse
   constante en brillo/opacidad/fuerza durante todo el recorrido de la
   sección, sin apagarse con el scroll) — "uProgress" queda solo por si
   a futuro hace falta reintroducir algún efecto ligado a un progreso.
   Devuelve "true" si WebGL arrancó bien, "false" si hay que usar un
   fallback (quien llama decide cuál). */
function attachSpotlightCanvas(section, canvas, getProgress, sharedState, trackingSpeed) {
  const gl =
    canvas.getContext("webgl", {
      antialias: true,
      // Canvas con alfa real: el shader solo pinta el patrón dentro
      // del spotlight (ver comentario de arriba) — fuera de ahí queda
      // transparente y se ve el "background-color" de la sección.
      alpha: true,
      premultipliedAlpha: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      // Sin esto, el navegador puede descartar/limpiar el back-buffer
      // apenas se presenta cada frame — el shader se sigue viendo
      // perfecto en pantalla (el browser compone cada frame nuevo de
      // todas formas), pero cualquier lectura externa del buffer entre
      // frames (debugging, tests automatizados con "readPixels") podía
      // devolver contenido vacío/negro en vez del último frame real.
      preserveDrawingBuffer: true,
    }) ||
    canvas.getContext("experimental-webgl");

  if (!gl) return false;

  const VERTEX_SRC = "attribute vec2 aPosition;\n" + "void main() {\n" + "  gl_Position = vec4(aPosition, 0.0, 1.0);\n" + "}";

  // Ruido "value noise" clásico (hash + interpolación suave) + fbm con
  // "domain warp" (cada octava distorsiona el dominio de la siguiente):
  // es la técnica estándar para lograr manchas orgánicas continuas
  // (tinta/agua) en vez de un ruido plano tipo estática. Sin "base": el
  // color de fondo parejo lo pone el CSS de la sección (ver arriba), acá
  // solo se pinta el patrón, con su propia opacidad como canal alfa.
  const FRAGMENT_SRC = [
    "precision highp float;",
    "uniform vec2 uResolution;",
    "uniform float uTime;",
    "uniform vec2 uMouse;",
    "uniform float uProgress;",
    "uniform float uIntensity;",
    "uniform float uRadius;",
    "",
    "float hash(vec2 p) {",
    "  p = fract(p * vec2(123.34, 456.21));",
    "  p += dot(p, p + 45.32);",
    "  return fract(p.x * p.y);",
    "}",
    "",
    "float valueNoise(vec2 p) {",
    "  vec2 i = floor(p);",
    "  vec2 f = fract(p);",
    "  float a = hash(i);",
    "  float b = hash(i + vec2(1.0, 0.0));",
    "  float c = hash(i + vec2(0.0, 1.0));",
    "  float d = hash(i + vec2(1.0, 1.0));",
    "  vec2 u = f * f * (3.0 - 2.0 * f);",
    "  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;",
    "}",
    "",
    "const mat2 WARP_ROT = mat2(0.8, 0.6, -0.6, 0.8);",
    "",
    "float fbm(vec2 p) {",
    "  float sum = 0.0;",
    "  float amp = 0.5;",
    "  for (int i = 0; i < 5; i++) {",
    "    sum += amp * valueNoise(p);",
    "    p = WARP_ROT * p * 2.0 + 3.7;",
    "    amp *= 0.55;",
    "  }",
    "  return sum;",
    "}",
    "",
    "void main() {",
    "  vec2 uv = gl_FragCoord.xy / uResolution.xy;",
    "  float aspect = uResolution.x / uResolution.y;",
    "  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * 2.6;",
    "",
    "  float t = uTime * 0.025;",
    "  vec2 warp = vec2(fbm(p + vec2(t, -t)), fbm(p - vec2(t, t) + 7.3));",
    "  float n = fbm(p + warp * 1.35);",
    // Rango intermedio (pedido explícito "nivel medio" — antes 0.08–0.62,
    // más denso; y antes de eso 0.18–0.82, el original): punto medio
    // entre los dos.
    "  n = smoothstep(0.12, 0.7, n);",
    "",
    // Azul visible pero sin sobrecargar (pedido explícito "no tan
    // brillante, nivel medio el efecto").
    // Color fijo, SIN mezclar hacia negro por "uProgress" (versión previa
    // apagaba el brillo a medida que se scrolleaba la sección pineada —
    // pedido explícito: la luz del cursor debe mantenerse constante en
    // brillo/opacidad/fuerza durante todo el recorrido).
    "  vec3 patternColor = vec3(22.0, 150.0, 214.0) / 255.0;",
    "",
    "  vec2 d = (uv - uMouse) * vec2(aspect, 1.0);",
    "  float dist = length(d);",
    "  float mask = (1.0 - smoothstep(0.0, uRadius, dist)) * uIntensity;",
    "",
    // Amplificación moderada (x1.1, con tope en 1.0 — antes x1.6):
    // pedido explícito "nivel medio", ya no al máximo pero sigue con
    // algo más de cuerpo que el "mask*n" crudo sin amplificar.
    "  float alpha = clamp(mask * n * 1.1, 0.0, 1.0);",
    "  gl_FragColor = vec4(patternColor, alpha);",
    "}",
  ].join("\n");

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, VERTEX_SRC);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SRC);
  const program = vertexShader && fragmentShader ? gl.createProgram() : null;

  if (program) {
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
  }

  if (!program || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return false;
  }

  // Triángulo único que cubre toda la pantalla (más barato que un quad
  // de 2 triángulos/4 vértices, técnica estándar para post-procesos).
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPosition = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  const u = {
    uResolution: gl.getUniformLocation(program, "uResolution"),
    uTime: gl.getUniformLocation(program, "uTime"),
    uMouse: gl.getUniformLocation(program, "uMouse"),
    uProgress: gl.getUniformLocation(program, "uProgress"),
    uIntensity: gl.getUniformLocation(program, "uIntensity"),
    uRadius: gl.getUniformLocation(program, "uRadius"),
  };

  // "sharedState" (opcional): permite que dos secciones adyacentes
  // (ej. "#idi" + "#idi-timeline") compartan el mismo "pos"/"intensity"
  // en vez de que cada una tenga su propio spotlight independiente —
  // así el brillo no se resetea al cruzar de una sección a la otra, se
  // siente como una sola superficie continua bajo el cursor.
  const state = sharedState || {
    pos: { x: 0.5, y: 0.5 },
    intensity: { v: 0 },
    radiusNorm: 0.28,
  };

  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  // Ancho/alto de VIEWPORT (no "section.getBoundingClientRect()"): la
  // sección siempre ocupa exactamente el viewport completo (".test-section"
  // es "width:100%; height:100vh"), así que medir el viewport directo
  // evita cualquier lectura parcial/desactualizada del layout (ej. si
  // este resize() corriera antes de que el pin-spacer o alguna fuente
  // todavía en carga terminen de asentar el tamaño real de "section").
  function resize() {
    const width = Math.max(1, Math.round(window.innerWidth));
    const height = Math.max(1, Math.round(window.innerHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    // Radio del spotlight (380px — pedido explícito "más fuerte": antes
    // 300px, mismo orden de magnitud que el de "#idi") normalizado a la
    // altura de la sección.
    state.radiusNorm = 380 / height;
  }
  resize();
  window.addEventListener("resize", resize);
  // Red de seguridad extra: cualquier cambio de layout de "section"
  // (fuentes que terminan de cargar, pin-spacer, etc.) que no dispare
  // un "resize" de ventana también recalcula el canvas.
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(resize).observe(section);
  }

  if (!isTouch) {
    // Inercia del cursor: único uso de GSAP acá, igual que el resto de
    // los spotlights del sitio (gsap.quickTo sobre un objeto plano, no
    // sobre una custom property CSS). Listener propio de "mousemove"/
    // "mouseleave", sin ScrollTrigger ni pin — no puede interferir con
    // ninguna animación GSAP que ya exista en "section".
    // "trackingSpeed" (parámetro opcional: pedido explícito en su
    // momento para una sección que ya no existe — "la iluminación
    // desaparece demasiado rápido... debe permanecer visible durante todo
    // el recorrido del mouse, sin apagarse mientras el cursor sigue
    // desplazándose") — valores por defecto SIN CAMBIOS (0.5/0.6, los de
    // siempre) para el único llamador actual (".idi-timeline", que no
    // pasa este parámetro). El problema real no era que la intensidad
    // bajara a 0 (eso solo pasa en "mouseleave"): con una posición que
    // tarda 0.5s en alcanzar al cursor real, un movimiento rápido deja al
    // punto de luz "atrasado" respecto de dónde está el mouse en ese
    // instante — con el radio del spotlight sin cubrir ese hueco, el
    // texto que el cursor ya alcanzó se ve sin luz todavía. Acortar estos
    // dos tiempos (posición e intensidad) hace que la luz se mantenga más
    // cerca del cursor real sin tocar su radio, color, blend-mode ni
    // patrón — solo su "persistencia"/capacidad de respuesta, tal como
    // se pidió.
    const posDuration = (trackingSpeed && trackingSpeed.posDuration) || 0.5;
    const intensityDuration = (trackingSpeed && trackingSpeed.intensityDuration) || 0.6;
    const setX = gsap.quickTo(state.pos, "x", { duration: posDuration, ease: "power3" });
    const setY = gsap.quickTo(state.pos, "y", { duration: posDuration, ease: "power3" });
    const setIntensity = gsap.quickTo(state.intensity, "v", { duration: intensityDuration, ease: "power2" });

    section.addEventListener("mousemove", (e) => {
      const r = section.getBoundingClientRect();
      setX((e.clientX - r.left) / r.width);
      setY((e.clientY - r.top) / r.height);
      setIntensity(1);
    });
    section.addEventListener("mouseleave", () => setIntensity(0));
  } else {
    // Táctil: sin cursor no hay spotlight que perseguir — se muestra el
    // patrón de forma estática (sin seguimiento), igual de oculto al
    // entrar y con la misma transición de color por scroll.
    state.intensity.v = 0.85;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Transparente: limpia a alfa 0 antes de cada frame, así lo único que
  // queda dibujado es el patrón dentro del spotlight (ver fragment
  // shader) — todo lo demás dejar ver el "background-color" real de la
  // sección, sin ninguna interferencia del canvas.
  gl.clearColor(0, 0, 0, 0);

  // Con "#idi-timeline" son ahora 3 contextos WebGL a la vez en toda la
  // página. Dos salvaguardas para no forzar la GPU de más:
  //   1) El loop se PARA por completo (ni un requestAnimationFrame) en
  //      cuanto la sección sale del viewport, y se retoma solo cuando
  //      vuelve a entrar — así nunca hay 3 shaders dibujando a la vez
  //      si el usuario está viendo solo una sección.
  //   2) Si el navegador/GPU pierde el contexto igual (drivers viejos,
  //      demasiados contextos simultáneos, etc.), en vez de dejar el
  //      canvas roto (ícono de "contexto perdido") se para el loop y se
  //      deja transparente — se sigue viendo el "background-color" de
  //      la sección, sin ningún ícono de error.
  let isSectionVisible = true;
  let contextLost = false;
  let rafId = null;

  canvas.addEventListener(
    "webglcontextlost",
    (e) => {
      e.preventDefault();
      contextLost = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    },
    false
  );

  if (typeof IntersectionObserver !== "undefined") {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isSectionVisible = entry.isIntersecting;
          if (isSectionVisible && !rafId && !contextLost) {
            rafId = requestAnimationFrame(renderFrame);
          }
        });
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(section);
  }

  function renderFrame(nowMs) {
    if (!isSectionVisible || contextLost) {
      rafId = null;
      return;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform1f(u.uTime, nowMs * 0.001);
    gl.uniform2f(u.uResolution, canvas.width, canvas.height);
    gl.uniform2f(u.uMouse, state.pos.x, 1.0 - state.pos.y);
    gl.uniform1f(u.uProgress, getProgress());
    gl.uniform1f(u.uIntensity, state.intensity.v);
    gl.uniform1f(u.uRadius, state.radiusNorm);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    rafId = requestAnimationFrame(renderFrame);
  }
  rafId = requestAnimationFrame(renderFrame);

  return true;
}

/* ============================================================
   SECCIÓN "PRODUCTOS" — migrada tal cual del sitio anterior
   ----------------------------------------------------------------
   Todo lo de acá abajo es CÓDIGO ORIGINAL SIN MODIFICAR, copiado del
   sitio viejo: el sistema de scramble de "SOPHIA TECH CORP"/nombres de
   producto (".js-scramble"/".js-scramble-fast", con su propio
   "CHARS"/"scrambleText" — pedido explícito de mantener intacto), los
   filtros por tab + el panel de PDF embebido, y las partículas
   magnéticas de las tabs al hacer hover. Usa ScrollTrigger/
   ScrollToPlugin, ya registrados y cargados arriba (por Capacidades) —
   no se duplica ninguna librería.
   ============================================================ */

/* ── Text Scramble ──────────────────────────────────────────────────── */
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+-/=?『』";

function scrambleText(el, { flickersPerChar = 6, frameDuration = 35 } = {}) {
  
  if (el._scrambleInterval) clearInterval(el._scrambleInterval);

  if (!el.dataset.scrambleFinal) el.dataset.scrambleFinal = el.textContent;
  const finalText = el.dataset.scrambleFinal;

  const length = finalText.length;
  const totalFrames = length * flickersPerChar;
  let frame = 0;

  el._scrambleInterval = setInterval(() => {
    let out = "";
    const resolvedCount = Math.floor(frame / flickersPerChar);

    for (let i = 0; i < length; i++) {
      const char = finalText[i];
      if (char === " ") {
        out += " ";
      } else if (i < resolvedCount) {
        out += char;
      } else {
        out += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
    }

    el.textContent = out;
    frame++;

    if (frame > totalFrames) {
      el.textContent = finalText;
      clearInterval(el._scrambleInterval);
      el._scrambleInterval = null;
    }
  }, frameDuration);
}

/* 1) Disparado por scroll, una sola vez (ej. SOPHIA TECH CORP) */
(function () {
  const els = document.querySelectorAll(".js-scramble");
  if (!els.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const isFast = entry.target.classList.contains("js-scramble-fast");
          scrambleText(
            entry.target,
            isFast
              ? { flickersPerChar: 3, frameDuration: 16 } // más rápido: nombres de producto
              : { flickersPerChar: 6, frameDuration: 35 } // velocidad original: SOPHIA TECH CORP
          );
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  els.forEach((el) => observer.observe(el));
})();

/* =========================== S4 — PRODUCTOS (filtros + entrada) ===========================
   Antes S6 en el sitio viejo: mismo mecanismo de filtro exacto,
   renombrado a "prod-*" / "#s4-intro". */
(function () {
  const tabs = document.querySelectorAll("#prod-tabs .prod-tab");
  const rows = document.querySelectorAll("#prod-list .prod-row");
  if (!tabs.length || !rows.length) return;

  // FIX (bug real, dos disparadores — abrir "Explorar solución" Y
  // filtrar por categoría cambian el alto de "#s4-intro" en vivo): el
  // ScrollTrigger de su transición de salida pin+fade (ver
  // "addPinFadeTransition()") queda con la medida VIEJA hasta que algo
  // lo recalcula.
  //
  // Un "trigger.refresh()" simple SOLO arregla la mitad del problema.
  // Si el usuario está scrolleado ADENTRO del rango activo de esa
  // transición en el momento de filtrar: refresh() recalcula bien el
  // nuevo "start"/"end", pero la posición de scroll (en píxeles) del
  // usuario no se mueve — como la sección ahora es más corta, esa MISMA
  // posición cae en un % mucho más adelantado del rango nuevo, y la
  // sección salta de golpe a un scale/opacity más avanzado, revelando
  // I+D+i sin que el usuario haya scrolleado lo suficiente (confirmado
  // con captura real del bug). "refreshS4PinFade()" guarda el "progress"
  // ANTES de refrescar y repone el scroll a ese mismo % sobre el rango
  // NUEVO — nada salta.
  //
  // "preserveScroll" (bug reportado: "al abrir Explorar solución la
  // sección se sube/el PDF queda muy arriba" — un salto de ~190px
  // medido a mano): el reposicionamiento de arriba tiene sentido para
  // FILTRAR (la sección se ACORTA de golpe, sin transición CSS de por
  // medio — hay que corregir un salto que ya iba a pasar solo). Pero el
  // acordeón SÍ tiene su propia transición CSS (0.6s) y, a diferencia
  // de filtrar, agranda la sección — el "progress" de la transición de
  // salida más bien BAJA (nunca sube), así que no hay ningún snap
  // visual que corregir; forzar igual el "scrollTo()" acá era la causa
  // real del salto que se sentía al abrir/cerrar. Por eso
  // "scheduleS4Refresh()" (el que dispara el acordeón, ver más abajo)
  // pasa "false": sigue recalculando "start"/"end" con "trigger.refresh()"
  // (necesario, el colchón cambió), pero ya no mueve el scroll del
  // usuario. Filtrar (que llama a esta función directo, sin pasar nada)
  // mantiene el comportamiento de siempre.
  function refreshS4PinFade() {
    if (typeof ScrollTrigger === "undefined") return;
    // Instancia puntual (ver "id" en addPinFadeTransition()) en vez de
    // "ScrollTrigger.refresh()" global: recalcula SOLO el trigger de
    // salida de Productos, no los de Hero/Capacidades/I+D+i/Trayectoria
    // — mismo resultado para este bug, mucho más barato.
    const trigger = ScrollTrigger.getById("s4-intro__pinFade");
    if (!trigger) return;

    // FIX (bug reportado: al CERRAR "Explorar solución" la fila
    // filtrada desaparecía y se veía I+D+i ocupando la mitad de la
    // pantalla, sin haber scrolleado más): antes, esta función solo
    // reponía el scroll (preservando el % de progreso de la
    // transición) cuando YA estaba activa según el rango VIEJO
    // ("wasActive"/"preserveScroll"), y el acordeón llamaba siempre con
    // eso desactivado — asumiendo que only abrir (crecer) podía pasar
    // por acá, nunca cerrar. Error: cerrar el acordeón ACORTA
    // "#s4-intro" tanto como ocultar filas al filtrar, así que el mismo
    // salto de golpe que ya se arreglaba para filtrar podía pasar
    // también al cerrar, sin que nada lo corrigiera.
    //
    // En vez de mantener dos casos con supuestos distintos, se detecta
    // la dirección real del cambio comparando el "start" ANTES y
    // DESPUÉS de refrescar:
    //   - Si "start" se corrió MÁS TEMPRANO (la sección se acortó: una
    //     fila que se oculta al filtrar, o el acordeón que se cierra):
    //     sin reponer el scroll, la MISMA posición de scroll cae de
    //     golpe en un % más avanzado del recorrido nuevo — se repone
    //     para que el % de progreso quede igual que antes, sin salto.
    //   - Si "start" se corrió MÁS TARDE (la sección creció: el
    //     acordeón que se abre): el % de progreso solo puede bajar
    //     (nunca saltar hacia adelante), así que no hay nada que
    //     corregir — no se toca el scroll.
    const startBefore = trigger.start;
    const progressBefore = trigger.progress;
    trigger.refresh();
    if (trigger.start < startBefore) {
      window.scrollTo(0, trigger.start + progressBefore * (trigger.end - trigger.start));
    }
  }

  // Debounce ~130ms (pedido explícito, "por si el usuario abre/cierra
  // varios acordeones rápido seguido") — coalesce múltiples eventos de
  // "transitionend" seguidos (el acordeón SÍ tiene una transición CSS
  // que esperar, a diferencia del filtro de tabs, que cambia el alto al
  // toque y refresca de inmediato, ver "tabs.forEach" más abajo) en un
  // solo refresh, en vez de encadenar uno por cada uno.
  let s4RefreshTimer = null;
  function scheduleS4Refresh() {
    clearTimeout(s4RefreshTimer);
    s4RefreshTimer = setTimeout(() => refreshS4PinFade(), 130);
  }

  /* Presentación comercial (PDF embebido) por producto — archivos en
     /pdfs (raíz del sitio, ver index.html). Para agregar la de un
     nuevo producto en el futuro, alcanza con sumar una línea acá — no
     hace falta tocar el HTML ni ninguna otra parte de este bloque.
     La clave tiene que ser igual al "data-filter" del tab de ese producto. */
const PRODUCT_PDFS = {
    "timbrame24": "pdfs/timbrame24.pdf",
    "avatares": "pdfs/avatares.pdf",
    "empleados-virtuales": "pdfs/empleados-virtuales.pdf",
    "smart-meter": "pdfs/smart-meter.pdf",
    "domotica": "pdfs/domotica.pdf",
    "pet24": "pdfs/pet24.pdf",
    "gestion-riesgos": "pdfs/gestion-riesgos.pdf",
};
  const presentationEl = document.getElementById("prod-presentation");

  // FIX (bug reportado: al filtrar por un producto puntual, "Explorar
  // solución" no se veía y la sección I+D+i ya aparecía ocupando parte
  // de la vista sin haber scrolleado más): "refreshS4PinFade()" se
  // llama de forma SÍNCRONA justo después de "updatePresentation()"
  // (ver el listener de los tabs, más abajo) — en ese mismo instante
  // recalcula dónde termina "#s4-intro" para el ScrollTrigger de la
  // transición pin+fade hacia I+D+i. El problema: agregar/sacar
  // "is-visible" en ESTE elemento (el panel entero, no el acordeón de
  // adentro) dispara su PROPIA transición CSS de 0.6s (max-height/
  // opacity/margin-top, ver ".prod-presentation.is-visible" en
  // style.css) — así que ese refresh() sincrónico mide la sección
  // ANTES de que el panel termine de crecer/achicarse, y el
  // start/end del trigger queda corto. Con eso, el trigger puede
  // activarse de más (revela I+D+i antes de tiempo, tapando el botón
  // recién creado). Ya existía este mismo mecanismo para el acordeón
  // interno (ver "bodyEl.addEventListener('transitionend', ...)" un
  // poco más abajo, adentro de "updatePresentation()") pero faltaba acá
  // afuera, para la transición de aparición/desaparición del panel
  // completo. Se registra UNA sola vez (afuera de "updatePresentation()",
  // que se re-ejecuta en cada click) porque "presentationEl" nunca se
  // recrea, solo se le cambia el innerHTML.
  if (presentationEl) {
    presentationEl.addEventListener("transitionend", (e) => {
      if (e.target !== presentationEl || e.propertyName !== "max-height") return;
      scheduleS4Refresh();
    });
  }

  // ============================================================
  // MODAL "Explorar solución" — visor de PDF en overlay
  // ------------------------------------------------------------
  // FIX (pedido explícito: sacar el PDF del acordeón in-page y abrirlo
  // en un modal en vez de en la misma página): el PDF vivía en un
  // iframe con su propio scroll interno, DENTRO del flujo normal de
  // la página — al llegar al final de ese scroll interno (o si el
  // cursor quedaba un instante sobre el marco negro alrededor), el
  // navegador le pasaba el scroll restante a la página completa
  // ("scroll chaining"), que tiene transiciones ligadas 1:1 al scroll
  // (los pin+fade de GSAP) — de ahí el salto brusco reportado, que
  // "overscroll-behavior: contain" no llegó a resolver del todo.
  // Acá el modal vive en un overlay aparte y bloquea el scroll de la
  // PÁGINA mientras está abierto (ver "openPdfModal()" más abajo): no
  // queda scroll de página con el que el del PDF pueda chocar, así que
  // el problema desaparece de raíz en vez de mitigarse.
  // Un solo modal, creado UNA sola vez y reutilizado por todos los
  // productos — el <iframe> de adentro se reemplaza en cada apertura.
  // ============================================================
  let pdfModalEl = null;

  function ensurePdfModal() {
    if (pdfModalEl) return pdfModalEl;

    pdfModalEl = document.createElement("div");
    pdfModalEl.className = "pdf-modal";
    pdfModalEl.setAttribute("role", "dialog");
    pdfModalEl.setAttribute("aria-modal", "true");
    pdfModalEl.setAttribute("aria-hidden", "true");
    pdfModalEl.innerHTML = `
      <div class="pdf-modal-backdrop"></div>
      <div class="pdf-modal-panel">
        <button class="pdf-modal-close" type="button" aria-label="Cerrar">
          <svg viewBox="0 0 20 20" width="20" height="20" fill="none">
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="pdf-modal-body"></div>
      </div>
    `;
    document.body.appendChild(pdfModalEl);

    pdfModalEl.querySelector(".pdf-modal-backdrop").addEventListener("click", closePdfModal);
    pdfModalEl.querySelector(".pdf-modal-close").addEventListener("click", closePdfModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && pdfModalEl.classList.contains("is-open")) closePdfModal();
    });

    return pdfModalEl;
  }

  // FIX (pedido explícito: poder pintar de negro la scrollbar del PDF
  // del modal): configura el worker de PDF.js UNA sola vez, si la
  // librería cargó (ver el <script> nuevo en index.html, justo antes
  // de "script.js"). Sin esto, "pdfjsLib.getDocument()" no funciona.
  if (typeof pdfjsLib !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  }

  function openPdfModal(pdfPath) {
    const modal = ensurePdfModal();
    const bodyEl = modal.querySelector(".pdf-modal-body");
    bodyEl.innerHTML = `<div class="pdf-modal-loading">Cargando…</div>`;
    // Bloquea el scroll de la página mientras el modal está abierto —
    // la pieza clave del fix anterior: sin scroll de página, no hay
    // nada con lo que el scroll interno del PDF pueda chocar.
    document.body.style.overflow = "hidden";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    renderPdfIntoModal(pdfPath, bodyEl);
  }

  // Dibuja cada página del PDF en su propio <canvas>, adentro de un
  // contenedor scrolleable NUESTRO ("pdf-modal-pages") en vez de dejar
  // que el navegador embeba su visor nativo dentro de un <iframe> (que
  // no permite estilar su propia scrollbar desde afuera, por vivir en
  // un documento aparte). Con el scroll siendo nuestro, sí podemos
  // pintarlo (ver ".pdf-modal-pages::-webkit-scrollbar" en style.css).
  async function renderPdfIntoModal(pdfPath, bodyEl) {
    // Red de seguridad: si PDF.js no cargó (CDN caído, red bloqueada,
    // etc.) o si falla al parsear el archivo, no rompemos el modal —
    // volvemos al <iframe> nativo de siempre (con su scrollbar gris,
    // pero funcional).
    const fallbackToIframe = () => {
      bodyEl.innerHTML = `
        <iframe
          src="${pdfPath}#toolbar=0&navpanes=0&view=FitH"
          title="Presentación comercial"
          loading="lazy"
        ></iframe>
      `;
    };

    if (typeof pdfjsLib === "undefined") {
      fallbackToIframe();
      return;
    }

    const container = document.createElement("div");
    container.className = "pdf-modal-pages";
    bodyEl.innerHTML = "";
    bodyEl.appendChild(container);

    try {
      const pdfDoc = await pdfjsLib.getDocument(pdfPath).promise;
      const containerWidth = container.clientWidth || 800;

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        // Si el usuario ya cerró el modal (o abrió otro producto) antes
        // de que termine de renderizar, cortamos: no hay sentido en
        // seguir dibujando páginas en un contenedor que ya no se ve.
        if (!container.isConnected) return;

        const page = await pdfDoc.getPage(pageNum);
        const unscaledWidth = page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale: containerWidth / unscaledWidth });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        container.appendChild(canvas);

        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      }
    } catch (err) {
      fallbackToIframe();
    }
  }

  function closePdfModal() {
    if (!pdfModalEl || !pdfModalEl.classList.contains("is-open")) return;
    pdfModalEl.classList.remove("is-open");
    pdfModalEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    // Vacía el contenido al cerrar: evita que el PDF (iframe o páginas
    // ya renderizadas) siga cargado de fondo.
    pdfModalEl.querySelector(".pdf-modal-body").innerHTML = "";
  }

  function updatePresentation(filter) {
    if (!presentationEl) return;

    const pdfPath = PRODUCT_PDFS[filter];

    if (!pdfPath) {
      // "Todo", o un producto que todavía no tiene presentación cargada:
      // se oculta y se vacía (evita que un iframe viejo siga cargado de fondo).
      presentationEl.classList.remove("is-visible");
      presentationEl.innerHTML = "";
      presentationEl.setAttribute("aria-hidden", "true");
      return;
    }

    // El botón ya no es un disclosure/acordeón (ver el modal más
    // arriba) — un solo click abre el modal directo, así que no
    // necesita "aria-expanded" ni un cuerpo colapsable propio.
    presentationEl.innerHTML = `
      <div class="prod-presentation-inner">
        <button class="prod-presentation-toggle" type="button">
          <span>Explorar solución</span>
          <svg class="prod-presentation-plus" viewBox="0 0 20 20" width="16" height="16" fill="none">
            <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;
    presentationEl.classList.add("is-visible");
    presentationEl.setAttribute("aria-hidden", "false");

    const toggleBtn = presentationEl.querySelector(".prod-presentation-toggle");
    toggleBtn.addEventListener("click", () => openPdfModal(pdfPath));
  }

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const filter = tab.getAttribute("data-filter");
      tabs.forEach((t) => t.classList.toggle("active", t === tab));

      rows.forEach((row) => {
        const match = filter === "all" || row.getAttribute("data-category") === filter;
        row.classList.toggle("prod-row-hidden", !match);
        // La fila que matchea el filtro pasa a mostrarse primero en la
        // lista. Como .prod-list es un flex-column, "order" la reordena
        // visualmente sin moverla en el HTML real y sin afectar el alto
        // total de la página (las demás filas siguen ocupando su lugar,
        // solo invisibles). El panel de presentación (#prod-presentation)
        // no tiene "order" explícito, así que su valor por defecto es 0:
        // queda siempre entre la fila activa (-1) y las ocultas (1), es
        // decir, justo debajo de la fila activa.
        row.style.order = match ? "-1" : "1";
      });

      // Colchón extra de scroll (pedido explícito, ver "s4FilterExtraScroll"
      // cerca de "addPinFadeTransition()"): filtrar a UN producto oculta
      // todas las demás filas ("prod-row-hidden" es "display:none"),
      // acortando mucho "#s4-intro" — sin esto, la transición hacia
      // I+D+i quedaba con muy poco margen apenas se elegía cualquier
      // producto puntual (no pasaba con "Todo", que muestra todas las
      // filas). Antes de "updatePresentation()"/"refreshS4PinFade()" de
      // abajo, para que el recálculo del trigger ya use el valor nuevo.
      s4FilterExtraScroll = filter === "all" ? 0 : window.innerHeight * 0.5;

      updatePresentation(filter);

      // Productos ahora participa del sistema de transición pin+scale+fade
      // (se pinea como saliente hacia I+D+i, ver initSectionTransitions()):
      // como filtrar cambia su alto real (se ocultan filas), hay que avisarle
      // a ScrollTrigger para que esa transición no quede con una medida
      // vieja. Sin transición CSS de por medio acá (ocultar filas es
      // instantáneo, a diferencia del acordeón), así que se refresca
      // directo, sin debounce — pero SÍ con preservación de progreso (ver
      // "refreshS4PinFade()" más arriba), que es la parte que realmente
      // arregla el bug real (reportado con captura): filtrar estando ya
      // scrolleado adentro del pin de salida hacía saltar la sección
      // varios % de golpe, revelando I+D+i antes de tiempo.
      refreshS4PinFade();
    });
  });

  /* Toda la fila es clickeable: dispara el click del tab de arriba que le
     corresponde (misma "data-category" ↔ "data-filter"), así se reutiliza
     100% la lógica de filtro/orden/presentación de arriba sin duplicar
     nada y quedan siempre sincronizados. Después hace scroll suave hasta
     los tabs para mostrar el resultado (mismo mecanismo que el navbar:
     GSAP ScrollToPlugin con offset de 90px por el navbar fijo). */
  rows.forEach((row) => {
    row.addEventListener("click", () => {
      const category = row.getAttribute("data-category");
      const tab = document.querySelector(`#prod-tabs .prod-tab[data-filter="${category}"]`);
      if (!tab) return;

      // FIX (pedido explícito + bug reportado: "si aprieto de nuevo el
      // producto ya filtrado, la sección de abajo sube un poco cada
      // vez"): si esta fila YA es el filtro activo, no hay nada que
      // filtrar de nuevo — antes igual se disparaba "tab.click()" (que
      // vuelve a correr todo el filtro/presentación) y el "scrollTo"
      // de más abajo, aunque no cambiara nada, y ese re-scroll
      // acumulaba el pequeño salto reportado. Cortamos acá: fila ya
      // activa → click no hace nada.
      if (tab.classList.contains("active")) return;

      tab.click();

      gsap.to(window, {
        scrollTo: { y: "#prod-tabs", offsetY: 90 },
        duration: 1,
        ease: "power2.inOut",
      });
    });
  });

  // Entrada suave de toda la sección al llegar con el scroll
  gsap.fromTo(
    "#s4-intro .prod-tabs, #s4-intro .prod-row",
    { opacity: 0, y: 24 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.05,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#s4-intro",
        start: "top 75%",
      },
    }
  );
})();


/* ── Partículas magnéticas en las tabs de Productos ──────────────────────
   Genera, para cada tab, su propio campo de partículas (igual mecanismo
   que el ejemplo: posiciones y offsets aleatorios vía CSS custom
   properties --x/--y). Se hace acá para no tener que tocar el HTML de
   cada una de las 8 tabs a mano. */
(function () {
  const prodTabs = document.querySelectorAll(".prod-tab");
  if (!prodTabs.length) return;

  const PARTICLES_PER_TAB = 14; // pocas partículas: efecto sutil, no denso

  prodTabs.forEach((tab) => {
    // Envolvemos el texto existente en un <span> para que quede siempre
    // por encima de las partículas (ver CSS: .prod-tab > span { z-index: 2 }).
    const label = tab.textContent;
    tab.innerHTML = `<span>${label}</span>`;

    const field = document.createElement("div");
    field.className = "particles-field";
    tab.appendChild(field);

    for (let i = 0; i < PARTICLES_PER_TAB; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      // Rango de movimiento chico (-25px a 25px): las tabs son botones
      // pequeños, no tiene sentido un desplazamiento grande como en botones
      // full-size.
      particle.style.setProperty("--x", `${Math.random() * 50 - 25}px`);
      particle.style.setProperty("--y", `${Math.random() * 50 - 25}px`);
      particle.style.animation = `particleFloat ${1 + Math.random() * 2}s infinite`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      field.appendChild(particle);
    }
  });
})();

/* ============================================================
   SECCIÓN "I+D+I" — Proceso de Innovación
   ----------------------------------------------------------------
   Rediseño (pedido explícito: réplica del "Il Metodo" de myweblab.it,
   ver capturas). La lógica de fondo sigue siendo la misma que ya
   probó su solidez acá (un solo ScrollTrigger pin+scrub, todo el
   estado derivado de self.progress en un único onUpdate, nada de
   scroll-jacking manual, API nativa de SVG para dibujar la curva) —
   lo que cambia es:
     1) Los NODOS ahora se ubican al 25/50/75/100% del LARGO real del
        path (antes 0/33/67/100%, "i/(TOTAL-1)"), pedido explícito.
     2) Cada fase dedica ~100vh de scroll (antes un paso fijo más
        corto) — "PHASE_VH" abajo.
     3) El fade-in/fade-out de cada fase y el estado "alcanzado" de
        cada nodo ya NO son tweens de GSAP: son clases CSS
        ("is-current"/"is-past" en ".idi__stage", "is-active" en
        ".idi__node") + "transition" en style.css — pedido explícito
        "no anims inline por JS, mejor con clases + transition en
        CSS". Acá solo se decide QUÉ clase le toca a cada una en cada
        frame del scrub.
     4) Se dejó de animar ".idi__indicator" (la X que recorría la
        curva) — la referencia no tiene ningún indicador viajando,
        solo la línea creciendo + los nodos (el <div> sigue en el
        HTML sin tocar, ver style.css, simplemente ya no se anima).

   La SECCIÓN ".idi-timeline" completa es lo que pinea — así ocupa toda
   la pantalla mientras la línea se dibuja y las etapas se reemplazan.
   Como es la última sección del sitio, al terminar el recorrido el pin
   se libera con total normalidad y ahí termina la página.
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("idi-timeline");
  if (!section || typeof ScrollTrigger === "undefined") return;

  const pathEl = section.querySelector(".idi__path-progress");
  const stages = gsap.utils.toArray(".idi__stage", section);
  const nodes = gsap.utils.toArray(".idi__node", section);
  const TOTAL = stages.length;

  if (!TOTAL || !pathEl) return;

  // El viewBox del SVG es fijo (200x900, ver index.html) y el <svg> usa
  // preserveAspectRatio="none": el mapeo de coordenadas del path a % del
  // contenedor es directo (mismo % en cada eje que en el viewBox), así que
  // no hace falta recalcular nada en el resize — solo la GEOMETRÍA del
  // path (fija) determina las posiciones.
  const VIEWBOX_W = 200;
  const VIEWBOX_H = 900;
  const pathLength = pathEl.getTotalLength();

  function pointAt(fraction) {
    const pt = pathEl.getPointAtLength(pathLength * fraction);
    return { left: (pt.x / VIEWBOX_W) * 100 + "%", top: (pt.y / VIEWBOX_H) * 100 + "%" };
  }

  // Los 4 nodos se ubican en los puntos del path a 25/50/75/100% de su
  // longitud (pedido explícito) — quedan exactamente SOBRE la curva, sin
  // coordenadas a mano.
  nodes.forEach((node, i) => {
    const pt = pointAt((i + 1) / TOTAL);
    node.style.left = pt.left;
    node.style.top = pt.top;
  });

  // Estado inicial: línea sin dibujar, primera fase ya visible (no hace
  // falta scrollear nada para leer la primera).
  gsap.set(pathEl, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
  stages[0].classList.add("is-current");

  // Duraciones en "unidades de viewport" (mismo criterio que STEP_VH/
  // END_BUFFER_VH del carrusel de Capacidades). "PHASE_VH" (pedido
  // explícito "~100vh por cada una de las 4 fases") reemplaza al viejo
  // "STEP_VH" — antes el tramo de scroll dependía de TOTAL-1 pasos ENTRE
  // nodos; ahora son TOTAL tramos iguales, uno por fase (la primera
  // fase también "dibuja" su propio tramo de línea, del 0% al 25%).
  //
  // FIX (pedido explícito de otra sesión: "el mismo efecto de scale+
  // fade+pin de Hero→Capacidades entre idi y trayectoria, sin romper
  // nada"): en vez de un SEGUNDO ScrollTrigger con pin propio sobre esta
  // misma sección, se extiende el pin QUE YA EXISTE con un tramo final
  // (SCALE_FADE_VH) donde, después del recorrido de la línea + el
  // colchón de lectura, la sección entera escala/desvanece igual que el
  // resto de las transiciones del sitio — mismo pin de siempre, un solo
  // ScrollTrigger, cero riesgo de pines compitiendo. Sin cambios acá.
  const PHASE_VH = 1;
  const END_BUFFER_VH = 0.5;
  const SCALE_FADE_VH = 1; // tramo final de scale+fade hacia Trayectoria
  const STEPS_VH = PHASE_VH * TOTAL;
  const REVEAL_VH = STEPS_VH + END_BUFFER_VH; // línea + colchón (lo que antes era TOTAL_VH)
  const TOTAL_VH = REVEAL_VH + SCALE_FADE_VH; // + el tramo de cover, total del pin
  const activeRatio = STEPS_VH / TOTAL_VH;
  // Fracción de progreso (0-1) donde arranca el tramo de scale+fade.
  const coverStart = REVEAL_VH / TOTAL_VH;

  let currentIdx = 0;

  // Le asigna a CADA fase (no solo a la anterior y la nueva) el estado
  // que le toca según el índice activo: "is-past" (ya leída, arriba),
  // "is-current" (visible, centrada) o ninguna clase (todavía no
  // llegó, esperando abajo — ver ".idi__stage" en style.css). Al
  // resolver TODAS de una, en vez de solo togglear la anterior/nueva,
  // un ScrollTrigger.refresh() a mitad de camino (ej. al filtrar
  // Productos, que recalcula el layout de toda la página) puede correr
  // el progreso de golpe más de un paso sin dejar ninguna fase en un
  // estado a medio camino.
  function setActiveStage(idx) {
    if (idx === currentIdx) return;
    currentIdx = idx;
    stages.forEach((stage, i) => {
      stage.classList.remove("is-current", "is-past");
      if (i < idx) stage.classList.add("is-past");
      else if (i === idx) stage.classList.add("is-current");
    });
  }

  // Un nodo se "rellena" (".is-active", ver style.css) apenas la línea
  // dibujada lo alcanza — se compara directo contra el largo dibujado
  // (no contra la fase activa), así queda sincronizado exactamente con
  // lo que se ve, sin importar en qué momento cambia la fase de texto.
  function updateNodes(lineP) {
    nodes.forEach((node, i) => {
      const threshold = (i + 1) / TOTAL;
      node.classList.toggle("is-active", lineP >= threshold - 0.001);
    });
  }

  ScrollTrigger.create({
    // Pinea la SECCIÓN completa ("#idi-timeline"), no solo ".idi__process":
    // probado a mano que GSAP calcula mal el alto del pin-spacer cuando el
    // elemento pineado es justo el bloque interno (queda sin reservar el
    // espacio de scroll del recorrido, aunque el trigger reporte start/end
    // correctos) — pineando su contenedor se obtiene el mismo resultado
    // visual sin ese problema.
    trigger: section,
    start: "top top",
    end: () => "+=" + window.innerHeight * TOTAL_VH,
    pin: true,
    scrub: 1,
    onUpdate: (self) => {
      const p = self.progress;

      // La línea se dibuja con el scroll (stroke-dashoffset de 100% a
      // 0%); cada fase reemplaza a la anterior cuando el dibujo entra
      // en su propio tramo de 1/TOTAL.
      const lineP = gsap.utils.clamp(0, 1, p / activeRatio);
      gsap.set(pathEl, { strokeDashoffset: pathLength * (1 - lineP) });
      updateNodes(lineP);

      const idx = Math.min(TOTAL - 1, Math.floor(lineP * TOTAL));
      setActiveStage(idx);

      // Tramo final (sin cambios respecto de antes) — 0 hasta
      // "coverStart" (mientras dura el recorrido + el colchón de
      // lectura), luego escala/desvanece la SECCIÓN COMPLETA mientras
      // Trayectoria sube por detrás y la tapa. Misma curva que el
      // resto del sitio (90% del tramo hasta scale 0.92/opacity 0.55,
      // 10% final hasta opacity 0 — ver "outgoingPanels.forEach"/
      // "Capacidades → Sección 03" en initSectionTransitions()).
      const coverP = gsap.utils.clamp(0, 1, (p - coverStart) / (1 - coverStart));
      let scale;
      let opacity;
      if (coverP <= 0.9) {
        const t = coverP / 0.9;
        scale = gsap.utils.interpolate(1, 0.92, t);
        opacity = gsap.utils.interpolate(1, 0.55, t);
      } else {
        const t = (coverP - 0.9) / 0.1;
        scale = 0.92;
        opacity = gsap.utils.interpolate(0.55, 0, t);
      }
      gsap.set(section, { scale, opacity, pointerEvents: coverP > 0 ? "none" : "auto" });
    },
  });

  // Performance de los marcadores "CSS Reaction" (pedido explícito: "12
  // animaciones CSS infinitas simultáneas -- si genera jank, pausar las
  // que estén fuera del viewport"). Los 4 marcadores viven juntos dentro
  // del mismo tramo pineado, así que entran/salen de pantalla todos a la
  // vez -- alcanza con un único observer sobre la SECCIÓN completa (ya
  // en "section" de arriba), no uno por nodo. Solo alterna una clase que
  // CSS traduce en "animation-play-state:paused" (ver
  // ".idi-timeline--paused" en style.css) -- no toca ".is-active" ni la
  // lógica de scroll-progress de arriba, es un mecanismo aparte.
  if ("IntersectionObserver" in window) {
    const nodesIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          section.classList.toggle("idi-timeline--paused", !entry.isIntersecting);
        });
      },
      { threshold: 0 }
    );
    nodesIO.observe(section);
  }
});

/* ============================================================
   SECCION TRAYECTORIA — "Sticky Text + Cards en fila (tren vertical)"
   (pedido explícito, reemplaza al slider de flechas anterior)
   ----------------------------------------------------------------
   GSAP + ScrollTrigger (pin:true, scrub:0.4 — mismo patrón que
   "#idi-timeline" en este archivo, más arriba): un único progreso 0→1
   pinea la sección entera (el texto de la columna derecha queda fijo
   por construcción, al quedar pineado junto con el resto — no
   necesita su propia lógica).

   FIX (feedback: "no se tienen que superponer ni tener efecto de
   transparencia, pasan en fila para arriba"): se abandonó el
   crossfade por-card (yPercent+opacity individuales) a favor de un
   mecanismo mucho más simple y literal — las 4 cards viven en flujo
   normal, apiladas en columna con "gap: 10px" (ver ".tr__cards-track"
   en style.css, pedido explícito "separada por un margen de 10px
   aprox"), y es el TRACK ENTERO el que se traslada hacia arriba en
   línea recta (un solo "y" en px, sin opacity, sin per-card logic).
   La "ventana" que lo contiene (".tr__cards", id="trCards") es
   cuadrada y de tamaño fijo con overflow:hidden, así que en todo
   momento se ve solo una card completa; la siguiente ya está
   inmediatamente debajo (separada por el gap) y sube a medida que la
   de arriba desaparece recortada contra el borde superior de la
   ventana — exactamente "pasan en fila para arriba", sin
   superposición ni fundido.

   cardStep (alto de una card + el gap) se mide en vivo contra el DOM
   ("measure()") en vez de asumirse fijo, y se vuelve a medir en cada
   "onRefresh" de ScrollTrigger (resize, fonts/imágenes que cargan
   tarde) — evita que un cálculo cacheado desactualizado genere saltos.

   Mobile (pedido explícito "simplificar a cards apiladas en scroll
   vertical normal, sin pin"): por debajo de 900px no se crea el
   ScrollTrigger en absoluto — mismo criterio "snapshot" que
   "isTouch"/"prefersReducedMotion" en el resto del archivo (se lee
   una sola vez al cargar, no reactivo a resize). El CSS de esa misma
   media query (ver style.css) anula la ventana fija y el transform
   del track: al ser ya un flex-column con gap, queda como una lista
   vertical normal sin más cambios.

   Salida hacia Contacto: SIN efecto de scroll (pedido explícito,
   "sacale el efecto de scroll a esa parte de Trayectoria a Contacto")
   — antes tenía el mismo pin+scale+fade que el resto de las
   transiciones del sitio (tramo "SCALE_FADE_VH" extendiendo este
   mismo pin), pero contra un fondo celeste sólido ese efecto se sentía
   raro/no aportaba. Se sacó: el pin de acá termina apenas las 4 cards
   completan su recorrido, y de ahí en más el scroll hacia Contacto es
   100% nativo — Contacto ya tiene su propio "background" sólido (ver
   style.css), así que no hace falta ningún manejo especial de fondo
   para esta transición en particular. */
document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("trayectoria");
  const cardsWindow = document.getElementById("trCards");
  const track = document.getElementById("trCardsTrack");
  if (!section || !cardsWindow || !track) return;

  const cards = Array.from(track.querySelectorAll(".tr__card"));
  if (!cards.length) return;

  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (isMobile || prefersReducedMotion || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    return;
  }

  // FIX (feedback: "se scrollea una sola card y la otra sube apenas"):
  // la versión anterior medía el alto de una card en PX con
  // getBoundingClientRect() y lo cacheaba en "cardStep" — si esa
  // medición corría antes de que el layout terminara de resolver el
  // tamaño real de la card (fonts/CSS tardío, primer paint, etc.), el
  // track se movía una distancia en px equivocada (mucho más chica de
  // lo real) y el resultado era exactamente esto: parecía que "solo
  // avanzaba un poco".
  //
  // Ahora se usa "yPercent" en vez de "y" en px: GSAP calcula el
  // porcentaje CONTRA EL ALTO REAL DEL TRACK en el momento exacto de
  // cada frame — nunca depende de una medición cacheada de antemano,
  // así que no importa cuándo/cómo terminó de resolver el layout.
  // "-100 * (cards.length-1)/cards.length" es el yPercent que deja la
  // ÚLTIMA card exactamente enrasada con la ventana al final (el gap
  // de 10px entre cards es despreciable frente al alto de la card —
  // error de ~1-2px, imperceptible).
  const finalYPercent = -100 * ((cards.length - 1) / cards.length);

  function updateTrack(p) {
    gsap.set(track, { yPercent: p * finalYPercent });
  }

  updateTrack(0);

  // Pin único para el recorrido de cards (sin tramo de salida — ver
  // comentario grande arriba). "REVEAL_VH" es todo el pin.
  const REVEAL_VH = (cards.length - 1) * 0.55;

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () => "+=" + window.innerHeight * REVEAL_VH,
    pin: true,
    // Casi sin smoothing (pedido explícito "que vayan pasando
    // fluidamente") — responde prácticamente 1:1 al scroll.
    scrub: 0.1,
    onUpdate: (self) => {
      updateTrack(self.progress);
    },
  });
});

/* ============================================================
   SECCIÓN "CLARIDAD" (id="clarity") — animación de entrada por
   palabras del eyebrow + título (pedido explícito: mismo efecto
   "Accessible text by duplication" ya usado en ".contact__title",
   ver el bloque de acá abajo — mismos criterios, sin repetirlos todos
   acá). Eyebrow y título viven en el mismo bloque
   (".clarity-content") — pedido explícito "secuenciar en vez de
   animar ambos a la vez": un solo ScrollTrigger con un timeline que
   arranca las palabras del eyebrow primero y las del título un poco
   después (no espera a que el eyebrow termine del todo, se solapan un
   poco — timeline con offsets, no dos triggers independientes por
   separado, así el "poco después" queda relativo al arranque real, no
   a cuándo cada uno decida dispararse por su cuenta).

   No interfiere con el fade de SALIDA que ya tiene esta sección (ver
   más arriba en este archivo, ".clarity"/"clarityContent" dentro de
   "initSectionTransitions()"): ese apaga ".clarity-content" ENTERO
   (el padre) recién cuando la sección ya se scrolleó fuera de vista
   ('bottom bottom') — mucho después de que esta animación de entrada
   ya terminó. Las palabras quedan en opacity:1 para siempre (pedido
   "once:true"); si el padre se apaga y se vuelve a prender scrolleando
   para atrás, siguen ahí, visibles, sin re-animarse (correcto: ya
   "entraron" una vez).
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const claritySection = document.getElementById("clarity");
  const eyebrowEl = document.querySelector(".clarity-eyebrow");
  const titleEl = document.querySelector(".clarity-title");
  if (!claritySection || !eyebrowEl || !titleEl || typeof SplitText === "undefined" || typeof ScrollTrigger === "undefined") {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.fonts.ready.then(() => {
    const eyebrowSplit = SplitText.create(eyebrowEl, { type: "words", aria: "hidden" });
    const titleSplit = SplitText.create(titleEl, { type: "words", aria: "hidden" });

    if (prefersReducedMotion) {
      gsap.set(eyebrowSplit.words, { opacity: 1 });
      gsap.set(titleSplit.words, { opacity: 1 });
      return;
    }

    gsap
      .timeline({
        scrollTrigger: {
          trigger: claritySection,
          start: "top 80%",
          once: true,
          // Mismo fix que ".contact__title" más abajo: el
          // "invalidateOnRefresh:true" global del sitio (ver
          // "ScrollTrigger.defaults()") re-prima este tween a mitad de
          // camino en cualquier refresh posterior (fuentes/imágenes/
          // resize) y lo deja trabado sin llegar nunca a opacity:1 —
          // se pisa acá, sin tocar el resto del sitio.
          invalidateOnRefresh: false,
        },
      })
      .from(eyebrowSplit.words, { opacity: 0, duration: 2, ease: "sine.out", stagger: 0.1 }, 0)
      .from(titleSplit.words, { opacity: 0, duration: 2, ease: "sine.out", stagger: 0.1 }, 0.4);
  });
});

/* ============================================================
   TÍTULO DE CONTACTO — animación de entrada por palabras (pedido
   explícito: efecto "Accessible text by duplication" de GSAP —
   SplitText divide el título en palabras y las anima con fade-in
   progresivo, disparado por ScrollTrigger al entrar en viewport en vez
   de solo al cargar la página, "once:true" para que no se repita).
   ----------------------------------------------------------------
   Accesibilidad (parte central del efecto, pedido explícito "no
   omitir"): "SplitText" fragmenta el título en un <span> por palabra
   para poder animarlas por separado — eso le rompe la semántica a un
   lector de pantalla (deja de leerse como una frase). La solución ya
   está en el HTML (ver index.html, junto a ".contact__title"): el
   título real queda "aria-hidden" y hay un <h2 class="sr-only">
   duplicado al lado, con el texto íntegro sin fragmentar — eso es lo
   que un lector de pantalla percibe en su lugar. Acá solo hace falta
   NO tocar ese duplicado (nunca pasa por "SplitText.create()").
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.querySelector(".contact__title");
  if (!titleEl || typeof SplitText === "undefined" || typeof ScrollTrigger === "undefined") return;

  // Mismo criterio que el resto del sitio (ver ".tr__cards" más
  // arriba): con "prefers-reduced-motion" el texto aparece directo,
  // sin animar.
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.fonts.ready.then(() => {
    const split = SplitText.create(titleEl, { type: "words", aria: "hidden" });

    if (prefersReducedMotion) {
      gsap.set(split.words, { opacity: 1 });
      return;
    }

    gsap.from(split.words, {
      opacity: 0,
      duration: 2,
      ease: "sine.out",
      stagger: 0.1,
      scrollTrigger: {
        trigger: titleEl,
        start: "top 85%",
        once: true,
        // "ScrollTrigger.defaults()" (más arriba en este archivo) deja
        // "invalidateOnRefresh:true" GLOBAL para el resto del sitio (lo
        // necesitan los pines/scrubs cuando cambia el layout) — pero
        // para un fade-in "once" de una sola pasada es contraproducente:
        // cualquier "ScrollTrigger.refresh()" posterior (hay varios,
        // fuentes/imágenes/resize) volvía a "primar" el tween a
        // opacity:0 a mitad de la animación, dejando las palabras
        // trabadas en un punto intermedio para siempre (el trigger no
        // vuelve a dispararse, por el "once"). Se pisa el default acá
        // nomás, sin tocar el comportamiento del resto del sitio.
        invalidateOnRefresh: false,
      },
    });
  });
});

/* ============================================================
   FORMULARIO DE CONTACTO ("#contacto", pedido explícito — layout
   calcado de dragonfly.xyz/contact, ver comentario junto a
   "#contactForm" en index.html) — SOLO frontend: valida los campos
   requeridos con la API nativa del navegador y muestra un mensaje de
   confirmación en la propia página. NO envía el mail a ningún lado
   todavía.

   IMPORTANTE ANTES DE PUBLICAR: como el sitio no tiene backend propio,
   hace falta conectar el "fetch" comentado más abajo a un servicio de
   formularios (Formspree, Netlify Forms, Getform, EmailJS) o a un
   endpoint propio — todos aceptan un POST con los mismos campos que ya
   tiene este <form>. Mientras tanto, el submit se resuelve como si
   hubiera funcionado (para poder mostrar/probar el flujo completo),
   pero ningún dato se está mandando de verdad.

   ".contact__field--touched" (ver style.css): recién se agrega en el
   PRIMER intento de submit — así ningún campo se marca en rojo por
   ":invalid" mientras el usuario recién está llegando al formulario,
   solo después de que intentó enviarlo con algo sin completar.
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const statusEl = document.getElementById("contactStatus");
  const submitBtn = form.querySelector(".contact__submit");
  const fields = Array.from(form.querySelectorAll(".contact__field"));

  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.remove("contact__status--success", "contact__status--error");
    if (kind) statusEl.classList.add("contact__status--" + kind);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    fields.forEach((field) => field.classList.add("contact__field--touched"));

    if (!form.checkValidity()) {
      setStatus("Revisá los campos marcados antes de enviar.", "error");
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    setStatus("Enviando…");

    // ------------------------------------------------------------
    // ACÁ VA LA CONEXIÓN REAL (ver comentario de arriba) — ejemplo con
    // un servicio de formularios genérico, comentado a propósito:
    //
    // fetch("https://TU-ENDPOINT-O-SERVICIO/aca", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(Object.fromEntries(new FormData(form))),
    // })
    //   .then((res) => {
    //     if (!res.ok) throw new Error("bad response");
    //     form.reset();
    //     fields.forEach((field) => field.classList.remove("contact__field--touched"));
    //     setStatus("¡Gracias! Te vamos a contactar a la brevedad.", "success");
    //   })
    //   .catch(() => {
    //     setStatus("Hubo un error al enviar — probá de nuevo o escribinos por mail.", "error");
    //   })
    //   .finally(() => {
    //     if (submitBtn) submitBtn.disabled = false;
    //   });
    // ------------------------------------------------------------

    // Placeholder mientras no hay backend conectado (ver comentario de
    // arriba): simula el éxito del envío para poder probar el flujo.
    setTimeout(() => {
      form.reset();
      fields.forEach((field) => field.classList.remove("contact__field--touched"));
      setStatus("¡Gracias! Te vamos a contactar a la brevedad.", "success");
      if (submitBtn) submitBtn.disabled = false;
    }, 500);
  });
});

/* ============================================================
   CURSOR CUSTOM SOBRE LAS CARDS 3D DE TRAYECTORIA (pedido explícito:
   "reemplazar el cursor por el mismo cursor circular custom del Home,
   pero sin el texto click me — solo el redondel"). Reutiliza el MISMO
   elemento ".globe-cursor"/"#globeCursor" que ya arma "earth-hero.js"
   para el Home (mismo tamaño/color/comportamiento de seguimiento, ver
   ".globe-cursor"/".globe-cursor.is-hover" en style.css) — no se crea
   un cursor nuevo aparte, se le agregan más "activadores" al que ya
   existe. Vive acá, en script.js (no en cada "tr-*.js" por separado):
   los 4 <canvas> ya están en el DOM desde que carga la página (el HTML
   estático de index.html), completamente aparte de cuándo/si cada
   módulo WebGL termina de montar su escena — así que esto es pura
   lógica de UI/DOM, no necesita tocar ni depender de ningún archivo
   "tr-*.js".

   "is-plain" (ver style.css) apaga el texto "Click me" SIEMPRE para
   estos 4 activadores — a diferencia de "is-dismissed" (que en el Home
   recién apaga el texto después del primer click), acá nunca debe
   aparecer. Mismo criterio "solo no-touch" que el cursor del Home
   (":hover" persistente no existe en touch) y mismo lerp de
   seguimiento — pero un loop de rAF PROPIO en vez de reusar el de
   "earth-hero.js" (son archivos/momentos de carga independientes).

   No interfiere con "OrbitControls" de ninguno de los 4 módulos: son
   listeners de "mouseenter"/"mousemove"/"mouseleave" que solo leen la
   posición del mouse y escriben en el cursor custom — nunca llaman
   "preventDefault()"/"stopPropagation()", así que los propios
   listeners de "pointerdown"/"pointermove" que arma OrbitControls en
   el mismo <canvas> siguen recibiendo los eventos con total
   normalidad (el drag para rotar sigue andando igual). */
(function () {
  const cursorEl = document.getElementById("globeCursor");
  const canvases = document.querySelectorAll(
    ".tr__pcb-canvas, .tr__arm-canvas, .tr__planet-canvas, .tr__hud-canvas"
  );
  if (!cursorEl || !canvases.length) return;

  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  if (isTouch) return;

  const LERP = 0.18; // mismo valor que el cursor del Home
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId = null;

  function tick() {
    currentX += (targetX - currentX) * LERP;
    currentY += (targetY - currentY) * LERP;
    cursorEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    rafId = requestAnimationFrame(tick);
  }

  canvases.forEach((canvas) => {
    canvas.addEventListener("mouseenter", (e) => {
      canvas.style.cursor = "none";
      targetX = currentX = e.clientX;
      targetY = currentY = e.clientY;
      cursorEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      // "is-label" explícito afuera (pedido explícito "se ve click me en
      // las cards"): por si quedó pegado del Home (ver "is-label" en
      // earth-hero.js/style.css) por cualquier motivo — acá se fuerza a
      // apagado siempre que se entra a una card, sin depender de que el
      // Home lo haya limpiado bien solo.
      cursorEl.classList.remove("is-label");
      cursorEl.classList.add("is-visible", "is-hover", "is-plain");
      if (rafId === null) rafId = requestAnimationFrame(tick);
    });
    canvas.addEventListener("mousemove", (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    });
    canvas.addEventListener("mouseleave", () => {
      cursorEl.classList.remove("is-visible", "is-hover", "is-plain");
    });
  });
})();