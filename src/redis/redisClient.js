const redis = require('redis');

// Redis 클라이언트 생성
const client = redis.createClient({
    url: 'redis://localhost:6379',
    retry_strategy: function(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('The server refused the connection');
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    }
});

// 이벤트 설정
client.on('error', (err) => {
    console.error('Redis Client Error', err);
});

client.on('connect', () => {
    console.log('Connected to Redis server');
});

async function connectRedis() {
    try {
        await client.connect();
        console.log('Redis connected');
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
}

const lpush = async (key, value) => await client.lPush(key, value);
const ltrim = async (key, start, stop) => await client.lTrim(key, start, stop);
const lrange = async (key, start, stop) => await client.lRange(key, start, stop);
const hset = async (key, field, value) => await client.hSet(key, field, value);
const hgetall = async (key) => await client.hGetAll(key);
const get = async (key) => await client.get(key);
const set = async (key, value) => await client.set(key, value);
const del = async (key) => await client.del(key);

connectRedis();

module.exports = { lpush, ltrim, lrange, hset, hgetall, get, set, del };