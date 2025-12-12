import { beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
let mongo;
beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri, { dbName: "test", maxPoolSize: 5 });
});
afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});
