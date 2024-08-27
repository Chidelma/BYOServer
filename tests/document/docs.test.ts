import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { mkdir, rm } from "node:fs/promises"
import { photosURL, urlPrefix } from "../data.js"

const PHOTOS = 'photos'

beforeAll(async () => {

    await rm(process.env.DB_DIR!, {recursive:true})
    await mkdir(process.env.DB_DIR!, {recursive:true})
})

afterAll(async () => {

    await Promise.allSettled([rm(process.env.DB_DIR!, { recursive:true }), fetch(`${urlPrefix}/${PHOTOS}/schema`, { method: "DELETE" })])
})

describe("byos/[primary]/docs", async () => {

    test("POST", async () => {

        const res = await fetch(`${urlPrefix}/${PHOTOS}/migrate`, {
            method: "POST",
            body: JSON.stringify({ url: photosURL, limit: 100 })
        })

        expect(res.status).toEqual(200)
    })

    test("GET", async () => {

        const res = await fetch(`${urlPrefix}/${PHOTOS}/docs`)

        expect(res.status).toEqual(200)

        const results = await res.json()

        expect(Object.entries(results).length).toEqual(100)
    })

    test("PATCH", async () => {

        const update: _storeUpdate<_photo> = {
            $set: { title: "All Mighti" },
            $where: { $ops: [{ title: { $like: "%est%" } }] }
        }

        let res = await fetch(`${urlPrefix}/${PHOTOS}/docs`, {
            method: "PATCH",
            body: JSON.stringify(update)
        })

        const count = await res.json()

        const params = new URLSearchParams({ $ops: JSON.stringify([{ title: { $eq: "All Mighti" } }]) })

        res = await fetch(`${urlPrefix}/${PHOTOS}/docs?${params.toString()}`)

        expect(res.status).toEqual(200)

        const results = await res.json()

        expect(Object.entries(results).length).toEqual(count)
    })

    test("DELETE", async () => {

        await fetch(`${urlPrefix}/${PHOTOS}/docs`, {
            method: "DELETE"
        })

        const res = await fetch(`${urlPrefix}/${PHOTOS}/docs`)

        expect(res.status).toEqual(200)

        const results = await res.json()

        expect(Object.entries(results).length).toEqual(0)
    })
})