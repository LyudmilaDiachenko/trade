var config = require('config'),
    sql = require('co-mysql').createPool(config.get("sql"))
    ;

module.exports = {
    main: function *(next) {
        this.body = yield sql.query('select now()');
        //if (!this.session.user_id) return this.redirect('/login/');
        //var items = yield sql.query('SELECT * FROM mail.mail LEFT JOIN mail.users ON user_from = user_id where user_to=? and del=0 order by id desc limit 6', [this.session.user_id]);
        //yield this.render('main', {
        //    session: this.session,
        //    page: 'main',
        //    items: items
        //});
        yield next;
    },
}