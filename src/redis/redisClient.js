const redis = require('redis');

let client = null;

// Redis 클라이언트 init
function createClient() {
    return redis.createClient({
        url: 'redis://localhost:6379',
        socket: {
            keepAlive: 5000,
            reconnectStrategy: retries => Math.min(retries * 100, 3000)
        }
    });
}
// Redis 연결 상태 확인
async function ensureConnection() {
    if (!client) {
        client = createClient();
        
        client.on('error', (err) => {
            console.error('Redis Client Error:', err);
            if (err.code === 'ECONNREFUSED') {
                client = null;
            }
        });

        client.on('connect', () => {
            console.log('Connected to Redis server');
        });

        client.on('end', () => {
            console.log('Redis connection ended');
            client = null;
        });
    }

    if (!client.isReady) {
        try {
            await client.connect();
            console.log('Redis connected');
        } catch (err) {
            console.error('Failed to connect to Redis:', err);
            client = null;
            throw err;
        }
    }

    return client;
}

// Redis 명령어 실행 전에 연결 상태 확인
async function executeRedisCommand(command, ...args) {
    try {
        const connectedClient = await ensureConnection();
        return await command.apply(connectedClient, args);
    } catch (err) {
        console.error(`Error executing Redis command:`, err);
        throw err;
    }
}

const exists = async (key) => {
    try {
        const result = await executeRedisCommand(client.exists.bind(client), key);
        console.log(`Key ${key} exists:`, result);
        return result;
    } catch (err) {
        console.error(`Error checking existence of key ${key}:`, err);
        throw err;
    }
};

const xAdd = async (streamKey, messageData) => {
    try {
        const id = await executeRedisCommand(
            client.xAdd.bind(client),
            streamKey,
            '*',
            { data: JSON.stringify(messageData) }
        );
        return { id, ...messageData };
    } catch (err) {
        console.error(`Error adding message to stream ${streamKey}:`, err);
        throw err;
    }
};

const xTrim = async (streamKey, maxLen, options = {}) => {
    try {
        const args = ['MAXLEN'];
        if (options.approx) args.push('~');
        args.push(maxLen.toString());
        const result = await executeRedisCommand(client.xTrim.bind(client), streamKey, ...args);
        console.log(`Stream ${streamKey} trimmed:`, result);
        return result;
    } catch (err) {
        console.error(`Error trimming stream ${streamKey}:`, err);
        throw err;
    }
};

const xRevRange = async (streamKey, end = '+', start = '-', count = 1) => {
    try {
        const args = [streamKey, end, start];
        if (count) args.push({ COUNT: count });
        const messages = await executeRedisCommand(client.xRevRange.bind(client), ...args);
        console.log(`Messages read from stream ${streamKey} in reverse order:`, messages);
        return messages;
    } catch (err) {
        console.error(`Error reading reverse range from stream ${streamKey}:`, err);
        throw err;
    }
};

const xRange = async (streamKey, start = '-', end = '+') => {
    try {
        const result = await executeRedisCommand(
            client.xRange.bind(client),
            streamKey,
            start,
            end
        );

        if (!result || !Array.isArray(result)) {
            return [];
        }

        const messages = result.map(item => {
            try {
                const { id, message } = item;
                if (message && message.data) {
                    const parsedData = JSON.parse(message.data);
                    return {
                        id,
                        ...parsedData
                    };
                }
                return null;
            } catch (parseError) {
                console.error('Error parsing message:', parseError);
                return null;
            }
        }).filter(Boolean);

        return messages;
    } catch (err) {
        console.error(`Error reading range from stream ${streamKey}:`, err);
        return [];
    }
};


const xLen = async (streamKey) => {
    try {
        const length = await executeRedisCommand(client.xLen.bind(client), streamKey);
        console.log(`Length of stream ${streamKey}:`, length);
        return length;
    } catch (err) {
        console.error(`Error getting length of stream ${streamKey}:`, err);
        throw err;
    }
};

const xGroupCreate = async (streamKey, groupName, startId = '0') => {
    try {
        await executeRedisCommand(
            client.xGroupCreate.bind(client),
            streamKey,
            groupName,
            startId,
            { MKSTREAM: true }
        );
    } catch (err) {
        if (!err.message.includes('BUSYGROUP')) {
            throw err;
        }
    }
};

const xReadGroup = async (groupName, consumerName, streamKey, lastId = '>') => {
    try {
        const result = await executeRedisCommand(
            client.xReadGroup.bind(client),
            groupName,
            consumerName,
            [{ key: streamKey, id: lastId }],
            { COUNT: 10, BLOCK: 1000 }
        );

        if (!result || !Array.isArray(result) || !result[0].messages) {
            return [];
        }

        const messages = result[0].messages.map(item => {
            try {
                const { id, message } = item;
                if (message && message.data) {
                    const parsedData = JSON.parse(message.data);
                    return {
                        id,
                        ...parsedData
                    };
                }
                return null;
            } catch (parseError) {
                console.error('Error parsing message:', parseError);
                return null;
            }
        }).filter(Boolean);

        return messages;
    } catch (err) {
        console.error(`Error reading group messages from ${streamKey}:`, err);
        return [];
    }
};

const xDel = async (streamKey, messageId) => {
    try {
        return await executeRedisCommand(client.xDel.bind(client), streamKey, messageId);
    } catch (err) {
        console.error(`Error deleting message from stream ${streamKey}:`, err);
        throw err;
    }
};

const clearStream = async (streamKey) => {
    try {
        await executeRedisCommand(client.del.bind(client), streamKey);
        console.log(`Cleared stream ${streamKey}`);
    } catch (err) {
        console.error(`Error clearing stream ${streamKey}:`, err);
        throw err;
    }
};

const lpush = async (key, value) => executeRedisCommand(client.lPush.bind(client), key, value);
const ltrim = async (key, start, stop) => executeRedisCommand(client.lTrim.bind(client), key, start, stop);
const lrange = async (key, start, stop) => executeRedisCommand(client.lRange.bind(client), key, start, stop);
const hset = async (key, field, value) => executeRedisCommand(client.hSet.bind(client), key, field, value);
const hgetall = async (key) => executeRedisCommand(client.hGetAll.bind(client), key);
const get = async (key) => executeRedisCommand(client.get.bind(client), key);
const set = async (key, value) => executeRedisCommand(client.set.bind(client), key, value);
const del = async (key) => executeRedisCommand(client.del.bind(client), key);

// 초기 연결 시도
ensureConnection().catch(console.error);

module.exports = {
    lpush,
    ltrim,
    lrange,
    hset,
    hgetall,
    get,
    set,
    del,
    exists,
    xRevRange,
    xAdd,
    xTrim,
    xRange,
    xLen,
    xGroupCreate,
    xReadGroup,
    xDel,
    clearStream
};