// Responsive Navbar + Interactions
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const navbar = document.querySelector('.navbar');
let navOverlay = null;

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    const expanded = hamburger.classList.contains('active');
    hamburger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    toggleNavOverlay(expanded);
  });
  // Close menu when a link is clicked (mobile UX)
  navLinks.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.tagName === 'A' && navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      toggleNavOverlay(false);
    }
  });
}

// Add shadow/glass intensity when scrolling
function updateNavbarOnScroll() {
  if (!navbar) return;
  if (window.scrollY > 8) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}
window.addEventListener('scroll', updateNavbarOnScroll, { passive: true });
updateNavbarOnScroll();

// Subtle pointer-follow glow on service cards
const serviceCards = document.querySelectorAll('.service-item');
serviceCards.forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mx', `${x}px`);
    card.style.setProperty('--my', `${y}px`);
  });
});

// Testimonials are auto-scrolling and non-interactive
// Pointer-follow glow removed to prevent user interaction
// Prevent scroll interference on testimonials ticker
const testimonialsTicker = document.querySelector('.testimonials-ticker');
if (testimonialsTicker) {
  // Prevent wheel scrolling
  testimonialsTicker.addEventListener('wheel', (e) => {
    e.preventDefault();
  }, { passive: false });
  
  // Prevent touch scrolling
  testimonialsTicker.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });
  
  // Prevent drag
  testimonialsTicker.addEventListener('dragstart', (e) => {
    e.preventDefault();
  });
}

// Mobile-only: reveal service cards one-by-one with parallax
const mobileQuery = window.matchMedia('(max-width: 768px)');
let servicesObserver = null;
let servicesScrollHandler = null;
let revealQueue = [];
let revealTimer = null;

function enableMobileServicesParallax() {
  const cards = Array.from(document.querySelectorAll('.service-item'));
  if (!cards.length) return;

  // Reset states
  cards.forEach((c) => {
    c.classList.remove('in-view');
    c.style.removeProperty('--parallax');
  });

  // Intersection observer for reveal queueing
  servicesObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      if (entry.isIntersecting) {
        // queue reveal in DOM order
        if (!revealQueue.includes(el)) {
          revealQueue.push(el);
          processRevealQueue();
        }
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

  cards.forEach((c) => servicesObserver.observe(c));

  // Parallax scroll handler
  servicesScrollHandler = () => {
    window.requestAnimationFrame(() => {
      cards.forEach((el) => {
        if (!el.classList.contains('in-view')) return;
        const rect = el.getBoundingClientRect();
        const viewportH = window.innerHeight || document.documentElement.clientHeight;
        const center = rect.top + rect.height / 2;
        const dist = center - viewportH / 2;
        // clamp parallax between -14px and 14px
        const offset = Math.max(-14, Math.min(14, dist * 0.06));
        el.style.setProperty('--parallax', `${offset}px`);
      });
    });
  };
  window.addEventListener('scroll', servicesScrollHandler, { passive: true });
  servicesScrollHandler();
}

function processRevealQueue() {
  if (revealTimer) return;
  const step = () => {
    const next = revealQueue.shift();
    if (next) {
      next.classList.add('in-view');
      revealTimer = setTimeout(step, 160); // stagger reveal
    } else {
      clearTimeout(revealTimer);
      revealTimer = null;
    }
  };
  step();
}

function disableMobileServicesParallax() {
  const cards = document.querySelectorAll('.service-item');
  cards.forEach((c) => {
    c.classList.add('in-view'); // ensure visible on desktop
    c.style.removeProperty('--parallax');
  });
  if (servicesObserver) {
    servicesObserver.disconnect();
    servicesObserver = null;
  }
  if (servicesScrollHandler) {
    window.removeEventListener('scroll', servicesScrollHandler);
    servicesScrollHandler = null;
  }
  revealQueue = [];
  if (revealTimer) {
    clearTimeout(revealTimer);
    revealTimer = null;
  }
}

function handleServicesParallax() {
  if (mobileQuery.matches) {
    enableMobileServicesParallax();
  } else {
    disableMobileServicesParallax();
  }
}
mobileQuery.addEventListener ? mobileQuery.addEventListener('change', handleServicesParallax) : mobileQuery.addListener(handleServicesParallax);
handleServicesParallax();

function ensureNavOverlay() {
  if (!navOverlay) {
    navOverlay = document.createElement('div');
    navOverlay.className = 'nav-overlay';
    document.body.appendChild(navOverlay);
    navOverlay.addEventListener('click', () => {
      navLinks.classList.remove('active');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      toggleNavOverlay(false);
    });
  }
  return navOverlay;
}

function toggleNavOverlay(visible) {
  const overlay = ensureNavOverlay();
  if (visible) {
    overlay.classList.add('active');
  } else {
    overlay.classList.remove('active');
  }
}