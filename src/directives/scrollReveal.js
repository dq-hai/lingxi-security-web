const DEFAULT_OPTIONS = {
  delay: 0,
  distance: 28,
  duration: 700,
  origin: 'bottom',
  once: false,
  threshold: 0.18
};

function resolveTransform(distance, origin) {
  const axis = origin === 'left' || origin === 'right' ? 'X' : 'Y';
  const amount = origin === 'top' || origin === 'left' ? -distance : distance;
  return `translate${axis}(${amount}px)`;
}

function applyRevealState(el, options, visible) {
  el.style.setProperty('--reveal-distance', `${options.distance}px`);
  el.style.setProperty('--reveal-duration', `${options.duration}ms`);
  el.style.setProperty('--reveal-delay', `${options.delay}ms`);
  el.style.setProperty('--reveal-transform', resolveTransform(options.distance, options.origin));
  el.classList.toggle('is-visible', visible);
}

function mountObserver(el, binding) {
  const options = { ...DEFAULT_OPTIONS, ...(binding.value || {}) };

  el.__revealOptions = options;
  el.classList.add('scroll-reveal');
  applyRevealState(el, options, false);

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        applyRevealState(el, options, true);
        if (options.once) {
          observer.disconnect();
        }
      } else if (!options.once) {
        applyRevealState(el, options, false);
      }
    },
    { threshold: options.threshold }
  );

  observer.observe(el);
  el.__revealObserver = observer;
}

export default {
  mounted(el, binding) {
    mountObserver(el, binding);
  },
  updated(el, binding) {
    const nextOptions = { ...DEFAULT_OPTIONS, ...(binding.value || {}) };
    const prevOptions = el.__revealOptions || {};
    if (JSON.stringify(nextOptions) === JSON.stringify(prevOptions)) return;

    el.__revealObserver?.disconnect();
    mountObserver(el, binding);
  },
  unmounted(el) {
    el.__revealObserver?.disconnect();
    delete el.__revealObserver;
    delete el.__revealOptions;
  }
};
