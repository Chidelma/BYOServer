import Silo from "@delma/byos";
import { _HTTPContext } from "@delma/tachyon";
import { VALIDATE } from "../../../../_utils/validation.js";

export default class Docs {

    private static primaryColKey = "[primary]"

    private static secondaryColKey = "[secondary]"

    @VALIDATE([{ type: "object" }, { type: "object" }])
    static async GET(join: _join<Record<string, any>, Record<string, any>>, { slugs }: _HTTPContext) {
    
        join.$leftCollection ??= slugs.get(Docs.primaryColKey)
        join.$rightCollection ??= slugs.get(Docs.secondaryColKey)

        return await Silo.joinDocs(join)
    }
}