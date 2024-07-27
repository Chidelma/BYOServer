import { describe, test, expect } from "bun:test"
import { mkdirSync, rmSync } from "node:fs"
import { albums } from "../data.js"

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

const albumIds = await albumsResponse.json()

describe("byos/[primary]/stream/doc", async () => {

    test("DELETE", async () => {

        const res = await fetch(`${urlPrefix}/${ALBUMS}/stream/doc/${albumIds[2]}`, {
            method: "DELETE"
        })

        await fetch(`${urlPrefix}/${ALBUMS}/doc/${albumIds[2]}`, {
            method: "DELETE"
        })

        let count = 0

        for await (const _ of res.body!) {
            count++
            break
        }
        
        expect(count).toEqual(1)
    })

    test("GET", async () => {

        const res = await fetch(`${urlPrefix}/${ALBUMS}/stream/doc?_id=${albumIds[0]}`)

        expect(res.status).toEqual(200)

        let count = 0

        for await (const _ of res.body!) {
            count++
            break
        }

        expect(count).toEqual(1)
    })
})