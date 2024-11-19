import { Hono } from "jsr:@hono/hono";
import { serveStatic } from "jsr:@hono/hono/deno";
import { compress } from "jsr:@hono/hono/compress";
import { listeningMessage } from "./message.ts";

const app = new Hono();

app.use(compress({
    encoding: 'gzip'
}));
app.use("/*", serveStatic({ root: `${Deno.cwd()}/dist` }));

Deno.serve({
    hostname: '0.0.0.0',
    port: parseInt(Deno.env.get('PORT') as string) || 8000,
    onListen() {
        listeningMessage(parseInt(Deno.env.get('PORT') as string) || 8000, "hono");
    }
}, app.fetch)
