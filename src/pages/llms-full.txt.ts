import type { APIRoute } from "astro";
import { llmsTxt } from "../lib/llms";
export const GET: APIRoute = () => new Response(llmsTxt(true), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
