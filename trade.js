var config = require('config');

module.exports = {
    main: function *(next) {
        this.body = config.get('sql');
        yield next;
    },
}