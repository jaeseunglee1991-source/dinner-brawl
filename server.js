// server.js (최상위 루트 폴더)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// 1. 우리가 분리해둔 모듈들 불러오기
const { pool, initDB } = require('./src/config/db'); 
const socketHandler = require('./src/socket/handler'); 

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 정적 파일(public 폴더) 서빙
app.use(express.static('public'));

// 2. DB 초기화 실행
initDB();

// 3. 전역 방(Room) 데이터 관리 객체
const rooms = {};

// 4. 분리된 소켓 로직 실행 (io, DB연결, 방 데이터를 넘겨줌)
socketHandler(io, pool, rooms);

// 5. 서버 포트 오픈
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 서버 실행 중... 포트: ${PORT}`));
