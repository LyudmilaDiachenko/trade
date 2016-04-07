var
    md5 = require("crypto-js/md5"),
    config = require('config'),
    //sql = require('co-mysql').createPool(config.get("sql"))
    sql = require('co-mysql')(require('mysql').createPool(config.get("sql")))
    ;

module.exports = {
    main: function *(next) {
        //if (!this.session.user_id) return this.redirect('/login/');
        //var items = yield sql.query(`SELECT * FROM trade.adv LEFT JOIN trade.category LEFT JOIN trade.subcategory LEFT JOIN trade.currency where user_id=?`, [this.session.user_id]);
        yield this.render('main', {
            session: this.session,
            page: 'main'
            //items: items
        });
        yield next;
    },
    login: function *(next) {
        if (this.request.body.email && this.request.body.password) {
            try {
                yield sql.query('INSERT INTO `trade`.`users` (`email`,`password`) VALUES (?, ?)', [this.request.body.email, md5(this.request.body.password).toString()]);
            } catch (error) {

            }
            var user = yield sql.query('SELECT * FROM trade.users where email=? and password=?', [this.request.body.email, md5(this.request.body.password).toString()]);
            this.session.user_id = user[0] ? user[0].user_id : null;
            this.session.email = user[0] ? user[0].email : null;
            this.session.name = user[0] ? user[0].name : null;
            this.redirect('/');
        } else {
            yield this.render('login', {
                session: {},
                page: 'login'
            });
        }
        yield next;
    },
    logout: function *(next) {
        this.session = {};
        return this.redirect('/');
    },
    profile: function *(next) {
        if (!this.session.user_id) return this.redirect('/login/');
        if (this.request.body.name) {
            try {
                if (this.request.body.password != this.request.body.re_password) {
                    return this.redirect('/profile/?error=2')
                }
                var resp = yield sql.query('UPDATE trade.users SET name=?, password=?, sex=?, dob=?, city=?, addr=?, tel=? WHERE user_id=? and password=?', [this.request.body.name, md5(this.request.body.password).toString(), this.request.body.sex, this.request.body.dob, this.request.body.city, this.request.body.addr, this.request.body.tel, this.session.user_id, md5(this.request.body.old_password).toString()]);
            } catch (err) {

            }
            if (resp.affectedRows > 0) {
                this.redirect('/profile/?success=1');
            } else {
                this.redirect('/profile/?error=1');
            }
        } else {
            var user = yield sql.query('SELECT * FROM trade.users where user_id=?', [this.session.user_id]);
            yield this.render('profile', {
                session: this.session,
                page: 'profile',
                user: user[0],
                error: this.query.error,
                success: this.query.success
            });
        }
        yield next;
    },
    publish: function *(next) {
        if (!this.session.user_id) return this.redirect('/login/');
        if (this.request.body.name && this.request.body.text && this.request.body.price) {
            if(!this.request.body.category_id || this.request.body.category_id=='0'){
                this.request.body.category_id = null;
            }
            try {
                if (this.request.body.adv_id){
                    yield sql.query('UPDATE trade.adv SET name=?, text=?, price=?, category_id=?, currency_id=? WHERE adv_id=? and user_id=?', [this.request.body.name, this.request.body.text, this.request.body.price, this.request.body.category_id, this.request.body.currency_id, this.request.body.adv_id, this.session.user_id]);
                } else {
                    var res = yield sql.query('INSERT INTO `trade`.`adv` (`user_id`,`name`,`text`,`price`, `category_id`, `currency_id`) VALUES (?, ?, ?, ?, ?, ?)', [this.session.user_id, this.request.body.name, this.request.body.text, this.request.body.price, this.request.body.category_id, this.request.body.currency_id]);
                }
            } catch (error) {

            }
            return this.redirect('/adv/'+(this.request.body.adv_id || res.insertId)+'/');
        } else {
            var item = {};
            if(this.params.id) {
                item = (yield sql.query('SELECT * FROM trade.adv WHERE adv_id=? and user_id=?', [this.params.id, this.session.user_id]))[0];
            }
               if(!item) return this.redirect('/publish/');
            var list = yield sql.query('SELECT * FROM trade.category');
            var currencies = yield sql.query('SELECT * FROM trade.currency');
            yield this.render('publish', {
                session: this.session,
                page: 'publish',
                item: item,
                list: list,
                currencies: currencies

            });
        }
    },
    search: function *(next) {
        var query = `SELECT a.*, u.email, c.*, y.*
        FROM trade.adv a
        INNER JOIN trade.users u using (user_id)
        LEFT JOIN trade.category c using (category_id)
        LEFT JOIN trade.currency y using (currency_id)
        LEFT JOIN trade.currency y2 on y2.currency_id = ?
        WHERE 1 `
            + (this.query.text ? ` and (a.name LIKE "%${this.query.text}%" OR text LIKE "%${this.query.text}%") ` : '')
            + (this.query.price_from ? ` and ceil(price * y.rate / y2.rate) >= "${this.query.price_from}" ` : '')
            + (this.query.price_to ? ` and ceil(price * y.rate / y2.rate) <= "${this.query.price_to}" ` : '')
            + ((this.query.category_id|0) ? ` and category_id='${this.query.category_id}' ` : '')
            + ` ORDER BY a.name desc`;
        var items = yield sql.query(query,[this.query.currency_id|0]);
        var list = yield sql.query('SELECT * FROM trade.category');
        var currencies = yield sql.query('SELECT * FROM trade.currency');
        yield this.render('search', {
            session: this.session,
            page: 'search',
            items: items,
            list: list,
            currencies: currencies,
            query: this.query
        });
        yield next;
    },
    adv: function *(next){
        var items = yield sql.query (`SELECT *, a.name as adv_name, u.name as user_name
        FROM trade.adv a
        INNER JOIN trade.users u using (user_id)
        INNER JOIN trade.category c using (category_id)
        INNER JOIN trade.currency y using (currency_id)
        WHERE adv_id = ?`,[this.params.id]);
        if (!items[0]) {
            return this.redirect('/');
        }
        var reviews = yield sql.query(`SELECT * FROM trade.review where adv_id=? order by date desc limit 100`,[this.params.id]);

        yield this.render('adv', {
            session: this.session,
            page: 'adv',
            item: items[0],
            reviews: reviews,
            id: this.params.id
        });
        yield next;

    },
    user: function *(next){
        var user = yield sql.query (`SELECT * FROM trade.users WHERE user_id = ?`,[this.params.id]);
        yield this.render('user', {
            session: this.session,
            page: 'user',
            user: user [0],
            id: this.params.id
        });
        yield next;

    },

    review: function *(next){
        var res = yield sql.query('INSERT INTO `trade`.`review` (`adv_id`, `user_id`, `name`, `text`) VALUES (?, ?, ?, ?)', [this.request.body.adv_id, this.session.user_id, this.request.body.name, this.request.body.text]);
        return this.redirect('/adv/'+this.request.body.adv_id +'/#review-' + res.insertId);
    }
};

