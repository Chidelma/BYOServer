import { test, expect, describe } from 'bun:test'
import { albums } from '../data.js'
import { $ } from 'bun'
import { mkdirSync, rmSync } from 'node:fs'

rmSync(process.env.DATA_PREFIX!, {recursive:true})
mkdirSync(process.env.DATA_PREFIX!, {recursive:true})

const ALBUMS = 'albums'

describe("SQL", () => {

    test("INSERT", async () => {

        await $`bun byos "CREATE TABLE ${ALBUMS}"`

        await Promise.all(albums.slice(0, 25).map((album: _album) => {

            const keys = Object.keys(album)
            const values = Object.values(album).map(val => JSON.stringify(val))

            return $`bun byos "INSERT INTO ${ALBUMS} (${keys.join(',')}) VALUES (${values.join('|')})"`
        }))

    })
})