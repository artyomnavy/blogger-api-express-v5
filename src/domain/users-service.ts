import {CreateUserModel} from "../types/user/input";
import {OutputUsersType} from "../types/user/output";
import {ObjectId} from "mongodb";
import {usersRepository} from "../repositories/users-db-repository";
import bcrypt from 'bcrypt';
import {usersQueryRepository} from "../repositories/users-db-query-repository";
import {AuthLoginModel} from "../types/auth/input";

export const usersService = {
    async createUser(createData: CreateUserModel): Promise<OutputUsersType> {
        const passwordHash = await bcrypt.hash(createData.password, 10)

        const newUser = {
            _id: new ObjectId(),
            login: createData.login,
            password: passwordHash,
            email: createData.email,
            createdAt: new Date().toISOString()
        }

        const createdUser = await usersRepository
            .createUser(newUser)

        return createdUser
    },
    async checkCredentials(inputData: AuthLoginModel) {
        const user = await usersQueryRepository
            .getUserByLoginOrEmail(inputData.loginOrEmail)

        if (!user) {
            return null
        }

        const checkPassword = await bcrypt.compare(inputData.password, user.password)

        if (!checkPassword) {
            return null
        } else {
            return user
        }
    },
    async deleteUser(id: string): Promise<boolean> {
        return await usersRepository
            .deleteUser(id)
    }
}