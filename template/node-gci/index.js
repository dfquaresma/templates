// Copyright (c) Alex Ellis 2017. All rights reserved.
// Copyright (c) OpenFaaS Author(s) 2018. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

"use strict"

const handler = require('./function/handler');
const express = require('express');
const app = express();
const gci = require('./gcinterceptor');

app.get('/__gci', gci);
app.get('/', function (req, res) {res.send(handler(req))});

const PORT = process.env.EXPRESS_PORT || 8082;
app.listen(PORT, function () {
    console.log('App listening on port ' + PORT + '!');
});