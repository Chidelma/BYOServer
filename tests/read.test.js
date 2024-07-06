import { test, expect, describe } from 'bun:test'
import Silo from '../src/Stawrij.js'
import { albums } from './data.js'
import { mkdirSync, rmSync } from 'node:fs'

//rmSync(process.env.DATA_PREFIX!, {recursive:true})
//mkdirSync(process.env.DATA_PREFIX!, {recursive:true})

const ALBUMS = 'albums'

await Silo.bulkPutDocs(ALBUMS, albums.slice(0, 25))

describe("NO-SQL", async () => {

    test("SELECT ALL", async () => {

        const results = await Silo.findDocs(ALBUMS, {}).next()

        expect(results.size).toBe(25)
    })

    test("SELECT PARTIAL", async () => {

        const results = await Silo.findDocs(ALBUMS, { $select: ["title"] }).next()

        const allAlbums = Array.from(results.values())

        const onlyTtitle = allAlbums.every(user => user.title && !user.userId)

        expect(onlyTtitle).toBe(true)
    })

    test("GET ONE", async () => {

        const results = await Silo.findDocs(ALBUMS, {}).next(1)

        const _id = Array.from(results.keys())[0]

        const result = await Silo.getDoc(ALBUMS, _id).once()

        const id = Array.from(result.keys())[0]

        expect(_id).toEqual(id)
    })

    test("SELECT CLAUSE", async () => {

        const results = await Silo.findDocs(ALBUMS, { $ops: [{ userId: { $eq: 2 } }] }).next()
        
        const allAlbums = Array.from(results.values())
        
        const onlyUserId = allAlbums.every(user => user.userId === 2)

        expect(onlyUserId).toBe(true)
    })

    test("SELECT LIMIT", async () => {

        const results = await Silo.findDocs(ALBUMS, {}).next(5)

        expect(results.size).toBe(5)
    })
})

describe("SQL", () => {

    test("SELECT PARTIAL", async () => {

        const cursor = await Silo.executeSQL(`SELECT title FROM ${ALBUMS}`)

        const results = await cursor.next()

        const allAlbums = Array.from(results.values())
        
        const onlyTtitle = allAlbums.every(user => user.title && !user.userId)

        expect(onlyTtitle).toBe(true)
    })

    test("SELECT CLAUSE", async () => {

        const cursor = await Silo.executeSQL(`SELECT * FROM ${ALBUMS} WHERE userId = 2`)

        const results = await cursor.next()
        
        const allAlbums = Array.from(results.values())
        
        const onlyUserId = allAlbums.every(user => user.userId === 2)

        expect(onlyUserId).toBe(true)
    })

    test("SELECT ALL", async () => {

        const cursor = await Silo.executeSQL(`SELECT * FROM ${ALBUMS}`)

        const results = await cursor.next()

        expect(results.size).toBe(25)
    })
})