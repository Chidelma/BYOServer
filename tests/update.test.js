import { test, expect, describe } from 'bun:test'
import Silo from '../src/Stawrij.js'
import { photos, todos } from './data.js'
import { mkdirSync, rmSync } from 'node:fs'

//rmSync(process.env.DATA_PREFIX!, {recursive:true})

//mkdirSync(process.env.DATA_PREFIX!, {recursive:true})

describe("NO-SQL", async () => {

    const PHOTOS = 'photos'

    await Silo.bulkPutDocs(PHOTOS, photos.slice(0, 25))

    test("UPDATE ONE", async () => {

        let results = await Silo.findDocs(PHOTOS, {}).next(1)

        const id = Array.from(results.keys())[0]

        await Silo.patchDoc(PHOTOS, new Map([[id, { title: "All Mighty" }]]))

        results = await Silo.findDocs(PHOTOS, { $ops: [{ title: { $eq: "All Mighty" } }]}).next()
        
        expect(results.size).toBe(1)
    })

    test("UPDATE CLAUSE", async () => {

        const count = await Silo.patchDocs(PHOTOS, { title: "All Mighti", $where: { $ops: [{ title: { $like: "%est%" } }] } })

        const results = await Silo.findDocs(PHOTOS, { $ops: [ { title: { $eq: "All Mighti" } } ] }).next()
        
        expect(results.size).toBe(count)
    })

    test("UPDATE ALL", async () => {

        const count = await Silo.patchDocs(PHOTOS, { title: "All Mighter", $where: {} })

        const results = await Silo.findDocs(PHOTOS, { $ops: [ { title: { $eq: "All Mighter" } } ] }).next()
        
        expect(results.size).toBe(count)
    }, 60 * 60 * 1000)
})

describe("SQL", async () => {

    const TODOS = 'todos'

    for(const todo of todos.slice(0, 25)) {

        const keys = Object.keys(todo)
            
        const params = new Map()
        const values = []

        Object.values(todo).forEach((val, idx) => {
            if(typeof val === 'object') {
                params.set(keys[idx], val)
                values.push(keys[idx])
            } else if(typeof val === 'string') {
                values.push(`'${val}'`)
            } else values.push(val)
        })

        await Silo.executeSQL(`INSERT INTO ${TODOS} (${keys.join(',')}) VALUES (${values.join(',')})`, params)
    }

    test("UPDATE CLAUSE", async () => {

        const count = await Silo.executeSQL(`UPDATE ${TODOS} SET title = 'All Mighty' WHERE title LIKE '%est%'`)

        const cursor = await Silo.executeSQL(`SELECT * FROM ${TODOS} WHERE title = 'All Mighty'`)
        
        const results = await cursor.next()
        
        expect(results.size).toBe(count)
    })

    test("UPDATE ALL", async () => {

        const count = await Silo.executeSQL(`UPDATE ${TODOS} SET title = 'All Mightier'`)

        const cursor = await Silo.executeSQL(`SELECT * FROM ${TODOS} WHERE title = 'All Mightier'`)
        
        const results = await cursor.next()
        
        expect(results.size).toBe(count)
        
    }, 60 * 60 * 1000)
})