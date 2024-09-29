import Silo from "@vyckr/byos";
import { VALIDATE } from "../../../utils/validation.js";

export default class Doc {

    private static colKey = "[primary]"

    @VALIDATE([{ type: "string" }, { type: "object" }])
    static async GET(id: _ulid, { slugs }: _HTTPContext) {

        return await Silo.getDoc(slugs.get(Doc.colKey), id).once()
    }

    @VALIDATE([{ type: "object" }, { type: "object" }])
    static async POST(doc: Record<string, any>, { slugs }: _HTTPContext) {

        return await Silo.putData(slugs.get(Doc.colKey), doc);
    }

    @VALIDATE([{ type: "object" }, { type: "object" }])
    static async PATCH(doc: Record<_ulid, Record<string, any>>, { slugs }: _HTTPContext) {

        await Silo.patchDoc<Record<string, any>>(slugs.get(Doc.colKey), new Map(Object.entries(doc)) as Map<_ulid, Record<string, any>>)
    }

    @VALIDATE([{ type: "string" }, { type: "object" }])
    static async DELETE(id: _ulid, { slugs }: _HTTPContext) {

        await Silo.delDoc(slugs.get(Doc.colKey), id)
    }
}