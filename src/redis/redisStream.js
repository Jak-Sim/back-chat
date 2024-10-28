const redisClient = require('./redisClient');

const formatStreamMessage = (userId, message, type = 'text') => ({
    userId,
    message,
    timestamp: Date.now(),
    type
});

const createConsumerGroup = async (streamKey, groupName) => {
    try {
        await redisClient.xGroupCreate(streamKey, groupName);
    } catch (err) {
        if (!err.message.includes('BUSYGROUP')) {
            throw err;
        }
    }
};

const addToStream = async (streamKey, messageData) => {
    try {
        if (!messageData) {
            throw new Error('Message data is required');
        }

        const result = await redisClient.xAdd(streamKey, messageData);
        console.log(`Added message to stream ${streamKey}:`, result);
        return result;
    } catch (err) {
        console.error(`Error adding to stream ${streamKey}:`, err);
        throw err;
    }
};

const readFromStream = async (streamKey, groupName, consumerName) => {
    try {
        const messages = await redisClient.xReadGroup(groupName, consumerName, streamKey);
        
        if (messages && messages.length > 0) {
            console.log(`Read ${messages.length} messages from ${streamKey}`);
        }
        
        return messages;
    } catch (err) {
        console.error(`Error reading from stream ${streamKey}:`, err);
        return [];
    }
};

const readRangeFromStream = async (streamKey, start = '-', end = '+') => {
    try {
        const messages = await redisClient.xRange(streamKey, start, end);
        return messages;
    } catch (err) {
        console.error(`Error reading range from stream ${streamKey}:`, err);
        return [];
    }
};

const deleteFromStream = async (streamKey, messageId) => {
    try {
        return await redisClient.xDel(streamKey, messageId);
    } catch (err) {
        console.error(`Error deleting from stream ${streamKey}:`, err);
        throw err;
    }
};

const cleanupStream = async (streamKey) => {
    try {
        await redisClient.clearStream(streamKey);
    } catch (err) {
        console.error(`Error cleaning up stream ${streamKey}:`, err);
        throw err;
    }
};

module.exports = {
    createConsumerGroup,
    addToStream,
    readFromStream,
    readRangeFromStream,
    deleteFromStream,
    cleanupStream
};