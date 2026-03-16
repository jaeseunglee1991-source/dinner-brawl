// src/data/constants.js
const AFFINITIES = ['SPICY', 'GREASY', 'FRESH', 'SALTY', 'SWEET', 'MINT_CHOCO', 'PINEAPPLE'];

const SKILLS = [
    { name: 'CRITICAL', desc: '50% 확률로 2배 피해' }, { name: 'LIFESTEAL', desc: '입힌 피해의 50% 회복' },
    { name: 'DOUBLE_ATTACK', desc: '30% 확률로 한 번 더 타격' }, { name: 'GIANT_KILLER', desc: '체력 높은 적에게 1.5배 피해' },
    { name: 'FRENZY', desc: '공격할 때마다 영구적으로 공격력 +2' }, { name: 'IRON_FIST', desc: '무조건 최소 10 데미지 보장' },
    { name: 'SNIPER', desc: '20% 확률로 3배의 치명타 피해' }, { name: 'VAMPIRE', desc: '입힌 피해의 100% 흡혈' },
    { name: 'BULLY', desc: '체력 낮은 적에게 1.5배 피해' }, { name: 'BERSERKER', desc: '내 체력이 50% 이하일 때 데미지 2배' },
    { name: 'TANK', desc: '시작 시 최대 체력 +20' }, { name: 'SWORD_MASTER', desc: '시작 시 기본 공격력 +5' },
    { name: 'NINJA', desc: '적의 공격을 30% 확률로 회피' }, { name: 'SHIELD', desc: '받는 모든 피해 절반 감소' },
    { name: 'HEALER', desc: '공격 시 아군 1명 체력 5 회복' }, { name: 'LUCKY', desc: '77% 확률로 +7 추가 데미지' },
    { name: 'GUARDIAN', desc: '15% 확률로 적의 공격 완벽 방어' }, { name: 'COMBO', desc: '공격할 때마다 데미지 +1 영구 증가' },
    { name: 'MAGICIAN', desc: '20% 확률로 방어무시 20 피해' }, { name: 'PHOENIX', desc: '사망 시 1회 한정 HP 1로 부활' },
    { name: 'CLUMSY', desc: '30% 확률로 공격 빗나감' }, { name: 'KAMIKAZE', desc: '10% 확률로 자폭 (적 30 피해, 본인 즉사)' },
    { name: 'WEAK', desc: '시작 시 최대 체력 -10' }, { name: 'SOFT_PUNCH', desc: '시작 시 기본 공격력 반토막' },
    { name: 'ALLERGY', desc: '공격할 때마다 자신도 3 피해 입음' }, { name: 'COWARD', desc: '20% 확률로 공격 포기' },
    { name: 'CURSED', desc: '받는 모든 피해가 1.5배 증가' }, { name: 'LAZY', desc: '50% 확률로 턴 건너뜀' },
    { name: 'BLIND', desc: '50% 확률로 공격 빗나감' }, { name: 'PAPER_SHIELD', desc: '받는 모든 피해 +5 증가' }
];

// ⏱️ 직업 특성 세분화 (atkSpeed: 공격 쿨다운 ms 단위)
// 마법사(2600ms, 공+30), 도적/암살자(800ms, 공+0), 전사(1500ms) 등
const JOBS = [
    { name: '전사', hpBonus: 20, atkBonus: 5, maxMp: 20, atkSpeed: 1500 }, 
    { name: '마법사', hpBonus: -10, atkBonus: 30, maxMp: 100, atkSpeed: 2600 },
    { name: '도적', hpBonus: 0, atkBonus: 0, maxMp: 40, atkSpeed: 800 }, 
    { name: '탱커', hpBonus: 60, atkBonus: -5, maxMp: 10, atkSpeed: 2200 },
    { name: '사제', hpBonus: 10, atkBonus: 2, maxMp: 80, atkSpeed: 2400 }, 
    { name: '궁수', hpBonus: -5, atkBonus: 10, maxMp: 30, atkSpeed: 1200 },
    { name: '버서커', hpBonus: -15, atkBonus: 20, maxMp: 50, atkSpeed: 1800 }, 
    { name: '팔라딘', hpBonus: 40, atkBonus: 3, maxMp: 40, atkSpeed: 1600 },
    { name: '암살자', hpBonus: -10, atkBonus: 12, maxMp: 30, atkSpeed: 900 }, 
    { name: '요리사', hpBonus: 15, atkBonus: 2, maxMp: 20, atkSpeed: 1400 }
];

const GRADES = [
    { name: '신화', multi: 3.0, color: '#e74c3c', prob: 1 },
    { name: '전설', multi: 2.0, color: '#f1c40f', prob: 5 },
    { name: '영웅', multi: 1.5, color: '#9b59b6', prob: 10 },
    { name: '희귀', multi: 1.2, color: '#3498db', prob: 20 },
    { name: '일반', multi: 1.0, color: '#bdc3c7', prob: 64 }
];

module.exports = { AFFINITIES, SKILLS, JOBS, GRADES };
