# Green Mart — Fish & Agri Website

Official website for **Green Mart**, a farm-direct fisheries and agricultural goods
business based in Nagpur, Maharashtra. Live at **greenmart.org.in**.

## What this site does

- Showcases fresh & frozen fish products (Pangas, Rohu, Katla, Mrigal, Tilapia,
  Common Carp, Murrel/Catfish) and sourced coastal fish (Bangda, Rawas, Shilang)
- Individual product pages with sizes, storage, delivery info, and WhatsApp ordering
- Trilingual: English, Hindi (हिंदी), Marathi (मराठी)
- Live rates and bulk calculator via a connected Google Sheet
- Wholesale/B2B enquiry flow for restaurants, hotels, and retailers

## Structure

```
/index.html          — homepage (all main sections)
/404.html            — custom error page
/policies.html        — privacy, terms, shipping & returns
/products/            — individual product pages (Pangas, Rohu, Katla, etc.)
/images/               — site images, organized by purpose
  /branding/            — logo, favicon
  /hero/                 — homepage hero photo
  /farm/                 — farm & ponds photo
  /operations/           — harvest & cold storage photos
  /products/             — product card thumbnails
  /gallery/              — placeholder/misc images
/assets/               — shared CSS & JS used across all product pages
  product.css            — shared styling
  product-i18n.js        — shared Hindi/Marathi translation engine
/.well-known/
  security.txt           — security contact info
_headers                — Netlify security headers (incl. CSP)
robots.txt, sitemap.xml — SEO
```

## Certifications — status

Green Mart has **applied** for ISO 9001, ISO 14001, and HACCP certification and
received a positive initial response from an accredited body. Certification is
**in progress, not yet held.** Site copy reflects this honestly throughout —
do not change wording to claim certification is complete until certificates are
actually issued.

## Deployment

- Hosted on **Netlify**, auto-deploys from this repo's `main` branch
- Domain **greenmart.org.in** points to the connected Netlify site
- No build step — this is a plain static site (HTML/CSS/JS, no framework)

## Contact

- WhatsApp: +91 86006 32420
- Email: orders@greenmart.org.in
