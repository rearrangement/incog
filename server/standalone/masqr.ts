import { Context, MiddlewareHandler } from "jsr:@hono/hono";
import { decodeBase64 } from "jsr:@std/encoding/base64";
import { getSignedCookie, setSignedCookie } from "jsr:@hono/hono/cookie";

//Masqr implementation for Hono
interface Options {
    deniedFilePath: string;
    v3: boolean;
    unlockedPaths: Array<string>;
    whitelistedURLS: Array<string>;
    masqrURL: string;
    cookieSecret: string;
}

interface MasqrResp {
    error?: "Invalid License" | "License for incorrect product";
    status?: "License valid";
}

class Masqr {
    #options: Options;
    constructor(options: Options) {
        this.#options = options;
    }
    
    fail(ctx: Context) {
        const file = this.#options.v3 ? Deno.readTextFileSync(`${Deno.cwd()}/server/deniedFiles/${ctx.req.header('Host')}.html`) : Deno.readTextFileSync(this.#options.deniedFilePath);
        return file;
    }

    turnToHostname(url: string) {
        try {
            return new URL(url).hostname;
        }
        catch (_) {
            return url;
        }
    }

    async verifyUser(ctx: Context, key: string, host: string): Promise<boolean> {
        try {
            const cookie = await getSignedCookie(ctx, this.#options.cookieSecret, 'userIfVerified'); 
            const res = await fetch(`${this.#options.masqrURL}${key}&host=${host}`);
            const resp: MasqrResp = await res.json();
            if (resp.status === "License valid") {
                return true
            }
            else {
                return false 
            }
        }
        catch (_) {
            return false
        }
    };

    async refCheck(ctx: Context): Promise<boolean> {
        const refCheckCookie = await getSignedCookie(ctx, this.#options.cookieSecret, 'refreshcheck');
        if (!refCheckCookie) {
            await setSignedCookie(ctx, 'refreshcheck', 'true', this.#options.cookieSecret, { path: '/', sameSite: 'Strict', secure: true, maxAge: 10000 });
            return true;
        }
        else { return false }
    }
}

type Auth = {
    getFile: (ctx: Context) => string | Promise<string>;
    validate: (ctx: Context, key: string, host: string) => boolean | Promise<boolean>;
    refCheck: (ctx: Context) => boolean | Promise<boolean>
}



//I did not write this regex (And there is no way I was going to). I found it here: https://github.com/honojs/hono/blob/main/src/utils/basic-auth.ts. The only reason I am not using that middleware is because I need to return HTML. NOT a string
const credsReg = /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/;
const userPassReg = /^([^:]*):(.*)$/;

const masqrAuth = (options: Auth): MiddlewareHandler => {
    return async function masqrAuth(ctx, next) { 
        const authMatch = credsReg.exec(ctx.req.header('Authorization') || '');
        const fail = ctx.html(options.getFile(ctx), 401, {
            'WWW-Authenticate': 'Basic',
            'Content-Type': 'text/html'
        });
        const refCheck = await options.refCheck(ctx);
        if (refCheck) return fail;
        if (!authMatch) return fail;
        try {
            const dec = new TextDecoder();
            const auth = userPassReg.exec(dec.decode(decodeBase64(authMatch[1])));
            if (!auth) return fail;
            const isAuthed = await options.validate(ctx, auth[2], ctx.req.header('Host') as string);
            if (!isAuthed) return fail;
            await next();
            return;
        }
        catch (_) {
            return fail;
        }
    };
};

export { Masqr, type Options as MasqrOptions, masqrAuth };
