
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
        
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        shareBtn.setAttribute('aria-label', '¡Link copiado!');
        setTimeout(() => shareBtn.setAttribute('aria-label', 'Compartir'), 2000);
      } catch (err) {
        
      }
    }
  });
});


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
    
    
    
    
    
    
    
    .to('.island-logo', { opacity: 1, duration: 0.45, ease: 'back.out(1.7)' }, 0.1)
    .to('.bar-mid', { opacity: 0, duration: 0.15, ease: 'power2.in' }, 0)
    .to('.bar-top', { attr: { x1: 3, y1: 3, x2: 13, y2: 13 }, duration: 0.28, ease: 'power3.inOut' }, 0)
    .to('.bar-bot', { attr: { x1: 13, y1: 3, x2: 3, y2: 13 }, duration: 0.28, ease: 'power3.inOut' }, 0)
    .to('.menu-backdrop', { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
    .from('.menu-panel', { autoAlpha: 0, yPercent: -10, scale: 0.6, duration: 0.6, transformOrigin: 'top center', ease: 'back.out(1.7)' }, 0.1)
    
    
    
    
    
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


window.addEventListener('resize', () => {
  if (isOpen) toggleMenu();
});


document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.dfy-nav');
  const toggle = document.getElementById('dfyNavToggle');
  const menuLabel = document.getElementById('dfyNavMenuLabel');
  const panel = document.getElementById('dfyNavPanel');
  const logo = document.querySelector('.dfy-nav__logo');
  if (!nav || !toggle || !menuLabel || !panel || typeof gsap === 'undefined') return;

  const dots = gsap.utils.toArray('.dfy-nav__dot', nav);
  if (dots.length < 5) return;

  
  const CLOSED = [
    { x: -6, y: -6, rotation: 0 },
    { x: 6, y: -6, rotation: 0 },
    { x: 0, y: 0, rotation: 0 },
    { x: -6, y: 6, rotation: 0 },
    { x: 6, y: 6, rotation: 0 },
  ];
  
  
  
  
  
  
  
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

  
  
  window.addEventListener('resize', () => {
    if (isOpen) setOpen(false);
  });
});


document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const targetId = link.getAttribute('href').slice(1);
  if (!targetId) return; 

  link.addEventListener('click', (e) => {
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return; 

    e.preventDefault();
    if (isOpen && link.classList.contains('menu-link')) toggleMenu();

    gsap.to(window, {
      scrollTo: { y: targetEl, offsetY: 90, autoKill: true },
      duration: 1,
      ease: 'power2.inOut',
    });
  });
});


document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const texts = document.querySelector('.hero__texts');

  if (!texts || prefersReducedMotion || typeof gsap === 'undefined') return;

  gsap.from(texts.children, { opacity: 0, y: 12, duration: 0.8, ease: 'power2.out', delay: 0.9, stagger: 0.1 });
});




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


let s4FilterExtraScroll = 0;
let s4AccordionExtraScroll = 0;

function initSectionTransitions() {
  if (typeof ScrollTrigger === 'undefined') return;

  const hero = document.querySelector('.hero');
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const otherPanels = [];
  const idiSection = document.getElementById('idi-timeline');
  if (idiSection) otherPanels.push(idiSection);
  const panels = hero ? [hero, ...otherPanels] : otherPanels;

  
  if (panels.length < 2) return;

  
  
  
  const outgoingPanels = panels.slice(0, -1);

  outgoingPanels.forEach((panel) => {
    
    
    
    
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

    
    
    
    
    
    
    
    
    
    tl.fromTo(panel, { scale: 1, opacity: 1, pointerEvents: 'auto' }, { scale: 0.92, opacity: 0.55, duration: 0.9 }).to(panel, {
      opacity: 0,
      pointerEvents: 'none',
      duration: 0.1,
    });
  });

  
  addPinFadeTransition(document.getElementById('s3-caps'));
  
  
  
  
  
  
  addPinFadeTransition(document.getElementById('s4-intro'), {
    extraScroll: () => window.innerHeight + s4FilterExtraScroll + s4AccordionExtraScroll,
  });

  
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
      .to({}, { duration: 0.4 }) 
      .addLabel('exitStart')
      .fromTo(claritySection, { scale: 1, opacity: 1, pointerEvents: 'auto' }, { scale: 0.92, opacity: 0.55, duration: 0.9 }, 'exitStart')
      .fromTo(clarityContent || claritySection, { opacity: 1 }, { opacity: 0, duration: 0.3 }, 'exitStart')
      .to(claritySection, { opacity: 0, pointerEvents: 'none', duration: 0.1 });
  }

  

  
  
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => ScrollTrigger.refresh(), 200);
  });
}




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
      
      
      
      threshold: 0.15,
    }
  );

  revealEls.forEach((el) => observer.observe(el));
})();

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText);
ScrollTrigger.defaults({ anticipatePin: 1, invalidateOnRefresh: true });


function initCapacidadesGrid() {
  const section = document.querySelector(".pa");
  const cards = gsap.utils.toArray(".pa__card");
  if (!section || !cards.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  
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
      
      
      tiltX(px * 6);
      tiltY(py * -6);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initCapacidadesGrid();

  
  
  
  
  
  initSectionTransitions();

  
  
  
  
  
  
  
  
  
  

  
  
  
  ScrollTrigger.refresh();

  
  
  
  
  
  let capsResizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(capsResizeTimeout);
    capsResizeTimeout = setTimeout(() => ScrollTrigger.refresh(), 200);
  });
});


document.addEventListener("DOMContentLoaded", () => {
  if (typeof ScrollTrigger === "undefined") return;

  
  
  ScrollTrigger.refresh();

  
  
  
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
    syncPinSpacerBackgrounds();
  });
});


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
              ? { flickersPerChar: 3, frameDuration: 16 } 
              : { flickersPerChar: 6, frameDuration: 35 } 
          );
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  els.forEach((el) => observer.observe(el));
})();


(function () {
  const tabs = document.querySelectorAll("#prod-tabs .prod-tab");
  const rows = document.querySelectorAll("#prod-list .prod-row");
  if (!tabs.length || !rows.length) return;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  function refreshS4PinFade() {
    if (typeof ScrollTrigger === "undefined") return;
    
    
    
    
    const trigger = ScrollTrigger.getById("s4-intro__pinFade");
    if (!trigger) return;

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const startBefore = trigger.start;
    const progressBefore = trigger.progress;
    trigger.refresh();
    if (trigger.start < startBefore) {
      window.scrollTo(0, trigger.start + progressBefore * (trigger.end - trigger.start));
    }
  }

  
  
  
  
  
  
  let s4RefreshTimer = null;
  function scheduleS4Refresh() {
    clearTimeout(s4RefreshTimer);
    s4RefreshTimer = setTimeout(() => refreshS4PinFade(), 130);
  }

  
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

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (presentationEl) {
    presentationEl.addEventListener("transitionend", (e) => {
      if (e.target !== presentationEl || e.propertyName !== "max-height") return;
      scheduleS4Refresh();
    });
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
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

  
  
  
  
  if (typeof pdfjsLib !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  }

  function openPdfModal(pdfPath) {
    const modal = ensurePdfModal();
    const bodyEl = modal.querySelector(".pdf-modal-body");
    bodyEl.innerHTML = `<div class="pdf-modal-loading">Cargando…</div>`;
    
    
    
    document.body.style.overflow = "hidden";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    renderPdfIntoModal(pdfPath, bodyEl);
  }

  
  
  
  
  
  
  async function renderPdfIntoModal(pdfPath, bodyEl) {
    
    
    
    
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
    
    
    pdfModalEl.querySelector(".pdf-modal-body").innerHTML = "";
  }

  function updatePresentation(filter) {
    if (!presentationEl) return;

    const pdfPath = PRODUCT_PDFS[filter];

    if (!pdfPath) {
      
      
      presentationEl.classList.remove("is-visible");
      presentationEl.innerHTML = "";
      presentationEl.setAttribute("aria-hidden", "true");
      return;
    }

    
    
    
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
        
        
        
        
        
        
        
        
        row.style.order = match ? "-1" : "1";
      });

      
      
      
      
      
      
      
      
      s4FilterExtraScroll = filter === "all" ? 0 : window.innerHeight * 0.5;

      updatePresentation(filter);

      
      
      
      
      
      
      
      
      
      
      
      refreshS4PinFade();
    });
  });

  
  rows.forEach((row) => {
    row.addEventListener("click", () => {
      const category = row.getAttribute("data-category");
      const tab = document.querySelector(`#prod-tabs .prod-tab[data-filter="${category}"]`);
      if (!tab) return;

      
      
      
      
      
      
      
      
      if (tab.classList.contains("active")) return;

      tab.click();

      gsap.to(window, {
        scrollTo: { y: "#prod-tabs", offsetY: 90 },
        duration: 1,
        ease: "power2.inOut",
      });
    });
  });

  
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



(function () {
  const prodTabs = document.querySelectorAll(".prod-tab");
  if (!prodTabs.length) return;

  const PARTICLES_PER_TAB = 14; 

  prodTabs.forEach((tab) => {
    
    
    const label = tab.textContent;
    tab.innerHTML = `<span>${label}</span>`;

    const field = document.createElement("div");
    field.className = "particles-field";
    tab.appendChild(field);

    for (let i = 0; i < PARTICLES_PER_TAB; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      
      
      
      particle.style.setProperty("--x", `${Math.random() * 50 - 25}px`);
      particle.style.setProperty("--y", `${Math.random() * 50 - 25}px`);
      particle.style.animation = `particleFloat ${1 + Math.random() * 2}s infinite`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      field.appendChild(particle);
    }
  });
})();


document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("idi-timeline");
  if (!section || typeof ScrollTrigger === "undefined") return;

  const pathEl = section.querySelector(".idi__path-progress");
  const stages = gsap.utils.toArray(".idi__stage", section);
  const nodes = gsap.utils.toArray(".idi__node", section);
  const TOTAL = stages.length;

  if (!TOTAL || !pathEl) return;

  
  
  
  
  
  const VIEWBOX_W = 200;
  const VIEWBOX_H = 900;
  const pathLength = pathEl.getTotalLength();

  function pointAt(fraction) {
    const pt = pathEl.getPointAtLength(pathLength * fraction);
    return { left: (pt.x / VIEWBOX_W) * 100 + "%", top: (pt.y / VIEWBOX_H) * 100 + "%" };
  }

  
  
  
  nodes.forEach((node, i) => {
    const pt = pointAt((i + 1) / TOTAL);
    node.style.left = pt.left;
    node.style.top = pt.top;
  });

  
  
  gsap.set(pathEl, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
  stages[0].classList.add("is-current");

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const PHASE_VH = 1;
  const END_BUFFER_VH = 0.5;
  const SCALE_FADE_VH = 1; 
  const STEPS_VH = PHASE_VH * TOTAL;
  const REVEAL_VH = STEPS_VH + END_BUFFER_VH; 
  const TOTAL_VH = REVEAL_VH + SCALE_FADE_VH; 
  const activeRatio = STEPS_VH / TOTAL_VH;
  
  const coverStart = REVEAL_VH / TOTAL_VH;

  let currentIdx = 0;

  
  
  
  
  
  
  
  
  
  function setActiveStage(idx) {
    if (idx === currentIdx) return;
    currentIdx = idx;
    stages.forEach((stage, i) => {
      stage.classList.remove("is-current", "is-past");
      if (i < idx) stage.classList.add("is-past");
      else if (i === idx) stage.classList.add("is-current");
    });
  }

  
  
  
  
  function updateNodes(lineP) {
    nodes.forEach((node, i) => {
      const threshold = (i + 1) / TOTAL;
      node.classList.toggle("is-active", lineP >= threshold - 0.001);
    });
  }

  ScrollTrigger.create({
    
    
    
    
    
    
    trigger: section,
    start: "top top",
    end: () => "+=" + window.innerHeight * TOTAL_VH,
    pin: true,
    scrub: 1,
    onUpdate: (self) => {
      const p = self.progress;

      
      
      
      const lineP = gsap.utils.clamp(0, 1, p / activeRatio);
      gsap.set(pathEl, { strokeDashoffset: pathLength * (1 - lineP) });
      updateNodes(lineP);

      const idx = Math.min(TOTAL - 1, Math.floor(lineP * TOTAL));
      setActiveStage(idx);

      
      
      
      
      
      
      
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

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const finalYPercent = -100 * ((cards.length - 1) / cards.length);

  function updateTrack(p) {
    gsap.set(track, { yPercent: p * finalYPercent });
  }

  updateTrack(0);

  
  
  const REVEAL_VH = (cards.length - 1) * 0.55;

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () => "+=" + window.innerHeight * REVEAL_VH,
    pin: true,
    
    
    scrub: 0.1,
    onUpdate: (self) => {
      updateTrack(self.progress);
    },
  });
});


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
          
          
          
          
          
          
          invalidateOnRefresh: false,
        },
      })
      .from(eyebrowSplit.words, { opacity: 0, duration: 2, ease: "sine.out", stagger: 0.1 }, 0)
      .from(titleSplit.words, { opacity: 0, duration: 2, ease: "sine.out", stagger: 0.1 }, 0.4);
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.querySelector(".contact__title");
  if (!titleEl || typeof SplitText === "undefined" || typeof ScrollTrigger === "undefined") return;

  
  
  
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
        
        
        
        
        
        
        
        
        
        
        invalidateOnRefresh: false,
      },
    });
  });
});


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

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

    
    
    setTimeout(() => {
      form.reset();
      fields.forEach((field) => field.classList.remove("contact__field--touched"));
      setStatus("¡Gracias! Te vamos a contactar a la brevedad.", "success");
      if (submitBtn) submitBtn.disabled = false;
    }, 500);
  });
});


(function () {
  const cursorEl = document.getElementById("globeCursor");
  const canvases = document.querySelectorAll(
    ".tr__pcb-canvas, .tr__arm-canvas, .tr__planet-canvas, .tr__hud-canvas"
  );
  if (!cursorEl || !canvases.length) return;

  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  if (isTouch) return;

  const LERP = 0.18; 
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
