import Silo from "@vyckr/byos";
import { VALIDATE } from "../../../_utils/validation.js";

export default class {

    @VALIDATE([{ type: "object", default: {} }, { type: "object" }])
    static GET(query: _storeQuery<Record<string, any>>, { slugs }: _HTTPContext) {

        return {

            async *[Symbol.asyncIterator]() {

                for await (const data of Silo.findDocs(slugs.get("[primary]"), query)) {

                    await Bun.sleep(100)

                    if(data instanceof Map) yield JSON.stringify(Object.fromEntries(data))
                    else yield data 
                }
            }
        }
    }

    @VALIDATE([{ type: "object", default: {} }, { type: "object" }])
    static DELETE(query: _storeQuery<Record<string, any>>, { slugs }: _HTTPContext) {

        return {

            async *[Symbol.asyncIterator]() {

                for await (const id of Silo.findDocs(slugs.get("[primary]"), query).onDelete()) {
                    await Bun.sleep(100)
                    yield id
                }
            }
        }
    }
}