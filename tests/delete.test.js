import { test, expect, describe } from 'bun:test'
import Silo from '../src/Stawrij.js'
import { comments, users } from './data.js'
import { mkdirSync, rmSync } from 'node:fs'

//rmSync(process.env.DATA_PREFIX!, {recursive:true})

//mkdirSync(process.env.DATA_PREFIX!, {recursive:true})

describe("NO-SQL", async () => {

    const COMMENTS = 'comments'

    await Silo.bulkPutDocs(COMMENTS, comments.slice(0, 25))

    let results = await Silo.findDocs(COMMENTS, {}).next(1)

    test("DELETE ONE", async () => {

        const id = Array.from(results.keys())[0]

        await Silo.delDoc(COMMENTS, id)

        results = await Silo.findDocs(COMMENTS, {}).next()

        const idx = Array.from(results.keys()).findIndex(_id => _id === id)

        expect(idx).toEqual(-1)

    }, 60 * 60 * 1000)

    test("DELETE CLAUSE", async () => {

        await Silo.delDocs(COMMENTS, { $ops: [ { name: { $like: "%et%" } } ] })

        results = await Silo.findDocs(COMMENTS, { $ops: [ { name: { $like: "%et%" } } ] }).next()

        expect(results.size).toEqual(0)

    }, 60 * 60 * 1000)

    test("DELETE ALL", async () => {

        Silo.delDocs(COMMENTS, {})

        results = Silo.findDocs(COMMENTS, {}).next()

        expect(results.size).toBe(0)

    }, 60 * 60 * 1000)
})


describe("SQL", async () => {

    const USERS = 'users'

    for(const user of users.slice(0, 25)) {

        const keys = Object.keys(user)
            
        const params = new Map()
        const values = []

        Object.values(user).forEach((val, idx) => {
            if(typeof val === 'object') {
                params.set(keys[idx], val)
                values.push(keys[idx])
            } else if(typeof val === 'string') {
                values.push(`'${val}'`)
            } else values.push(val)
        })

        await Silo.executeSQL(`INSERT INTO ${USERS} (${keys.join(',')}) VALUES (${values.join(',')})`, params)
    }

    let cursor = await Silo.executeSQL(`SELECT * FROM users`)

    let results = await cursor.next(1)

    test("DELETE CLAUSE", async () => {

        const name = Array.from(results.values())[0].name

        await Silo.executeSQL(`DELETE from users WHERE name = '${name}'`)

        cursor = await Silo.executeSQL(`SELECT * FROM users WHERE name = '${name}'`)

        results = await cursor.next()
        
        const idx = Array.from(results.values()).findIndex(com => com.name === name)

        expect(idx).toBe(-1)
    })

    test("DELETE ALL", async () => {

        await Silo.executeSQL(`DELETE from users`)

        cursor = await Silo.executeSQL(`SELECT * FROM users`)

        results = await cursor.next()

        expect(results.size).toBe(0)
    })
})