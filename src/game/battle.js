// src/game/battle.js
const { AFFINITIES, SKILLS, JOBS, GRADES } = require('../data/constants');

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ⏳ 30초 이상의 전투를 위해 기본 체력(HP)을 기존 10~25에서 대폭 상향!
const rollStat = () => ({ hp: random(250, 450), atk: random(4, 9) });

function generateDeck(playerName, menus) {
    let deck = [];
    const getId = () => Math.random().toString(36).substr(2, 9);
    
    const applyStartStats = (card) => {
        const has = (sk) => card.skills.some(s => s.name === sk);
        // 고정 수치 스킬들도 체력 뻥튀기에 맞춰 스케일업
        if (has('TANK')) card.maxHp += 200; 
        if (has('WEAK')) card.maxHp -= 100;
        if (has('SWORD_MASTER')) card.atk += 5;
        if (has('SOFT_PUNCH')) card.atk = Math.max(1, Math.floor(card.atk / 2));
        card.hp = card.maxHp; 
        if (card.hp <= 0) { card.hp = 1; card.maxHp = 1; }
        if (has('PHOENIX')) card.revived = false; 
        return card;
    };

    menus.forEach(menu => {
        let job = getRandomItem(JOBS);
        let grade = getRandomItem(GRADES);
        let baseHp = rollStat().hp;
        let baseAtk = rollStat().atk;

        deck.push(applyStartStats({ 
            id: getId(), menu: menu, owner: playerName, 
            grade: grade.name, gradeColor: grade.color, job: job.name,
            maxHp: Math.floor(baseHp * grade.multi) + job.hpBonus, 
            atk: Math.floor(baseAtk * grade.multi) + job.atkBonus,
            maxMp: job.maxMp, mp: job.maxMp, affinity: getRandomItem(AFFINITIES), 
            skills: [getRandomItem(SKILLS)], isAlive: true 
        }));
    });
    return deck;
}

function calculateAttack(attacker, target, allAliveCards, io) {
    let damage = attacker.atk;
    let attackerDamage = 0, heal = 0, allyHealId = null;
    let msg = `[${attacker.menu}] ⚔️ [${target.menu}]`; let isCrit = false;
    
    if (attacker.mp >= 5) { attacker.mp -= 5; }

    const has = (card, sk) => card.skills.some(s => s.name === sk);
    const isSpec = (aff) => aff === 'MINT_CHOCO' || aff === 'PINEAPPLE';
    
    if (has(attacker, 'COWARD') && Math.random() < 0.2) return { attackerId: attacker.id, targetId: target.id, damage: 0, msg: msg + " (겁먹음!)" };
    if (has(attacker, 'LAZY') && Math.random() < 0.5) return { attackerId: attacker.id, targetId: target.id, damage: 0, msg: msg + " (턴 스킵)" };
    if (has(target, 'NINJA') && Math.random() < 0.3) return { attackerId: attacker.id, targetId: target.id, damage: 0, msg: msg + " (회피!)" };
    if (has(target, 'GUARDIAN') && Math.random() < 0.15) return { attackerId: attacker.id, targetId: target.id, damage: 0, msg: msg + " (완벽방어)" };
    if ((has(attacker, 'CLUMSY') && Math.random() < 0.3) || (has(attacker, 'BLIND') && Math.random() < 0.5)) return { attackerId: attacker.id, targetId: target.id, damage: 0, msg: msg + " (빗나감!)" };
    
    if (isSpec(attacker.affinity) && isSpec(target.affinity) && attacker.affinity !== target.affinity) { damage = 9999; attackerDamage = 9999; msg += ` 💥세계관 붕괴💥`; } 
    else if (isSpec(attacker.affinity) && !isSpec(target.affinity)) { damage *= 2; msg += ` (특수 압도)`; } 
    else { 
        const basicWin = { 'SPICY':'GREASY', 'GREASY':'FRESH', 'FRESH':'SALTY', 'SALTY':'SWEET', 'SWEET':'SPICY' };
        if (basicWin[attacker.affinity] === target.affinity) { damage = Math.floor(damage * 1.5); msg += ` (상성 우위)`; } 
    }

    if (has(attacker, 'BERSERKER') && attacker.hp <= attacker.maxHp / 2) damage *= 2;
    if (has(attacker, 'BULLY') && target.hp < attacker.hp) damage = Math.floor(damage * 1.5);
    if (has(attacker, 'GIANT_KILLER') && target.hp > attacker.hp) damage = Math.floor(damage * 1.5);
    if (has(attacker, 'MAGICIAN') && Math.random() < 0.2) { damage = 50; msg += ` (마법 피해)`; } // 스케일업
    if (has(attacker, 'LUCKY') && Math.random() < 0.77) damage += 30; // 스케일업
    if (has(attacker, 'SNIPER') && Math.random() < 0.2) { damage *= 3; isCrit = true; } 
    else if (has(attacker, 'CRITICAL') && Math.random() < 0.5) { damage *= 2; isCrit = true; }
    
    if (has(attacker, 'IRON_FIST') && damage < 20) damage = 20;
    if (has(target, 'SHIELD')) damage = Math.floor(damage / 2);
    if (has(target, 'CURSED')) damage = Math.floor(damage * 1.5);
    if (has(target, 'PAPER_SHIELD')) damage += 15;
    
    if (has(attacker, 'LIFESTEAL')) heal = Math.floor(damage / 2);
    if (has(attacker, 'VAMPIRE')) heal = damage;
    if (has(attacker, 'KAMIKAZE') && Math.random() < 0.1) { damage += 150; attackerDamage = 9999; msg += ` 자폭!`; } // 스케일업
    if (has(attacker, 'ALLERGY')) attackerDamage += 10;
    if (has(attacker, 'FRENZY')) attacker.atk += 2;
    if (has(attacker, 'COMBO')) attacker.atk += 1;
    
    if (has(attacker, 'HEALER')) { 
        let allies = allAliveCards.filter(c => c.owner === attacker.owner && c.id !== attacker.id);
        if(allies.length > 0) allyHealId = getRandomItem(allies).id; 
    }
    if (has(attacker, 'DOUBLE_ATTACK') && Math.random() < 0.3) damage *= 2;
    
    // 리플레이와 충돌 방지를 위해 서버 콘솔에는 찍지만 소켓 통신은 handler.js에서 일괄 처리
    return { attackerId: attacker.id, targetId: target.id, damage, attackerDamage, heal, allyHealId, isCrit, msg };
}

module.exports = { generateDeck, calculateAttack, getRandomItem };
