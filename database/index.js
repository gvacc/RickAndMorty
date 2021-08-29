require('dotenv').config()
const fs = require('fs')
const path = require('path')
const pg = require('pg')

const elephantCloudConfig = {
    connectionString: process.env.elephantCloud_db_uri
};

const db = new pg.Client(elephantCloudConfig)

db.on('connect', () => {
	console.log(`Подключились к базе данных`)
})
db.on('end', () => {
	console.log(`Отключились от базы данных`)
})

module.exports = db

