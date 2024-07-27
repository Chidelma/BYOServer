import Silo from "@delma/byos";
import { _HTTPContext } from "@delma/tachyon";
import { VALIDATE } from "../../../_utils/validation.js";

export default class {

    @VALIDATE([{ type: "object" }, { type: "object" }])
    static GET({ _id, onlyId }: { _id: _uuid, onlyId?: boolean }, { slugs }: _HTTPContext) {

        return {

            async *[Symbol.asyncIterator]() {

                for await (const data of Silo.getDoc<Record<string, any>>(slugs!.get("[primary]"), _id, onlyId)) {
                    
                    if(data instanceof Map) {

                        const doc: Record<string, any> = {}

                        for (const [key, value] of data.entries()) doc[key] = value

                        yield JSON.stringify(doc)
                    }
                    else yield data
                }
            }
        }
    }

    @VALIDATE([{ type: "string" }, { type: "object" }])
    static DELETE(_id: _uuid, { slugs }: _HTTPContext) {

        return {

            async *[Symbol.asyncIterator]() {

                for await (const _ of Silo.getDoc(slugs!.get("[primary]"), _id).onDelete()) {
                    yield _id
                }
            }
        }
    }
}