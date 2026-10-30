# ShonkuWEB

The ShonkuWEB studio website, built with static HTML, CSS, and JavaScript.

The site introduces the studio and its two services:

- **Ecommerce development:** product display, integrated online payments, inventory, and order management.
- **Catalog website development:** product display, inventory management, and ordering through WhatsApp, without a payment gateway.

## Local development

From the repository root:

```sh
python3 -m http.server 3000 --bind 127.0.0.1
```

Open [localhost:3000](http://localhost:3000). Refresh the browser after editing files. No installation or build step is required.

## Pages and assets

| Path | Purpose |
| --- | --- |
| `index.html` | Studio overview and services |
| `services/index.html` | Service details, comparison, and FAQs |
| `aboutus/index.html` | Studio story, approach, and founders |
| `contactus/index.html` | Project enquiry email helper |
| `assets/studio.css` | Shared responsive design |
| `assets/studio.js` | Mobile menu, storefront illustration switch, enquiry drafts |
| `assets/favicon.svg` | Site icon |
| `assets/art/` | Original vector illustrations for service journeys, connected business data, the studio, and contact |
| `assets/motion/` | Inline ecommerce and catalog shopping demos, static posters, and earlier explainer assets |
| `scripts/render-motion.py` | Motion-graphics authoring script (Pillow and ffmpeg required only to re-render) |
| `scripts/render-shopping-demos.py` | Customer-journey demo authoring, using original vector UI artwork |
| `terms&conditions/`, `cancellation-refund-policy/`, `shipping-delivery-policy/`, `payment/` | Existing policies and billing content with refreshed navigation |

The older `bidhushekhar/` page retains its content styling, with the current shared navigation and a contact link for enquiries. Policy and billing pages also use `style.css` for content layout. All pages use the current `assets/studio.js` interactions; `script.js` is retained as legacy source.

Responsive layouts cover narrow phones, phones, tablets, and desktops. On phones the service comparison becomes readable cards, navigation opens as a disclosure menu, and form fields use 16px text. Entry and scroll animations respect reduced-motion preferences. Below-fold illustrations load lazily, and shopping demos pause outside the viewport.

## Contact behaviour

The enquiry form validates the brief and prepares an email to `contact@shonkuweb.com`. Visitors review it and open their email app to send it, or copy the text. The site does **not** send enquiries, store submissions, or claim that a message has been delivered. A backend or form service is needed for direct submission.

## Content to add later

Past project names, descriptions, links, and images will be supplied separately. The homepage includes a small coming-soon note; no client case studies or performance statistics are invented.

Google Fonts supplies DM Sans and Manrope, with system-font fallbacks. Storefront illustrations are inline SVG and CSS. The illustration switch demonstrates the ordering paths; it is not a working store.

## Deployment

Serve this directory as a static site. Existing Apache clean-URL redirects are in `.htaccess`. The default Git push destination is `origin` (`https://github.com/shonkuweb/ShonkuWeb.git`), with `main` tracking `origin/main`.
