const socket = io();
window.myUserId = ""; 
window.myNickname = ""; 
window.isAdmin = false;
window.myRoomId = "";
window.playersData = [];
window.entities = {}; // 3D 엔진과 UI가 공유할 캐릭터 데이터 [cite: 199]
