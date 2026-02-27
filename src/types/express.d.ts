import { IUser } from "../db/mongodb/models/User.js";

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}
