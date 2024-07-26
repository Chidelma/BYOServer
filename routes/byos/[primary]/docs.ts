import Silo from "@delma/byos";
import { _HTTPContext } from "@delma/tachyon";
import { VALIDATE } from "../../_utils/validation.js";

export default class Docs {

    private static colKey = "[primary]"

    @VALIDATE([{ type: "object", default: {} }, { type: "object" }])
    static async GET(query: _storeQuery<Record<string, any>>, { slugs }: _HTTPContext) {

        return await Silo.findDocs(slugs!.get(Docs.colKey), query).collect()
    }

    @VALIDATE([{ type: "object" }, { type: "object" }])
    static async POST(docs: Record<string, any>[], { slugs }: _HTTPContext) {

        return await Silo.bulkDataPut(slugs!.get(Docs.colKey), docs);
    }

    @VALIDATE([{ type: "object" }, { type: "object" }])
    static async PATCH(updateQuery: _storeUpdate<Record<string, any>>, { slugs }: _HTTPContext) {

        return await Silo.patchDocs(slugs!.get(Docs.colKey), updateQuery)
    }

    @VALIDATE([{ type: "object", default: {} }, { type: "object" }])
    static async DELETE(deleteQuery: _storeDelete<Record<string, any>>, { slugs }: _HTTPContext) {

        return await Silo.delDocs(slugs!.get(Docs.colKey), deleteQuery)
    }
}