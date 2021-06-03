# WebSyncTable 示例

## 安装导入
前端通过 `script` 标签引入 `vue.js` 和 `WebSyncTable`：
```html
<!-- 引入vue-->
<script src="./vue/vue.min.js"></script>
<!-- 引入webSyncTable-->
<script src="./synctable/synctable.min.js"></script>
```

后端引入`SyncTable` 和 `WebSyncTable`：
+ `SyncTable` 用于创建本地同步表。
+ `WebSyncTable` 用于客户端服务端的表同步。

```javascript
var WebSyncTable = require('websynctable');
var SyncTable = require('synctable');
```

## 创建同步表
前端获取协议类型拼接服务端访问地址,创建一个名为 `table1` 的表：
```javascript
var proto = location.protocol === 'http:' ? 'ws:' : 'wss:';
var server = `${proto}//${window.location.host}`;
const auth = {
	'edger-token': this.token,
	'edger-srand': this.srand
};
this.table = new SyncTable(server, 'table1', auth);
```

后端同步创建，先创建一个与客户端相同的 `SyncTable` , 然后通过创建 `WebSyncTable` 同步前后端的表：
```javascript
var table = new SyncTable('table1');
// Create SyncTable server
var server = new WebSyncTable(app, table);
```

## 添加变量
前端可通过 `table.set()` 方法向表中设置属性，会自动同步后端：
```javascript
this.table.set(this.key, this.value).then(v => {
	console.log('ok');
}).catch(e => {
	console.error('set error!');
});
```
后端会自动同步数据，服务也会有一份相同的数据。

## 获取变量
此方法会优先从本地表中拿数据，所以不会去请求后端，这样可以节省网络资源。
```javascript
this.table.get(this.key).then(value => {
	console.log('k1 value is:', value);
	this.value = value;
}).catch(error => {
	console.error('get k1 value error!');
});
```