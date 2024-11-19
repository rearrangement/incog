import { createServer } from 'node:http';
import { Socket } from "node:net";
import { type FastifyServerFactory, FastifyServerFactoryHandler, RawServerDefault } from "npm:fastify";
import wisp from 'npm:wisp-server-node';

const serverFactory: FastifyServerFactory = (handler: FastifyServerFactoryHandler): RawServerDefault => {
    return createServer()
        .on('request', (req, res) => {
            handler(req, res);
        })
        .on('upgrade', (req, socket, head) => {
            if (req.url?.endsWith('/wisp/')) {
                wisp.routeRequest(req, socket as Socket, head);
            }
        });
};

export { serverFactory };
