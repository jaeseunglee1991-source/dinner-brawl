const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { pool, initDB } = require('./src/config/db'); // 1. DB 모듈 불러오기
const socketHandler = require('./src/socket/handler'); // 2. 소켓 모듈 불러오기

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

initDB(); // DB 초기화 실행

const rooms = {}; // 전역 방 데이터 [cite: 8]

// 소켓 핸들러에 필요한 객체들 전달
socketHandler(io, pool, rooms);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`서버 실행 중... 포트: ${PORT}`)); [cite: 88]
