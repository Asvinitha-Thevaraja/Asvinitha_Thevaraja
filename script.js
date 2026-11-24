// ================= Helpers =================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function store(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
function load(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

// ================= Navbar =================
const navbar = $("#navbar");
const navLinks = $("#navLinks");
const menuToggle = $("#menuToggle");
const backToTop = $("#backToTop");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
  menuToggle.innerHTML = navLinks.classList.contains("open")
    ? '<i class="fa-solid fa-xmark"></i>'
    : '<i class="fa-solid fa-bars"></i>';
});
$$(".nav-links a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
  })
);

// Highlight the nav link of the section in view
const sections = $$("main section");
function onScroll() {
  const y = window.scrollY;
  navbar.classList.toggle("scrolled", y > 20);
  backToTop.classList.toggle("show", y > 500);

  let current = "home";
  sections.forEach((s) => {
    if (y >= s.offsetTop - 120) current = s.id;
  });
  $$(".nav-links a").forEach((a) =>
    a.classList.toggle("active", a.getAttribute("href") === "#" + current)
  );
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ================= Typing effect =================
const roles = ["Full Stack Developer", "Software Engineer", "Problem Solver"];
const typed = $("#typedRole");
let roleIdx = 0, charIdx = roles[0].length, deleting = true;
function typeLoop() {
  const word = roles[roleIdx];
  typed.textContent = word.slice(0, charIdx);
  if (deleting) {
    charIdx--;
    if (charIdx < 0) { deleting = false; roleIdx = (roleIdx + 1) % roles.length; charIdx = 0; }
  } else {
    charIdx++;
    if (charIdx > roles[roleIdx].length) { deleting = true; setTimeout(typeLoop, 1800); return; }
  }
  setTimeout(typeLoop, deleting ? 50 : 90);
}
setTimeout(typeLoop, 2000);

// ================= Profile photo =================
const profileImg = $("#profileImg");
const fallbackAvatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
      '<rect width="200" height="200" fill="#132c57"/>' +
      '<circle cx="100" cy="78" r="38" fill="#4fc3f7"/>' +
      '<path d="M30 180c8-40 38-60 70-60s62 20 70 60z" fill="#4fc3f7"/>' +
    "</svg>"
  );

const savedPhoto = load("portfolio_photo");
if (savedPhoto) profileImg.src = savedPhoto;
profileImg.addEventListener("error", () => { profileImg.src = fallbackAvatar; }, { once: true });
if (profileImg.complete && profileImg.naturalWidth === 0) profileImg.src = fallbackAvatar;

$("#photoUpload") && $("#photoUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    profileImg.src = reader.result;
    if (!store("portfolio_photo", reader.result)) {
      alert("Photo shown, but it's too large to remember after reload. Save it as assets/profile.jpg instead.");
    }
  };
  reader.readAsDataURL(file);
});

// ================= Skill bars + reveal on scroll =================
$$(".section-title, .skill-card, .project-slider, .cert-card, .timeline-item, .vol-card, .lang-card, .stat, .reach-card, .about-text, .edu-card")
  .forEach((el) => el.classList.add("reveal"));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      entry.target.querySelectorAll(".fill").forEach((f) => (f.style.width = f.dataset.width + "%"));
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.15 }
);
$$(".reveal").forEach((el) => observer.observe(el));

// ================= Contact: "Copy email" button =================
const copyBtn = $("#copyEmail");
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    const email = copyBtn.dataset.email;
    let ok = false;
    try { await navigator.clipboard.writeText(email); ok = true; } catch {
      // fallback for browsers without clipboard access
      const t = document.createElement("textarea");
      t.value = email; document.body.appendChild(t); t.select();
      try { ok = document.execCommand("copy"); } catch {}
      t.remove();
    }
    const label = copyBtn.querySelector("span");
    label.textContent = ok ? "Copied!" : "Try again";
    copyBtn.classList.toggle("copied", ok);
    setTimeout(() => { label.textContent = "Copy"; copyBtn.classList.remove("copied"); }, 1800);
  });
}

// ================= Footer year =================
$("#year").textContent = new Date().getFullYear();

// ================= Profile glow: brighter the closer the cursor gets =================
const ring = document.querySelector(".image-ring");
if (ring && window.matchMedia("(hover: hover)").matches) {
  const RANGE = 280; // px beyond the photo edge where the glow starts
  let frame = null;
  window.addEventListener("mousemove", (e) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      const r = ring.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy) - r.width / 2;
      const glow = Math.max(0, Math.min(1, 1 - dist / RANGE));
      ring.style.setProperty("--glow", glow.toFixed(3));
    });
  });
  document.addEventListener("mouseleave", () => ring.style.setProperty("--glow", 0));
}

// ================= Competition tabs (Hackathons / Ideathons) =================
document.querySelectorAll(".comp-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".comp-tab").forEach((t) => {
      const on = t === tab;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on);
      const panel = document.getElementById(t.dataset.target);
      panel.hidden = !on;
      // items inside a hidden list skip the scroll animation, so show them right away
      if (on) panel.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
    });
  });
});

// ================= Certificate thumbnails (finalist competitions) =================
// Each .cert-thumb shows only if its image exists (jpg, jpeg, png or webp with the same name).
const viewer = document.createElement("div");
viewer.className = "cert-viewer";
viewer.innerHTML = '<button class="cert-viewer-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button><img alt="" /><p></p>';
document.body.appendChild(viewer);
const viewerImg = viewer.querySelector("img");
const viewerTitle = viewer.querySelector("p");
function closeViewer() { viewer.classList.remove("open"); document.body.style.overflow = ""; }
viewer.addEventListener("click", (e) => { if (e.target !== viewerImg) closeViewer(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeViewer(); });

document.querySelectorAll(".cert-thumb").forEach((btn) => {
  const base = btn.dataset.cert.replace(/\.[a-z]+$/i, "");
  const tries = [btn.dataset.cert, base + ".jpeg", base + ".png", base + ".webp"];
  (function tryNext(i) {
    if (i >= tries.length) return; // no image yet: keep it hidden
    const probe = new Image();
    probe.onload = () => {
      btn.innerHTML = `<img src="${tries[i]}" alt="${btn.dataset.title}" loading="lazy" />`;
      btn.hidden = false;
      btn.addEventListener("click", () => {
        viewerImg.src = tries[i];
        viewerImg.alt = viewerTitle.textContent = btn.dataset.title;
        viewer.classList.add("open");
        document.body.style.overflow = "hidden";
      });
    };
    probe.onerror = () => tryNext(i + 1);
    probe.src = tries[i];
  })(0);
});


// ================= Certifications: "View Certificate" buttons =================
// Each button appears only when its file exists in assets/certificates/
// (same name as data-cert + .jpg / .jpeg / .png / .webp / .pdf).
// Images open in the viewer above; PDFs open in a new tab.
document.querySelectorAll(".cert-view-btn").forEach((btn) => {
  const base = btn.dataset.cert;
  const images = [".jpg", ".jpeg", ".png", ".webp"].map((ext) => base + ext);
  const show = (onClick) => { btn.hidden = false; btn.addEventListener("click", onClick); };
  (function tryImage(i) {
    if (i >= images.length) {
      // no image: try a PDF
      fetch(base + ".pdf", { method: "HEAD" })
        .then((r) => { if (r.ok) show(() => window.open(base + ".pdf", "_blank", "noopener")); })
        .catch(() => {});
      return;
    }
    const probe = new Image();
    probe.onload = () => show(() => {
      viewerImg.src = images[i];
      viewerImg.alt = viewerTitle.textContent = btn.dataset.title;
      viewer.classList.add("open");
      document.body.style.overflow = "hidden";
    });
    probe.onerror = () => tryImage(i + 1);
    probe.src = images[i];
  })(0);
});

// ================= Projects slider: one project at a time, endless loop =================
// A copy of the last project sits before the first, and a copy of the first sits after the last.
// When the slider lands on a copy it jumps (without animation) to the real project,
// so moving from the last project to the first always continues in the same direction.
(function () {
  const slider = document.querySelector(".project-slider");
  if (!slider) return;
  const viewport = slider.querySelector(".project-viewport");
  const track = slider.querySelector(".project-track");
  const slides = [...track.children];
  const n = slides.length;
  const dotsBox = document.querySelector(".slide-dots");
  const count = document.querySelector(".slide-count");
  if (n === 0) return;

  // copies for the seamless loop (must be added before the screenshot loader runs below)
  const firstCopy = slides[0].cloneNode(true);
  const lastCopy = slides[n - 1].cloneNode(true);
  [firstCopy, lastCopy].forEach((c) => {
    c.setAttribute("aria-hidden", "true");
    c.classList.add("slide-copy");
    c.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  });
  track.appendChild(firstCopy);
  track.insertBefore(lastCopy, slides[0]);

  let pos = 1;             // position in the track (0 = copy of last, 1..n = real, n+1 = copy of first)
  let animating = false;

  const dots = slides.map((_, i) => {
    const d = document.createElement("button");
    d.type = "button";
    d.setAttribute("aria-label", `Go to project ${i + 1}`);
    d.addEventListener("click", () => moveTo(i + 1));
    dotsBox.appendChild(d);
    return d;
  });

  const realIndex = () => (((pos - 1) % n) + n) % n;
  function setTransform(offsetPx = 0, animate = true) {
    track.style.transition = animate ? "" : "none";
    track.style.transform = `translateX(calc(${-pos * 100}% + ${offsetPx}px))`;
  }
  function updateUi() {
    const i = realIndex();
    dots.forEach((d, k) => d.classList.toggle("active", k === i));
    slides.forEach((s, k) => s.setAttribute("aria-hidden", k !== i));
    count.textContent = `${i + 1} / ${n}`;
  }
  function moveTo(p) {
    if (animating) return;
    if (p === pos) { setTransform(0, true); return; }
    pos = p;
    animating = true;
    setTransform(0, true);
    updateUi();
    clearTimeout(finishTimer);
    finishTimer = setTimeout(finish, 600); // backup in case the animation is switched off
  }
  // after sliding onto a copy, jump to the matching real project without animation
  let finishTimer = null;
  function finish() {
    clearTimeout(finishTimer);
    if (!animating) return;
    animating = false;
    if (pos === 0) { pos = n; setTransform(0, false); }
    else if (pos === n + 1) { pos = 1; setTransform(0, false); }
    void track.offsetWidth;                // apply the jump before the next animation
    track.style.transition = "";
  }
  track.addEventListener("transitionend", (e) => { if (e.target === track) finish(); });
  const next = () => moveTo(pos + 1);
  const prev = () => moveTo(pos - 1);

  slider.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });

  // swipe (touch) and drag (mouse)
  let startX = 0, startY = 0, dx = 0, dragging = false, moved = false;
  viewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || animating) return;
    dragging = true; moved = false; dx = 0;
    startX = e.clientX; startY = e.clientY;
    viewport.classList.add("dragging");
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      // mostly vertical: let the page scroll instead
      dragging = false; viewport.classList.remove("dragging"); setTransform(0, true); return;
    }
    if (Math.abs(dx) > 5) moved = true;
    setTransform(dx, false);
  });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove("dragging");
    track.style.transition = "";
    const threshold = viewport.clientWidth * 0.18;
    if (dx < -threshold) next();
    else if (dx > threshold) prev();
    else setTransform(0, true);
  };
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
  // a drag should not also click a link inside the card
  viewport.addEventListener("click", (e) => {
    if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
  }, true);
  viewport.addEventListener("dragstart", (e) => e.preventDefault());

  // touchpad: two-finger swipe left / right
  // One swipe = one project: after moving, ignore the rest of that swipe (touchpads keep
  // sending movement for a while after the fingers stop) until it has been quiet for 300 ms.
  let wheelSum = 0, wheelLock = false, quietTimer = null;
  viewport.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical scroll: leave the page alone
    e.preventDefault();
    clearTimeout(quietTimer);
    quietTimer = setTimeout(() => { wheelLock = false; wheelSum = 0; }, 300);
    if (wheelLock || animating) return;
    wheelSum += e.deltaX;
    if (Math.abs(wheelSum) > 50) {
      wheelSum > 0 ? next() : prev();
      wheelSum = 0; wheelLock = true;
    }
  }, { passive: false });

  setTransform(0, false);
  updateUi();
  requestAnimationFrame(() => { track.style.transition = ""; });
})();

// ================= Project screenshots =================
// Shows assets/projects/<name>.png / .jpg / .jpeg / .webp / .svg in the image space when the file exists.
// Clicking the screenshot opens it large in the certificate viewer.
document.querySelectorAll(".project-shot[data-img]").forEach((fig) => {
  const tries = [".png", ".jpg", ".jpeg", ".webp", ".svg"].map((ext) => fig.dataset.img + ext);
  (function tryNext(i) {
    if (i >= tries.length) return; // no screenshot yet: keep the placeholder
    const probe = new Image();
    probe.onload = () => {
      const img = document.createElement("img");
      img.src = tries[i];
      img.alt = fig.dataset.title || "";
      img.draggable = false;
      fig.appendChild(img);
      fig.classList.add("loaded");
      // tall phone screenshots: show the whole screen centred, with a blurred fill behind it
      if (probe.naturalHeight > probe.naturalWidth) {
        fig.classList.add("portrait");
        fig.style.setProperty("--shot", `url("${tries[i]}")`);
      }
      img.addEventListener("click", () => {
        if (typeof viewer === "undefined") return;
        viewerImg.src = tries[i];
        viewerImg.alt = viewerTitle.textContent = fig.dataset.title || "";
        viewer.classList.add("open");
        document.body.style.overflow = "hidden";
      });
    };
    probe.onerror = () => tryNext(i + 1);
    probe.src = tries[i];
  })(0);
});


// ================= Project images: white light follows the cursor behind the screen =================
document.querySelectorAll(".mock-wrap").forEach((wrap) => {
  wrap.addEventListener("mousemove", (e) => {
    const r = wrap.getBoundingClientRect();
    wrap.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
    wrap.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
  });
});

// ================= ANIMATIONS: stagger, tilt, counters =================
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1) cards in the same group appear one after another
  document.querySelectorAll(".reveal").forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    const i = siblings.indexOf(el);
    if (i > 0 && !reduce) {
      const delay = Math.min(i * 90, 540);
      el.style.transitionDelay = delay + "ms";
      // remove the delay only after the card has appeared, so hover effects stay instant
      const mo = new MutationObserver(() => {
        if (!el.classList.contains("visible")) return;
        mo.disconnect();
        setTimeout(() => { el.style.transitionDelay = ""; }, delay + 900);
      });
      mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    }
  });

  // 3) card tilt towards the cursor (only on devices with a mouse)
  if (!reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const MAX = 6; // degrees
    document.querySelectorAll(".cert-card, .vol-card, .skill-card, .about-card, .timeline-content, .reach-card .reach-row")
      .forEach((card) => {
        card.classList.add("tilt-card");
        if (getComputedStyle(card).position === "static") card.style.position = "relative";
        const shine = document.createElement("span");
        shine.className = "tilt-shine";
        card.prepend(shine);
        const big = card.offsetWidth > 500; // tilt big cards less
        card.addEventListener("mousemove", (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          const m = big ? MAX / 2.5 : MAX;
          card.style.transition = "transform .12s ease-out";
          card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * m}deg) rotateY(${(px - 0.5) * m}deg) translateY(-3px)`;
          card.style.setProperty("--sx", px * 100 + "%");
          card.style.setProperty("--sy", py * 100 + "%");
        });
        card.addEventListener("mouseleave", () => {
          card.style.transition = "transform .5s ease";
          card.style.transform = "";
        });
      });
  }

  // 4) numbers count up when they come into view
  const counters = [...document.querySelectorAll(".comp-tab .count")];
  if (counters.length && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const el = en.target, end = parseInt(el.textContent, 10) || 0;
        let n = 0;
        el.textContent = "0";
        const step = () => { n++; el.textContent = n; if (n < end) setTimeout(step, 900 / end); };
        if (end > 0) setTimeout(step, 200);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => io.observe(c));
  }
})();
