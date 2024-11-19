import fastifyCompress from '@fastify/compress';
import fastifyCookie from '@fastify/cookie';
import fastifyHttpProxy from '@fastify/http-proxy';
import fastifyMiddie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import { masqr } from '@rubynetwork/corlink-fastify';
import chalk from 'chalk';
import Fastify from 'fastify';
import gradient from "npm:gradient-string";
import { serverFactory } from './serverFactory.ts';

const app = Fastify({ logger: false, serverFactory: serverFactory });

await app.register(fastifyCookie, {
    secret: Deno.env.get('COOKIE_SECRET') || 'e',
    parseOptions: {}
});
if (Deno.env.get('MASQR') === 'true') {
    await app.register(masqr, {
        deniedFilePath: `${Deno.cwd()}/server/denied.html`,
        unlockedPaths: ['/wisp/'],
        whiteListedURLs: [],
        masqrUrl: 'https://corlink.example.com/validate?license=',
        builtinCookieParser: false,
        v3: false
    });
}
await app.register(fastifyCompress, {
    encodings: ['br', 'gzip', 'deflate']
});
await app.register(fastifyStatic, {
    root: `${Deno.cwd()}/dist`
});
await app.register(fastifyMiddie);
await app.register(fastifyHttpProxy, {
    upstream: 'https://rawcdn.githack.com/ruby-network/ruby-assets/main/',
    prefix: '/gms/',
    http2: false
});
let port: number;
//if (isDocker()) {
    port = 8080;
//} else {
    port = parseInt(Deno.env.get('PORT') as string) || 8000;
//}

const message = `
 ___                       _ _        
|_ _|_ __   ___ ___  _ __ (_) |_ ___  
 | || '_ \\ / __/ _ \\| '_ \\| | __/ _ \\ 
 | || | | | (_| (_) | | | | | || (_) |
|___|_| |_|\\___\\___/|_| |_|_|\\__\\___/
`
const messageColors = {
    green: "#34b874",
    white: "#ffffff",
    blue: "#161923",
}

console.log(gradient(Object.values(messageColors)).multiline(message));
app.listen({ port: port, host: '0.0.0.0' }).then(() => {
    console.log(`${chalk.hex("#34b874")("Server listening on")} ${chalk.white.bold('http://localhost:' + port)}`);
    console.log(chalk.white.bold(`Server also listening on ${chalk.hex("#34b874").bold('http://0.0.0.0:' + port)}`));
});
