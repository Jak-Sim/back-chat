const redis = require('redis');

let client = null;
let isConnecting = false;
let connectionPromise = null;

// Redis 클라이언트 초기화 함수
function createClient() {
    const newClient = redis.createClient({
        url: 'redis://localhost:6379',
        socket: {
            keepAlive: 5000,
            reconnectStrategy: (retries) => {
                const delay = Math.min(retries * 100, 3000);
                console.log(`Reconnecting... Attempt ${retries}, delay: ${delay}ms`);
                return delay;
            }
        },
        commandTimeout: 5000,
        connectTimeout: 10000
    });

    newClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
        if (err.code === 'ECONNREFUSED') {
            client = null;
            connectionPromise = null;
        }
    });

    newClient.on('connect', () => {
        console.log('Connected to Redis server');
    });

    newClient.on('end', () => {
        console.log('Redis connection ended');
        client = null;
        connectionPromise = null;
    });

    newClient.on('reconnecting', () => {
        console.log('Redis Client reconnecting...');
    });

    return newClient;
}

// Redis 연결 상태 확인
async function ensureConnection() {
    if (client?.isReady) {
        return client;
    }

    if (isConnecting && connectionPromise) {
        await connectionPromise;
        return client;
    }

    try {
        isConnecting = true;
        client = createClient();
        connectionPromise = client.connect();
        await connectionPromise;
        isConnecting = false;
        return client;
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
        client = null;
        connectionPromise = null;
        isConnecting = false;
        throw err;
    }
}

// Redis 명령어 실행 함수 수정
async function executeRedisCommand(commandFunction) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const connectedClient = await ensureConnection();
            if (!connectedClient) {
                throw new Error('Could not get Redis connection');
            }

            const result = await commandFunction(connectedClient);
            if (result === null || result === undefined) {
                return [];  // 빈 결과는 빈 배열 리턴
            }
            return result;

        } catch (err) {
            console.error(`Redis command error (attempt ${attempt + 1}/${maxRetries}):`, err);
            lastError = err;

            if (err.message.includes('Invalid argument type')) {
                continue;
            }

            if (err.message.includes('Connection') ||
                err.message.includes('ECONNRESET') ||
                err.message.includes('ready') ||
                err.message.includes('null')) {
                client = null;
                connectionPromise = null;
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                continue;
            }

            throw err;
        }
    }

    throw lastError;
}

// Redis 스트림에 메시지 추가
const xAdd = async (streamKey, messageData) => {
    return executeRedisCommand(async (connectedClient) => {
        return connectedClient.xAdd(streamKey, '*', { data: JSON.stringify(messageData) });
    });
};

// Redis 스트림 길이 제한
const xTrim = async (streamKey, maxLen, options = {}) => {
    return executeRedisCommand(async (connectedClient) => {
        const args = ['MAXLEN'];
        if (options.approx) args.push('~');
        args.push(maxLen.toString());
        return connectedClient.xTrim(streamKey, ...args);
    });
};

// Redis 스트림에서 역순으로 범위 조회
const xRevRange = async (streamKey, end = '+', start = '-', count = 1) => {
    return executeRedisCommand(async (connectedClient) => {
        const args = [streamKey, end, start];
        if (count) args.push('COUNT', count);
        const messages = await connectedClient.xRevRange(...args);

        if (!messages || !Array.isArray(messages)) {
            return [];
        }

        return messages.map(parseMessage).filter(Boolean);
    });
};

// Redis 스트림에서 범위 조회
const xRange = async (streamKey, start = '-', end = '+') => {
    return executeRedisCommand(async (connectedClient) => {
        const messages = await connectedClient.xRange(streamKey, start, end);

        if (!messages || !Array.isArray(messages)) {
            return [];
        }

        return messages.map(parseMessage).filter(Boolean);
    });
};

// 메시지 파싱
function parseMessage(message) {
    try {
        let id, fields;

        if (Array.isArray(message)) {
            [id, fields] = message;
        } else if (typeof message === 'object' && message !== null) {
            id = message.id;
            fields = message.message;
        } else {
            return null;
        }

        if (fields && fields.data) {
            const parsedData = JSON.parse(fields.data);
            return { id, ...parsedData };
        }

        if (fields && fields.message) {
            const parsedMessage = JSON.parse(fields.message);
            return { id, ...parsedMessage };
        }

        if (fields && typeof fields === 'object') {
            return { id, ...fields };
        }

        return null;
    } catch (parseError) {
        console.error('Error parsing message:', {
            error: parseError,
            message: message,
            fields: fields
        });
        return null;
    }
}

// Redis 스트림의 길이 조회
const xLen = async (streamKey) => {
    return executeRedisCommand(async (connectedClient) => {
        return connectedClient.xLen(streamKey);
    });
};

// Redis 그룹 생성
const xGroupCreate = async (streamKey, groupName, startId = '0') => {
    try {
        await executeRedisCommand(async (connectedClient) => {
            return connectedClient.xGroupCreate(streamKey, groupName, startId, { MKSTREAM: true });
        });
    } catch (err) {
        if (!err.message.includes('BUSYGROUP')) {
            console.error(`Error creating group ${groupName} for stream ${streamKey}:`, err);
            throw err;
        }
        console.log(`Group ${groupName} already exists for stream ${streamKey}`);
    }
};

// Redis 그룹에서 메시지 읽기
const xReadGroup = async (groupName, consumerName, streamKey, lastId = '>') => {
    return executeRedisCommand(async (connectedClient) => {
        const result = await connectedClient.xReadGroup(
            groupName,
            consumerName,
            [{ key: streamKey, id: lastId }],
            { COUNT: 10 }
        );

        if (!result || !Array.isArray(result) || result.length === 0) {
            return [];
        }

        const stream = result[0];
        if (!stream?.messages || !Array.isArray(stream.messages)) {
            return [];
        }

        return stream.messages.map(parseMessage).filter(Boolean);
    });
};

// Redis 스트림에서 메시지 삭제
const xDel = async (streamKey, messageId) => {
    return executeRedisCommand(async (connectedClient) => {
        return connectedClient.xDel(streamKey, messageId);
    });
};

// Redis 스트림 삭제
const clearStream = async (streamKey) => {
    return executeRedisCommand(async (connectedClient) => {
        return connectedClient.del(streamKey);
    });
};

// 리스트에 요소 추가
const lpush = async (key, value) => {
    return executeRedisCommand(async (connectedClient) => {
        return connectedClient.lPush(key, value);
    });
};

// 리스트 트림
const ltrim = async (key, start, stop) => {
    return executeRedisCommand(async (connectedClient) => {
        return connectedClient.lTrim(key, start, stop);
    });
};

// 리스트 범위 조회
const lrange = async (key, start, stop) => {
    return executeRedisCommand(async (connectedClient) => {
        return connectedClient.lRange(key, start, stop);
    });
};

// 해시셋에 필드 설정
const hset = async (key, field, value) => {
    return executeRedisCommand(async (connectedClient) => {
        return connectedClient.hSet(key, field, value);
    });
};

// 해시셋 모든 필드 가져오기
const hgetall = async (key) => {
    return executeRedisCommand(async (connectedClient) => {
        return connectedClient.hGetAll(key);
    });
};

const get = async (key) => {
    return executeRedisCommand(async (connectedClient) => {
        return connectedClient.get(key);
    });
};

const set = async (key, value) => {
    return executeRedisCommand(async (connectedClient) => {
        return connectedClient.set(key, value);
    });
};

const del = async (key) => {
    return executeRedisCommand(async (connectedClient) => {
        return connectedClient.del(key);
    });
};

// 키 존재 여부 확인
const exists = async (key) => {
    return executeRedisCommand(async (connectedClient) => {
        return connectedClient.exists(key);
    });
};

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