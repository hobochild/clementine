const { sql } = require('slonik')
const uuid = require('uuid/v4')
const bcrypt = require('bcrypt')
const db = require('./db')

module.exports = {
  async createPasswordless(email) {
    try {
      const { rows } = await db.query(sql`
      INSERT INTO users (id, email)
        VALUES (${uuid()}, ${email})
        RETURNING id, email;
      `)

      const [user] = rows
      return user
    } catch (error) {
      throw error
    }
  },
  async create(email, password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10)

      const { rows } = await db.query(sql`
      INSERT INTO users (id, email, password)
        VALUES (${uuid()}, ${email}, ${hashedPassword})
        RETURNING id, email;
      `)

      const [user] = rows
      return user
    } catch (error) {
      throw error
    }
  },
  async find(email) {
    const { rows } = await db.query(sql`
    SELECT * FROM users WHERE email=${email} LIMIT 1;
    `)
    return rows[0]
  },
  async findById(id) {
    if (!id) {
      return null
    }

    const { rows } = await db.query(sql`
    SELECT * FROM users WHERE id=${id} LIMIT 1;
    `)
    return rows[0]
  }
}
