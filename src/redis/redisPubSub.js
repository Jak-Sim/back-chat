const redis = require('redis');

const pubClient = redis.createClient({ url: 'redis://localhost:6379' });
const subClient = redis.createClient({ url: 'redis://localhost:6379' });

(async () => {
    await pubClient.connect().catch((err) => console.error('Pub Client Error', err));
    await subClient.connect().catch((err) => console.error('Sub Client Error', err));
})();

pubClient.on('error', (err) => console.error('Pub Client Error', err));
subClient.on('error', (err) => console.error('Sub Client Error', err));

const publish = async (channel, message) => {
    try {
        const reply = await pubClient.publish(channel, message);
        console.log(`Message published to ${channel}:`, reply);
        return reply;
    } catch (err) {
        console.error(`Error publishing to ${channel}:`, err);
        throw err;
    }
};

const subscribe = async (channel, messageHandler) => {
    try {
        await subClient.subscribe(channel, (message) => {
            try {
                messageHandler(null, message);
            } catch (err) {
                console.error(`Error in message handler for ${channel}:`, err);
                messageHandler(err, null);
            }
        });
        console.log(`Subscribed to ${channel}`);
    } catch (err) {
        console.error(`Error subscribing to ${channel}:`, err);
        messageHandler(err, null);
    }
};

module.exports = { publish, subscribe };