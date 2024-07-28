import { $ } from "bun"
import { rmSync, mkdirSync } from "node:fs"
import { albums, posts } from "../data.js"
import { describe, test } from "bun:test"

rmSync(process.env.DATA_PREFIX!, {recursive:true})
mkdirSync(process.env.DATA_PREFIX!, {recursive:true})

const ALBUMS = 'albums'

await $`bun byos "CREATE TABLE ${ALBUMS}"`

await Promise.all(albums.slice(0, 25).map((album: _album) => {

    const keys = Object.keys(album)
    const values = Object.values(album).map(val => JSON.stringify(val))

    return $`bun byos "INSERT INTO ${ALBUMS} (${keys.join(',')}) VALUES (${values.join('|')})"`
}))

const POSTS = 'posts'

await $`bun byos "CREATE TABLE ${POSTS}"`

await Promise.all(posts.slice(0, 25).map((post: _post) => {

    const keys: string[] = []
    const values: string[] = []

    Object.entries(post).forEach(([key, value]) => {
        keys.push(key)
        values.push(JSON.stringify(value))
    })

    return $`bun byos "INSERT INTO ${POSTS} (${keys.join(',')}) VALUES (${values.join('|')})"`
}))

describe("SQL", () => {

    test("SELECT PARTIAL", async () => {

        await $`bun byos "SELECT title FROM ${ALBUMS}"`
    })

    test("SELECT CLAUSE", async () => {

        await $`bun byos "SELECT * FROM ${ALBUMS} WHERE userId = 2"`
    })

    test("SELECT ALL", async () => {

        await $`bun byos "SELECT * FROM ${ALBUMS}"`
    })

    test("SELECT LIMIT", async () => {

        await $`bun byos "SELECT * FROM ${ALBUMS} LIMIT 5"`
    })

    test("SELECT GROUP BY", async () => {

        await $`bun byos "SELECT userId FROM ${ALBUMS} GROUP BY userId"`
    })

    test("SELECT JOIN", async () => {

        await $`bun byos "SELECT * FROM ${ALBUMS} INNER JOIN ${POSTS} ON userId = id"`
    })
})