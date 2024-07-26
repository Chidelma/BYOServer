import { describe, test, expect } from "bun:test"
import { mkdirSync, rmSync } from "node:fs"
import { photos } from "./data.js"

rmSync(process.env.DATA_PREFIX!, {recursive:true})
mkdirSync(process.env.DATA_PREFIX!, {recursive:true})

const PHOTOS = 'photos'

const urlPrefix = `http://localhost:8000/byos`

await fetch(`${urlPrefix}/${PHOTOS}/schema`, {
    method: "POST",
})

describe("byos/[primary]/docs", async () => {

    let albumIds: string[] = []

    test("POST", async () => {

        const res = await fetch(`${urlPrefix}/${PHOTOS}/docs`, {
            method: "POST",
            body: JSON.stringify(photos.slice(0, 25))
        })

        expect(res.status).toEqual(200)

        albumIds = await res.json()

        expect(albumIds.length).toEqual(25)
    })

    test("GET", async () => {

        const res = await fetch(`${urlPrefix}/${PHOTOS}/docs`)

        expect(res.status).toEqual(200)

        const results = await res.json()

        expect(Object.entries(results).length).toEqual(25)
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