<div style="font-size:32px" align="center">Club Social Network</div>
<div style="font-size:16px" align="center">
Backend Application of Club Social Network
</div>
<br>
<div style="font-size:11px" align="center">
<span>20180416 Yeongil Yoon</span>,
<span>20180528 Hoyeon Lee</span>,
<span>20180532 Heechan Lee</span>,<br>
<span>20180634 Mingyu Jo</span>,
<span>20180700 Hyeongjin Choi</span>
</div>

## Installation

```bash
$ docker-compose -f postgresql/postgres-13.yml up -d
$ npm install
$ npx prisma migrate dev
$ npx prisma generate
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Description

- Swagger API: http://localhost:3000/api
- Get test authentication token (expires in 15m): http://localhost:3000/auth/test

## Architecture

request -> middleware -> guard -> interceptor -> pipe -> controller -> service -> interceptor(post request) -> response

[See more](https://docs.nestjs.com/faq/request-lifecycle) about nestjs request lifecycle.

Our application has

- AuthGuard for authentication (currently, authorization is handled by service (todo))
- ValidationPipe for validation of input
- ClassSerializerInterceptor for serialization between plain javascript object and class object

## License

Nest is [MIT licensed](LICENSE).
