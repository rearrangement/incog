import { Context, MiddlewareHandler } from "jsr:@hono/hono";
import { decodeBase64 } from "jsr:@std/encoding/base64";
import { getCookie, getSignedCookie, setCookie, setSignedCookie } from "jsr:@hono/hono/cookie";

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
        if (this.#options.whitelistedURLS.includes(ctx.req.header('Host') as string)) return true;
        if (this.#options.unlockedPaths.includes(ctx.req.header('Host') as string)) return true;
        return true;
        try {
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
}

type Auth = {
    getFile: (ctx: Context) => string | Promise<string>;
    validate: (ctx: Context, key: string, host: string) => boolean | Promise<boolean>;
}



//I did not write this regex (And there is no way I was going to). I found it here: https://github.com/honojs/hono/blob/main/src/utils/basic-auth.ts. The only reason I am not using that middleware is because I need to return HTML. NOT a string
const credsReg = /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/;
const userPassReg = /^([^:]*):(.*)$/;

const masqrAuth = (options: Auth): MiddlewareHandler => {
    return async function masqrAuth(ctx, next) {
        const authMatch = credsReg.exec(ctx.req.header('Authorization') || '');
        console.log(authMatch);
        const refCheck = getCookie(ctx, 'refreshcheck');
        if (refCheck !== undefined || refCheck !== true) {
            setCookie(ctx, 'refreshcheck', 'true')
            ctx.html(options.getFile(ctx), 401);
        }
        if (!authMatch) return ctx.html(options.getFile(ctx), 401, {
            'WWW-Authenticate': 'Basic'
        });
        try {
            const dec = new TextDecoder();
            const auth = userPassReg.exec(dec.decode(decodeBase64(authMatch[1])));
            if (!auth) return ctx.html(options.getFile(ctx), 401, {
                'WWW-Authenticate': 'Basic'
            });
            const isAuthed = await options.validate(ctx, auth[2], ctx.req.header('Host') as string);
            if (!isAuthed) return ctx.html(options.getFile(ctx), 401, {
                "WWW-Authenticate": "Basic"
            });
            await next();
            return;
        }
        catch (_) {
            return ctx.html(options.getFile(ctx), 401, {
                'WWW-Authenticate': 'Basic'
            });
        }
    };
};

export { Masqr, type Options as MasqrOptions, masqrAuth };
