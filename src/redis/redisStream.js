const redisClient = require('./redisClient');

// Creates a consumer group for a given stream
const createConsumerGroup = async (streamKey, groupName) => {
    try {
        await redisClient.xGroupCreate(streamKey, groupName);
    } catch (err) {
        if (!err.message.includes('BUSYGROUP')) {
            throw err;
        }
    }
};

// Adds a message to the stream
const addToStream = async (streamKey, messageData) => {
    try {
        if (!messageData) {
            throw new Error('Message data is required');
        }

        const id = await redisClient.xAdd(streamKey, messageData);
        console.log(`Added message to stream ${streamKey}:`, id);
        return { id, ...messageData };
    } catch (err) {
        console.error(`Error adding to stream ${streamKey}:`, err);
        throw err;
    }
};

// Reads messages from the stream using a consumer group
const readFromStream = async (streamKey, groupName, consumerName) => {
    try {
        if (!streamKey || !groupName || !consumerName) {
            console.error('Missing required parameters for readFromStream');
            return [];
        }

        const messages = await redisClient.xReadGroup(groupName, consumerName, streamKey);

        if (Array.isArray(messages) && messages.length > 0) {
            console.log(`Read ${messages.length} messages from ${streamKey}`);
        }

        return messages;
    } catch (err) {
        console.error(`Error reading from stream ${streamKey}:`, err);
        return [];
    }
};

// Reads a range of messages from the stream
const readRangeFromStream = async (streamKey, start = '-', end = '+') => {
    try {
        const messages = await redisClient.xRange(streamKey, start, end);
        return messages;
    } catch (err) {
        console.error(`Error reading range from stream ${streamKey}:`, err);
        return [];
    }
};

// Deletes a message from the stream
const deleteFromStream = async (streamKey, messageId) => {
    try {
        return await redisClient.xDel(streamKey, messageId);
    } catch (err) {
        console.error(`Error deleting from stream ${streamKey}:`, err);
        throw err;
    }
};

// Cleans up the stream by clearing all messages
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