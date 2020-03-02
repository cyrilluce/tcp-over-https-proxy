# tcp-over-https-proxy

Use https proxy create tcp tunnel, forward local port to server behind proxy.

## Usage

### cli

Install

```
npm i -g tcp-over-https-proxy
```

Establish port forwarding

```
#tcp-over-https-proxy remoteHost:remotePort localPort httpsProxy
tcp-over-https-proxy 10.0.0.111:3306 3306 http://123.123.123.123:8080

# map 10.0.0.111:3306 to localhost:3306 via https proxy http://123.123.123.123:8080
```

### lib

Install

```
npm i tcp-over-https-proxy
```

Use

```javascript
const { createTcpTunnel } = require("tcp-over-https-proxy");

createTcpTunnel("10.0.0.111:3306", 3306, "http://123.123.123.123:8080");
```
