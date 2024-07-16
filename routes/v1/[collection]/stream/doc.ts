import Silo from "@delma/byos";
import { _HTTPContext } from "@delma/tachyon";

export default class {

    static GET({ id, onlyId }: { id: _uuid, onlyId?: boolean }, { slugs }: _HTTPContext) {

        return {

            async *[Symbol.asyncIterator]() {

                for await (const data of Silo.getDoc<Record<string, any>>(slugs.get("collection"), id, onlyId)) {
                    
                    if(data instanceof Map) {

                        const doc: Record<_uuid, Record<string, any>> = {}

                        data.forEach((value, key) => doc[key] = value)

                        yield JSON.stringify(doc)

                    } else yield data
                }
            }
        }
    }

    static DELETE(id: _uuid, { slugs }: _HTTPContext) {

        return {

            async *[Symbol.asyncIterator]() {

                for await (const _ of Silo.getDoc(slugs.get("collection"), id).onDelete()) {
                    yield id
                }
            }
        }
    }
}