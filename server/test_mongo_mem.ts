
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const start = async () => {
  try {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('MongoMemoryServer started at:', uri);
    await mongoose.connect(uri);
    console.log('Mongoose connected');
    await mongoose.disconnect();
    await mongod.stop();
  } catch (err) {
    console.error(err);
  }
};

start();
