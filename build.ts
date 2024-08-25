import { Glob } from "bun"

const files = Array.from(new Glob("**/*.ts").scanSync({ cwd: "./routes" }))

const routes = files.filter((route) => !route.split('/').some((path) => path.startsWith('_'))).map(route => `./routes/${route}`)

await Bun.build({
    entrypoints: routes,
    outdir: "./dist",
    target: "bun",
    root: "./routes",
})