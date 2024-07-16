import Silo from "@delma/byos";
import { _HTTPContext } from "@delma/tachyon";

export default class {

    static GET(query: _storeQuery<Record<string, any>>, { slugs }: _HTTPContext) {

        return {

            async *[Symbol.asyncIterator]() {

                for await (const data of Silo.findDocs(slugs.get("collection"), query)) {

                    if(data instanceof Map) {

                        const doc: Record<_uuid, Record<string, any>> = {}

                        data.forEach((value, key) => doc[key] = value)

                        yield JSON.stringify(doc)

                    } else yield data 
                }
            }
        }
    }

    static DELETE(query: _storeQuery<Record<string, any>>, { slugs }: _HTTPContext) {

        return {

            async *[Symbol.asyncIterator]() {

                for await (const id of Silo.findDocs(slugs.get("collection"), query).onDelete()) {
                    yield id
                }
            }
        }
    }
}