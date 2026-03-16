// public/js/global.js
const socket = io();
var myUserId = "", myNickname = "", isAdmin = false;
var myRoomId = "", selectedRoomId = "", selectedRoomRequiresPw = false;
var playersData = [];
var initialRouteHandled = false;

const affinityEmoji = { 'SPICY':'🌶️', 'GREASY':'🍗', 'FRESH':'🥗', 'SALTY':'🧂', 'SWEET':'🍰', 'MINT_CHOCO':'🌿', 'PINEAPPLE':'🍍' };

var entities = {};
var meshMap = {};
var canvas, scene, camera, renderer, mainLight;
var environmentGroup;
var currentThemeRoom = null;

// 📼 리플레이 전용 상태 변수
var isReplaying = false;
var replayTimeouts = [];
