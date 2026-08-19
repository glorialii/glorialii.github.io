/* ================================================================
   Gloria Li — portfolio scripts
   ----------------------------------------------------------------
   Contents
     1. Page navigation (tab switching)
     2. Scroll-triggered reveal animation
     3. Scroll progress (the turtle riding the top bar)
     4. Click ripple effect
     5. Sound engine (ambient, motifs, ticks, drop, chime, whoosh, boop
        combo/fanfare, power-down, shimmer, unlock — Web Audio API)
     6. Card hover ticks + turtle logo easter egg
     7. More hover sounds — nav links, buttons, footer, résumé unlock
   ================================================================ */


/* ============================================================
   1. PAGE NAVIGATION
   ============================================================ */
function goTo(page, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  if (btn) btn.classList.add('active');
  window.scrollTo(0, 0);
  playPageMotif(page);
  playWhoosh();
  milestoneFired = false;
  requestAnimationFrame(revealVisible);
}


/* ============================================================
   2. SCROLL-TRIGGERED REVEAL
   ----------------------------------------------------------------
   Elements marked .reveal fade + drift into place as they enter
   the viewport, and also get an immediate pass whenever a page
   becomes active (so above-the-fold content doesn't wait on a
   scroll event that may never come).
   ============================================================ */
let revealObserver = null;

function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(el => revealObserver.observe(el));
  revealVisible();
}

/** Immediately reveal anything already sitting in the viewport (e.g. right after a tab switch). */
function revealVisible() {
  document.querySelectorAll('.reveal:not(.in-view)').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
      el.classList.add('in-view');
      if (revealObserver) revealObserver.unobserve(el);
    }
  });
}

document.addEventListener('DOMContentLoaded', initReveal);


/* ============================================================
   3. SCROLL PROGRESS
   ----------------------------------------------------------------
   A thin bar at the very top of the viewport fills as the current
   page is scrolled, with a small turtle riding its leading edge.
   ============================================================ */
let milestoneFired = false;

function updateScrollProgress() {
  const doc = document.documentElement;
  const scrollTop = doc.scrollTop || document.body.scrollTop;
  const scrollHeight = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
  const pct = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0;
  const fill = document.getElementById('scrollFill');
  if (fill) fill.style.width = pct + '%';

  if (pct >= 98 && !milestoneFired) {
    milestoneFired = true;
    playMilestone();
  }
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress);
document.addEventListener('DOMContentLoaded', updateScrollProgress);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function updateParallax() {
  if (prefersReducedMotion) return;
  const mark = document.querySelector('.hero-watermark');
  if (!mark) return;
  const y = window.scrollY * 0.12;
  mark.style.transform = `translateY(${y}px)`;
}
window.addEventListener('scroll', updateParallax, { passive: true });


/* ============================================================
   4. CLICK RIPPLE EFFECT
   ----------------------------------------------------------------
   A small sage droplet expands from wherever you click — purely
   visual, paired with a quiet "drop" sound when sound is on.
   ============================================================ */
document.addEventListener('click', (e) => {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.left = e.clientX + 'px';
  ripple.style.top = e.clientY + 'px';
  document.body.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
  playDrop();
});


/* ============================================================
   5. SOUND ENGINE
   ----------------------------------------------------------------
   No audio files — everything below is synthesized with the Web
   Audio API. Sound is off by default (autoplay-safe); the toggle
   button in the nav turns on a quiet generative ambient pad, and
   layers in a click, a ripple "drop", a hover chime on photos, a
   soft tick on hovered cards, and a boop on the turtle logo.
   ============================================================ */

let audioCtx     = null;
let ambientNodes = null;
let soundOn      = false;

/** Lazily create (or resume) the shared AudioContext. */
function ensureCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/** Start the ambient drone: a slow, detuned triad with a breathing filter. */
function startAmbient() {
  const ctx = ensureCtx();

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.4);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.connect(master);

  // Gentle triad, C3 · E3 · G3 · C4.
  const freqs = [130.81, 164.81, 196.00, 261.63];
  const oscs = freqs.map((f, i) => {
    const o = ctx.createOscillator();
    o.type = i % 2 === 0 ? 'sine' : 'triangle';
    o.frequency.value = f;

    const g = ctx.createGain();
    g.gain.value = 0.22 / freqs.length;

    o.connect(g);
    g.connect(filter);
    o.start();
    return o;
  });

  // Slow LFO breathing on the filter cutoff.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.045;

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 260;

  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  ambientNodes = { master, oscs, lfo, filter };
}

/** Fade out and tear down the ambient drone. */
function stopAmbient() {
  if (!ambientNodes) return;

  const { master, oscs, lfo } = ambientNodes;
  const ctx = audioCtx;

  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);

  setTimeout(() => {
    oscs.forEach(o => { try { o.stop(); } catch (e) {} });
    try { lfo.stop(); } catch (e) {}
  }, 700);

  ambientNodes = null;
}

/** A single soft click, played on navigation when sound is on. */
function playClick() {
  if (!soundOn || !audioCtx) return;

  const ctx = audioCtx;
  const t = ctx.currentTime;

  const o = ctx.createOscillator();
  const g = ctx.createGain();

  o.type = 'triangle';
  o.frequency.setValueAtTime(520, t);
  o.frequency.exponentialRampToValueAtTime(220, t + 0.09);

  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);

  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.14);
}

/** Wired to the nav's sound button. */
function toggleSound(btn) {
  soundOn = !soundOn;
  btn.classList.toggle('on', soundOn);
  btn.setAttribute('aria-pressed', String(soundOn));

  if (soundOn) {
    ensureCtx();
    startAmbient();
    playClick();
  } else {
    stopAmbient();
    playPowerDown();
  }
}

/** A soft two-note chime, played when hovering a photo (only while sound is on). */
function playHoverChime() {
  if (!soundOn || !audioCtx) return;

  const ctx = audioCtx;
  const t = ctx.currentTime;
  const notes = [659.25, 987.77]; // E5, B5 — a quiet fifth

  notes.forEach((freq, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;

    const start = t + i * 0.05;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(i === 0 ? 0.09 : 0.05, start + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);

    o.connect(g);
    g.connect(ctx.destination);
    o.start(start);
    o.stop(start + 0.6);
  });
}

/** A quiet water-drop "plip", played on every click when sound is on. */
function playDrop() {
  if (!soundOn || !audioCtx) return;

  const ctx = audioCtx;
  const t = ctx.currentTime;

  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(720, t);
  o.frequency.exponentialRampToValueAtTime(280, t + 0.16);

  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.07, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.24);
}

/** A short, quiet tick played when hovering a card. Frequency varies slightly per element for texture. */
function playTick(freq) {
  if (!soundOn || !audioCtx) return;

  const ctx = audioCtx;
  const t = ctx.currentTime;

  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = freq || 440;

  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.045, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.1);
}

/** A playful little "boop" for the turtle logo — pitches up a bit each time it's boop'd in a row. */
function playBoop(step) {
  if (!soundOn || !audioCtx) return;

  const ctx = audioCtx;
  const t = ctx.currentTime;
  const bump = 1 + ((step || 1) - 1) * 0.12;

  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(340 * bump, t);
  o.frequency.exponentialRampToValueAtTime(620 * bump, t + 0.14);

  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.13, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.22);
}

/** A little celebratory run — the reward for boop-ing the turtle five times in a row. */
function playFanfare() {
  playMotif([523.25, 659.25, 783.99, 1046.50], { gap: 0.09, dur: 0.3, peak: 0.11, type: 'triangle' });
}

/** A soft, airy sparkle — plays when hovering the activity ticker. */
function playShimmer() {
  playMotif([659.25, 783.99, 987.77, 1174.66], { gap: 0.06, dur: 0.55, peak: 0.035, type: 'sine' });
}

/** A short filtered-noise "whoosh", played alongside every page transition. */
function playWhoosh() {
  if (!soundOn || !audioCtx) return;

  const ctx = audioCtx;
  const t = ctx.currentTime;

  const dur = 0.32;
  const bufferSize = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 0.8;
  filter.frequency.setValueAtTime(300, t);
  filter.frequency.exponentialRampToValueAtTime(2200, t + dur * 0.85);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);
  src.start(t);
  src.stop(t + dur + 0.02);
}

/** A quiet descending tone, played the moment ambient sound is switched off. */
function playPowerDown() {
  if (!audioCtx) return;

  const ctx = audioCtx;
  const t = ctx.currentTime;

  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(500, t);
  o.frequency.exponentialRampToValueAtTime(170, t + 0.26);

  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.32);
}

/** Plays a short run of notes, one after another. Used for page motifs, milestone, and unlock. */
function playMotif(freqs, opts) {
  if (!soundOn || !audioCtx) return;
  const { gap = 0.055, dur = 0.16, peak = 0.09, type = 'triangle' } = opts || {};

  const ctx = audioCtx;
  const t = ctx.currentTime;

  freqs.forEach((freq, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;

    const start = t + i * gap;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    o.connect(g);
    g.connect(ctx.destination);
    o.start(start);
    o.stop(start + dur + 0.02);
  });
}

// One tiny pentatonic motif per section, so navigating around has its own melody.
const PAGE_MOTIFS = {
  home:       [261.63, 329.63, 392.00],          // C4 E4 G4
  experience: [392.00, 440.00, 523.25],          // G4 A4 C5
  projects:   [329.63, 392.00, 523.25],          // E4 G4 C5
  skills:     [440.00, 523.25, 659.25],          // A4 C5 E5
  athletics:  [293.66, 392.00, 587.33],          // D4 G4 D5 — a bigger leap, more energy
};
function playPageMotif(page) {
  playMotif(PAGE_MOTIFS[page] || PAGE_MOTIFS.home, { gap: 0.05, dur: 0.14, peak: 0.08 });
}

/** A quick, quiet tick for hovering nav links, buttons, and footer links. */
function playHoverTick(freq) {
  if (!soundOn || !audioCtx) return;

  const ctx = audioCtx;
  const t = ctx.currentTime;

  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.value = freq || 500;

  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.045, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.08);
}

/** A small triumphant run, played once when you scroll to the bottom of a page. */
function playMilestone() {
  playMotif([523.25, 659.25, 783.99], { gap: 0.07, dur: 0.22, peak: 0.08, type: 'sine' });
}

/** A quick sparkly arpeggio for résumé downloads. */
function playUnlock() {
  playMotif([440.00, 554.37, 659.25, 880.00], { gap: 0.045, dur: 0.16, peak: 0.09, type: 'triangle' });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.hero-photo, .ath-photo').forEach(el => {
    el.addEventListener('mouseenter', playHoverChime);
  });
});


/* ============================================================
   6. CARD HOVER TICKS + TURTLE LOGO EASTER EGG
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const cardNotes = [392.0, 440.0, 493.88, 523.25, 587.33]; // G4 A4 B4 C5 D5
  const cards = document.querySelectorAll('.stat-cell, .proj-item, .exp-item, .skill-col');
  cards.forEach((el, i) => {
    el.addEventListener('mouseenter', () => playTick(cardNotes[i % cardNotes.length]));
  });
});

/** Wired to the nav turtle logo's click handler. Boop it 5x in a row for a little fanfare. */
let boopCount = 0;
let boopResetTimer = null;
function boopTurtle(mark) {
  const icon = mark.querySelector('.mark-icon');
  icon.classList.remove('bounce');
  void icon.offsetWidth; // restart animation
  icon.classList.add('bounce');

  clearTimeout(boopResetTimer);
  boopCount++;

  if (boopCount >= 5) {
    playFanfare();
    boopCount = 0;
  } else {
    playBoop(boopCount);
  }
  boopResetTimer = setTimeout(() => { boopCount = 0; }, 1500);
}


/* ============================================================
   7. MORE HOVER SOUNDS — nav links, buttons, footer + résumé unlock
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Nav links each get the root note of their page's motif.
  const navNotes = [261.63, 392.00, 329.63, 440.00, 293.66]; // home, experience, projects, skills, athletics
  document.querySelectorAll('.nav-link').forEach((el, i) => {
    el.addEventListener('mouseenter', () => playHoverTick(navNotes[i % navNotes.length]));
  });

  // Buttons get a slightly brighter tick.
  document.querySelectorAll('.btn').forEach(el => {
    el.addEventListener('mouseenter', () => playHoverTick(560));
  });

  // Footer links, a touch softer/lower.
  document.querySelectorAll('.foot-links a').forEach(el => {
    el.addEventListener('mouseenter', () => playHoverTick(420));
  });

  // Every résumé download link gets a little "unlock" sparkle on click.
  document.querySelectorAll('a[download]').forEach(el => {
    el.addEventListener('click', playUnlock);
  });

  // The activity ticker gets a soft airy shimmer when you hover it to pause it.
  const ticker = document.querySelector('.ticker-viewport');
  if (ticker) ticker.addEventListener('mouseenter', playShimmer);
});
