import Silo from "@delma/byos";
import { _HTTPContext } from "@delma/tachyon";

export default class Schema {

    private static colKey = "[primary]"

    static async POST({ slugs }: _HTTPContext) {

        await Silo.createSchema(slugs!.get(Schema.colKey))
    }

    static async PATCH({ slugs }: _HTTPContext) {

        await Silo.modifySchema(slugs!.get(Schema.colKey))
    }

    static DELETE({ slugs }: _HTTPContext) {

        Silo.dropSchema(slugs!.get(Schema.colKey))
    }
}