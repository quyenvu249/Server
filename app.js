var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let expressLayouts = require('express-ejs-layouts');
let fileUpload = require('express-fileupload');

var apiRouter = require('./routes/apiRoutes');
var usersRouter = require('./routes/userRoutes');
var introsRouter = require('./routes/introRoutes');
var loginRouter = require('./routes/loginRoutes');
var scheduleRouter = require('./routes/scheduleRoutes');
var serviceRouter = require('./routes/serviceRoutes');
let db = require('./database');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(fileUpload({
  createParentPath: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(expressLayouts);

app.use('/api', apiRouter);
app.use('/', loginRouter);
app.use('/users', usersRouter);
app.use('/introduces', introsRouter);
app.use('/schedules', scheduleRouter);
app.use('/services', serviceRouter);

app.get('/docs', (req, res) => {
  res.render('docs', {layout:'temp/default', title:'Documentation'})
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
