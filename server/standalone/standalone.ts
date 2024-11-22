import { Hono } from "jsr:@hono/hono";
import { serveStatic } from "jsr:@hono/hono/deno";
import { compress } from "jsr:@hono/hono/compress";
import { listeningMessage } from "../message.ts";
import { Masqr, masqrAuth, type MasqrOptions } from "./masqr.ts";

const app = new Hono();

const options: MasqrOptions = {
    deniedFilePath: `${Deno.cwd()}/server/deniedFiles/denied.html`,
    v3: false,
    unlockedPaths: [],
    whitelistedURLS: ['incog.works'],
    masqrURL: "https://license.mercurywork.shop/validate?license=",
    cookieSecret: 'thisisnotsecurpleasesetsomething1234'
}

const masqr = new Masqr(options);

app.use(compress({
    encoding: 'gzip'
}));

app.use(masqrAuth({
    //Because I need hono's context to fetch the denied files (if using v3 especially), I have to define this to allow access to that context
    getFile: (ctx) => {
        return masqr.fail(ctx)
    },
    //Same with these.
    validate: async (ctx, key, host) => {
        return await masqr.verifyUser(ctx, key, host);
    },
    check: async (ctx) => {
        return await masqr.userLoggedIn(ctx);
    }
}));

app.use("/*", serveStatic({ root: `${Deno.cwd()}/dist` }));

Deno.serve({
    hostname: '0.0.0.0',
    port: parseInt(Deno.env.get('PORT') as string) || 8000,
    onListen() {
        listeningMessage(parseInt(Deno.env.get('PORT') as string) || 8000, "hono");
    }
}, app.fetch)
