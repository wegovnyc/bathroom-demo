// Cloudflare Pages Function Proxy for NYC Socrata API

export async function onRequest(context) {
  // Socrata API Endpoint for Public Restrooms in NYC (increasing limit to get all 1066+ records)
  const socrataUrl = "https://data.cityofnewyork.us/resource/i7jb-7jku.json?$limit=50000";
  
  // Create a Cache key based on the request URL
  const cache = caches.default;
  const cacheKey = new Request(context.request.url);
  
  // Try to find a valid response in the edge cache
  let response = await cache.match(cacheKey);

  if (!response) {
    // Cache Miss: Fetch fresh data from Socrata securely
    // In a prod app, we'd add X-App-Token header here if we had one
    try {
      response = await fetch(socrataUrl);
      
      if (!response.ok) {
        throw new Error(`Socrata responded with ${response.status}`);
      }

      // Clone the response so we can modify headers for caching
      response = new Response(response.body, response);
      
      // Set to cache heavily at the edge for 1 hour
      // (Public restrooms data rarely changes)
      response.headers.set("Cache-Control", "s-maxage=3600");
      
      // Also set CORS headers so our local dev can hit it without issues
      response.headers.set("Access-Control-Allow-Origin", "*");
      
      // Save the response to the cache for future requests
      context.waitUntil(cache.put(cacheKey, response.clone()));
    } catch (error) {
       return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Ensure CORS is set on cached responses too
  const finalResponse = new Response(response.body, response);
  finalResponse.headers.set("Access-Control-Allow-Origin", "*");
  return finalResponse;
}
