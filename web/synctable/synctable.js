/*
 * Copyright (c) 2021 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * File: synctable.js Web SyncTable client module.
 *
 * Author: Han.hui <hanhui@acoinfo.com>
 * 
 * Version: 0.1.7
 *
 */

/* Client version */
const CLIENT_VERSION = [0, 1, 7];

/* All Clients */
const clients = new Set();

/*
	* singleDiff
	*/
function singleDiff(target, value, key) {
	if (target[key] === value) {
		return false;
	}

	let diff = false;
	if (typeof value === 'object') {
		if (value === null) {
			if (target[key] !== null) {
				diff = true;
			}
		} else if (Array.isArray(value)) {
			if (!Array.isArray(target[key])) {
				diff = true;
			} else {
				diff = isDifferent(target[key], value);
			}
		} else {
			if (Array.isArray(target[key])) {
				diff = true;
			} else {
				diff = isDifferent(target[key], value);
			}
		}

	} else {
		diff = true;
	}

	return diff;
}

/*
	* Object different check
	*/
function isDifferent(target, source) {
	if (typeof target !== 'object' || typeof source !== 'object') {
		throw new TypeError('Arguments error');
	}
	if (target == null && source == null) {
		return false;
	} else if (target == null || source == null) {
		return true;
	}

	let diff = false;
	if (Array.isArray(target)) {
		if (!Array.isArray(source)) {
			return true;
		}

		try {
			source.forEach(function(value, key) {
				diff = singleDiff(target, value, key);
				if (diff) {
					throw new Error('Different');
				}
			});
		} catch (error) {
			if (error.message === 'Different') {
				return true;
			} else {
				throw error;
			}
		}

	} else {
		if (Array.isArray(source)) {
			return true;
		}

		for (let prop in source) {
			diff = singleDiff(target, source[prop], prop);
			if (diff) {
				break;
			}
		}
	}

	return diff;
}

/*
	* EventEmitter Class
	*/
class EventEmitter {
	constructor() {
		this._events = {};
		this.on = this.addEventListener;
		this.off = this.removeEventListener;
	}

	/*
		* Emit event
		*/
	_emit(event) {
		var listeners = this._events[event];
		if (!Array.isArray(listeners)) {
			return false;
		}

		listeners = listeners.slice();
		var args = Array.prototype.slice.call(arguments, 1);
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].apply(this, args);
		}
		return true;
	}

	/*
		* Add Event Listener
		*/
	addEventListener(event, listener) {
		if (typeof listener !== 'function') {
			throw new TypeError('listener must be a function');
		}

		if (!this._events[event]) {
			this._events[event] = [];
		}
		this._events[event].push(listener);
		return this;
	}

	/*
		* Remove Event Listener
		*/
	removeEventListener(event, listener) {
		if (typeof listener !== 'function') {
			throw new TypeError('listener must be a function');
		}

		var list = this._events[event];
		if (!Array.isArray(list)) {
			return this;
		}
		for (var i = list.length - 1; i >= 0; --i) {
			if (list[i] == listener ||
				(list[i].listener && list[i].listener == listener)) {
				list.splice(i, 1);
				if (!list.length) {
					delete this._events[event];
				}
				break;
			}
		}
		return this;
	}

	/*
		* Remove All Listener
		*/
	removeAllListeners(event) {
		if (arguments.length === 0) {
			this._events = {};
		} else {
			delete this._events[event];
		}
		return this;
	}
}

/* Timeout period */
const TIMEOUT_PERIOD = 1000;

/* Linkers Map */
const linkers = new Map();

/*
	* Linker Class
	*/
class Linker extends EventEmitter {
	constructor(server, opt) {
		if (typeof server !== 'string' || typeof opt !== 'object') {
			throw new TypeError('Arguments error');
		}

		super();
		this.ref = 1;
		this.opt = opt;
		this.url = this._url(server, opt);
		this.period = opt.ping;
		this.server = server;
		this.opened = false;
		this.tables = new Map();
		this.socket = new WebSocket(this.url);
		this._init();
		linkers.set(server, this);
	}

	/*
		* Get url
		*/
	_url(server, opt) {
		var url = server + '/eos/websynctable';
		console.log(opt);
		console.log(typeof opt.token);
		console.log(typeof opt.srand);
		if (typeof opt.token === 'string' && typeof opt.srand === 'string') {
			url += `?edger-token=${opt.token}&edger-srand=${opt.srand}&version=${CLIENT_VERSION}`;
		} else {
			url += `?version=${CLIENT_VERSION}`;
		}
		console.log(`${url}-----------------------`);
		return url;
	}

	/*
		* WebSocket Initialize
		*/
	_init() {
		this.socket.onopen = () => {
			this.opened = true;
			console.log('SyncTable Linker connected.');
			this._emit('connect');

			if (this.ping == undefined) {
				this.ping = setInterval(() => {
					this.send({ event: 'noop' });
				}, this.period);
			}
		};

		this.socket.onclose = () => {
			this.opened = false;
			if (this.ref <= 0) {
				return;
			}
			console.log('SyncTable Linker disconnect.');
			this._emit('disconnect');

			if (this.ping != undefined) {
				clearInterval(this.ping);
				this.ping = undefined;
			}
			this._reconn = setTimeout(() => {
				this.url = this._url(this.server, this.opt);
				this.socket = new WebSocket(this.url);
				this._init();
			}, TIMEOUT_PERIOD);
		};

		this.socket.onmessage = (event) => {
			try {
				var msg = JSON.parse(event.data);
			} catch {
				return console.error('SyncTable Linker receive invalid message.');
			}
			var table = this.tables.get(msg.name);
			if (table) {
				table._onmessage(msg);
			} else {
				console.warn('SyncTable Linker received unregister table message.');
			}
		};
	}

	/*
	 * Close
	 */
	close() {
		if (this.ref <= 0) {
			return;
		}
		this.ref--;
		if (this.ref <= 0) {
			if (this.ping != undefined) {
				clearInterval(this.ping);
				this.ping = undefined;
			} else {
				clearTimeout(this._reconn);
			}
			this.removeAllListeners();
			this.socket.close();
			this.tables.clear();
			linkers.delete(this.server);
		}
	}

	/*
		* Register table
		*/
	register(name, table) {
		this.tables.set(name, table);
	}

	/*
		* Unregister table
		*/
	unregister(name) {
		this.tables.delete(name);
		if (this.socket.readyState === WebSocket.OPEN) {
			this.send({ name, event: 'goodbye' });
		}
	}

	/*
		* Send a message to server
		*/
	send(msg) {
		if (this.opened) {
			this.socket.send(JSON.stringify(msg));
			return true;
		} else {
			return false;
		}
	}

	/*
		* Get connect state
		*/
	get state() {
		return this.socket.readyState;
	}
}

/*
	* Uint8Array to Base64
	*/
function toBase64(u8) {
	var decoder = new TextDecoder('utf8');
	return btoa(decoder.decode(u8));
}

/*
	* Uint8Array from Base64
	*/
function fromBase64(str) {
	var encoder = new TextEncoder();
	return encoder.encode(atob(str));
}

/*
	* Get random id
	*/
function getRandId() {
	var d = Date.now();
	var randid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		var r = (d + Math.random() * 16) % 16 | 0;
		d = Math.floor(d / 16);
		return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
	return randid;
}

/*
	* SyncTable Class (client)
	*/
class SyncTable extends EventEmitter {
	constructor(server, name, opt = {}) {
		if (typeof server !== 'string' || typeof name !== 'string') {
			throw new TypeError('Arguments error');
		}
		if (clients.has(name)) {
			throw new Error('Duplicate creation');
		}

		if (typeof opt.ping !== 'number') {
			opt.ping = 2000;
		}
		if (typeof opt.timeout !== 'number') {
			opt.timeout = 6000;
		}

		super();
		this._linker = linkers.get(server);
		if (this._linker) {
			this._linker.ref++;
		} else {
			this._linker = new Linker(server, opt);
		}
		this._linker.register(name, this);

		this._name = name;
		this._uuid = getRandId();
		this._scnt = 0;

		this._qsets = [];
		this._qgets = [];
		this._qhass = [];
		this._qcmds = [];
		this._qsync = [];

		this._cache = new Map();
		this._undef = new Set();
		this._alrdy = undefined;
		this._init();

		this._timer = setInterval(() => {
			this._totick(this._qsets, opt.timeout);
			this._totick(this._qgets, opt.timeout);
			this._totick(this._qhass, opt.timeout);
			this._totick(this._qcmds, opt.timeout);
		}, TIMEOUT_PERIOD);

		clients.add(name);
	}

	/*
		* Say hello
		*/
	_hello() {
		let keys = undefined;
		if (this._qgets.length) {
			keys = [];
			this._qgets.forEach(pending => keys.push(pending.key));
		}
		if (this._qsync.length) {
			if (keys) {
				keys = keys.concat(this._qsync);
			} else {
				keys = this._qsync;
			}
		}
		var sended = false;
		if (keys) {
			this._linker.send(this._bsync(keys));
			sended = true;
		}
		for (let i = 0; i < this._qsets.length; i++) {
			let pending = this._qsets[i];
			this._linker.send(pending.msg);
			sended = true;
		}
		for (let i = 0; i < this._qhass.length; i++) {
			let pending = this._qhass[i];
			this._linker.send(pending.msg);
			sended = true;
		}
		for (let i = 0; i < this._qcmds.length; i++) {
			let pending = this._qcmds[i];
			if (!pending.sended && pending.msg) {
				this._linker.send(pending.msg);
				pending.sended = true;
				sended = true;
			}
		}
		if (!sended) {
			this._linker.send(this._bnoop());
		}
		this._emit('connect');
	}

	/*
		* Initialize
		*/
	_init() {
		this._linker.on('connect', () => {
			this._hello();
		});

		this._linker.on('disconnect', () => {
			this._qsync = [];
			if (this._alrdy) {
				this._cache.forEach((value, key) => this._alrdy.set(key, value));
			} else {
				this._alrdy = this._cache;
			}
			this._alrdy.forEach((value, key) => this._qsync.push(key));
			this._cache = new Map();
			this._undef.clear();
			this._emit('disconnect');
		});

		if (this._linker.state === WebSocket.OPEN) {
			this._hello();
		}
	}

	/*
		* Timeout tick
		*/
	_totick(queue, timeout) {
		for (var i = 0; i < queue.length; i++) {
			var pending = queue[i];
			pending.timeout += TIMEOUT_PERIOD;
			if (pending.timeout >= timeout) {
				pending.reject(new Error('Timeout'));
				queue.splice(i, 1);
				i--;
			}
		}
	}

	/*
		* On linker message
		*/
	_onmessage(msg) {
		switch (msg.event) {

		case 'clear':
			this._cache.clear();
			this._emit('clear');
			break;

		case 'update':
			if (msg.encode === 'base64') {
				try {
					msg.value = fromBase64(msg.value);
				} catch {
					return console.error(`SyncTable: ${this._name} invalid base64.`);
				}
			}
			if (msg.value == undefined) {
				this._cache.delete(msg.key);
				this._undef.add(msg.key);
			} else {
				this._cache.set(msg.key, msg.value);
				this._undef.delete(msg.key);
			}
			for (let i = 0; i < this._qgets.length; i++) {
				const pending = this._qgets[i];
				if (pending.key === msg.key) {
					pending.resolve(msg.value);
					this._qgets.splice(i, 1);
					i--;
				}
			}
			if (msg.id) {
				for (var i = 0; i < this._qsets.length; i++) {
					const pending = this._qsets[i];
					if (pending.key === msg.key && pending.id === msg.id) {
						pending.resolve(msg.value);
						this._qsets.splice(i, 1);
						i--;
					}
				}
			}
			var diff = true;
			if (this._alrdy) {
				var old = this._alrdy.get(msg.key);
				if (old === msg.value) {
					diff = false;
				} else if (typeof old === 'object') {
					if (typeof msg.value === 'object') {
						diff = isDifferent(msg.value, old);
					}
				}
				if (old !== undefined) {
					this._alrdy.delete(msg.key);
					if (this._alrdy.size === 0) {
						this._alrdy = undefined;
					}
				}
			}
			if (diff) {
				this._emit('update', msg.key, msg.value);
			}
			break;

		case 'has':
			for (let i = 0; i < this._qhass.length; i++) {
				var pending = this._qhass[i];
				if (pending.key === msg.key) {
					if (msg.value == undefined) {
						this._undef.add(msg.key);
					} else {
						this._undef.delete(msg.key);
					}
					pending.resolve(msg.value);
					this._qhass.splice(i, 1);
					i--;
				}
			}
			break;

		case 'cmd':
			for (let i = 0; i < this._qcmds.length; i++) {
				const pending = this._qcmds[i];
				if (pending.key === msg.key && pending.id === msg.id) {
					pending.resolve(msg.value);
					this._qcmds.splice(i, 1);
					i--;
				}
			}
			break;

		case 'event':
			if (typeof this.onmessage === 'function') {
				if (msg.encode === 'base64') {
					try {
						msg.value = fromBase64(msg.value);
					} catch {
						return console.error(`SyncTable: ${this._name} invalid base64.`);
					}
				}
				this.onmessage(msg.key, msg.value);
			}
			break;

		case 'error':
			if (msg.key != undefined) {
				if (msg.id) {
					for (let i = 0; i < this._qsets.length; i++) {
						const pending = this._qsets[i];
						if (pending.key === msg.key && pending.id === msg.id) {
							pending.reject(new Error(msg.info));
							this._qsets.splice(i, 1);
							i--;
						}
					}
				} else {
					for (let i = 0; i < this._qgets.length; i++) {
						const pending = this._qgets[i];
						if (pending.key === msg.key) {
							pending.reject(new Error(msg.info));
							this._qgets.splice(i, 1);
							i--;
						}
					}
				}
			} else {
				console.error(`SyncTable: ${this._name} receive error: ${msg.info}`);
				this._emit('error', new Error(msg.info));
			}
			break;

		default:
			console.warn(`SyncTable: ${this._name} receive unknown message: ${msg.event}`);
			break;
		}
	}

	/*
		* Gen id
		*/
	_genid() {
		var id = this._uuid + this._scnt;
		this._scnt++;
		return id;
	}

	/*
		* Build set message
		*/
	_bset(key, value, id) {
		var msg = {
			name: this._name, event: 'set', id, key
		};

		if (value instanceof Uint8Array) {
			msg.encode = 'base64';
			msg.value = toBase64(value);
		} else {
			msg.value = value;
		}
		return msg;
	}

	/*
		* Build get message
		*/
	_bget(key) {
		return {
			name: this._name, event: 'get', key
		};
	}

	/*
		* Build has message
		*/
	_bhas(key) {
		return {
			name: this._name, event: 'has', key
		};
	}

	/*
		* Build sync message
		*/
	_bsync(keys) {
		return {
			name: this._name, event: 'sync', keys
		};
	}

	/*
		* Build fetch message
		*/
	_bcmd(cmd, arg, id) {
		return {
			name: this._name, event: 'cmd', id, key: cmd, value: arg
		};
	}

	/*
		* Build noop message
		*/
	_bnoop() {
		return {
			name: this._name, event: 'noop'
		};
	}

	/*
		* Close
		*/
	close() {
		if (this._cache == undefined) {
			return;
		}

		clients.delete(this._name);
		this.removeAllListeners();
		this._linker.unregister(this._name);
		this._linker.close();

		clearInterval(this._timer);
		delete this._timer;
		delete this._linker;
		delete this._name;
		delete this._cache;
		delete this._undef;

		this._totick(this._qsets, 0);
		this._totick(this._qgets, 0);
		this._totick(this._qhass, 0);
		this._totick(this._qcmds, 0);
	}

	/*
		* SyncTable delete
		*/
	async delete(key) {
		return this.set(key, undefined);
	}

	/*
		* SyncTable set
		*/
	async set(key, value) {
		if (typeof key !== 'string' && typeof key !== 'number') {
			throw new TypeError('Arguments error');
		}

		var msg = this._bset(key, value, this._genid());
		return new Promise((resolve, reject) => {
			if (this._linker.opened) {
				this._linker.send(msg);
			}
			this._qsets.push({
				key, msg, id: msg.id, timeout: 0, resolve, reject
			});
		});
	}

	/*
		* SyncTable get
		*/
	async get(key) {
		if (typeof key !== 'string' && typeof key !== 'number') {
			throw new TypeError('Arguments error');
		}

		return new Promise((resolve, reject) => {
			var value = this._cache.get(key);
			if (value != undefined) {
				resolve(value);
			} else {
				if (this._undef.has(key)) {
					resolve(value);
				} else {
					if (this._linker.opened) {
						this._linker.send(this._bget(key));
					}
					this._qgets.push({ key, timeout: 0, resolve, reject });
				}
			}
		});
	}

	/*
		* SyncTable has
		*/
	async has(key) {
		if (typeof key !== 'string' && typeof key !== 'number') {
			throw new TypeError('Arguments error');
		}

		var msg = this._bhas(key);
		return new Promise((resolve, reject) => {
			var has = this._cache.has(key);
			if (has) {
				resolve(has);
			} else {
				if (this._undef.has(key)) {
					resolve(false);
				} else {
					if (this._linker.opened) {
						this._linker.send(msg);
					}
					this._qhass.push({ key, msg, timeout: 0, resolve, reject });
				}
			}
		});
	}

	/*
		* SyncTable fetch
		*/
	async fetch(cmd, arg, delay = false) {
		if (typeof cmd !== 'string') {
			throw new TypeError('Arguments error');
		}

		var msg = this._bcmd(cmd, arg, this._genid());
		return new Promise((resolve, reject) => {
			if (this._linker.opened) {
				this._linker.send(msg);
				this._qcmds.push({
					key: cmd, id: msg.id, sended: true, timeout: 0, resolve, reject
				});
			} else if (delay) {
				this._qcmds.push({
					key: cmd, msg, id: msg.id, timeout: 0, resolve, reject
				});
			} else {
				reject(new Error('No connection'));
			}
		});
	}

	/*
		* Get table name
		*/
	get name() {
		return this._name;
	}
}

SyncTable.Object = { isDifferent };
SyncTable.SyncTable = SyncTable;

module.exports = SyncTable;
