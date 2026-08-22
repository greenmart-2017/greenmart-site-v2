#!/usr/bin/env bash
set -euo pipefail

# Verify core static site files are present (no build step required).
REQUIRED=(
  index.html
  404.html
  policies.html
  assets/main.js
  assets/product.css
  assets/product-i18n.js
  assets/product-page.js
  products/pangas.html
  assets/product.css
  assets/product-i18n.js
  pangas.html
  robots.txt
  sitemap.xml
)

for f in "${REQUIRED[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "Missing required file: $f" >&2
    exit 1
  fi
done

echo "Green Mart static site validated (${#REQUIRED[@]} core files present)."
