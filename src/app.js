const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');


const indexRouter = require('./routes');
const usersRouter = require('./routes/users');
const dataLakeController = require('./routes/DataLakeController');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VBP Experiment Executor',
      version: '1.0.0',
    },
  },
  apis: ['src/routes/*.js'], // files containing annotations as above
};
const openapiSpecification = swaggerJsdoc(options);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.text({type: 'text/plain'}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/queries', dataLakeController);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

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
