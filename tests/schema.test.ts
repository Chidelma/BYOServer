import { describe, test, expect } from "bun:test"
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs"

rmSync(process.env.DATA_PREFIX!, {recursive:true})
mkdirSync(process.env.DATA_PREFIX!, {recursive:true})

const PHOTOS = 'photos'

const urlPrefix = `http://localhost:8000/byos`

describe("byos/[primary]/schema", async () => {

    test("POST", async () => {

        const res = await fetch(`${urlPrefix}/${PHOTOS}/schema`, {
            method: "POST",
        })

        expect(res.status).toEqual(200)

        const file = Bun.file(`${process.env.DATA_PREFIX}/${PHOTOS}/.schema.json`)

        const savedSchema = await file.json()

        const dirKeys = readdirSync(`${process.env.DATA_PREFIX}/${PHOTOS}`)

        const testPassed = Object.keys(savedSchema).every(key => dirKeys.includes(key))

        expect(testPassed).toBe(true)
    })

    test("DELETE", async () => {

        const res = await fetch(`${urlPrefix}/${PHOTOS}/schema`, {
            method: "DELETE"
        })

        expect(res.status).toEqual(200)

        expect(existsSync(`${process.env.DATA_PREFIX}/${PHOTOS}`)).toBe(false)
    })
})