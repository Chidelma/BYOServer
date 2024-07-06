export default class {

    /**
     * 
     * @param {Record<string, any>} query
     * @param {string} collection
     * @returns {string[]}
     */
    static async getExprs(query, collection) {

        let exprs = new Set()

        try {

            if(query.$ops) {

                for(const op of query.$ops) {

                    for(const column in op) {

                        const col = op[column]

                        const prefix = `${collection ?? query.$collection}/${column}`

                        if(col.$eq) exprs = new Set([...exprs, `${prefix}/${col.$eq}/**/*`])
                        if(col.$ne) exprs = new Set([...exprs, `${prefix}/!(${col.$ne})/**/*`])
                        if(col.$gt) {
                            const valOp = this.getGtOp(String(col.$gt).split('').map((n) => Number(n)))
                            exprs = new Set([...exprs, `${prefix}/${valOp}/**/*`])
                        }
                        if(col.$gte) {
                            const valOp = this.getGteOp(String(col.$gte).split('').map((n) => Number(n)))
                            exprs = new Set([...exprs, `${prefix}/${valOp}/**/*`])
                        }
                        if(col.$lt) {
                            const valOp = this.getLtOp(String(col.$lt).split('').map((n) => Number(n)))
                            exprs = new Set([...exprs, `${prefix}/${valOp}/**/*`])
                        }
                        if(col.$lte) {
                            const valOp = this.getLteOp(String(col.$lte).split('').map((n) => Number(n)))
                            exprs = new Set([...exprs, `${prefix}/${valOp}/**/*`])
                        }
                        if(col.$like) exprs = new Set([...exprs, `${prefix}/${col.$like.replaceAll('%', '*')}/**/*`])
                    }
                }
            } else exprs = new Set([`${collection ?? query.$collection}/**/*`])

        } catch(e) {
            if(e instanceof Error) throw new Error(`Query.getExprs -> ${e.message}`)
        }

        return Array.from(exprs)
    }

    /**
     * 
     * @param {number[]} numbers
     * @param {boolean} negate
     * @returns {string}
     */
    static getGtOp(numbers, negate) {

        let expression = ''

        for(const num of numbers) expression += negate ? `[!${num < 9 ? num + 1 : 9}-9]` : `[${num < 9 ? num + 1 : 9}-9]`

        return expression
    }

    /**
     * 
     * @param {number[]} numbers
     * @param {boolean} negate
     * @returns {string}
     */
    static getGteOp(numbers, negate) {

        let expression = ''

        for(const num of numbers) expression += negate ? `[!${num < 9 ? num : 9}-9]` : `[${num < 9 ? num : 9}-9]`

        return expression
    }

    /**
     * 
     * @param {number[]} numbers
     * @param {boolean} negate
     * @returns {string}
     */
    static getLtOp(numbers, negate) {

        let expression = ''

        for(const num of numbers) expression += negate ? `[!0-${num < 9 ? num - 1 : 9}]` : `[0-${num < 9 ? num - 1 : 9}]`

        return expression
    }
    /**
     * 
     * @param {number[]} numbers
     * @param {boolean} negate
     * @returns {string}
     */
    static getLteOp(numbers, negate) {

        let expression = ''

        for(const num of numbers) expression += negate ? `[!0-${num < 9 ? num : 9}]` :  `[0-${num < 9 ? num : 9}]`

        return expression
    }
}