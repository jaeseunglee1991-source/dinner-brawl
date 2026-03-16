const socket = io();
var myUserId = "", myNickname = "", isAdmin = false;
var myRoomId = "", selectedRoomId = "", selectedRoomRequiresPw = false;
var playersData = [];
var initialRouteHandled = false;

const affinityEmoji = { 'SPICY':'🌶️', 'GREASY':'🍗', 'FRESH':'🥗', 'SALTY':'🧂', 'SWEET':'🍰', 'MINT_CHOCO':'🌿', 'PINEAPPLE':'🍍' };

// 3D 엔진과 UI가 실시간으로 공유할 전역 변수
var entities = {};
var meshMap = {};
var canvas, scene, camera, renderer, mainLight;
var environmentGroup;
var currentThemeRoom = null;
