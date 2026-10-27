# SEE YOU — interactive e-commerce front-end demo

A responsive storefront prototype built with plain HTML, CSS and JavaScript. It includes a homepage, category browsing, product search/filter/sort, product details, a local demo cart, demo checkout, order history, a demo admin dashboard, local product management, four changeable themes, and French/Arabic/English interface labels with Arabic RTL layout.

## Run it

**Option 1:** Open `index.html` directly in a modern browser.

**Option 2 (recommended):** Run a local static server from this directory:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

No npm installation or build step is needed.

## Demo credentials

- **Admin:** `admin@seeyou.tn` / `Admin123!`
- **Customer:** `client@seeyou.tn` / `Client123!`

Open the account icon in the header to sign in. The demo credentials are also shown in the login dialog.

## Available demo features

- Original SEE YOU logo supplied in the conversation.
- Local banner and locally packaged sample product-image assets.
- Four visual themes: Chic Luxury, Soft Feminine, Bold Night and Natural Modern.
- Language switcher: Français, العربية and English. Arabic uses `dir="rtl"`.
- Product categories, search, sort, favorites and product detail modal.
- Demo cart and checkout flow; demo orders are stored in browser localStorage.
- Admin dashboard with product-stock updates, adding demo products, and order list/CSV export.
- Local newsletter signup simulation.

## Important limitations — read before a real client launch

This is a **front-end-only demonstration**, not a production e-commerce system.

- Product names, prices, stock, and product images are sample/demo content. Replace them with the boutique's actual approved catalog and photographs before publishing.
- The demo orders are stored only in the current browser. They are not sent to the business and are not visible to other devices.
- The demo login is implemented in client-side JavaScript and is **not secure authentication**. Never use these credentials for a live store.
- No real payment, delivery provider, WhatsApp order transmission, email notifications, or customer database is connected.
- LocalStorage is not suitable for authoritative inventory, real orders, sensitive customer data, or image storage in production.
- The hero/banner includes the supplied visual asset; have the client approve the address and any claims shown within that artwork before reusing it publicly.
- The CSS references Google Fonts when internet access is available and uses system fallbacks otherwise. All main brand images and sample product images are stored locally in this project.

## What is required for production

Connect a secure backend and persistent database, hashed-password authentication, role-based permissions, validated inventory and prices, server-side order creation, secure image hosting, approved customer policies, and any required payment/shipping/email integrations. Confirm the business identity, logo usage, product data, prices, sizes, stock, contact details, shipping/returns policies, and legal pages with the client before launch.
