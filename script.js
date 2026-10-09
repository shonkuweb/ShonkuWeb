/**
 * ShonkuWeb — Premium AI-First Startup Interactions & Runtime Simulator
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initAiPlayground();
  initFaqAccordion();
  initScrollAnimations();
  initContactForm();
});

/* ---------- 1. NAVBAR & MOBILE DRAWER ---------- */
function initNavbar() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const navbar = document.querySelector('.navbar');

  // Create overlay if not present
  let navOverlay = document.querySelector('.nav-overlay');
  if (!navOverlay) {
    navOverlay = document.createElement('div');
    navOverlay.className = 'nav-overlay';
    document.body.appendChild(navOverlay);
  }

  if (hamburger && navLinks) {
    const toggleMenu = () => {
      const isActive = hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
      navOverlay.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      document.body.style.overflow = isActive ? 'hidden' : '';
    };

    hamburger.addEventListener('click', toggleMenu);
    navOverlay.addEventListener('click', toggleMenu);

    // Close when clicking nav items
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
          toggleMenu();
        }
      });
    });
  }

  // Navbar glass scroll effect
  const handleScroll = () => {
    if (!navbar) return;
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Mark current active nav item
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').replace(/\/$/, '') || '/';
    if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
      a.classList.add('active');
    }
  });
}

/* ---------- 2. INTERACTIVE AI AGENT SIMULATOR ---------- */
function initAiPlayground() {
  const chips = document.querySelectorAll('.demo-prompt-chip');
  const messagesContainer = document.getElementById('demoMessages');
  const inputField = document.getElementById('demoInput');
  const sendBtn = document.getElementById('demoSendBtn');

  if (!messagesContainer) return;

  const demoScenarios = {
    'support': {
      user: "A customer wants to update their shipping address and asked about our return policy for opened items.",
      agentText: "Hello! I've checked the customer's active order #SW-8921. Because it hasn't dispatched yet, I safely updated their destination to the requested address. For opened items, our policy permits returns within 30 days under warranty inspection. I've sent the confirmation receipt to their registered email and tagged the ticket as resolved.",
      tool: "Tool Executed: order_api.update_address() & crm.send_confirmation()",
      latency: "284ms"
    },
    'automation': {
      user: "Parse this supplier PDF invoice, verify line items against PO #774, and trigger ERP payment approval.",
      agentText: "Invoice #INV-2049 processed successfully. Extracted 14 line items. Verification against PO #774 matched with 100% SKU and line item parity. ERP voucher created in SAP and forwarded to the Finance Manager for final 1-click authorization.",
      tool: "Tool Executed: doc_ai.extract_invoice() & erp_connector.sync_voucher()",
      latency: "340ms"
    },
    'lead': {
      user: "New enterprise lead registered with 250+ employee email. Score the prospect and schedule an engineer.",
      agentText: "Lead scored 94/100 (Enterprise tier, High Intent). Verified tech stack uses AWS + Node.js. Automatically enriched LinkedIn profile metadata and booked an architectural consultation into Senior Solutions Engineer Alex's calendar for tomorrow at 2:00 PM EST.",
      tool: "Tool Executed: enrich_clearbit() & calendar_api.create_invite()",
      latency: "195ms"
    }
  };

  function simulateAgentResponse(scenarioKey, customText) {
    const scenario = demoScenarios[scenarioKey] || {
      user: customText || "How can your autonomous agents scale our customer operations?",
      agentText: "ShonkuWeb autonomous agents connect directly to your custom knowledge bases, ticketing systems, and internal REST APIs. They resolve up to 84% of user inquiries without human intervention, respect strict security guardrails, and seamlessly escalate complex cases to human staff with full context.",
      tool: "Tool Executed: rag_knowledge_base.semantic_search()",
      latency: "210ms"
    };

    messagesContainer.innerHTML = '';

    // Append User message
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.textContent = scenario.user;
    messagesContainer.appendChild(userBubble);

    // Placeholder typing indicator
    const agentBubble = document.createElement('div');
    agentBubble.className = 'chat-bubble agent';
    agentBubble.innerHTML = `
      <div class="agent-meta">
        <span><i class="fas fa-robot"></i> Shonku AI Agent</span>
        <span>• Thinking...</span>
      </div>
      <p style="color: var(--text-muted); font-style: italic;">Analyzing context and formulating actions...</p>
    `;
    messagesContainer.appendChild(agentBubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Simulate fast streaming
    setTimeout(() => {
      agentBubble.innerHTML = `
        <div class="agent-meta">
          <span><i class="fas fa-robot"></i> Shonku AI Agent</span>
          <span>• Latency: ${scenario.latency}</span>
        </div>
        <p>${scenario.agentText}</p>
        <div class="agent-tool-tag">
          <i class="fas fa-check-circle"></i> ${scenario.tool}
        </div>
      `;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 450);
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const key = chip.getAttribute('data-scenario');
      simulateAgentResponse(key);
    });
  });

  if (sendBtn && inputField) {
    const handleSend = () => {
      const query = inputField.value.trim();
      if (!query) return;
      chips.forEach(c => c.classList.remove('active'));
      simulateAgentResponse('custom', query);
      inputField.value = '';
    };

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }
}

/* ---------- 3. FAQ ACCORDION ---------- */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close other accordions
      faqItems.forEach(other => {
        if (other !== item) other.classList.remove('active');
      });

      item.classList.toggle('active', !isActive);
    });
  });
}

/* ---------- 4. SCROLL REVEAL MICRO-ANIMATIONS ---------- */
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.flagship-card, .capability-card, .workflow-step-card, .testimonial-card, .stat-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(el);
  });
}

// Global class helper for revealed elements
window.addEventListener('load', () => {
  const style = document.createElement('style');
  style.textContent = `
    .in-view {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);
});

/* ---------- 5. CONTACT FORM INTERACTION ---------- */
function initContactForm() {
  const contactForm = document.querySelector('.contact-form');
  if (!contactForm) return;

  // Pre-select service dropdown if query param passed
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    if (serviceParam) {
      const serviceSelect = contactForm.querySelector('select[name="service"]');
      if (serviceSelect) {
        if (serviceParam.includes('support')) {
          serviceSelect.value = 'Customer Support AI Agent';
        } else if (serviceParam.includes('automation')) {
          serviceSelect.value = 'Custom AI Automation Workflow';
        }
      }
    }
  } catch (err) {}

  contactForm.addEventListener('submit', (e) => {
    // If action is "#", show sleek feedback
    if (contactForm.getAttribute('action') === '#' || !contactForm.getAttribute('action')) {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Submitting...`;

        setTimeout(() => {
          submitBtn.innerHTML = `<i class="fas fa-check"></i> Inquiry Received!`;
          submitBtn.style.background = '#059669';
          submitBtn.style.borderColor = '#059669';

          const feedback = document.createElement('div');
          feedback.className = 'form-success-banner';
          feedback.style.cssText = `
            margin-top: 18px;
            padding: 16px;
            background: #ecfdf5;
            border: 1px solid rgba(5, 150, 105, 0.2);
            border-radius: 12px;
            color: #065f46;
            font-size: 0.92rem;
            line-height: 1.5;
            text-align: center;
          `;
          feedback.innerHTML = `<strong>Thank you!</strong> An AI Systems Architect from ShonkuWeb will review your requirements and reach out within 1 business day.`;
          
          contactForm.appendChild(feedback);
          contactForm.reset();
        }, 800);
      }
    }
  });
}