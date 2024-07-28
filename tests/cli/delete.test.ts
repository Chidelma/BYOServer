import { test, describe } from 'bun:test'
import { users } from '../data.js'
import { mkdirSync, rmSync } from 'node:fs'
import { $ } from 'bun'
import Silo from "@delma/byos"

rmSync(process.env.DATA_PREFIX!, {recursive:true})
mkdirSync(process.env.DATA_PREFIX!, {recursive:true})

describe("SQL", async () => {

    const USERS = 'users'

    await $`bun byos "CREATE TABLE ${USERS}"`

    await Promise.all(users.slice(0, 25).map((user: _user) => {

        const keys = Object.keys(user)
        const values = Object.values(user).map(val => JSON.stringify(val))

        return $`bun byos "INSERT INTO ${USERS} (${keys.join(',')}) VALUES (${values.join('|')})"`
    }))

    let cursor = await Silo.executeSQL<_user>(`SELECT * FROM users LIMIT 1`) as _storeCursor<_user>

    let results = await cursor.collect() as Map<_uuid, _user>

    test("DELETE CLAUSE", async () => {

        const name = Array.from(results.values())[0].name

        await $`bun byos "DELETE FROM users WHERE name = '${name}'"`
    })

    test("DELETE ALL", async () => {

        await $`bun byos "DELETE FROM users"`
    })
})