import type { APIRoute } from "astro";

// One real page, plus the plain-text files answer engines read. lastmod is the build date,
// and the site rebuilds daily.
export const GET: APIRoute = () => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ["/", "/llms.txt", "/llms-full.txt"];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>https://harisrinivasan.dev${u}</loc><lastmod>${today}</lastmod>${u === "/" ? "<priority>1.0</priority>" : ""}</url>`).join("\n")}
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
