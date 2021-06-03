#! /bin/javascript

/*
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * File: main.js.
 *
 * Author: liping@acoinfo.com
 *
 */
const Web = require('webapp');
const bodyParser = require('middleware').bodyParser;

/* Create web server */
var app = Web.createApp();
app.use(bodyParser.json());
app.use(Web.static('./public', { index: ['index.html', 'index.htm'] }));
app.use('/', require('./routers/rest'));
app.start();

/**
 * Create WebSyncTable Server
 */
var WebSyncTable = require('websynctable');
var SyncTable = require('synctable');
var table = new SyncTable('table1');
var server = new WebSyncTable(app, table);

/**
 * Create socketio
 */
var io = require('socket.io')(
	app, {
		serveClient: false,
		pingInterval: 10000,
		pingTimeout: 5000
	}
);

io.on('connection', function(sockio) {
	sockio.on('message', (msg, callback) => {
		callback(`server: ${msg}`);
	});
});

/* Event loop */
require('iosched').forever();
