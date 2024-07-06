import { test, expect, describe } from 'bun:test'
import Silo from '../src/Stawrij.js'
import { albums, posts } from './data.js'
import { mkdirSync, rmSync } from 'fs'

//rmSync(process.env.DATA_PREFIX!, {recursive:true})
//mkdirSync(process.env.DATA_PREFIX!, {recursive:true})

describe("NO-SQL", () => {

    test("PUT", async () => {

        await Silo.bulkPutDocs('posts', posts.slice(0, 25))

        const results = await Silo.findDocs('posts', {}).next()

        expect(results.size).toEqual(25)

    }, 60 * 60 * 1000)
})

const ALBUMS = 'albums'

describe("SQL", () => {

    test("INSERT", async () => {

        for(const album of albums.slice(0, 25)) {

            const keys = Object.keys(album)
            
            const params = new Map()
            const values = []

            Object.values(album).forEach((val, idx) => {
                if(typeof val === 'object') {
                    params.set(keys[idx], val)
                    values.push(keys[idx])
                } else if(typeof val === 'string') {
                    values.push(`'${val}'`)
                } else values.push(val)
            })

            await Silo.executeSQL(`INSERT INTO ${ALBUMS} (${keys.join(',')}) VALUES (${values.join(',')})`, params)
        }

        const cursor = await Silo.executeSQL(`SELECT * FROM ${ALBUMS}`)

        const results = await cursor.next()

        expect(results.size).toEqual(25)

    }, 60 * 60 * 1000)
})