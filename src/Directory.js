import localforage from "localforage";
import globToRegExp from "glob-to-regexp";

export default class {

    static DATA_PATH;

    static CHAR_LIMIT = 255

    static SLASH_ASCII = "%2F"

    static STORES = new Map()

    static async openDirDB() {
        this.DATA_PATH = await window.showDirectoryPicker()
        await this.saveDirDB(this.DATA_PATH)
    }

    /**
     * 
     * @param {DirectoryEntry} entry
     * @param {string} dirName
     */
    static async saveDirDB(entry, dirName) {

        if(dirName && this.hasUUID(dirName)) {
            
            const segs = dirName.split('/')

            const collection = segs.shift()

            await this.STORES.get(collection).setItem(segs.join('/'), '')

            return
        }

        if(entry.kind === 'directory') {
            for (const entry of entry.values()) {
                if(dirName) {
                    await this.saveDirDB(entry, `${dirName}/${entry.name}`)
                } else {
                    this.STORES.set(entry.name, new localforage.createInstance({ name: entry.name }))
                    await this.saveDirDB(entry, entry.name)
                }
            }
        }
    }

    /**
     * 
     * @param {string} idx
     * @returns {boolean}
     */
    static hasUUID(idx) {
        const segs = idx.split('/')
        return segs.length >= 5 && /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(segs[segs.length - 2])
    }

    /**
     * 
     * @param {string} collection
     * @param {string} id
     */
    static async aquireLock(collection, id) {

        try {

            if(await this.isLocked(collection, id)) {

                this.queueProcess(collection, id)
    
                for await (const _ of this.onUnlock(`${collection}/${id}/${process.pid}`)) {
                    break
                }
            }
    
            this.queueProcess(collection, id)

        } catch(e) {
            if(e instanceof Error) throw new Error(`Dir.aquireLock -> ${e.message}`)
        }
    }

    /**
     * 
     * @param {string} pattern
     * @returns {AsyncGenerator<string>}
     */
    static async *onUnlock(pattern) {

        const cwd = this.DATA_PATH

        const stream = new ReadableStream<string>({
            start(controller) {
                watch(pattern, { cwd }).on("unlinkDir", path => {
                    controller.enqueue(path)
                })
            }
        })

        const reader = stream.getReader()

        const path = await reader.read()

        yield path.value
    }

    /**
     * 
     * @param {string} collection
     * @param {string} id
     */
    static async releaseLock(collection, id) {

        try {

            rmSync(`${this.DATA_PATH}/${collection}/${id}/${process.pid}`, { recursive: true })

            const results = await glob(`${collection}/${id}/**/`, { withFileTypes: true, stat: true, cwd: this.DATA_PATH })
            
            const timeSortedDir = results.sort((a, b) => a.birthtimeMs - b.birthtimeMs).map(p => p.relative()).filter(p => p.split('/').length === 3)

            if(timeSortedDir.length > 0) rmSync(`${this.DATA_PATH}/${timeSortedDir[0]}`, { recursive: true })

        } catch(e) {
            if(e instanceof Error) throw new Error(`Dir.releaseLock -> ${e.message}`)
        }
    }

    /**
     * 
     * @param {string} collection
     * @param {string} id
     * @returns {boolean}
     */
    static async isLocked(collection, id) {

        const results = await glob(`${collection}/${id}/**/`, { cwd: this.DATA_PATH })

        return results.filter(p => p.split('/').length === 3).length > 0
    }

    /**
     * 
     * @param {string} collection
     * @param {string} id
     */
    static queueProcess(collection, id) {
        mkdirSync(`${this.DATA_PATH}/${collection}/${id}/${process.pid}`, { recursive: true })
    }

    /**
     * 
     * @param {string} collection
     * @param {string} id
     * @returns {Promise<Record<string, any>>}
     */
    static async reconstructDoc(collection, id) {

        const indexes = [...await this.searchIndexes(`${collection}/**/${id}/*`, true), ...await this.searchIndexes(`${collection}/**/${id}/*/`)]
        
        const keyVals = await this.reArrangeIndexes(indexes)

        let keyVal = {}

        keyVals.forEach(data => {
            const segs = data.split('/')
            const val = segs.pop()
            const key = segs.join('/')
            keyVal = { ...keyVal, [key]: val }
        })
        
        return this.constructDoc(keyVal)
    }

    /**
     * 
     * @param {string[]} indexes
     * @returns {Promise<string[]>}
     */
    static async reArrangeIndexes(indexes) {

        const keyVals = []

        for(const index of indexes) {

            const segments = [...index.split('/')]

            segments.pop()
            const id = segments.pop()
            const file = Bun.file(`${this.DATA_PATH}/${index}`)
            const val = await file.exists() ? await file.text() : segments.pop()
            const collection = segments.shift()

            segments.unshift(id)
            segments.unshift(collection)

            keyVals.push(`${segments.join('/')}/${val}`)
        }

        return keyVals
    }

    /**
     * 
     * @param {string | string[]} pattern
     * @param {"addDir" | "unlinkDir"} action
     * @param {boolean} listen
     * @returns {AsyncGenerator<string>}
     */
    static async *onChange(pattern, action, listen) {
        
        const cwd = this.DATA_PATH
        const queue = {}
        const hasUUID = this.hasUUID

        const isComplete = (path, id, size) => {

            if(queue[id]) {

                queue[id].add(path)

                if(size === (queue[id].size + 1)) {
                    queue[id].clear()
                    return true
                }

            } else queue[id] = new Set([path])

            return false
        }

        const isPartialChange = () => {

            if(Array.isArray(pattern)) {

                const firstPattern = pattern[0]

                const segs = firstPattern.split('/')

                if(!segs.slice(1, -1).every((elem) => elem.includes('*'))) return true

            } else {

                const segs = pattern.split('/')

                if(!segs.slice(1, -1).every((elem) => elem.includes('*'))) return true
            }

            return false
        }

        const enqueueID = (controller, path) => {
            if(hasUUID(path)) {
                const segs = path.split('/')
                const size = Number(segs.pop())
                const id = segs.pop()
                if(isComplete(path, id, size) || isPartialChange()) {
                    controller.enqueue(id)
                }
            }
        }

        const stream = new ReadableStream<string>({
            start(controller) {
                if(listen) {
                    watch(pattern, { cwd }).on(action, path => {
                        enqueueID(controller, path)
                    })
                } else {
                    new Glob(pattern, { cwd }).stream().on("data", path => {
                        enqueueID(controller, path)
                    })
                }
            }
        })

        const reader = stream.getReader()

        let data;

        let lowestLatency = 500

        while(true) {

            let res;

            if(listen) res = await reader.read()
            else {

                const startTime = Date.now()
                res = await Promise.race([
                    reader.read(),
                    new Promise(resolve =>
                        setTimeout(() => resolve({ done: true, value: undefined }), lowestLatency)
                    )
                ])
                const elapsed = Date.now() - startTime
                if(elapsed < lowestLatency) lowestLatency = elapsed + 1
            }

            if(res.done || (data && data.limit === data.count)) break
            
            data = yield res.value
        }
    }

    /**
     * 
     * @param {string} collection
     * @param {string[]} pattern
     * @returns {Promise<string[]>}
     */
    static async searchIndexes(collection, pattern) {

        const store = this.STORES.get(collection)

        if(!store) throw new Error(`Collection ${collection} does not exist`)

        const indexes = await store.keys()

        return indexes.filter(idx => pattern.some(pat => new RegExp(globToRegExp(pat)).test(idx)))
    }

    /**
     * 
     * @param {string} index
     */
    static async updateIndex(index) {

        const segements = index.split('/')

        const collection = segements.shift()
        const key = segements.shift()

        const id = segements.pop()
        const val = segements.pop()

        const currIndexes = await this.searchIndexes(collection, [`${collection}/${key}/**/${id}`])

        const store = this.STORES.get(collection)

        currIndexes.forEach(idx => store?.removeItem(idx))

        await this.DATA_PATH.removeEntry(index, { recursive: true })

        await store?.setItem(index, '')

        let currDir = this.DATA_PATH

        for(const seg of index.split('/')) {

            if(seg === val && val.length > this.CHAR_LIMIT) {

                const fileHandle = await currDir.getFileHandle(id, { create: true })

                const writable = await fileHandle.createWritable()

                await writable.write(val)

                await writable.close()

            } else currDir = currDir.getDirectoryHandle(index, { create: true })
        }
    }

    /**
     * 
     * @param {string} index
     */
    static async deleteIndex(index) {

        const segements = index.split('/')

        const collection = segements.shift()

        await this.STORES.get(collection)?.removeItem(index)

        await this.DATA_PATH.removeEntry(index, { recursive: true })
    }

    /**
     * 
     * @param {string} collection
     * @param {string} id
     * @param {Record<string, any>} doc
     * @param {string} parentKey
     * @returns {string[]}
     */
    static deconstructDoc(collection, id, doc, parentKey) {

        const indexes = []

        const obj = {...doc}

        for(const key in obj) {

            const newKey = parentKey ? `${parentKey}/${key}` : key

            if(typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                indexes.push(...this.deconstructDoc(collection, id, obj[key], newKey))
            } else if(typeof obj[key] === 'object' && Array.isArray(obj[key])) {
                const items = obj[key]
                if(items.some((item) => typeof item === 'object')) throw new Error(`Cannot have an array of objects`)
                items.forEach((item, idx) => indexes.push(`${collection}/${newKey}/${idx}/${String(item).replaceAll('/', this.SLASH_ASCII)}/${id}`))
            } else indexes.push(`${collection}/${newKey}/${String(obj[key]).replaceAll('/', this.SLASH_ASCII)}/${id}`)
        }

        return indexes
    }

    /**
     * 
     * @param {Record<string, string>} keyVal
     * @returns {Record<string, any>}
     */
    static constructDoc(keyVal) {

        const doc = {}

        for(let fullKey in keyVal) {

            const keys = fullKey.split('/').slice(2)

            let curr = doc

            while(keys.length > 1) {

                const key = keys.shift()

                if(keys[0].match(/^\d+$/)) {
                    if(!Array.isArray(curr[key])) curr[key] = []
                } else {
                    if(typeof curr[key] !== 'object' || curr[key] === null) curr[key] = {}
                }

                curr = curr[key]
            }

            const lastKey = keys.shift()

            if(lastKey.match(/^\d+$/)) curr[parseInt(lastKey, 10)] = this.parseValue(keyVal[fullKey].replaceAll(this.SLASH_ASCII, '/'))
            else curr[lastKey] = this.parseValue(keyVal[fullKey].replaceAll(this.SLASH_ASCII, '/'))
        }

        return doc
    }

    /**
     * 
     * @param {string} value
     * @returns {any}
     */
    static parseValue(value) {

        const num = Number(value) 

        if(!Number.isNaN(num)) return num

        if(value === "true") return true

        if(value === "false") return false

        if(value === 'null') return null
    
        return value
    }
}