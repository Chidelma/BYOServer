import Silo from "@delma/byos";
import { _HTTPContext } from "@delma/tachyon";

export default class {

    private static colKey = "collection"

    static async GET(query: _storeQuery<Record<string, any>>, { slugs }: _HTTPContext) {

        return await Silo.findDocs(slugs.get(this.colKey), query).collect()
    }

    static async POST(docs: Record<string, any>[], { slugs }: _HTTPContext) {

        await Silo.bulkPutDocs(slugs.get(this.colKey), docs);
    }

    static async PATCH(updateQuery: _storeUpdate<Record<string, any>>, { slugs }: _HTTPContext) {

        return await Silo.patchDocs(slugs.get(this.colKey), updateQuery)
    }

    static async DELETE(deleteQuery: _storeDelete<Record<string, any>>, { slugs }: _HTTPContext) {

        return await Silo.delDocs(slugs.get(this.colKey), deleteQuery)
    }
}