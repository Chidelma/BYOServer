import { test, expect, describe } from 'bun:test'
import { todos } from '../data.js'
import { mkdirSync, rmSync } from 'node:fs' 
import { $ } from 'bun'

rmSync(process.env.DATA_PREFIX!, {recursive:true})
mkdirSync(process.env.DATA_PREFIX!, {recursive:true})


describe("SQL", async () => {

    const TODOS = 'todos'

    await $`bun byos "CREATE TABLE ${TODOS}"`

    await Promise.all(todos.slice(0, 25).map((todo: _todo) => {

        const keys = Object.keys(todo)
        const values = Object.values(todo).map(val => JSON.stringify(val))

        return $` bun byos "INSERT INTO ${TODOS} (${keys.join(',')}) VALUES (${values.join('|')})"`
    }))

    test("UPDATE CLAUSE", async () => {

        await $`bun byos "UPDATE ${TODOS} SET title = 'All Mighty' WHERE title LIKE '%est%'"`
    })

    test("UPDATE ALL", async () => {

        await $`bun byos "UPDATE ${TODOS} SET title = 'All Mightier'"`
    })
})