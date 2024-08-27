import Silo from "@vyckr/byos";
import { VALIDATE } from "../../_utils/validation.js";

export default class Docs {

    private static colKey = "[primary]"

    @VALIDATE([{ type: "object", default: {} }, { type: "object" }])
    static async GET(query: _storeQuery<Record<string, any>>, { slugs }: _HTTPContext) {

        const docs = query.$onlyIds ? new Array<any> : new Map()

        for await (const data of Silo.findDocs(slugs.get(Docs.colKey), query).collect()) {

            if(data instanceof Map) {
                const doc = data as Map<any, any>
                for(let [key, value] of doc) {
                    (docs as Map<any, any>).set(key, value)
                }
            } else (docs as Array<any>).push(data as _ulid)
        }

        return docs
    }

    @VALIDATE([{ type: "object" }, { type: "object" }])
    static async POST(docs: Record<string, any>[], { slugs }: _HTTPContext) {

        await Silo.batchPutData(slugs.get(Docs.colKey), docs);
    }

    @VALIDATE([{ type: "object" }, { type: "object" }])
    static async PATCH(updateQuery: _storeUpdate<Record<string, any>>, { slugs }: _HTTPContext) {

        return await Silo.patchDocs(slugs.get(Docs.colKey), updateQuery)
    }

    @VALIDATE([{ type: "object", default: {} }, { type: "object" }])
    static async DELETE(deleteQuery: _storeDelete<Record<string, any>>, { slugs }: _HTTPContext) {

        return await Silo.delDocs(slugs.get(Docs.colKey), deleteQuery)
    }
}