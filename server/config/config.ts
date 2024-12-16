import { parse } from "npm:smol-toml";

interface Data {
    buildOpts: {
        games: boolean;
    };
    server: {
        wisp: boolean;
        port: number;
    };
    //other options can be added later.
}

const doc = await Deno.readTextFile(`${Deno.cwd()}/config.toml`);
const parsedDoc = parse(doc) as unknown as Data;

if (typeof parsedDoc.buildOpts !== "object") {
    throw new Error(`Invalid structure: "buildOpts" should be an object`);
}
if (typeof parsedDoc.server !== "object") {
    throw new Error(`Invalid structure: "server" should be an object`);
}
if (typeof parsedDoc.buildOpts.games !== "boolean") {
    throw new Error(`Invalid type for "buildOpts.games"! It should be a boolean (true/false)`);
}
if (typeof parsedDoc.server.wisp !== "boolean") {
    throw new Error(`Invalid type for "server.wisp"! It should be a boolean (true/false)`);
}
if (typeof parsedDoc.server.port !== "number") {
    throw new Error(`Invalid type for "server.port"! It should be a number`);
}

export { type Data as TOMLConfig, parsedDoc };
