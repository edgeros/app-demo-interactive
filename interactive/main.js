#! /bin/javascript

/*
 * Copyright (c) 2020 EdgerOS Team.
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
const iosched = require('iosched');

/* Whether the app was awakened by a shared message */
if (ARGUMENT != undefined) {
	console.log('Awakened by share message:', ARGUMENT);
}

/* Create web server */
const app = Web.createApp();
app.use(bodyParser.json());
app.use(Web.static('./public', { index: ['index.html', 'index.htm'] }));
app.use('/', require('./routers'));
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
var io = require('socket.io')
var socketio = io(
	app, {
		serveClient: false,
		pingInterval: 10000,
		pingTimeout: 5000
	}
);

socketio.on('connection', function(sockio) {
	sockio.on('message', (msg, callback) => {
		callback(`server: ${msg}`);
	});
});

/*
 * Event loop
 */
iosched.forever();
