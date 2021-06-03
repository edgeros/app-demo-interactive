# Socket.io 示例

## 安装导入
+ 前端引入 `vue.js` 和 `socket.io ` 。
```html
<!-- 引入vue-->
<script src="./vue/vue.min.js"></script>
<!-- 引入socketio client-->
<script src="./socketio/socket.io.js"></script>
```
Socket.io 客户端参考：【[Socket.IO](https://socket.io/docs/v4#What-Socket-IO-is)】。
Socket.io 客户端获取： 【[Socket.io-client 下载](https://github.com/socketio/socket.io-client/blob/master/dist/socket.io.min.js)】。

+ 后端导入：
```javascript
var io = require('socket.io');
```
**注意**：`JSRE` 目前支持的 `socket.io` 是 v2.2 版本，`socket.io-client` 需要安装 v2.x 版本。

## 创建 Socket.io 连接
前端创建连接:
```javascript
const auth = {
	'edger-token': this.token,
	'edger-srand': this.srand
};
this.socket = io({
	query: auth
});
```

后端创建服务，并监听已连接事件：
```javascript
var socketio = io(
	app, {
		serveClient: false,
		pingInterval: 10000,
		pingTimeout: 5000
	}
);
```

参数说明:
- `app` 要绑定的服务器；
- `serveClient` 是否提供客户端文件；
- `pingTimeout` 没有pong数据包需要多少毫秒才能认为连接已关闭（`60000`）；
- `pingInterval` 发送新的ping数据包（`25000`）前需要多少毫秒；

## 监听 Socket.io 已连接上事件
前端监听此事件是为了能初始化页面上的一些操作，以及 `Socket.io` 开发者自定义的一些事件。
```javascript
this.socket.on('connect', () => {
	console.log('已连接！');
});
```

后端已连接事件,可以在回调函数中初始化一些`sockio`自定义事件：
```javascript
socketio.on('connection', function(sockio) {
	// ...
});
```

## 收发消息
前端可以使用 `socket.emit()` 方法向后端发送消息如下，`emit` 函数 `arg1` 是事件名称，与服务端对应，必填。`arg2` 为向服务端发送的数据，根据需要填充。`arg3` 为对服务端返回数据的操作，服务端有返回则需要，无返回不需要。
```javascript
send: function() {
	this.socket.emit('message', this.message, (response) => {
		this.response = response;
	});
}
```

后端监听事件接收消息，`sockio.on()` 参数与前端程序参数保持对应。
```javascript
socketio.on('connection', function(sockio) {
	sockio.on('message', (msg, callback) => {
		callback(`server: ${msg}`);
	});
});
```