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
$ npx prisma migrate dev --name init
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

## License

Nest is [MIT licensed](LICENSE).
