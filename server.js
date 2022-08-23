"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const axios_1 = __importDefault(require("axios"));
const fastify_1 = __importDefault(require("fastify"));
const redis_1 = require("redis");
const server = (0, fastify_1.default)({ logger: true });
server.get('/user/:user', async (req) => {
    try {
        const { data } = await axios_1.default.get(`https://api.github.com/users/${req.params.user}/gists`, {
            headers: {
                Accept: 'application/json',
                OAUth: process.env.GITHUB_ACCESS_TOKEN || ''
            }
        });
        const client = (0, redis_1.createClient)();
        client.on('error', (err) => console.error('Redis Client Error', err));
        await client.connect();
        const query = await client.get(req.params.user);
        let newData = data;
        if (query) {
            const savedData = JSON.parse(query);
            newData = newData.filter(f => !savedData.find(s => s === f.id));
        }
        if (newData.length) {
            client.set(req.params.user, JSON.stringify(data.map(d => d.id)));
        }
        return newData;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            console.log('error message: ', error.message);
            return error.message;
        }
        else {
            console.log('unexpected error: ', error);
            return 'An unexpected error occurred';
        }
    }
});
const start = async () => {
    try {
        server.listen({ port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
