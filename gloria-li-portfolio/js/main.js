/* ================================================================
   Gloria Li — portfolio scripts
   ----------------------------------------------------------------
   Contents
     1. Page navigation (tab switching)
     2. Sound engine (generative ambient + click, Web Audio API)
   ================================================================ */


/* ============================================================
   1. PAGE NAVIGATION
   ============================================================ */
function goTo(page, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  if (btn) btn.classList.add('active');
  window.scrollTo(0, 0);
  playClick();
}


/* ============================================================
   2. SOUND ENGINE
   ----------------------------------------------------------------
   No audio files — everything below is synthesized with the Web
   Audio API. Sound is off by default (autoplay-safe); the toggle
   button in the nav turns on a quiet generative ambient pad, and
   a soft paper-tab "tick" plays on every section change.
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

  // Gentle triad, C3 · E3 · G3 · C4 — a quiet "sage" drone.
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

/** A single soft "tick", played on navigation when sound is on. */
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

/** Wired to the nav's Sound button. */
function toggleSound(btn) {
  soundOn = !soundOn;
  btn.classList.toggle('on', soundOn);
  btn.setAttribute('aria-pressed', String(soundOn));
  btn.querySelector('.lbl').textContent = soundOn ? 'Sound on' : 'Sound';

  if (soundOn) {
    ensureCtx();
    startAmbient();
    playClick();
  } else {
    stopAmbient();
  }
}
