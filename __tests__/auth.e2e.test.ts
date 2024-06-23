import {OutputUsersType} from "../src/types/user/output";
import request from "supertest";
import {app} from "../src/settings";
import {HTTP_STATUSES} from "../src/utils";

const loginBasicAuth = 'admin'
const passwordBasicAuth = 'qwerty'

const responseNullData = {
    pagesCount: 0,
    page: 1,
    pageSize: 10,
    totalCount: 0,
    items: []
}

describe('/auth', () => {

    let newUser: OutputUsersType | null = null
    let token: any = null

    beforeAll(async () => {
        await request(app).delete('/testing/all-data').expect(HTTP_STATUSES.NO_CONTENT_204)
    })

    it('- POST does not enter to system with incorrect data and does not create token', async () => {
        await request(app)
            .post('/auth/login')
            .send({loginOrEmail: 'ab', password: '12345'})
            .expect(HTTP_STATUSES.BAD_REQUEST_400, {
                errorsMessages: [
                    {message: 'Invalid loginOrEmail', field: 'loginOrEmail'},
                    {message: 'Invalid password', field: 'password'},
                ]
            })
    })

    it('- POST does not enter to system with incorrect data and does not create token', async () => {
        await request(app)
            .post('/auth/login')
            .send({
                loginOrEmail: 'login',
                password: 'password'
            })
            .expect(HTTP_STATUSES.UNAUTHORIZED_401)
    })

    it('+ POST create user with correct data', async () => {
        const createUser = await request(app)
            .post('/users')
            .auth(loginBasicAuth, passwordBasicAuth)
            .send({
                login: 'login',
                password: '123456',
                email: 'test@test.com'
            })
            .expect(HTTP_STATUSES.CREATED_201)

        newUser = createUser.body

        expect(newUser).toEqual({
            id: expect.any(String),
            login: 'login',
            email: 'test@test.com',
            createdAt: expect.any(String)
        })

        await request(app)
            .get('/users')
            .auth(loginBasicAuth, passwordBasicAuth)
            .expect(HTTP_STATUSES.OK_200, {
                pagesCount: 1,
                page: 1,
                pageSize: 10,
                totalCount: 1,
                items: [newUser]
            })
    })

    it('+ POST enter to system with correct data and create token', async () => {
        const createToken = await request(app)
            .post('/auth/login')
            .send({
                loginOrEmail: 'test@test.com',
                password: '123456'
            })
            .expect(HTTP_STATUSES.OK_200)

        token = createToken.body.accessToken
    })

    it('- GET information about user with invalid token', async () => {
        const res = await request(app)
            .get('/auth/me')
            .set('Authorization', `Bearer wr0ngt0k3n`)
            .expect(HTTP_STATUSES.UNAUTHORIZED_401)
    })

    it('+ GET information about user with valid token', async () => {
        const res = await request(app)
            .get('/auth/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(HTTP_STATUSES.OK_200)

        expect(res.body).toEqual({
            login: 'login',
            email: 'test@test.com',
            userId: newUser!.id
        })
    })

    it('+ DELETE user by ID with correct id', async () => {
        await request(app)
            .delete('/users/' + newUser!.id)
            .auth(loginBasicAuth, passwordBasicAuth)
            .expect(HTTP_STATUSES.NO_CONTENT_204)

        await request(app)
            .get('/users')
            .auth(loginBasicAuth, passwordBasicAuth)
            .expect(HTTP_STATUSES.OK_200, responseNullData)
    })
})