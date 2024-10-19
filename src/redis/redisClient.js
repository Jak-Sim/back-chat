const redis = require('redis');
const { promisify } = require('util');

const client = redis.createClient();

// Redis 비동기 처리
const lpush = promisify(client.lpush).bind(client);
const ltrim = promisify(client.ltrim).bind(client);
const lrange = promisify(client.lrange).bind(client);
const hset = promisify(client.hset).bind(client);
const hgetall = promisify(client.hgetall).bind(client);

client.on('error', (err) => console.error('Redis Client Error', err));

module.exports = { lpush, ltrim, lrange, hset, hgetall };