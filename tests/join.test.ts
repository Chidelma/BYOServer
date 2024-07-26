import { describe, test, expect } from "bun:test"
import { mkdirSync, rmSync } from "node:fs"
import { posts, albums } from "./data.js"

rmSync(process.env.DATA_PREFIX!, {recursive:true})
mkdirSync(process.env.DATA_PREFIX!, {recursive:true})

const ALBUMS = 'albums'
const POSTS = 'posts'

const urlPrefix = `http://localhost:8000/byos`

describe("byos/[primary]/join/[secondary]/docs", async () => {

    await fetch(`${urlPrefix}/${ALBUMS}/schema`, {
        method: "POST",
    })

    await fetch(`${urlPrefix}/${POSTS}/schema`, {
        method: "POST",
    })

    await fetch(`${urlPrefix}/${ALBUMS}/docs`, {
        method: "POST",
        body: JSON.stringify(albums.slice(0, 25))
    })

    await fetch(`${urlPrefix}/${POSTS}/docs`, {
        method: "POST",
        body: JSON.stringify(posts.slice(0, 25))
    })

    test("GET", async () => {

        const params = new URLSearchParams({ $mode: "inner", $on: JSON.stringify({ userId: { $eq: "userId" } }) } )

        const res = await fetch(`${urlPrefix}/${ALBUMS}/join/${POSTS}/docs?${params.toString()}`)

        expect(res.status).toEqual(200)

        const results = await res.json()

        expect(Object.entries(results).length).toBeGreaterThan(0)
    })
})