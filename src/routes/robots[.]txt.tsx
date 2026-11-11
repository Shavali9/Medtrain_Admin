import { createFileRoute } from "@tanstack/react-router";

/** The admin must never be indexed. */
export const Route = createFileRoute("/robots.txt")({ server: { handlers: { GET: () => new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain; charset=utf-8" } }) } }, component: () => null });
