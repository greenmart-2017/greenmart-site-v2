import { handleLogin } from "../lib/handlers.js";

export default async (req, context) => handleLogin(req, context);

export const config = {
  path: "/api/auth/login"
};
