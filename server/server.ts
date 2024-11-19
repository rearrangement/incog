import fastifyCompress from '@fastify/compress';
import fastifyCookie from '@fastify/cookie';
import fastifyHttpProxy from '@fastify/http-proxy';
import fastifyMiddie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import { masqr } from '@rubynetwork/corlink-fastify';
import chalk from 'chalk';
import Fastify from 'fastify';
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
console.log(chalk.green(`Server listening on ${chalk.bold('http://localhost:' + port)}`));
console.log(chalk.magenta(`Server also listening on ${chalk.bold('http://0.0.0.0:' + port)}`));

app.listen({ port: port, host: '0.0.0.0' });
