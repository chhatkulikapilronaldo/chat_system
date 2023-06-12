const mysql = require('mysql2');
require('dotenv').config();
class Database {
    constructor(config) {
        this.connection = mysql.createConnection( process.env.JAWSDB_URL ? process.env.JAWSDB_URL : config );
    }

    query(sql, args=[]) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (error, rows) => {
                if (error) {
                    return reject(error);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.connection.end( error => {
                if (error) {
                    return reject(error);
                } else {
                    resolve();
                }
            } );
        } );
    }
};

const connectDB = (dbName, dbPassword) => {
    const db = new Database({
      host: process.env.MYSQL_DB_HOST,
      port: process.env.MYSQL_DB_PORT,
      user:  process.env.MYSQL_DB_USER,
      password: process.env.MYSQL_DB_PASSWORD,
      database: process.env.MYSQL_DB_NAME
    })
    return db;
};

module.exports = connectDB;