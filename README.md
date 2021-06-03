# 前后端交互
`EedgerOS` 支持多种前后端交互技术：

+ `RESTFul`: `JSRE` 应用框架支持的基本交互方式，参考 `API` 手册：【Application Framework/App】。
+ `Websocket`:  `HTML5` 开始提供的一种在单个连接上进行全双工通讯的协议， 参考 `API` 手册：【Websocket】。
+ `Socket.io`:  基于 `RESTFul` 与 `Websocket` 实现的可以实现实时、双向和基于事件的通信，参考 `API` 手册：【Socketio】。
+ `WebSyncTable`: 用于多任务处理 `SyncTable` 对象的服务器。 该服务使用 `WebSocket` 与 `Web` 通信，参考 `API`手册：【WebSyncTable】。

在进行 `EedgerOS` 前后端交互时，需要使用 `EedgerOS` 安全接口，前端 引入 `@edgeros/web-sdk` 包， 前端交互接口一般需要加入 `token` 、`srand` 字段， 关于 `EedgerOS` 安全机制参考 `API` 手册 【SDK/Security】。

本章所涉及示例代码在 `eap-demo-interactive` 工程中，工程地址：【 https://gitee.com/edgeros/eap-demo-interactive.git 】或 【 https://github.com/edgeros/eap-demo-interactive.git 】。

【[RESTFul](./doc/RESTFul.md)】
【[Socket.io](./doc/Socket.io.md)】
【[WebSyncTable](./doc/WebSyncTable.md)】

