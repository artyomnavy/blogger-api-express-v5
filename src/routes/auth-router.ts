import {Response, Request, Router} from "express";
import {HTTP_STATUSES} from "../utils";
import {usersService} from "../domain/users-service";
import {RequestWithBody} from "../types/common";
import {AuthLoginModel} from "../types/auth/input";
import {authLoginValidation} from "../middlewares/validators/auth-validator";
import {jwtService} from "../application/jwt-service";
import {authBearerMiddleware} from "../middlewares/auth/auth-middleware";
import {usersQueryRepository} from "../repositories/users-db-query-repository";

export const authRouter = Router({})

authRouter.post('/login',
    authLoginValidation(),
    async (req: RequestWithBody<AuthLoginModel>, res: Response) => {
        let {
            loginOrEmail,
            password
        } = req.body

    const user = await usersService
            .checkCredentials({loginOrEmail, password})

        if (!user) {
            res.sendStatus(HTTP_STATUSES.UNAUTHORIZED_401)
        } else {
            const token = await jwtService
                .createJWT(user._id.toString())
            res.send({accessToken: token})
        }
    })

authRouter.get('/me',
    authBearerMiddleware,
    async (req: Request, res: Response) => {

        const authMe = await usersQueryRepository
            .getUserByIdForAuthMe(req.userId!)

        res.send(authMe)
})