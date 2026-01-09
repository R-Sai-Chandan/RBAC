const pgPromise = require('pg-promise')
require('dotenv').config()

const pgp = pgPromise({
  capSQL: true // helps with readable SQL later
})

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not set in environment variables')
}

const db = pgp(process.env.DATABASE_URL)

module.exports = db
