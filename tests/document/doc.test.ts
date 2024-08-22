import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { mkdir, rm } from "node:fs/promises"
import { albumURL } from "../data.js"

const ALBUMS = 'albums'
const urlPrefix = `http://localhost:8000/byos`
let albumIds: _ulid[] = []

beforeAll(async () => {

    await rm(process.env.DB_DIR!, {recursive:true})
    await mkdir(process.env.DB_DIR!, {recursive:true})

    await fetch(`${urlPrefix}/${ALBUMS}/schema`, {
        method: "POST",
    }) 

    await fetch(`${urlPrefix}/${ALBUMS}/migrate`, {
        method: "POST",
        body: JSON.stringify({ url: albumURL, limit: 100 })
    })

    const urlParams = new URLSearchParams({
        $limit: '3',
        $onlyIds: 'true'
    })

    const res = await fetch(`${urlPrefix}/${ALBUMS}/docs?${urlParams.toString()}`)

    albumIds = await res.json() as _ulid[]
})

afterAll(async () => {

    await Promise.allSettled([rm(process.env.DB_DIR!, { recursive:true }), fetch(`${urlPrefix}/${ALBUMS}/schema`, { method: "DELETE" })])
})

describe("byos/[primary]/doc", async () => {

    test("GET", async () => {

        const res = await fetch(`${urlPrefix}/${ALBUMS}/doc/${albumIds[0]}`)

        expect(res.status).toEqual(200)

        const doc = await res.json()

        expect(Object.entries(doc).length).toEqual(1)
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

        expect(res.status).toEqual(200)

        const ulid = await res.text()

        expect(ulid).not.toBeNull()
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