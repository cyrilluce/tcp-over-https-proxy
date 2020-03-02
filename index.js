#!/usr/bin/env node
// @ts-check
const url = require("url");
const net = require("net");
const readline = require("readline");

// 通过http proxy建立tcp连接
function connectByHttpsProxy(address, proxy) {
  return clientSocket => {
    const seqId = Math.random()
      .toString(36)
      .slice(2);
    function log(...rest) {
      console.log(`${new Date().toLocaleString()} [${seqId}]`, ...rest);
    }
    const proxyConfig = url.parse(proxy);
    // 连接代理服务器，发出CONNECT请求
    // log(`socket connect in`, proxyConfig)
    const proxySocket = net.createConnection({
      host: proxyConfig.hostname,
      port: +proxyConfig.port
    });
    // 等待连接建立
    const rl = readline.createInterface({
      input: proxySocket,
      terminal: false
    });
    // 读取连接建立成功http头
    const lines = [];
    rl.on("line", function(line) {
      //   log('socket proxy response line: ', line)
      lines.push(line);
      // 解析第一行http状态码
      if (lines.length === 1) {
        const result = line.match(/^HTTP\/([\d\.]+) (\d+) ([\s\S ]+)$/);
        const [, , code] = result || [, , "500"];
        // 非2xx状态，表示错误
        if (!/^2\d\d$/.test(code)) {
          rl.close();
          clientSocket.end();
          return;
        }
      }

      if (!line && lines.length > 1) {
        // 空行，连续两个换行，结束，并转交
        rl.close();
        log(`${address} socket connection established`);
        clientSocket.pipe(proxySocket).pipe(clientSocket);
      }
    });

    // 发送请求
    proxySocket.write(`CONNECT ${address} HTTP/1.1\r\n\r\n`);
    log(`${address} socket send CONNECT to proxy`);

    clientSocket
      .on("error", () => {
        log("socket error");
      })
      .on("close", () => {
        log("socket close");
      });
  };
}

function createTcpTunnel(targetAddress, localPort, proxy) {
  net
    .createServer(connectByHttpsProxy(targetAddress, proxy))
    .listen(localPort, () => {
      console.log(
        `LOCALHOST:${localPort} -> ${targetAddress},  PROXY: ${proxy}`
      );
    });
}

async function main() {
  const [, , targetAddress = "", localPort = 8888, proxy = ""] = process.argv;

  if (!targetAddress || !proxy) {
    return console.warn(
      "Usage: tcp-over-https-proxy remoteHost:remotePort localPort httpsProxy"
    );
  }

  createTcpTunnel(targetAddress, localPort, proxy);
}

exports.connectByHttpsProxy = connectByHttpsProxy;
exports.createTcpTunnel = createTcpTunnel;

function isEntryPoint() {
  return require.main === module;
}

if (isEntryPoint()) {
  main().catch(console.error);
}
