var app = require('koa')(),
    router = require('koa-router')(),
    render = require('koa-ejs'),
    serve = require('koa-serve'),
    bodyParser = require('koa-bodyparser'),
    session = require('koa-generic-session'),
    MysqlStore = require('koa-mysql-session'),
    config = require('config'),
    trade = require('./trade')
    ;

//обработка форм
app.use(bodyParser());

//session
app.keys = config.get("secret");
app.use(session({
    store: new MysqlStore(config.get("sql")),
    rolling: true,
    cookie: {
        maxage: 86400
    }
}));

//шаблонизация
render(app, {
    root: 'view',
    layout: 'layout',
    viewExt: 'html',
    cache: false,
    debug: false
});

//роздача статики
app.use(serve('static'));

//роутинг
router
    .get('/', trade.main)

    .get('/login/', trade.login)
    .post('/login/', trade.login)

    .get('/logout/', trade.logout)

    .get('/profile/', trade.profile)
    .post('/profile/', trade.profile)

    .get('/user/:id/', trade.user)

    .get('/publish/', trade.publish)
    .post('/publish/', trade.publish)
    .get('/publish/:id/', trade.publish)

    .get('/search/', trade.search)

    .get('/adv/:id/', trade.adv)

    .post('/review/', trade.review)

//відгуки на кінцевій
//блокнот(дод у вибране)
//друзі
;
app.use(router.routes());

app.listen(config.get('port'));
