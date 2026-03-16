// public/js/global.js
const socket = io();
var myUserId = "", myNickname = "", isAdmin = false;
var myRoomId = "", selectedRoomId = "", selectedRoomRequiresPw = false;
var playersData = [];
var initialRouteHandled = false;

const affinityEmoji = { 'SPICY':'🌶️', 'GREASY':'🍗', 'FRESH':'🥗', 'SALTY':'🧂', 'SWEET':'🍰', 'MINT_CHOCO':'🌿', 'PINEAPPLE':'🍍' };

// 3D 엔진과 UI가 실시간으로 공유할 데이터
var entities = {};
var meshMap = {};
