import Silo from "@delma/byos";
import { VALIDATE } from "../../../_utils/validation.js";

export default class {

    @VALIDATE([{ type: "object" }, { type: "object" }])
    static GET({ _id, onlyId }: { _id: _ulid, onlyId?: boolean }, { slugs }: _HTTPContext) {

        return {

            async *[Symbol.asyncIterator]() {

                for await (const data of Silo.getDoc<Record<string, any>>(slugs.get("[primary]"), _id, onlyId)) {

                    await Bun.sleep(100)

                    if(data instanceof Map) yield JSON.stringify(Object.fromEntries(data))
                    else yield data
                }
            }
        }
    }

    @VALIDATE([{ type: "string" }, { type: "object" }])
    static DELETE(_id: _ulid, { slugs }: _HTTPContext) {

        return {

            async *[Symbol.asyncIterator]() {

                for await (const _ of Silo.getDoc(slugs.get("[primary]"), _id).onDelete()) {
                    await Bun.sleep(100)
                    yield _id
                }
            }
        }
    }
}