import type { APIRoute } from "astro";

// Ensure Astro treats this as server-side code
export const prerender = false;

export const ALL: APIRoute = async (ctx) => {
    ctx.request.headers.set("x-forwarded-for", ctx.clientAddress);

    return new Response(
        JSON.stringify({
            name: "Astro",
            url: "https://astro.build/",
        }),
    );
};