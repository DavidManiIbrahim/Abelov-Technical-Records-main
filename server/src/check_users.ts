import { connectMongo } from "./db/mongo";
import { UserModel } from "./models/user.model";

const check = async () => {
    try {
        await connectMongo();
        const users = await UserModel.find({});
        console.log("Found users:", users.map(u => ({ email: u.email, roles: u.roles })));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
