'use strict'

const db = require('../persistence/db')

module.exports.up = async function(next) {
  const client = await db.connect()

  await client.query(`
    CREATE TABLE IF NOT EXISTS keys (
      id uuid PRIMARY KEY,
      graph_id uuid REFERENCES graphs (id) ON DELETE CASCADE,
      secret text
    );
  `)

  await client.query(`
    CREATE INDEX graph_key on graphs (id);
  `)

  await client.release(true)
  next()
}

module.exports.down = async function(next) {
  const client = await db.connect()

  await client.query(`
  DROP TABLE keys;
  `)

  await client.release(true)
  next()
}