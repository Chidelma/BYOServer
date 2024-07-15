import Silo from "@delma/byos";
import { _HTTPContext } from "@delma/tachyon";

export default class {

    private static colKey = "collection"

    static async GET(id: _uuid, { slugs }: _HTTPContext) {

        return await Silo.getDoc(slugs.get(this.colKey), id).once()
    }

    static async POST(doc: Record<string, any>, { slugs }: _HTTPContext) {

        return await Silo.putDoc(slugs.get(this.colKey), doc);
    }

    static async PATCH(doc: Record<_uuid, Record<string, any>>, { slugs }: _HTTPContext) {

        const data = new Map<_uuid, Record<string, any>>()

        Object.entries(doc).forEach(([id, value]) => data.set(id as _uuid, value))

        await Silo.patchDoc<Record<string, any>>(slugs.get(this.colKey), data)
    }

    static async DELETE(id: _uuid, { slugs }: _HTTPContext) {

        await Silo.delDoc(slugs.get(this.colKey), id);
    }
}