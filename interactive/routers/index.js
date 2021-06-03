/*
 * Copyright (c) 2020 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * File: demo rest api.
 *
 * Author: Li.Ping <liping@acoinfo.com>
 *
 */
const WebApp = require('webapp');
const Router = WebApp.Router;
const router = Router.create();

var users = [];

router.get('/api/user', function(req, res) {
	res.json(
		{
			result: true,
			message: 'success',
			data: users
		}
	);
	
});
router.post('/api/user', function(req, res) {
	users.push(req.body);
	res.json({
		result: true,
		message: 'success'
	});
});

module.exports = router
