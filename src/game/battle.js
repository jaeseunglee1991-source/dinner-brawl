const { AFFINITIES, SKILLS, JOBS, GRADES } = require('../data/constants');

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rollStat = () => ({ hp: random(10, 25), atk: random(4, 9) });

// 기존 generateDeck, calculateAttack 함수 전체 복사 [cite: 15, 45, 46, 72]

module.exports = { generateDeck, calculateAttack, getRandomItem };
