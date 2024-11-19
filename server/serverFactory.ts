import { createServer } from 'node:http';
import wisp from 'npm:wisp-server-node';

const serverFactory = (handler: any) => {
    return createServer()
        .on('request', (req: any, res: any) => {
            handler(req, res);
        })
        .on('upgrade', (req: any, socket: any, head: any) => {
            if (req.url?.endsWith('/wisp/')) {
                wisp.routeRequest(req, socket, head);
            }
        });
};

export { serverFactory };
