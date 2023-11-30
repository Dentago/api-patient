// TODO: Modify processes and dependencies as the system demands 

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const history = require('connect-history-api-fallback');
const controller = require('./controller');

// Variables
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI || process.env.CI_MONGODB_URI;
const port = process.env.PORT || process.env.CI_PORT;

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => {
    console.log(`Connected to MongoDB with URI: ${mongoURI}`);
  })
  .catch((err) => {
    console.error(`Failed to connect to MongoDB with URI: ${mongoURI}`);
    console.error(err.stack);
    process.exit(1);
  });

// create Express app
const app = express();
// parse requests of content-type 'application/json'
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// HTTP request logger
app.use(morgan('dev'));
// enable cross-origin resource sharing for frontend must be registered before api
app.options('*', cors());
app.use(cors());

// import routes
app.use('/api', controller);

// catch all non-error handler for api (i.e., 404 Not Found)
app.use('/api/*', function (_, res) {
    res.status(404).json({ 'message': 'Not Found' });
});

// configuration for serving frontend in production mode
// support Vuejs HTML 5 history mode
app.use(history());
// serve static assets
let root = path.normalize(__dirname + '/..');
let client = path.join(root, 'client', 'dist');
app.use(express.static(client));

// error handler (i.e., when exception is thrown) must be registered last
const env = app.get('env');
// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
    console.error(err.stack);
    let err_res = {
        'message': err.message,
        'error': {}
    };
    if (env === 'development') {
        // return sensitive stack trace only in dev mode
        err_res['error'] = err.stack;
    }
    res.status(err.status || 500);
    res.json(err_res);
});

app.listen(port, function(err) {
    if (err) throw err;
    console.log(`Express server listening on port ${port}, in ${env} mode`);
    console.log(`Backend: http://localhost:${port}/api/`);
    console.log(`Frontend (production): http://localhost:${port}/`);
});

module.exports = app;