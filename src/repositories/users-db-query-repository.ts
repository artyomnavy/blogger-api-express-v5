import {PaginatorUserModel} from "../types/user/input";
import {OutputUsersType, PaginatorUsersType, UsersType} from "../types/user/output";
import {usersCollection} from "../db/db";
import {userMapper} from "../types/user/mapper";
import {ObjectId, WithId} from "mongodb";
import {OutputAuthMeType} from "../types/auth/output";

export const usersQueryRepository = {
    async getAllUsers(QueryData: PaginatorUserModel): Promise<PaginatorUsersType> {
        const sortBy = QueryData.sortBy ?
                QueryData.sortBy :
                'createdAt'
        const sortDirection = QueryData.sortDirection ?
            QueryData.sortDirection :
            'desc'
        const pageNumber = QueryData.pageNumber ?
            QueryData.pageNumber :
            1
        const pageSize = QueryData.pageSize ?
            QueryData.pageSize :
            10
        const searchLoginTerm = QueryData.searchLoginTerm ?
            QueryData.searchLoginTerm :
            null
        const searchEmailTerm = QueryData.searchEmailTerm ?
            QueryData.searchEmailTerm :
            null

        let filterLogin = {}
        let filterEmail = {}

        if (searchLoginTerm) {
            filterLogin = {
                login: {
                    $regex: searchLoginTerm,
                    $options: 'i'
                }
            }
        }

        if (searchEmailTerm) {
            filterEmail = {
                email: {
                    $regex: searchEmailTerm,
                    $options: 'i'
                }
            }
        }

        const filter = {
            $or: [
                filterLogin,
                filterEmail
            ]
        }

        const users = await usersCollection
            .find(filter)
            .sort({[sortBy]: sortDirection === 'desc' ? -1 : 1})
            .skip((+pageNumber - 1) * +pageSize)
            .limit(+pageSize)
            .toArray()

        const totalCount = await usersCollection
            .countDocuments(filter)

        const pagesCount = Math.ceil(+totalCount / +pageSize)

        return {
            pagesCount: pagesCount,
            page: +pageNumber,
            pageSize: +pageSize,
            totalCount: +totalCount,
            items: users.map(userMapper)
        }
    },
    async getUserByLoginOrEmail(loginOrEmail: string): Promise<WithId<UsersType> | null> {
        const filter = {
            $or: [
                {login: loginOrEmail},
                {email: loginOrEmail}
            ]
        }

        const user = await usersCollection
            .findOne(filter)

        if (!user) {
            return null
        } else {
            return user
        }
    },
    async getUserById(id: string): Promise<OutputUsersType | null> {
        const user = await usersCollection
            .findOne({_id: new ObjectId(id)})

        if (!user) {
            return null
        } else {
            return userMapper(user)
        }
    },
    async getUserByIdForAuthMe(id: string): Promise<OutputAuthMeType | null> {
        const user = await usersCollection
            .findOne({_id: new ObjectId(id)})

        if (!user) {
            return null
        } else {
            return {
                email: user.email,
                login: user.login,
                userId: user._id.toString()
            }
        }
    }
}