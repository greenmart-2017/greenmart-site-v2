import { handleShopData } from "../lib/handlers.js";

export default async (req, context) => handleShopData(req, context);

export const config = {
  path: "/api/shop-data"
};
