export default class {

    /**
     * 
     * @param {string} SQL
     * @returns {Record<string, any>}
     */
    static convertSelect(SQL) {

        let query = {}

        try {

            SQL = SQL.toLowerCase()

            const selectMatch = SQL.match(/select\s+(.*?)\s+from\s+(\w+)\s*(?:where\s+(.+?))?$/i)

            if(!selectMatch) throw new Error("Invalid SQL SELECT statement")

            const [_, columns, collection, whereClause] = selectMatch

            if(whereClause) query = this.parseWherClause(whereClause)

            query.$collection = collection

            if(columns !== '*') query.$select = columns.split(',').map(col => col.trim())

        } catch(e) {
            if(e instanceof Error) throw new Error(`Paser.convertSelect -> ${e.message}`)
        }

        return query
    }

    /**
     * 
     * @param {string} SQL
     * @param {Map<string, any>} params
     * @returns {Record<string, any>}
     */
    static convertInsert(SQL, params) {

        const insert = {}

        try {

            SQL = SQL.toLowerCase()

            const insertMatch = SQL.match(/insert\s+into\s+(\w+)\s*\(([^)]+)\)\s+values\s*\(([^)]+)\)/i)

            if(!insertMatch) throw new Error("Invalid SQL INSERT statement")

            const [_, table, cols] = insertMatch

            insert.$collection = table.trim()

            const columns = cols.trim().split(',')

            const values = SQL.split('values')[1].trim().slice(1, -1).split(',')

            if(columns.length !== values.length) throw new Error("Length of Columns and Values don't match")

            for(let i = 0; i < values.length; i++) {
                insert[columns[i]] = values[i] === columns[i] ? params?.get(columns[i]) : this.parseValue(values[i])
            }

        } catch(e) {
            if(e instanceof Error) throw new Error(`Paser.convertInsert -> ${e.message}`)
        }

        return insert
    }

    /**
     * 
     * @param {string} SQL
     * @param {Map<string, any>} params
     * @returns {Record<string, any>}
     */
    static convertUpdate(SQL, params) {

        const update = {}

        try {

            SQL = SQL.toLowerCase()

            const updateMatch = SQL.match(/update\s+(\w+)\s+set\s+(.+?)(?:\s+where\s+(.+))?$/)

            if(!updateMatch) throw new Error("Invalid SQL UPDATE statement")

            const [_, table, setClause, whereClause] = updateMatch

            update.$collection = table.trim()

            const setConditions = setClause.split(',').map((cond) => cond.trim())

            for(let i = 0; i < setConditions.length; i++) {

                const [col, val] = setConditions[i].split('=').map(s => s.trim())

                update[col] = val === col ? params?.get(col) : this.parseValue(val)
            }

            update.$where = whereClause ? this.parseWherClause(whereClause) : {}

        } catch(e) {
            if(e instanceof Error) throw new Error(`Paser.convertUpdate -> ${e.message}`)
        }

        return update
    }

    /**
     * 
     * @param {string} SQL
     * @returns {Record<string, any>}
     */
    static convertDelete(SQL) {

        let deleteStore = {}

        try {

            SQL = SQL.toLowerCase()

            const deleteMatch = SQL.match(/delete\s+from\s+(\w+)(?:\s+where\s+(.+))?/i)

            if(!deleteMatch) throw new Error("Invalid SQL DELETE statement")

            const [_, table, whereClause] = deleteMatch

            if(whereClause) deleteStore = this.parseWherClause(whereClause)

            deleteStore.$collection = table

        } catch(e) {
            if(e instanceof Error) throw new Error(`Paser.convertDelete -> ${e.message}`)
        }

        return deleteStore
    }

    /**
     * 
     * @param {Record<string, any>} condition
     * @returns {Record<string, any>}
     */
    static mapConditionToOperand(condition) {

        const operand = {}

        switch(condition.operator) {
            case "=":
                operand.$eq = condition.value
                break
            case "!=":
                operand.$ne = condition.value
                break
            case ">":
                operand.$gt = condition.value
                break
            case "<":
                operand.$lt = condition.value
                break
            case ">=":
                operand.$gte = condition.value
                break
            case "<=":
                operand.$lte = condition.value
                break
            case "like":
                operand.$like = (condition.value).replaceAll('%', '*')
                break
            default:
                throw new Error(`Unsupported SQL operator: ${condition.operator}`)
        }

        return operand
    }

    /**
     * 
     * @param {string} condition
     * @returns {Record<string, any>}
     */
    static parseSQLCondition(condition) {

        const match = condition.match(/(=|!=|>=|<=|>|<|like)/i)

        if(!match) throw new Error(`Unsupported SQL operator in condition ${condition}`)

        const operator = match[0]

        let [column, value] = condition.split(operator).map(s => s.trim())

        return { column, operator, value: this.parseValue(value) }
    }

    /**
     * 
     * @param {string} whereClause
     * @returns {Record<string, any>}
     */
    static parseWherClause(whereClause) {

        let result = {}

        try {

            const orConditions = []

            const orGroups = whereClause.split(/\s+or\s+/i)

            orGroups.forEach((orGroup) => {

                const andGroupConditions= {}
                const andConditionsArray = orGroup.split(/\s+and\s+/i).map(cond => cond.trim())

                andConditionsArray.forEach((cond) => {
                    const condition = this.parseSQLCondition(cond)
                    andGroupConditions[condition.column] = this.mapConditionToOperand(condition)
                })

                orConditions.push(andGroupConditions)
            })

            result.$ops = orConditions

        } catch(e) {
            if(e instanceof Error) throw new Error(`Paser.parseWherClause -> ${e.message}`)
        }

        return result
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
    
        return value.slice(1, -1)
    }
}