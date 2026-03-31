import { onRequest as __api_restrooms_js_onRequest } from "/Users/devin/Antigravity/moda-related/nyc-public-restrooms/functions/api/restrooms.js"

export const routes = [
    {
      routePath: "/api/restrooms",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_restrooms_js_onRequest],
    },
  ]