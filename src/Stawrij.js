import Query from './Kweeree.js'
import Paser from './Paza.js'
import Dir from "./Directory.js";

export default class Stawrij {

    static indexUrl = new URL('./workers/Directory.js', import.meta.url).href
    static storeUrl = new URL('./workers/Stawrij.js', import.meta.url).href

    /**
     * 
     * @param {string} url
     * @param {any} message
     * @param {() => void} resolve
     * @param {any} result
     */
    static invokeWorker(url, message, resolve, result) {

        const worker = new Worker(url)

        worker.onmessage = ev => {
            if(result) {
                if(Array.isArray(result)) result.push(ev.data)
                else result = ev.data
            } 
            worker.terminate()
            resolve()
        }

        worker.onerror = ev => {
            console.error(ev.message)
            worker.terminate()
            resolve()
        }
        
        worker.postMessage(message)
    }

    /**
     * 
     * @param {string} SQL
     * @param {Map<keyof T, any>} params
     * @returns {Promise<any>}
     */
    static async executeSQL(SQL, params) {

        const op = SQL.match(/^(SELECT|INSERT|UPDATE|DELETE)/i)

        if(!op) throw new Error("MIssing SQL Operation")

        switch(op[0]) {

            case "SELECT":
                const query = Paser.convertSelect<T>(SQL)
                const selCol = query.$collection
                delete query.$collection
                return Stawrij.findDocs(selCol, query)
            case "INSERT":
                const insert = Paser.convertInsert<T>(SQL, params)
                const insCol = insert.$collection
                delete insert.$collection
                return await Stawrij.putDoc(insCol, insert)
            case "UPDATE":
                const update = Paser.convertUpdate<T>(SQL, params)
                const updateCol = update.$collection
                delete update.$collection
                return await Stawrij.patchDocs(updateCol, update)
            case "DELETE":
                const del = Paser.convertDelete<T>(SQL)
                const delCol = del.$collection
                delete del.$collection
                return await Stawrij.delDocs(delCol, del)
            default:
                throw new Error("Invalid Operation")
        }
    }

    /**
     * 
     * @param {string} collection
     * @param {string} id
     * @param {boolean} onlyId
     * @returns {Promise<Map | string>}
     */
    static getDoc(collection, id, onlyId) {

        return {

            async *[Symbol.asyncIterator]() {

                for await (const _ of Dir.onChange(`${collection}/**/${id}/*`, "addDir", true)) {
                    if(onlyId) yield id
                    else {
                        const doc = await Dir.reconstructDoc(collection, id)
                        yield new Map([[id, doc]])
                    }
                }
            },

            async once() {

                await Dir.onChange(`${collection}/**/${id}/*`, "addDir").next({ count: 1, limit: 1 })

                const doc = await Dir.reconstructDoc(collection, id)

                return new Map([[id, doc]])
            },

            async *onDelete() {
                for await (const _ of Dir.onChange(`${collection}/**/${id}/*`, "unlinkDir", true)) yield id
            }
        }
    }

    /**
     * 
     * @param {string} collection
     * @param {Record<string, any>[]} docs
     * @returns {Promise<void>}
     */
    static async bulkPutDocs(collection, docs) {

        await Promise.all(docs.map(doc => new Promise(resolve => Stawrij.invokeWorker(Stawrij.storeUrl, { action: "PUT", data: { collection, doc }}, resolve))))
    }

    /**
     * 
     * @param {string} collection
     * @param {Map<string, Record<string, any>> | Record<string, any>} data
     * @returns {Promise<_uuid>}
     */
    static async putDoc(collection, data) {

        const _id = data instanceof Map ? Array.from(data.keys())[0] : crypto.randomUUID() 
        
        try {

            console.log(`Writing ${_id}`)

            // await Dir.aquireLock(collection, _id)
            
            const doc = data instanceof Map ? data.get(_id) : data

            const indexes = Dir.deconstructDoc(collection, _id, doc).map(idx => `${idx}/${Object.keys(doc).length}`)

            await Promise.all(indexes.map(idx => new Promise(resolve => this.invokeWorker(this.indexUrl, { action: 'PUT', data: { idx } }, resolve))))

            //await Dir.releaseLock(collection, _id)

        } catch(e) {
            if(e instanceof Error) throw new Error(`Stawrij.putDoc -> ${e.message}`)
        }

        return _id
    }

    /**
     * 
     * @param {string} collection
     * @param {Map<string, Partial<T>>} data
     * @returns {Promise<void>}
     */
    static async patchDoc(collection, data) {
        
        try {

            const _id = Array.from(data.keys())[0]

            if(!_id) throw new Error("Stawrij document does not contain an UUID")

            console.log(`Updating ${_id}`)

            const currDoc = await Dir.reconstructDoc(collection, _id)

            const doc = data.get(_id)

            for(const key in doc) currDoc[key] = doc[key]

            await this.putDoc(collection, new Map([[_id, currDoc]]))

        } catch(e) {
            if(e instanceof Error) throw new Error(`Stawrij.patchDoc -> ${e.message}`)
        }
    }

    /**
     * 
     * @param {string} collection
     * @param {Record<string, any>} updateSchema
     * @returns {Promise<number>}
     */
    static async patchDocs(collection, updateSchema) {

        let count = 0
        
        try {

            const expressions = await Query.getExprs(updateSchema.$where, collection)

            const indexes = await Dir.searchIndexes(collection, expressions)

            const keys = Object.keys(updateSchema).filter(key => !key.startsWith('$'))

            const ids = Array.from(new Set(indexes.filter(Dir.hasUUID).map(idx => {
                const segs = idx.split('/')
                segs.pop()
                return segs.pop()
            })))

            await Promise.all(ids.map(id => {

                const partialDoc = {}

                for(const key of keys) partialDoc[key] = updateSchema[key]
                
                return new Promise(resolve => Stawrij.invokeWorker(Stawrij.storeUrl, { action: 'PATCH', data: { collection, doc: new Map([[id, partialDoc]]) } }, resolve))
            }))

            count = ids.length

        } catch(e) {
            if(e instanceof Error) throw new Error(`Stawrij.putDoc -> ${e.message}`)
        }

        return count
    }

    /**
     * 
     * @param {string} collection
     * @param {string} id
     * @returns {Promise<void>}
     */
    static async delDoc(collection, id) {

        try {

            // await Dir.aquireLock(collection, id)

            console.log(`Deleting ${id}`)

            const indexes = [...await Dir.searchIndexes(collection, [`${collection}/**/${id}/*`]), ...await Dir.searchIndexes(collection, [`${collection}/**/${id}/*/`])]

            await Promise.all(indexes.map(idx => new Promise(resolve => this.invokeWorker(this.indexUrl, { action: 'DEL', data: { idx } }, resolve))))

            // await Dir.releaseLock(collection, id)

        } catch(e) {
            if(e instanceof Error) throw new Error(`Stawrij.delDoc -> ${e.message}`)
        }
    }

    /**
     * 
     * @param {string} collection
     * @param {Record<string, any>} deleteSchema
     * @returns {Promise<number>}
     */
    static async delDocs(collection, deleteSchema) {

        let count = 0

        try {

            const expressions = await Query.getExprs(deleteSchema, collection)

            const indexes = [...await Dir.searchIndexes(collection, expressions), ...await Dir.searchIndexes(collection, expressions)]

            const ids = Array.from(new Set(indexes.filter(Dir.hasUUID).map(idx => {
                const segs = idx.split('/')
                segs.pop()
                return segs.pop()
            })))

            await Promise.all(ids.map(id => new Promise(resolve => Stawrij.invokeWorker(Stawrij.storeUrl, { action: 'DEL', data: { collection, id }}, resolve))))
            
            count = ids.length

        } catch(e) {
            if(e instanceof Error) throw new Error(`Stawrij.delDocs -> ${e.message}`)
        }

        return count
    }

    /**
     * 
     * @param {string} collection
     * @param {Record<string, any>} query
     * @param {boolean} onlyIds
     * @returns {Promise<AsyncGenerator<Map<string, Record<string, any>> | _uuid, void, unknown>>}
     */
    static findDocs(collection, query, onlyIds) {

        return {

            async *[Symbol.asyncIterator]() {

                const expressions = await Query.getExprs(query, collection)

                for await (const id of Dir.onChange(expressions, "addDir", true)) {

                    if(onlyIds) yield id
                    else {
                        
                        const doc = await Dir.reconstructDoc(collection, id)

                        if(query.$select && query.$select.length > 0) {
                            
                            const result = {...doc}

                            for(const col in result) {
                                if(!query.$select.includes(col)) delete result[col]
                            }

                            yield new Map([[id, result]])
                        
                        } else yield new Map([[id, doc]])
                    }
                }
            },
            
            /**
             * 
             * @param {number} limit
             * @returns {Promise<Map<string, Record<string, any>> | _uuid[]>}
             */
            async next(limit) {
                
                const results = new Map()

                const ids = []

                const expressions = await Query.getExprs(query, collection)

                const iter = Dir.onChange(expressions, "addDir")

                let count = 0
                
                while(true) {

                    const res = await iter.next({ count, limit })
                    
                    if(res.done || count === limit) break

                    if(onlyIds) ids.push(res.value)
                    else {

                        const doc = await Dir.reconstructDoc(collection, res.value)

                        if(query.$select && query.$select.length > 0) {

                            const subRes = {...doc}

                            for(const col in subRes) {
                                if(!query.$select.includes(col)) delete subRes[col]
                            }

                            results.set(res.value, subRes)

                        } else results.set(res.value, doc)
                    }

                    if(limit) count++
                }

                return onlyIds ? ids : results
            },

            async *onDelete() {

                const expressions = await Query.getExprs(query, collection)

                for await (const id of Dir.onChange(expressions, "unlinkDir", true)) yield id
            }
        }
    }
}