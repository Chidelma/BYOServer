import Silo from "@delma/byos";
import { VALIDATE } from "../../_utils/validation.js";

export default class Migrate {

    private static colKey = "[primary]"

    @VALIDATE([{ type: "object" }])
    static async GET({ slugs }: _HTTPContext) {

        return {

            async *[Symbol.asyncIterator]() {

                for await (const data of Silo.exportBulkData(slugs.get(Migrate.colKey))) {

                    await Bun.sleep(100)

                    yield data
                }
            }
        }
    }

    @VALIDATE([{ type: "object" }, { type: "object" }])
    static async POST({ url, limit }: { url: string, limit?: number }, { slugs }: _HTTPContext) {

        await Silo.importBulkData(slugs.get(Migrate.colKey), new URL(url), limit)
    }
}