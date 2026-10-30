/* ShonkuWEB: progressive enhancements for the static studio website. */
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
function closeMenu() {
  if (!menuButton || !mobileNav) return;
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.textContent = 'Menu +';
}
if (menuButton && mobileNav) {
  menuButton.hidden = false;
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.textContent = open ? 'Close −' : 'Menu +';
    mobileNav.hidden = !open;
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => {
    if (!mobileNav.hidden && !event.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('focusin', event => {
    if (!mobileNav.hidden && !event.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) {
      closeMenu();
      menuButton.focus();
    }
  });
  window.matchMedia('(min-width: 781px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });
}

const sceneButtons = document.querySelectorAll('[data-store-mode]');
const motionAllowed = window.matchMedia('(prefers-reduced-motion: no-preference)');
sceneButtons.forEach(button => button.addEventListener('click', () => {
  const catalog = button.dataset.storeMode === 'catalog';
  sceneButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelector('[data-store-action]').textContent = catalog ? 'Enquire on WhatsApp ↗' : 'Continue to checkout →';
  document.querySelector('[data-store-note]').textContent = catalog ? 'From browsing to a conversation' : 'From browsing to an online order';
  document.querySelector('[data-store-caption]').textContent = catalog ? 'Products organised. Orders on WhatsApp.' : 'Payments, orders & inventory. Connected.';
  if (motionAllowed.matches) {
    document.querySelectorAll('[data-store-action], [data-store-note], [data-store-caption]').forEach(label => {
      label.animate([{ opacity: .25 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    });
  }
}));

// Illustrative examples explain the service without collecting visitor data.
const growthExamples = {
  interest: {
    signal: ['They keep looking.', 'Shoppers return to the same product.'],
    insight: ['Interest is there.', 'Views and repeat visits reveal what draws attention.'],
    action: ['Make the choice easier.', 'Bring product details and the order button into focus.'],
    goal: ['More interest into orders.', 'Help a ready customer take the next step.']
  },
  return: {
    signal: ['They’re back.', 'Customers revisit your store after a previous order.'],
    insight: ['Learn the return pattern.', 'The time between visits helps you understand buying habits.'],
    action: ['Make reordering easier.', 'Put familiar products and a clear order path within reach.'],
    goal: ['Build repeat business.', 'Give returning customers a simpler buying experience.']
  },
  friction: {
    signal: ['They stop short.', 'Shoppers begin checkout but leave before ordering.'],
    insight: ['Find the sticking point.', 'See where customers drop out of the buying journey.'],
    action: ['Remove the friction.', 'Clarify delivery information and simplify checkout steps.'],
    goal: ['Fewer missed orders.', 'Help more shoppers complete the journey.']
  }
};
document.querySelectorAll('[data-growth]').forEach(button => {
  button.addEventListener('click', () => {
    const section = button.closest('.growth-story');
    const example = growthExamples[button.dataset.growth];
    section.querySelectorAll('[data-growth]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    Object.entries(example).forEach(([step, [title, copy]]) => {
      section.querySelector(`[data-growth-title="${step}"]`).textContent = title;
      section.querySelector(`[data-growth-copy="${step}"]`).textContent = copy;
    });
    if (motionAllowed.matches) {
      section.querySelectorAll('.growth-node').forEach((node, index) => {
        node.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 300, delay: index * 35, easing: 'ease-out' });
      });
    }
  });
});

// Inline demos stay silent and control-free; reduced-motion users get a still.
// Space/Enter provides an unobtrusive keyboard pause option.
const serviceDemos = document.querySelectorAll('[data-service-demo]');
if (serviceDemos.length) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function syncDemo(video) {
    if (reducedMotion.matches || video.dataset.inView !== 'true' || video.dataset.userPaused === 'true') {
      video.pause();
      if (reducedMotion.matches && video.readyState > 0) video.currentTime = 0;
    } else {
      video.play().catch(() => { /* The static poster remains if autoplay is unavailable. */ });
    }
  }
  const demoObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.dataset.inView = String(entry.isIntersecting);
      syncDemo(entry.target);
    });
  }, { threshold: .15 }) : null;
  serviceDemos.forEach(video => {
    video.muted = true;
    if (reducedMotion.matches) video.removeAttribute('autoplay');
    video.addEventListener('keydown', event => {
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      event.preventDefault();
      if (video.paused) {
        video.dataset.userPaused = 'false';
        video.play().catch(() => {});
      } else {
        video.dataset.userPaused = 'true';
        video.pause();
      }
    });
    if (demoObserver) demoObserver.observe(video);
    else { video.dataset.inView = 'true'; syncDemo(video); }
  });
  reducedMotion.addEventListener('change', () => serviceDemos.forEach(syncDemo));
}

const form = document.querySelector('#project-enquiry');
if (form) {
  const serviceSelect = form.elements.service;
  const selected = new URLSearchParams(window.location.search).get('service');
  if (['ecommerce', 'catalog', 'unsure'].includes(selected)) serviceSelect.value = selected;
  const result = document.querySelector('#draft-result');
  const preview = document.querySelector('#draft-preview');
  const emailLink = document.querySelector('#draft-email');
  const copyButton = document.querySelector('#copy-draft');
  let draftText = '';
  // Make it explicit that this static site prepares an email; it does not send one.
  form.addEventListener('submit', event => {
    event.preventDefault();
    ['name', 'business', 'message'].forEach(name => {
      const field = form.elements[name];
      field.setCustomValidity(field.value.trim() ? '' : 'Please add a little information here.');
    });
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const service = serviceSelect.options[serviceSelect.selectedIndex].text;
    draftText = `Hi ShonkuWEB,\n\nI'd like to discuss a website for my business.\n\nName: ${String(values.get('name')).trim()}\nEmail: ${String(values.get('email')).trim()}\nBusiness: ${String(values.get('business')).trim()}\nInstagram / website: ${String(values.get('instagram')).trim() || 'Not provided'}\nInterested in: ${service}\n\nAbout the project:\n${String(values.get('message')).trim()}\n\nThanks,\n${String(values.get('name')).trim()}`;
    preview.textContent = draftText;
    emailLink.href = `mailto:contact@shonkuweb.com?subject=${encodeURIComponent(`Website enquiry — ${String(values.get('business')).trim()}`)}&body=${encodeURIComponent(draftText)}`;
    result.hidden = false;
    result.focus();
    copyButton.textContent = 'Copy enquiry';
  });
  form.addEventListener('input', event => {
    if (typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
    // Require regeneration so an edited brief cannot open a stale email draft.
    result.hidden = true;
  });
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(draftText);
      copyButton.textContent = 'Copied';
    } catch {
      copyButton.textContent = 'Select and copy the text above';
    }
  });
}

// Reveal only content below the fold; everything remains visible without JS.
const revealTargets = document.querySelectorAll('.section-heading, .service-card, .growth-node, .process-step, .value, .founder, .pipeline-card, .service-intro, .service-demo, .studio-illustration, .enquiry-form');
if (motionAllowed.matches && 'IntersectionObserver' in window) {
  const pending = new Set();
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('reveal-ready');
      revealObserver.unobserve(entry.target);
      pending.delete(entry.target);
    });
    if (!pending.size) revealObserver.disconnect();
  }, { threshold: .08, rootMargin: '0px 0px -16px 0px' });
  revealTargets.forEach((element, index) => {
    if (element.getBoundingClientRect().top < window.innerHeight || element.offsetParent === null) return;
    element.style.setProperty('--reveal-delay', `${(index % 3) * 45}ms`);
    pending.add(element);
    element.classList.add('reveal-ready');
    revealObserver.observe(element);
  });
  motionAllowed.addEventListener('change', event => {
    if (event.matches) return;
    pending.forEach(element => element.classList.remove('reveal-ready'));
    pending.clear();
    revealObserver.disconnect();
  });
  document.addEventListener('focusin', event => {
    const element = event.target.closest('.reveal-ready');
    if (element) {
      element.classList.remove('reveal-ready');
      revealObserver.unobserve(element);
      pending.delete(element);
    }
  });
}

const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  let headerFrame = false;
  const updateHeader = () => {
    siteHeader.classList.toggle('is-scrolled', window.scrollY > 12);
    headerFrame = false;
  };
  window.addEventListener('scroll', () => {
    if (headerFrame) return;
    headerFrame = true;
    requestAnimationFrame(updateHeader);
  }, { passive: true });
  updateHeader();
}
