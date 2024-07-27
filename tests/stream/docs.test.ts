import { describe, test, expect } from "bun:test"
import { mkdirSync, rmSync } from "node:fs"
import { photos } from "../data.js"

rmSync(process.env.DATA_PREFIX!, {recursive:true})
mkdirSync(process.env.DATA_PREFIX!, {recursive:true})

const PHOTOS = 'photos'

const urlPrefix = `http://localhost:8000/byos`

await fetch(`${urlPrefix}/${PHOTOS}/schema`, {
    method: "POST",
})

describe("byos/[primary]/stream/docs", async () => {

    await fetch(`${urlPrefix}/${PHOTOS}/docs`, {
        method: "POST",
        body: JSON.stringify(photos.slice(0, 25))
    })

    test("GET", async () => {

        const res = await fetch(`${urlPrefix}/${PHOTOS}/stream/docs`)

        expect(res.status).toEqual(200)

        let count = 0

        for await (const chunk of res.body!) {    
            const decoded = new TextDecoder().decode(chunk)
            count += (decoded.length / 36)
            if(count === 25) break
        }

        expect(count).toEqual(25)
    })

    test("DELETE", async () => {

        const res = await fetch(`${urlPrefix}/${PHOTOS}/stream/docs`, {
            method: "DELETE"
        })

        let count = 0

        await fetch(`${urlPrefix}/${PHOTOS}/docs`, {
            method: "DELETE"
        })

        for await (const chunk of res.body!) {
            const decoded = new TextDecoder().decode(chunk)
            count += (decoded.length / 36)
            if(count === 25) break
        }

        expect(count).toEqual(25)
    })
})