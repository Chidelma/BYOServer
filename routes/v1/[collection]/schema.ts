import Silo from "@delma/byos";
import { _HTTPContext } from "@delma/tachyon";

export default class {

    private static colKey = "collection"

    static async POST(schema: _treeItem<Record<string, any>>[], { slugs }: _HTTPContext) {

        await Silo.createSchema(slugs.get(this.colKey), schema)
    }

    static async PATCH(schema: _colSchema<Record<string, any>>, { slugs }: _HTTPContext) {

        await Silo.modifySchema(slugs.get(this.colKey), schema)
    }

    static async DELETE({ soft }: { soft: boolean }, { slugs }: _HTTPContext) {

        soft ? await Silo.truncateSchema(slugs.get(this.colKey)) : Silo.dropSchema(slugs.get(this.colKey))
    }
}