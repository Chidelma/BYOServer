import Silo from "@delma/byos";
import { _HTTPContext } from "@delma/tachyon";
import { VALIDATE } from "../../_utils/validation.js";

export default class Doc {

    private static colKey = "[primary]"

    @VALIDATE([{ type: "string" }, { type: "object" }])
    static async GET(id: _uuid, { slugs }: _HTTPContext) {

        return await Silo.getDoc(slugs.get(Doc.colKey), id).once()
    }

    @VALIDATE([{ type: "object" }, { type: "object" }])
    static async POST(doc: Record<string, any>, { slugs }: _HTTPContext) {

        return await Silo.putData(slugs.get(Doc.colKey), doc);
    }

    @VALIDATE([{ type: "object" }, { type: "object" }])
    static async PATCH(doc: Record<_uuid, Record<string, any>>, { slugs }: _HTTPContext) {

        const data = new Map<_uuid, Record<string, any>>()

        Object.entries(doc).forEach(([id, value]) => data.set(id as _uuid, value))

        await Silo.patchDoc<Record<string, any>>(slugs.get(Doc.colKey), data)
    }

    @VALIDATE([{ type: "string" }, { type: "object" }])
    static async DELETE(id: _uuid, { slugs }: _HTTPContext) {

        await Silo.delDoc(slugs.get(Doc.colKey), id)
    }
}