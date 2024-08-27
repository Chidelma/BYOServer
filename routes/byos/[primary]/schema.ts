import Silo from "@delma/byos";

export default class Schema {

    private static colKey = "[primary]"

    static async POST({ slugs }: _HTTPContext) {

        await Silo.createSchema(slugs.get(Schema.colKey))
    }

    static async PATCH({ slugs }: _HTTPContext) {

        await Silo.modifySchema(slugs.get(Schema.colKey))
    }

    static async DELETE({ slugs }: _HTTPContext) {

        await Silo.dropSchema(slugs.get(Schema.colKey))
    }
}