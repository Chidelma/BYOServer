import { describe, test, expect } from "bun:test"
import { mkdirSync, rmSync } from "node:fs"
import { albums } from "./data.js"

rmSync(process.env.DATA_PREFIX!, {recursive:true})
mkdirSync(process.env.DATA_PREFIX!, {recursive:true})

const ALBUMS = 'albums'

const urlPrefix = `http://localhost:8000/byos`

await fetch(`${urlPrefix}/${ALBUMS}/schema`, {
    method: "POST",
})

const albumsResponse = await fetch(`${urlPrefix}/${ALBUMS}/docs`, {
    method: "POST",
    body: JSON.stringify(albums.slice(0, 25))
})

describe("byos/[primary]/doc", async () => {

    const albumIds = await albumsResponse.json()

    test("GET", async () => {

        const res = await fetch(`${urlPrefix}/${ALBUMS}/doc/${albumIds[0]}`)

        const doc = await res.json()

        expect(Object.entries(doc).length).toEqual(1)
        expect(res.status).toEqual(200)
    })

    test("POST", async () => {

        const res = await fetch(`${urlPrefix}/${ALBUMS}/doc`, {
            method: "POST",
            body: JSON.stringify({
                title: "test",
                userId: 9,
                id: 9
            })
        })

        const uuid = await res.text()

        expect(uuid).not.toBeNull()
        expect(res.status).toEqual(200)
    })

    test("PATCH", async () => {

        const res = await fetch(`${urlPrefix}/${ALBUMS}/doc`, {
            method: "PATCH",
            body: JSON.stringify({
                [albumIds[1]]: {
                    title: "test2"
                }
            })
        })

        expect(res.status).toEqual(200)
    })

    test("DELETE", async () => {

        const res = await fetch(`${urlPrefix}/${ALBUMS}/doc/${albumIds[2]}`, {
            method: "DELETE"
        })
        
        expect(res.status).toEqual(200)
    })
})