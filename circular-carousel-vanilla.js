/**
 * CircularCarousel (React Bits Vanilla JS Engine)
 * Ported faithfully from React Bits CircularCarousel component.
 * Features:
 * - 3D cylindrical tile-sliced mesh warping
 * - Realistic momentum, throw physics, snap & spring easing
 * - Mouse drag, trackpad wheel, touch support, keyboard navigation
 * - Entrance transitions (rise, assemble, spin)
 * - Dynamic captions with rolling reel digit counter
 */

(function (global) {
  const PRESETS = {
    cylinder: {
      axis: 'y',
      tilt: -5,
      perspective: 2500,
      curve: 1,
      spread: 1,
      inward: false,
      billboard: false,
      backfaces: true,
      window: 0
    },
    orbit: {
      axis: 'y',
      tilt: -16,
      perspective: 1500,
      curve: 0,
      spread: 1.45,
      inward: false,
      billboard: true,
      backfaces: false,
      window: 0
    },
    wheel: {
      axis: 'x',
      tilt: 0,
      perspective: 1800,
      curve: 0,
      spread: 1,
      inward: false,
      billboard: false,
      backfaces: true,
      window: 1.7
    },
    panorama: {
      axis: 'y',
      tilt: 0,
      perspective: 0,
      curve: 1,
      spread: 1,
      inward: true,
      billboard: false,
      backfaces: false,
      window: 0
    }
  };

  const INTRO_LENGTH = { assemble: 1500, rise: 1400, spin: 1800, none: 0 };
  const TILES = 8;
  const OVERLAP = 2.5;
  const DRAG_THRESHOLD = 5;
  const SPRING = 118;
  const SETTLE_SPEED = 9;
  const CAPTION_SPACE = 76;
  const TO_RAD = Math.PI / 180;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const wrap = degrees => ((((degrees + 180) % 360) + 360) % 360) - 180;
  const easeOut = t => 1 - Math.pow(1 - t, 4);
  const easeOutQuint = t => 1 - Math.pow(1 - t, 5);

  const rotateX = (p, degrees) => {
    const r = degrees * TO_RAD;
    const c = Math.cos(r);
    const s = Math.sin(r);
    return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
  };

  const rotateY = (p, degrees) => {
    const r = degrees * TO_RAD;
    const c = Math.cos(r);
    const s = Math.sin(r);
    return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
  };

  function createReelDigit(digit) {
    const spanDigit = document.createElement('span');
    spanDigit.className = 'circular-carousel__digit';
    const spanReel = document.createElement('span');
    spanReel.className = 'circular-carousel__reel';
    spanReel.style.transform = `translateY(${-Number(digit) * 10}%)`;
    for (let i = 0; i <= 9; i++) {
      const n = document.createElement('span');
      n.textContent = String(i);
      spanReel.appendChild(n);
    }
    spanDigit.appendChild(spanReel);
    return spanDigit;
  }

  function updateReelDigits(container, value) {
    const formatted = String(value).padStart(2, '0');
    const reels = container.querySelectorAll('.circular-carousel__reel');
    if (reels.length === 2) {
      reels[0].style.transform = `translateY(${-Number(formatted[0]) * 10}%)`;
      reels[1].style.transform = `translateY(${-Number(formatted[1]) * 10}%)`;
    }
  }

  function CircularCarousel(container, options = {}) {
    const items = options.items && options.items.length ? options.items : [];
    const count = items.length;
    if (!count) return null;

    const preset = PRESETS[options.preset] ? options.preset : 'cylinder';
    const layout = PRESETS[preset];
    const axis = layout.axis;
    const tiltValue = options.tilt !== undefined ? options.tilt : layout.tilt;
    const curveValue = layout.billboard ? 0 : clamp(options.curve !== undefined ? options.curve : layout.curve, 0, 1);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;

    const cardW = Math.max(40, options.cardWidth || 220);
    const aspectRatio = clamp(options.aspectRatio !== undefined ? options.aspectRatio : 1, 0.2, 5);
    const cardH = cardW / aspectRatio;
    const along = axis === 'x' ? cardH : cardW;
    const gap = options.gap !== undefined ? options.gap : 25;
    const step = 360 / count;

    // Calculate radius
    const n = Math.max(count, 3);
    const pitch = (along + gap) * layout.spread;
    const chord = pitch / (2 * Math.sin(Math.PI / n));
    const arc = (n * pitch) / (2 * Math.PI);
    const radius = Math.max(chord + (arc - chord) * curveValue, along * 0.6);

    // Calculate tiles for cylindrical bending
    const totalTiles = curveValue > 0.001 ? TILES : 1;
    const length = along / totalTiles;
    const bend = curveValue > 0.001 ? radius / curveValue : 0;

    const tiles = Array.from({ length: totalTiles }, (_, index) => {
      const start = index * length - (index > 0 ? OVERLAP / 2 : 0);
      const end = (index + 1) * length + (index < totalTiles - 1 ? OVERLAP / 2 : 0);
      const center = (start + end) / 2 - along / 2;
      const alpha = bend ? center / bend : 0;
      const shift = bend ? bend * Math.sin(alpha) : center;
      const sink = bend ? bend * (1 - Math.cos(alpha)) : 0;
      const depth = layout.inward ? sink : -sink;
      const turn = ((layout.inward ? -alpha : alpha) * 180) / Math.PI;
      const move =
        axis === 'x'
          ? `translate3d(0px, ${shift}px, ${depth}px) rotateX(${-turn}deg)`
          : `translate3d(${shift}px, 0px, ${depth}px) rotateY(${turn}deg)`;
      return { index, total: totalTiles, start, end, size: end - start, move };
    });

    const settings = {
      count,
      step,
      radius,
      layout,
      axis,
      tilt: tiltValue,
      perspective: layout.inward ? radius : (options.perspective !== undefined ? options.perspective : layout.perspective),
      cardW,
      cardH,
      intro: reduced ? 'none' : (options.intro in INTRO_LENGTH ? options.intro : 'rise'),
      autoplay: reduced ? 'off' : (options.autoplay || 'drift'),
      speed: options.speed !== undefined ? options.speed : 14,
      interval: Math.max(0.5, options.interval || 3),
      draggable: options.draggable !== undefined ? options.draggable : true,
      momentum: clamp(options.momentum !== undefined ? options.momentum : 0.6, 0, 1),
      snap: options.snap !== undefined ? options.snap : true,
      pauseOnHover: options.pauseOnHover !== undefined ? options.pauseOnHover : true,
      parallax: reduced ? 0 : clamp(options.parallax !== undefined ? options.parallax : 0.3, 0, 1),
      stretch: reduced ? 0 : clamp(options.stretch !== undefined ? options.stretch : 0.5, 0, 1),
      depthFade: clamp(options.depthFade !== undefined ? options.depthFade : 0.55, 0, 1),
      fadeColor: options.fadeColor || '#000000',
      innerShade: options.innerShade !== undefined ? options.innerShade : 0.6,
      cornerRadius: options.cornerRadius !== undefined ? options.cornerRadius : 12,
      captions: Boolean(options.captions),
      focusOnClick: options.focusOnClick !== undefined ? options.focusOnClick : true,
      fitMode: options.fitMode || 'viewport'
    };

    const state = {
      angle: 0,
      velocity: 0,
      target: null,
      dir: options.direction === 'right' ? 1 : -1,
      press: null,
      drag: false,
      hover: false,
      pointer: { inside: false, x: 0, y: 0 },
      yaw: 0,
      pitch: 0,
      intro: null,
      introDone: false,
      holdUntil: 0,
      stepAt: 0,
      suppressClick: false,
      wheelTimer: 0,
      fit: 1,
      shift: 0,
      drop: 0,
      last: 0,
      active: 0
    };

    // Build DOM structure
    container.innerHTML = '';
    const root = document.createElement('div');
    root.className = `circular-carousel ${options.className || ''}`.trim();
    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carousel');
    root.setAttribute('aria-label', 'NextGen Portfolio Carousel');
    root.tabIndex = 0;
    root.dataset.axis = axis;
    root.dataset.shape = preset;
    if (settings.draggable) root.dataset.draggable = '';

    root.style.setProperty('--cc-fade', settings.fadeColor);
    root.style.setProperty('--cc-radius', `${Math.max(0, settings.cornerRadius)}px`);
    root.style.setProperty('--cc-inner', (1 - clamp(settings.innerShade, 0, 1)).toFixed(3));

    const view = document.createElement('div');
    view.className = 'circular-carousel__view';

    const stage = document.createElement('div');
    stage.className = 'circular-carousel__stage';

    const camera = document.createElement('div');
    camera.className = 'circular-carousel__camera';

    const ring = document.createElement('div');
    ring.className = 'circular-carousel__ring';

    const cardElements = [];

    // Helper to render tiles
    function renderTile(item, tile, back) {
      const strip = back ? tile.total - 1 - tile.index : tile.index;
      const first = strip === 0;
      const last = strip === tile.total - 1;
      const r = 'var(--cc-radius)';
      const frameRadius =
        axis === 'x'
          ? `${first ? r : 0} ${first ? r : 0} ${last ? r : 0} ${last ? r : 0}`
          : `${first ? r : 0} ${last ? r : 0} ${last ? r : 0} ${first ? r : 0}`;
      const offset = back ? along - tile.end : tile.start;
      const size = tile.size;

      const tileEl = document.createElement('div');
      tileEl.className = 'circular-carousel__tile';
      tileEl.setAttribute('aria-hidden', 'true');
      const box =
        axis === 'x'
          ? { left: `${-cardW / 2}px`, top: `${-size / 2}px`, width: `${cardW}px`, height: `${size}px` }
          : { left: `${-size / 2}px`, top: `${-cardH / 2}px`, width: `${size}px`, height: `${cardH}px` };
      Object.assign(tileEl.style, box);
      const flip = axis === 'x' ? ' rotateX(180deg)' : ' rotateY(180deg)';
      tileEl.style.transform = tile.move + (back ? flip : '');

      const frame = document.createElement('div');
      frame.className = 'circular-carousel__frame';
      frame.style.height = `${axis === 'x' ? size : cardH}px`;
      frame.style.borderRadius = frameRadius;

      const photo = document.createElement('img');
      photo.className = 'circular-carousel__photo';
      photo.src = item.src;
      photo.alt = item.alt || '';
      photo.draggable = false;
      photo.decoding = 'async';

      const photoStyle =
        axis === 'x'
          ? { left: '0px', top: `${-offset}px`, width: `${cardW}px`, height: `${cardH}px` }
          : { left: `${-offset}px`, top: '0px', width: `${cardW}px`, height: `${cardH}px` };
      Object.assign(photo.style, photoStyle);

      frame.appendChild(photo);

      if (back) {
        const inner = document.createElement('div');
        inner.className = 'circular-carousel__inner';
        frame.appendChild(inner);
      }

      const shade = document.createElement('div');
      shade.className = 'circular-carousel__shade';
      frame.appendChild(shade);

      tileEl.appendChild(frame);
      return tileEl;
    }

    // Build cards
    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'circular-carousel__card';
      card.dataset.ccIndex = String(index);
      card.setAttribute('role', 'group');
      card.setAttribute('aria-roledescription', 'slide');
      card.setAttribute('aria-label', `${item.title || item.alt || `Venture ${index + 1}`}, ${index + 1} of ${count}`);

      tiles.forEach(tile => card.appendChild(renderTile(item, tile, false)));
      if (layout.backfaces) {
        tiles.forEach(tile => card.appendChild(renderTile(item, tile, true)));
      }

      ring.appendChild(card);
      cardElements.push(card);
    });

    camera.appendChild(ring);
    stage.appendChild(camera);
    view.appendChild(stage);
    root.appendChild(view);

    // Build Captions
    let captionEl = null;
    let titleEl = null;
    let subtitleEl = null;
    let digitsWrap = null;

    if (settings.captions) {
      captionEl = document.createElement('div');
      captionEl.className = 'circular-carousel__caption';
      captionEl.setAttribute('aria-hidden', 'true');

      const titleWrap = document.createElement('span');
      titleWrap.className = 'circular-carousel__title';

      titleEl = document.createElement('span');
      titleEl.className = 'circular-carousel__name';
      titleEl.textContent = items[0]?.title || items[0]?.alt || '';

      subtitleEl = document.createElement('span');
      subtitleEl.className = 'circular-carousel__subtitle';
      subtitleEl.textContent = items[0]?.subtitle || '';

      titleWrap.appendChild(titleEl);
      titleWrap.appendChild(subtitleEl);

      const countWrap = document.createElement('span');
      countWrap.className = 'circular-carousel__count';

      digitsWrap = document.createElement('span');
      digitsWrap.className = 'circular-carousel__digits';
      digitsWrap.appendChild(createReelDigit('0'));
      digitsWrap.appendChild(createReelDigit('1'));

      const slash = document.createElement('span');
      slash.className = 'circular-carousel__slash';
      slash.textContent = '/';

      const totalSpan = document.createElement('span');
      totalSpan.textContent = String(count).padStart(2, '0');

      countWrap.appendChild(digitsWrap);
      countWrap.appendChild(slash);
      countWrap.appendChild(totalSpan);

      captionEl.appendChild(titleWrap);
      captionEl.appendChild(countWrap);
      root.appendChild(captionEl);
    }

    const liveRegion = document.createElement('div');
    liveRegion.className = 'circular-carousel__live';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    root.appendChild(liveRegion);

    container.appendChild(root);

    // Ready state
    let raf = 0;
    let visible = true;

    const nearest = angle => Math.round(angle / settings.step) * settings.step;

    const measure = () => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const room = settings.captions ? CAPTION_SPACE : 0;
      const width = rect.width * 0.94;
      const height = (rect.height - room) * 0.92;
      const P = settings.perspective;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      if (settings.layout.inward) {
        minX = -width / 2;
        maxX = width / 2;
        minY = -settings.cardH / 2;
        maxY = settings.cardH / 2;
      } else {
        const corners = [
          [-settings.cardW / 2, -settings.cardH / 2],
          [settings.cardW / 2, -settings.cardH / 2],
          [-settings.cardW / 2, settings.cardH / 2],
          [settings.cardW / 2, settings.cardH / 2]
        ];
        const limit = settings.layout.window ? settings.layout.window * settings.step : 180;
        for (let a = -limit; a <= limit; a += limit / 24) {
          for (const [cx, cy] of corners) {
            let p;
            if (settings.axis === 'x') {
              p = rotateX([cx, cy, settings.radius], -a);
              p = [p[0], p[1], p[2] - settings.radius];
              p = rotateY(p, settings.tilt);
            } else if (settings.layout.billboard) {
              const c = rotateY([0, 0, settings.radius], a);
              p = [c[0] + cx, cy, c[2] - settings.radius];
              p = rotateX(p, settings.tilt);
            } else {
              p = rotateY([cx, cy, settings.radius], a);
              p = [p[0], p[1], p[2] - settings.radius];
              p = rotateX(p, settings.tilt);
            }
            if (p[2] >= P * 0.95) continue;
            const k = P / (P - p[2]);
            minX = Math.min(minX, p[0] * k);
            maxX = Math.max(maxX, p[0] * k);
            minY = Math.min(minY, p[1] * k);
            maxY = Math.max(maxY, p[1] * k);
          }
        }
      }

      const spanX = Math.max(maxX - minX, 1);
      const spanY = Math.max(maxY - minY, 1);

      // Responsive fitting:
      // On mobile / narrow screens, avoid crushing the card down by fitting all 360 degrees of the cylinder.
      // Instead, allow the active front card to occupy up to ~78% of container width so side cards peek in.
      const maxFrontCardW = rect.width * 0.78;
      const frontFitX = Math.min(1, maxFrontCardW / settings.cardW);
      const heightFit = Math.min(1, height / spanY);

      let fit;
      if (settings.fitMode === 'contain') {
        fit = Math.min(1, width / spanX, heightFit);
      } else {
        fit = Math.min(1, frontFitX, heightFit);
      }
      fit = Math.max(0.35, fit);
      state.fit = fit;
      state.shift = -((minY + maxY) / 2) * fit - room / 2;
      state.drop = settings.axis === 'x' ? (rect.width / fit) * 0.55 + settings.cardW : (rect.height / fit) * 0.55 + settings.cardH;
      stage.style.perspective = `${P}px`;
      stage.style.transform = `translate3d(0, ${state.shift}px, 0) scale(${fit})`;
    };

    const introCard = (elapsed, landing) => {
      if (!state.intro) return { radius: 1, lift: 0 };
      const type = state.intro.type;
      const reach = Math.abs(wrap(landing + state.angle));
      if (type === 'assemble') {
        const delay = (reach / 180) * 420;
        const p = easeOut(clamp((elapsed - delay) / 1080, 0, 1));
        return { radius: 1 + 0.6 * (1 - p), lift: 0 };
      }
      if (type === 'rise') {
        const delay = (reach / 180) * 480;
        const p = easeOutQuint(clamp((elapsed - delay) / 900, 0, 1));
        return { radius: 1, lift: (1 - p) * state.drop };
      }
      if (type === 'spin') {
        const p = easeOut(clamp(elapsed / INTRO_LENGTH.spin, 0, 1));
        return { radius: 1 + 0.28 * (1 - p), lift: 0 };
      }
      return { radius: 1, lift: 0 };
    };

    const advance = (s, dt, now) => {
      if (!state.introDone) {
        if (!state.intro) {
          if (s.intro === 'none') state.introDone = true;
          else state.intro = { type: s.intro, start: now };
        }
        if (state.intro && now - state.intro.start >= INTRO_LENGTH[state.intro.type]) {
          state.intro = null;
          state.introDone = true;
        }
      }

      const paused = (s.pauseOnHover && state.hover) || state.drag || now < state.holdUntil;
      const cruise = s.autoplay === 'drift' && !paused && !state.intro ? s.speed * state.dir : 0;
      let busy = Boolean(state.intro) || state.drag;

      if (state.drag || state.intro) {
        state.velocity = state.drag ? state.velocity : 0;
      } else if (state.target !== null) {
        let remaining = dt;
        const damping = 2 * Math.sqrt(SPRING);
        while (remaining > 0) {
          const h = Math.min(remaining, 1 / 240);
          const accel = SPRING * (state.target - state.angle) - damping * state.velocity;
          state.velocity += accel * h;
          state.angle += state.velocity * h;
          remaining -= h;
        }
        if (Math.abs(state.target - state.angle) < 0.004 && Math.abs(state.velocity) < 0.03) {
          state.angle = state.target;
          state.velocity = 0;
          state.target = null;
        }
        busy = true;
      } else {
        const tau = 0.18 + s.momentum * 1.5;
        state.velocity += (cruise - state.velocity) * (1 - Math.exp(-dt / tau));
        state.angle += state.velocity * dt;
        if (cruise === 0 && s.snap && Math.abs(state.velocity) < SETTLE_SPEED) {
          state.target = nearest(state.angle);
        }
        busy = busy || cruise !== 0 || Math.abs(state.velocity) > 0.01 || state.target !== null;
      }

      if (s.autoplay === 'step' && !paused && !state.intro && state.introDone) {
        if (!state.stepAt) state.stepAt = now + s.interval * 1000;
        if (now >= state.stepAt) {
          state.target = (state.target ?? nearest(state.angle)) + s.step * state.dir;
          state.stepAt = now + s.interval * 1000;
        }
        busy = true;
      } else {
        state.stepAt = 0;
      }

      if (now < state.holdUntil) busy = true;

      const ease = 1 - Math.exp(-dt / 0.35);
      const aimYaw = state.pointer.inside ? state.pointer.x * s.parallax * 9 : 0;
      const aimPitch = state.pointer.inside ? -state.pointer.y * s.parallax * 6 : 0;
      state.yaw += (aimYaw - state.yaw) * ease;
      state.pitch += (aimPitch - state.pitch) * ease;
      if (Math.abs(aimYaw - state.yaw) > 0.01 || Math.abs(aimPitch - state.pitch) > 0.01) busy = true;

      return busy;
    };

    const render = (s, now) => {
      const elapsed = state.intro ? now - state.intro.start : 0;
      const swell = 1 + s.stretch * 0.12 * Math.min(1, Math.abs(state.velocity) / 420);
      let spinOffset = 0;
      if (state.intro?.type === 'spin') {
        const p = easeOut(clamp(elapsed / INTRO_LENGTH.spin, 0, 1));
        spinOffset = -300 * state.dir * (1 - p);
      } else if (state.intro?.type === 'assemble') {
        const p = easeOut(clamp(elapsed / INTRO_LENGTH.assemble, 0, 1));
        spinOffset = -32 * state.dir * (1 - p);
      }
      const angle = state.angle + spinOffset;
      const R = s.radius * swell;

      if (s.axis === 'x') {
        camera.style.transform = `translate3d(0, 0, ${-R}px) rotateY(${s.tilt + state.yaw}deg) rotateX(${state.pitch}deg)`;
        ring.style.transform = `rotateX(${-angle}deg)`;
      } else if (s.layout.inward) {
        camera.style.transform = `translate3d(0, 0, ${s.perspective - 1}px) rotateX(${s.tilt + state.pitch}deg) rotateY(${state.yaw}deg)`;
        ring.style.transform = `rotateY(${angle}deg)`;
      } else {
        camera.style.transform = `translate3d(0, 0, ${-R}px) rotateX(${s.tilt + state.pitch}deg) rotateY(${state.yaw}deg)`;
        ring.style.transform = `rotateY(${angle}deg)`;
      }

      for (let index = 0; index < s.count; index++) {
        const card = cardElements[index];
        if (!card) continue;
        const base = index * s.step;
        const mod = introCard(elapsed, base);
        const r = R * mod.radius;
        let transform;
        if (s.axis === 'x') {
          transform = `rotateX(${-base}deg) translateZ(${r}px)`;
        } else if (s.layout.inward) {
          transform = `rotateY(${base}deg) translateZ(${-r}px)`;
        } else {
          transform = `rotateY(${base}deg) translateZ(${r}px)`;
          if (s.layout.billboard) transform += ` rotateY(${-(base + angle)}deg)`;
        }
        if (mod.lift) transform += s.axis === 'x' ? ` translateX(${mod.lift}px)` : ` translateY(${mod.lift}px)`;
        card.style.transform = transform;

        const world = wrap(base + angle);
        const facing = Math.cos(world * TO_RAD);
        if (s.layout.inward) card.style.visibility = Math.abs(world) > 86 ? 'hidden' : '';
        const fade = s.depthFade * Math.pow((1 - facing) / 2, 1.25);
        card.style.setProperty('--cc-depth', fade.toFixed(3));
      }

      const activeIndex = ((Math.round(-state.angle / s.step) % s.count) + s.count) % s.count || 0;
      if (activeIndex !== state.active) {
        state.active = activeIndex;
        const activeItem = items[activeIndex];
        if (titleEl) titleEl.textContent = activeItem?.title || activeItem?.alt || '';
        if (subtitleEl) subtitleEl.textContent = activeItem?.subtitle || '';
        if (digitsWrap) updateReelDigits(digitsWrap, activeIndex + 1);
        if (liveRegion) liveRegion.textContent = `${activeItem?.title || ''}, ${activeIndex + 1} of ${count}`;
        if (typeof options.onChange === 'function') options.onChange(activeIndex, activeItem);
      }
    };

    const frame = now => {
      raf = 0;
      const dt = state.last ? Math.min((now - state.last) / 1000, 0.05) : 1 / 60;
      state.last = now;
      const busy = advance(settings, dt, now);
      render(settings, now);
      if (busy && visible && !document.hidden) raf = requestAnimationFrame(frame);
      else state.last = 0;
    };

    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const focusIndex = index => {
      let target = -index * settings.step;
      target += 360 * Math.round((state.angle - target) / 360);
      state.target = target;
      state.holdUntil = performance.now() + 2800;
      wake();
    };

    const stepBy = delta => {
      const base = state.target !== null ? state.target : Math.round(state.angle / settings.step) * settings.step;
      state.target = base - delta * settings.step * (settings.layout.inward ? -1 : 1);
      state.holdUntil = performance.now() + 2800;
      wake();
    };

    // Pointer events
    const updatePointer = event => {
      const rect = root.getBoundingClientRect();
      state.pointer.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      state.pointer.y = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    };

    root.addEventListener('pointerdown', event => {
      state.suppressClick = false;
      if (!settings.draggable || event.button !== 0) return;
      state.press = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        angle: state.angle,
        moved: false,
        origin: 0,
        samples: [{ time: performance.now(), angle: state.angle }]
      };
    });

    root.addEventListener('pointermove', event => {
      if (event.pointerType === 'mouse') {
        state.pointer.inside = true;
        updatePointer(event);
      }
      const press = state.press;
      if (!press || press.id !== event.pointerId) {
        wake();
        return;
      }
      const delta = settings.axis === 'x' ? event.clientY - press.y : event.clientX - press.x;
      const cross = settings.axis === 'x' ? event.clientX - press.x : event.clientY - press.y;
      if (!press.moved) {
        if (Math.abs(delta) < DRAG_THRESHOLD) return;
        if (Math.abs(cross) > Math.abs(delta) * 1.2 && event.pointerType !== 'mouse') {
          state.press = null;
          return;
        }
        press.moved = true;
        press.origin = delta;
        state.drag = true;
        state.target = null;
        state.velocity = 0;
        root.dataset.dragging = '';
        try {
          root.setPointerCapture(event.pointerId);
        } catch {}
      }
      const perPixel = 180 / (Math.PI * settings.radius * state.fit);
      state.angle = press.angle + (delta - press.origin) * perPixel * (settings.layout.inward ? -1 : 1);
      const now = performance.now();
      press.samples.push({ time: now, angle: state.angle });
      while (press.samples.length > 2 && now - press.samples[0].time > 110) press.samples.shift();
      wake();
    });

    const releasePointer = event => {
      const press = state.press;
      if (!press || press.id !== event.pointerId) return;
      state.press = null;
      if (!press.moved) return;
      state.drag = false;
      delete root.dataset.dragging;
      state.suppressClick = true;
      const first = press.samples[0];
      const last = press.samples[press.samples.length - 1];
      const span = (last.time - first.time) / 1000;
      const velocity = span > 0.008 ? clamp((last.angle - first.angle) / span, -1400, 1400) : 0;
      state.velocity = velocity;
      if (Math.abs(velocity) > 60) state.dir = Math.sign(velocity);
      const coasting = settings.autoplay === 'drift' && !(settings.pauseOnHover && state.hover && event.pointerType === 'mouse');
      if (settings.snap && !coasting) {
        const tau = 0.18 + settings.momentum * 1.5;
        state.target = Math.round((state.angle + velocity * tau * 0.55) / settings.step) * settings.step;
      }
      wake();
    };

    root.addEventListener('pointerup', releasePointer);
    root.addEventListener('pointercancel', releasePointer);

    root.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      state.hover = true;
      wake();
    });

    root.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse') {
        state.hover = false;
        state.pointer.inside = false;
      }
      wake();
    });

    root.addEventListener('click', event => {
      if (state.suppressClick) {
        state.suppressClick = false;
        return;
      }
      const card = event.target.closest('[data-cc-index]');
      if (!card) return;
      const index = Number(card.getAttribute('data-cc-index'));
      if (settings.focusOnClick) focusIndex(index);
      if (typeof options.onItemClick === 'function') options.onItemClick(items[index], index);
    });

    root.addEventListener('keydown', event => {
      const forward = settings.axis === 'x' ? 'ArrowDown' : 'ArrowRight';
      const backward = settings.axis === 'x' ? 'ArrowUp' : 'ArrowLeft';
      if (event.key === forward) stepBy(1);
      else if (event.key === backward) stepBy(-1);
      else if (event.key === 'Home') focusIndex(0);
      else if (event.key === 'End') focusIndex(count - 1);
      else if (event.key === 'Enter' || event.key === ' ') {
        if (typeof options.onItemClick === 'function') options.onItemClick(items[state.active], state.active);
      } else return;
      event.preventDefault();
    });

    root.addEventListener('wheel', event => {
      if (!settings.draggable) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : 0;
      if (!delta) return;
      event.preventDefault();
      const perPixel = 180 / (Math.PI * settings.radius * state.fit);
      state.target = null;
      state.angle -= delta * perPixel * (settings.layout.inward ? -1 : 1);
      state.velocity = -delta * perPixel * (settings.layout.inward ? -1 : 1) * 30;
      state.holdUntil = performance.now() + 1600;
      clearTimeout(state.wheelTimer);
      state.wheelTimer = setTimeout(() => {
        if (settings.snap) state.target = nearest(state.angle + state.velocity * 0.12);
        wake();
      }, 140);
      wake();
    }, { passive: false });

    // Observers
    const resizeObserver = new ResizeObserver(() => {
      measure();
      wake();
    });
    resizeObserver.observe(root);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
        state.last = 0;
      }
    });
    intersectionObserver.observe(root);

    // Preload & reveal
    Promise.all(
      items.map(item => new Promise(resolve => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = item.src;
      }))
    ).then(() => {
      state.introDone = false;
      state.intro = null;
      root.dataset.ready = '';
      measure();
      render(settings, performance.now());
      wake();
    });

    measure();
    render(settings, performance.now());
    wake();

    return {
      focusIndex,
      stepBy,
      destroy: () => {
        cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
        container.innerHTML = '';
      }
    };
  }

  global.CircularCarousel = CircularCarousel;
})(window);
