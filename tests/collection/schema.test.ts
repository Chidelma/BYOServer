import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { mkdir, rm } from "node:fs/promises"
import { urlPrefix } from "../data.js"

const PHOTOS = 'photos'

beforeAll(async () => {
    await rm(process.env.DB_DIR!, {recursive:true})
    await mkdir(process.env.DB_DIR!, {recursive:true})
})

afterAll(async () => {
    await Promise.allSettled([rm(process.env.DB_DIR!, { recursive:true }), fetch(`${urlPrefix}/${PHOTOS}/schema`, { method: "DELETE" })])
})

describe("byos/[primary]/schema", async () => {

    test("POST", async () => {

        const res = await fetch(`${urlPrefix}/${PHOTOS}/schema`, {
            method: "POST",
        })

        expect(res.status).toEqual(200)

        const file = Bun.file(`${process.env.DB_DIR}/${PHOTOS}/.schema.json`)

        expect(await file.exists()).toBe(true)
    })

    test("DELETE", async () => {

        const res = await fetch(`${urlPrefix}/${PHOTOS}/schema`, {
            method: "DELETE"
        })

        expect(res.status).toEqual(200)

        const file = Bun.file(`${process.env.DB_DIR}/${PHOTOS}/.schema.json`)

        expect(await file.exists()).toBe(false)
    })
})