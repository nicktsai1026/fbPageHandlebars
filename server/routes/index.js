const Routes = require('./routes');
const Passport = require('./passport');
const Login = require('./login');

module.exports = function (app, db) {
    Routes(app, db);
    Passport(app, db);
    Login(app, db);
    // Other route groups could go here, in the future
};