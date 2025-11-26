declare module "mongo-lite" {
  type MongoLiteDocument = Record<string, unknown>;
  type MongoLiteCursor = {
    all: (callback: (err: Error | null, docs: MongoLiteDocument[]) => void) => void;
  };
  type MongoLiteCollection = {
    find: (selector: Record<string, unknown>) => MongoLiteCursor;
    insert: (doc: MongoLiteDocument, callback: (err: Error | null, doc: MongoLiteDocument) => void) => void;
    remove: (selector: Record<string, unknown>, callback: (err: Error | null) => void) => void;
  };
  type MongoLiteDb = Record<string, MongoLiteCollection>;

  const mongoLite: {
    connect: (url: string, collections?: string[]) => MongoLiteDb;
  };
  export = mongoLite;
}
