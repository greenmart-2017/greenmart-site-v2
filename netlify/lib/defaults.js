/** Seed data — exact public-site defaults from assets/main.js on day one. */

export const DEFAULT_SHOP_DATA = {
  ratesUpdated: "Today",
  rates: [
    ["Fresh Pangas — 800g–1kg", "per kg", "₹110–120"],
    ["Fresh Pangas — 1–1.2kg", "per kg", "₹120–130"],
    ["Fresh Pangas — 1.2kg+", "per kg", "₹130–140"],
    ["Fresh Rohu — size-graded", "per kg", "Ask on WhatsApp"],
    ["Fresh Katla — size-graded", "per kg", "Ask on WhatsApp"],
    ["Fresh Mrigal — size-graded", "per kg", "Ask on WhatsApp"],
    ["Tilapia / Common Carp", "per kg", "Ask on WhatsApp"],
    ["Murrel / Catfish (premium)", "per kg", "Seasonal — ask"],
    ["Fresh Bangda (Indian Mackerel)", "per kg", "Ask on WhatsApp"],
    ["Fresh Rawas (Indian Salmon)", "per kg", "Ask on WhatsApp"],
    ["Fresh Shilang", "per kg", "Ask on WhatsApp"],
    ["Frozen Basa Fillet — 500g pack", "per pack", "Launching soon"],
    ["Frozen Basa Fillet — 250g pack", "per pack", "Launching soon"],
    ["Frozen Fillet — bulk 5kg/10kg", "per kg", "Ask on WhatsApp"]
  ],
  availability: [
    ["Pangas", true],
    ["Rohu", true],
    ["Katla", true],
    ["Mrigal", true],
    ["Tilapia", true],
    ["Murrel", false]
  ],
  bulkRates: {
    "Pangas (Basa)": 125,
    "Rohu": 160,
    "Katla": 180,
    "Mrigal": 140,
    "Tilapia": 110,
    "Common Carp": 120,
    "Bangda (Indian Mackerel)": 150,
    "Rawas (Indian Salmon)": 350,
    "Shilang": 200
  },
  deliveryZones: {
    city: { label: "Within City", freeAboveKg: 50, flatRate: 80 },
    out: { label: "Outside City", freeAboveKg: 200, flatRate: 150 },
    near: { label: "Nearby Districts", perKgRate: 4, minRate: 300 }
  }
};

export const SHOP_STORE_NAME = "shop-data";
export const SHOP_KEY_CURRENT = "current";
export const SHOP_KEY_PREV = ["previous-1", "previous-2", "previous-3"];
export const LIMITS_STORE_NAME = "shop-rate-limits";
