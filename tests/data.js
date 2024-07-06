let res = await fetch(`https://jsonplaceholder.typicode.com/comments`)

export const comments = await res.json()

res = await fetch(`https://jsonplaceholder.typicode.com/posts`)

export const posts = await res.json()

res = await fetch(`https://jsonplaceholder.typicode.com/albums`)

export const albums = await res.json()

res = await fetch(`https://jsonplaceholder.typicode.com/photos`)

export const photos = await res.json()

res = await fetch(`https://jsonplaceholder.typicode.com/todos`)

export const todos = await res.json()

res = await fetch(`https://jsonplaceholder.typicode.com/users`)

export const users = await res.json()

export {}