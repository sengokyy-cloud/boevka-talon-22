/* Illustrated interludes. No text, audio, or network beyond local art. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const ownScript = document.currentScript?.src || document.baseURI;
  const local = (path) => new URL(path, ownScript).href;
  const active = new WeakMap(), cache = new Map();
  const defaults = 3, maxCache = 16;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const motions = {
    '01': ['fold', '#d8e8d0', '#729d9c', 1, 52],
    '02': ['leaf', '#e5bd7b', '#a6b567', 1, 47],
    '03': ['water', '#ffebae', '#8ebbbb', -1, 55],
    '04': ['bubble', '#f6cfa8', '#b86072', 1, 52],
    '05': ['leaf', '#dbb778', '#b7ba81', -1, 60],
    '06': ['leaf', '#eece90', '#c3a46e', 1, 49],
    '07': ['water', '#f8da9b', '#c48e83', -1, 61],
    '08': ['fire', '#ffe6a6', '#f5ba62', 1, 51],
    '09': ['hinge', '#eacba2', '#b07750', -1, 50]
  };
  const framePaths = (from, options = {}) => (Array.isArray(options) ? options : options.frames) || Array.from(
    { length: Math.max(0, Math.min(8, options.frameCount ?? defaults)) },
    (_, i) => `art/sequences/${from}-${String(i + 1).padStart(2, '0')}.webp`
  );
  function load(path) {
    const key = local(path);
    if (cache.has(key)) {
      const promise = cache.get(key);
      cache.delete(key); cache.set(key, promise);
      return promise;
    }
    const promise = new Promise(resolve => {
      const img = new Image();
      let done = false;
      const finish = value => {
        if (done) return;
        done = true; clearTimeout(timer);
        img.onload = img.onerror = null;
        resolve(value);
      };
      const timer = setTimeout(() => finish(null), 3000);
      img.onload = () => {
        if (typeof img.decode !== 'function') return finish(img);
        img.decode().then(() => finish(img), () => finish(img.naturalWidth ? img : null));
      };
      img.onerror = () => finish(null);
      img.src = key;
    });
    cache.set(key, promise);
    if (cache.size > maxCache) cache.delete(cache.keys().next().value);
    return promise;
  }
  /**
   * Warm the source scene's interlude and the next scene's main art.
   * @param {string} from two-digit source scene ID (e.g. "03")
   * @param {string[]|{frames?:string[],frameCount?:number,destination?:string}} [options]
   *   Paths, relative to cinema.js or absolute; an array sets exact chronological order.
   * @returns {Promise<(HTMLImageElement|null)[]>} decoded frames, or null for each unavailable frame
   */
  function preload(from, options) {
    if (reduced?.matches || !motions[from]) return Promise.resolve([]);
    const next = String(Number(from) + 1).padStart(2, '0');
    load(options?.destination || `art/${next}.webp`);
    return Promise.all(framePaths(from, options).map(load));
  }
  function div(cls, style, parent) {
    const el = document.createElement('div');
    el.className = cls;
    Object.assign(el.style, style);
    parent.append(el);
    return el;
  }
  function svgNode(name, props, host) {
    const el = document.createElementNS(NS, name);
    Object.entries(props).forEach(([key, value]) => el.setAttribute(key, value));
    host.append(el);
    return el;
  }
  function anim(run, el, keyframes, timing) {
    if (!el.animate) return null;
    const a = el.animate(keyframes, { fill: 'both', ...timing });
    run.animations.push(a);
    return a;
  }
  function clock(run, delay) {
    return new Promise(resolve => {
      if (run.done) return resolve(false);
      const id = setTimeout(() => { run.timers.delete(id); resolve(true); }, delay);
      run.timers.set(id, resolve);
    });
  }
  function destroy(run) {
    if (run.done) return;
    run.done = true;
    run.abortWait?.(null);
    run.timers.forEach((resolve, id) => { clearTimeout(id); resolve(false); });
    run.timers.clear();
    run.animations.forEach(a => a.cancel());
    run.shell?.remove();
    if (active.get(run.root) === run) active.delete(run.root);
  }
  /** Cancel playback and remove art layers synchronously; the pending play() resolves false. */
  function cancel(root) {
    const run = active.get(root);
    if (run) destroy(run);
  }
  function revealedPaper(type, dir, late) {
    const horizontal = (points) => 'polygon('+points.map(([x,y])=>(dir>0?100-x:x)+'% '+y+'%').join(',')+')';
    const outlines = type==='water' ? [
      [[0,0],[0,0],[0,32],[0,60],[0,100],[0,100]],
      [[0,0],[21,0],[16,32],[27,60],[22,100],[0,100]],
      [[0,0],[70,0],[57,32],[72,60],[66,100],[0,100]],
      [[0,0],[100,0],[100,32],[100,60],[100,100],[0,100]]
    ] : [
      [[0,0],[0,0],[0,48],[0,100],[0,100]],
      [[0,0],[20,0],[23,48],[30,100],[0,100]],
      [[0,0],[62,0],[65,48],[78,100],[0,100]],
      [[0,0],[100,0],[100,48],[100,100],[0,100]]
    ];
    if(type==='hinge'||late==='notebook') return [
      'polygon(0 100%,50% 100%,100% 100%,100% 100%,0 100%)',
      'polygon(0 80%,50% 89%,100% 75%,100% 100%,0 100%)',
      'polygon(0 35%,50% 48%,100% 29%,100% 100%,0 100%)',
      'polygon(0 0,50% 0,100% 0,100% 100%,0 100%)'
    ];
    return outlines.map(horizontal);
  }
  function visual(run, frame, dir, duration, pos, index, ending = false) {
    const panel = div('cinema-panel', {
      position: 'absolute', inset: '0', overflow: 'hidden',
      zIndex: String(2 + index), transform: 'translateZ(0)'
    }, run.shell);
    const picture = frame.cloneNode();
    picture.alt = '';
    picture.draggable = false;
    Object.assign(picture.style, {
      display: 'block', width: '100%', height: '100%', objectFit: 'contain',
      objectPosition: ending ? pos : `center ${pos}%`,
      transformOrigin: ending ? '50% 50%' : `50% ${pos}%`
    });
    {
      // Fill aspect-ratio slack with a softened copy of the same illustration.
      // Keep the original fully visible on small/wide screens; no white letterboxing.
      const mat = picture.cloneNode();
      Object.assign(mat.style, {
        position: 'absolute', inset: '0', objectFit: 'cover', transform: 'scale(1.12)',
        filter: 'blur(17px) brightness(.7)', pointerEvents: 'none'
      });
      panel.append(mat);
      const mount = div('cinema-image-mount', { position: 'absolute', inset: ending ? '0' : '2.75%' }, panel);
      if (!ending) picture.style.objectPosition = 'center';
      mount.append(picture);
      if (!ending) anim(run, mount, [
        { transform: `translate(${dir * 1.5}%, .45%) scale(.985)` },
        { transform: `translate(${-dir * .55}%, -.2%) scale(1.018)` }
      ], { duration, easing: 'ease-out' });
    }
    if (ending) anim(run, picture, [
      { transform: `translate(${dir * .35}%, 0) scale(.985)` },
      { transform: 'scale(1)' }
    ], { duration, easing: ending ? 'cubic-bezier(.22,.72,.31,1)' : 'ease-out' });
    if (index > 0) {
      const vertical = run.motif==='hinge';
      const swipe = revealedPaper(run.motif,dir,ending&&vertical?'notebook':null);
      const flipMs = vertical ? 745 : run.motif==='water' ? 610 : 510;
      anim(run, panel, swipe.map((clipPath,i) => ({ clipPath, offset: [0,.30,.67,1][i] })), {
        duration: ending ? Math.max(650,flipMs) : flipMs, easing: 'cubic-bezier(.40,.05,.22,1)'
      });
      const creaseInk = vertical
        ? 'linear-gradient(0deg,transparent 7%,#53391f40 32%,#fce6ac90 48%,#fff3d586 53%,#4f392d63 57%,transparent 92%)'
        : 'linear-gradient(90deg,transparent 6%,#49342145 42%,#f5deb377 52%,#f8eaca66 55%,#4233293b 59%,transparent 96%)';
      const fold = div('cinema-fold', {
        position: 'absolute', inset: vertical ? '0 -14% auto -14%' : '-15% auto -15% 0',
        width: vertical ? '128%' : '23%', height: vertical ? '26%' : '130%',
        zIndex: String(12 + index), opacity: '0', pointerEvents: 'none', background:creaseInk,
      }, run.shell);
      const sides = vertical ? [365,265,106,-100] : dir > 0 ? [495,382,185,-125] : [-125,90,300,495];
      anim(run, fold, sides.map((x, i) => ({
        transform: vertical ? `translateY(${x}%) skewY(-6deg)` : `translateX(${x}%) skewX(${dir * (ending ? 10 : 7)}deg)`,
        opacity: [0,.60,.66,0][i], offset: [0,.30,.67,1][i]
      })), { duration: ending ? Math.max(650,flipMs) : flipMs, easing: 'ease-in-out' });
    }
    return panel;
  }
  function atmosphere(run, profile, duration) {
    const [type, light, dark, dir] = profile;
    const svg = svgNode('svg', { viewBox: '0 0 100 170', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' }, run.shell);
    Object.assign(svg.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', zIndex: '30', pointerEvents: 'none', overflow: 'hidden' });
    if (type === 'water') {
      for (let i = 0; i < 5; i++) {
        const y = 114 + 9 * i;
        const shape = svgNode('path', { d: `M${2 + 9*i},${y} q18,-3 32,0 t34,0 q10,-2 16,-1`, fill: 'none',
          stroke: i % 2 ? dark : light, 'stroke-width': i % 2 ? '.45' : '.62', 'stroke-linecap': 'round', opacity: '0' }, svg);
        anim(run, shape, [
          { opacity: 0, transform: 'translateX(-8%)' }, { opacity: .47, offset: .28 },
          { opacity: .31, offset: .67 }, { opacity: 0, transform: 'translateX(15%)' }
        ], { duration: duration * .62, delay: 95 + i * 115, easing: 'ease-out' });
      }
      return;
    }
    const n = type === 'fire' ? 7 : type === 'hinge' ? 4 : 6;
    for (let i = 0; i < n; i++) {
      const x = 12 + (i * 29) % 81;
      const y = (type === 'fire' ? 77 : 45) + (i * 17) % 61;
      const radius = [1.1, .48, .65, 1.28][i % 4];
      const group = svgNode('g', { opacity: '0' }, svg);
      const g = svgNode('g', { transform: `translate(${x} ${y})` }, group);
      if (type === 'fire') {
        svgNode('circle', { cx: 0, cy: 0, r: radius * 3, fill: dark, opacity: '.24' }, g);
        svgNode('circle', { cx: 0, cy: 0, r: radius, fill: light }, g);
      } else if (type === 'bubble') {
        svgNode('circle', { cx: 0, cy: 0, r: radius * 2.4, fill: 'none', stroke: light, 'stroke-width': '.43' }, g);
        svgNode('circle', { cx: -.65, cy: -.7, r: '.34', fill: light }, g);
      } else if (type === 'hinge' || type === 'fold') {
        svgNode('path', { d: 'M-1.3,0 L.7,-1.7 L1.6,.8 Z', fill: i % 2 ? dark : light, opacity: '.86' }, g);
      } else {
        svgNode('path', { d: 'M-2.3,1 Q-2,-1.4 2.35,-1.2 Q1.2,1.8 -2.3,1Z', fill: i % 2 ? light : dark }, g);
        svgNode('path', { d: 'M-1.95,1 L1.5,-.95', stroke: '#594c2b64', 'stroke-width': '.24' }, g);
      }
      const dy = type === 'bubble' || type === 'fire' ? -23 : type === 'hinge' ? -11 : 16;
      anim(run, group, [
        { opacity: 0, transform: 'translate(0, 0)' },
        { opacity: .53, transform: `translate(${dir * 6}%, ${dy * .27}%)`, offset: .26 },
        { opacity: type === 'fire' ? .93 : .64, transform: `translate(${dir * 18}%, ${dy * .59}%)`, offset: .68 },
        { opacity: 0, transform: `translate(${dir * 30}%, ${dy}%)` }
      ], { duration: duration * ((i % 3 + 6) * .095), delay: 140 + i * 100, easing: 'ease-in-out' });
    }
  }
  /**
   * Play a forward, adjacent interlude inside the artwork-only window.
   * @param {HTMLElement} root artwork viewport; no UI or text is inserted.
   * @param {object} opts
   * @param {string} opts.from two-digit source scene ID
   * @param {string} opts.to two-digit adjacent destination scene ID
   * @param {string|{label?:string}} [opts.choice] optional visual palette variation
   * @param {string[]} [opts.frames] exact chronological list including optional nature inserts
   * @param {number} [opts.frameCount=3] count for numbered autodiscovery if no explicit list
   * @param {number} [opts.msPerFrame] custom panel cadence, bounded at 650–1600 ms
   * @param {number} [opts.frameMs] backward-compatible cadence alias
   * @param {string} [opts.destination] destination main illustration path
   * @param {string} [opts.destinationPosition] CSS object-position for last image
   * @param {function({frame:string,index:number,count:number,progress:number}):void} [opts.onBeat]
   *   Called at each panel and on arrival; arrival index equals count and progress equals 1.
   * @returns {Promise<boolean>} true on arrival; false on cancellation, skipped or unavailable sequence.
   *   On true, update the app's main art immediately; the bridge overlay remains for two animation frames.
   *   To make a Skip button: call cancel(root) and route to the destination in app state.
   */
  async function play(root, opts = {}) {
    const { from, to, onBeat } = opts;
    if (!root) return false;
    cancel(root);
    if (reduced?.matches || !motions[from] || Number(to) !== Number(from) + 1 ||
        typeof Element.prototype.animate !== 'function') return false;
    const run = { root, motif:motions[from][0], timers: new Map(), animations: [], done: false, shell: null };
    active.set(root, run);
    const abortWait = new Promise(resolve => run.abortWait = resolve);
    // Keep any decoded panels available under a slow or intermittent connection.
    const paths = framePaths(from, opts);
    const ready = Array(paths.length).fill(null);
    let arrived = null;
    const end = load(opts.destination || `art/${to}.webp`).then(image => arrived = image);
    const loadList = Promise.all([Promise.all(paths.map((path, n) => load(path).then(image => ready[n] = image))), end]);
    const assets = await Promise.race([loadList, clock(run, 2200).then(() => [ready.slice(), arrived]), abortWait]);
    if (run.done || !assets) { destroy(run); return false; }
    const source = root.querySelector('.scene-art');
    const frames = assets[0].filter(Boolean), destination = assets[1];
    if (!frames.length || !destination) { destroy(run); return false; }
    const profile = motions[from].slice();
    const choice = typeof opts.choice === 'string' ? opts.choice : (opts.choice?.label || '');
    if (from === '04' && /дын/i.test(choice)) profile[2] = '#aea967';
    const [, , , dir, focus] = profile;
    const cadence = frames.length === 1 ? 1570 : frames.length > 3 ? 1120 : 1300;
    const requestedCadence = opts.msPerFrame ?? opts.frameMs;
    const step = Number.isFinite(requestedCadence) ? Math.max(650, Math.min(1600, requestedCadence)) : cadence;
    const tail = run.motif==="hinge" ? 790 : 695;
    run.shell = div('cinema-insert', {
      position: 'absolute', inset: '0', zIndex: '5', overflow: 'hidden',
      isolation: 'isolate', pointerEvents: 'none', contain: 'layout paint'
    }, root);
    run.shell.setAttribute('aria-hidden', 'true');
    const panels = [];
    if (source?.naturalWidth) {
      const backing = visual(run, source, dir, 360, getComputedStyle(source).objectPosition, 0, true);
      panels.push(backing);
    }
    const beat = (frame, index) => {
      if (typeof onBeat !== 'function') return;
      try { onBeat({ frame, index, count: frames.length, progress: index / frames.length }); }
      catch (_) { /* A callback must not strand the transition overlay. */ }
    };
    atmosphere(run, profile, frames.length * step + tail);
    try {
      for (let i = 0; i < frames.length; i++) {
        panels.push(visual(run, frames[i], i % 2 === 0 ? dir : -dir, step + 600, focus, i + 1));
        beat(frames[i].src, i);
        if (!await clock(run, step)) return false;
        if (panels.length > 1) panels.shift().remove();
      }
      const position = opts.destinationPosition || (source ? getComputedStyle(source).objectPosition : 'center 35%');
      visual(run, destination, dir, tail, position, frames.length + 1, true);
      if (!await clock(run, tail)) return false;
      beat(destination.src, frames.length);
      // Keep the decoded destination over the old scene until the caller swaps art.
      requestAnimationFrame(() => requestAnimationFrame(() => destroy(run)));
      return true;
    } catch (_) { destroy(run); return false; }
  }
  window.Cinema = { play, preload, cancel };
})();
