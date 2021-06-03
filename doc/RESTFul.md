# RESTFul 示例
`EdgerOS` 后端程序基于 `RESTFul` 风格的 `Web` 应用程序框架构建的， 支持 `GET`, `POST`, `DELETE`, `HEAD`, `PUT` 等 `RESTFul` 各种请求方法。

## 安装导入
前端技术众多，开发者可根据自己意愿安装相应的 `HTTP` 插件，本教程目前采用的是 `Vue`  的 `Axios` 插件，通过 `<script>` 标签引入静态 `js` 文件， 如下：
```html
<!--引入vue.js-->
<script src="./vue/vue.min.js"></script>
<!--引入vue.js axios插件-->
<script src="./vue/axios.min.js"></script>
```

## GET 请求
下面程序是一个查询用户信息列表的简单例子：
```javascript
getUsers: function () {
    const auth = {
        'edger-token': this.token,
        'edger-srand': this.srand
    };
    axios
    .get('/api/user', {}, {headers: auth})
    .then(res =>{
        console.log(res.body);
    })
    .catch(function (error) {
        console.log(error);
    });
}
```

后端处理 `get` 请求：
```javascript
router.get('/api/user', function(req, res) {
	res.json(
		{
			result: true,
			message: 'success',
			data: users
		}
	);
});
```

## POST 请求
前端通过 `post` 请求，提交用户填写的个人信息：
```javascript
addUser: function () {
 	const auth = {
        'edger-token': this.token,
        'edger-srand': this.srand
    };
    axios
    .post('/api/user', { name: this.name, phone: this.phone }, {headers: auth})
    .then(res => {
        console.log(res.body);
    })
    .catch(function (error) {
        console.log(error);
    });
}
```

后端处理 `post` 请求：
```json
router.post('/api/user', function(req, res) {
	// 数据库或其他操作
	res.json({
		result: true,
		message: 'success'
	});
});
```
