import {OutputUsersType} from "./user/output";

declare global {
    namespace Express {
        export interface Request {
            userId: string | null
        }
    }
}