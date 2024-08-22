import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { mkdir, rm } from "node:fs/promises"
import { postsURL, albumURL } from "../data.js"

const ALBUMS = 'albums'
const POSTS = 'posts'

const urlPrefix = `http://localhost:8000/byos`


beforeAll(async () => {

    await rm(process.env.DB_DIR!, {recursive:true})
    await mkdir(process.env.DB_DIR!, {recursive:true})

    await fetch(`${urlPrefix}/${ALBUMS}/schema`, {
        method: "POST",
    }) 

    await fetch(`${urlPrefix}/${POSTS}/schema`, {
        method: "POST",
    }) 

    await fetch(`${urlPrefix}/${ALBUMS}/migrate`, {
        method: "POST",
        body: JSON.stringify({ url: albumURL, limit: 100 })
    })

    await fetch(`${urlPrefix}/${POSTS}/migrate`, {
        method: "POST",
        body: JSON.stringify({ url: postsURL, limit: 100 })
    })
})

afterAll(async () => {

    await Promise.allSettled([rm(process.env.DB_DIR!, { recursive:true }), fetch(`${urlPrefix}/${ALBUMS}/schema`, { method: "DELETE" }), fetch(`${urlPrefix}/${POSTS}/schema`, { method: "DELETE" })])
})

describe("byos/[primary]/join/[secondary]/docs", async () => {

    test("GET", async () => {

        const params = new URLSearchParams({ $mode: "inner", $on: JSON.stringify({ userId: { $eq: "userId" } }) } )

        const res = await fetch(`${urlPrefix}/${ALBUMS}/join/${POSTS}/docs?${params.toString()}`)

        expect(res.status).toEqual(200)

        const results = await res.json()

        expect(Object.entries(results).length).toBeGreaterThan(0)
    })
})