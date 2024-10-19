const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'sook6538',
    database: 'chatdb'
});

module.exports = pool;