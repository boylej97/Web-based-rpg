// Game Data
const character = {
  class: null,
  level: 1,
  health: 100,
  maxHealth: 100,
  mana: 50,
  maxMana: 50,
  attack: 10,
  xp: 0,
  xpNeeded: 100,
  gold: 0,
  potions: 0,
  herbs: 0,
  dungeonFloor: 1,
  equipment: { weapon: null, armor: null },
  statusEffects: [],
  achievements: [],
  enemiesDefeated: 0
};

const enemies = [
  { name: "Goblin", health: 50, attack: 5, herbs: 1, gold: 5 },
  { name: "Orc", health: 80, attack: 10, herbs: 2, gold: 10 },
  { name: "Dragon", health: 150, attack: 20, herbs: 5, gold: 50 }
];

const achievements = [
  { id: 1, name: "First Blood", check: c => c.enemiesDefeated >= 1 },
  { id: 2, name: "Novice Warrior", check: c => c.enemiesDefeated >= 5 },
  { id: 3, name: "Master Adventurer", check: c => c.level >= 5 }
];

let currentEnemy = null;

// DOM Elements
const classSelectionDiv = document.getElementById("class-selection");
const characterClassSpan = document.getElementById("character-class");
const characterLevelSpan = document.getElementById("character-level");
const characterHealthSpan = document.getElementById("character-health");
const characterMaxHealthSpan = document.getElementById("character-max-health");
const characterManaSpan = document.getElementById("character-mana");
const characterGoldSpan = document.getElementById("character-gold");
const enemyNameSpan = document.getElementById("enemy-name");
const enemyHealthSpan = document.getElementById("enemy-health");
const potionsCountSpan = document.getElementById("potions-count");
const herbCountSpan = document.getElementById("herb-count");
const gameLogDiv = document.getElementById("game-log");

// Initialize Game
document.querySelectorAll('.class-button').forEach(button => {
  button.addEventListener('click', (e) => {
    character.class = e.target.dataset.class;
    classSelectionDiv.style.display = 'none';
    initializeClassSkills(character.class);
    spawnNewEnemy();
    updateUI();
    gameLog(`You became a ${character.class}!`);
    document.body.classList.add('class-selected');
  });
});

// Core Game Functions
function spawnNewEnemy() {
  const floorMultiplier = 1 + (character.dungeonFloor * 0.15);
  const baseEnemy = {...enemies[Math.floor(Math.random() * enemies.length)]};
  
  currentEnemy = {
    ...baseEnemy,
    maxHealth: Math.floor(baseEnemy.health * floorMultiplier),
    health: Math.floor(baseEnemy.health * floorMultiplier),
    attack: Math.floor(baseEnemy.attack * floorMultiplier),
    gold: Math.floor(baseEnemy.gold * floorMultiplier),
    herbs: Math.floor(baseEnemy.herbs * floorMultiplier)
  };
  
  updateUI();
  animateEnemyAppearance();
  gameLog(`A ${currentEnemy.name} appears!`);
}

function animateEnemyAppearance() {
  const enemyCard = document.querySelector('.enemy-card');
  enemyCard.style.animation = 'none';
  enemyCard.offsetHeight; // Trigger reflow
  enemyCard.style.animation = 'slideIn 0.5s ease-out';
}

function attack() {
  const baseDamage = character.attack + (character.equipment.weapon?.attack || 0);
  const damage = Math.floor(baseDamage * (Math.random() * 0.3 + 0.85));
  
  currentEnemy.health -= damage;
  gameLog(`You attacked ${currentEnemy.name} for ${damage} damage!`);
  animateDamageEffect('#enemy-health-bar');

  if (currentEnemy.health <= 0) {
    handleEnemyDefeat();
  } else {
    enemyAttack();
  }
  updateUI();
}

document.getElementById("attack-button").addEventListener("click", attack);

function enemyAttack() {
  const baseDamage = currentEnemy.attack;
  const armorReduction = character.equipment.armor?.defense || 0;
  const damage = Math.max(
    Math.floor(baseDamage * (Math.random() * 0.3 + 0.7)) - armorReduction,
    1
  );
  
  character.health -= damage;
  gameLog(`${currentEnemy.name} attacked you for ${damage} damage!`);
  animateDamageEffect('#character-health-bar');

  if (character.health <= 0) {
    gameLog("Game Over! Refresh to restart.");
    resetGame();
  }
  updateUI();
}

function animateDamageEffect(selector) {
  const element = document.querySelector(selector);
  element.classList.add('damage-pulse');
  setTimeout(() => element.classList.remove('damage-pulse'), 300);
}

function handleEnemyDefeat() {
  const xpGained = currentEnemy.maxHealth;
  character.xp += xpGained;
  character.gold += currentEnemy.gold;
  character.herbs += currentEnemy.herbs;
  character.enemiesDefeated++;
  
  gameLog(`Defeated ${currentEnemy.name}! Gained ${xpGained} XP, ${currentEnemy.gold} gold, ${currentEnemy.herbs} herbs.`);
  
  checkLevelUp();
  checkAchievements();
  updateDungeonDifficulty();
  spawnNewEnemy();
}

// Progression System
function checkLevelUp() {
  while (character.xp >= character.xpNeeded) {
    const excessXP = character.xp - character.xpNeeded;
    
    character.level++;
    character.maxHealth += 20;
    character.maxMana += 10;
    character.attack += 5;
    character.health = character.maxHealth; // Full heal on level up
    character.mana = character.maxMana;
    character.xp = excessXP;
    character.xpNeeded = Math.floor(character.xpNeeded * 1.5);
    
    gameLog(`Level up! Now level ${character.level}!`);
    document.getElementById('character-max-health').classList.add('glow-text');
    setTimeout(() => {
      document.getElementById('character-max-health').classList.remove('glow-text');
    }, 1000);
    updateUI();
  }
}

function updateDungeonDifficulty() {
  if (character.enemiesDefeated % 5 === 0) {
    character.dungeonFloor++;
    gameLog(`Advanced to dungeon floor ${character.dungeonFloor}!`);
    document.getElementById("dungeon-floor").textContent = character.dungeonFloor;
  }
}

// Class System
function initializeClassSkills(className) {
  const skillsDiv = document.getElementById("skills");
  skillsDiv.innerHTML = `<h3>Class Skills</h3>`;

  const skills = {
    warrior: [{ name: "Power Strike", cost: 10, action: warriorStrike }],
    mage: [{ name: "Fireball", cost: 20, action: fireball }],
    rogue: [{ name: "Backstab", cost: 15, action: backstab }]
  };

  const classSkills = skills[className] || [];
  classSkills.forEach(skill => {
    const button = document.createElement("button");
    button.className = 'button button-magic';
    button.textContent = `${skill.name} (${skill.cost} Mana)`;
    button.addEventListener("click", () => useSkill(skill));
    skillsDiv.appendChild(button);
  });
}

function useSkill(skill) {
  if (character.mana >= skill.cost) {
    character.mana -= skill.cost;
    skill.action();
    
    if (currentEnemy.health > 0) {
      enemyAttack();
    } else {
      handleEnemyDefeat();
    }
    
    updateUI();
  } else {
    gameLog("Not enough mana!");
  }
}

// Class Skills
function warriorStrike() {
  const damage = Math.floor((character.attack + 10) * 1.5);
  currentEnemy.health -= damage;
  gameLog(`Power Strike dealt ${damage} damage!`);
}

function fireball() {
  const damage = Math.floor((character.attack + 5) * 2);
  currentEnemy.health -= damage;
  gameLog(`Fireball burned for ${damage} damage!`);
}

function backstab() {
  const damage = Math.floor((character.attack + 15) * (Math.random() * 0.5 + 1));
  currentEnemy.health -= damage;
  gameLog(`Backstab crit for ${damage} damage!`);
}

// Inventory System
document.getElementById("use-potion").addEventListener("click", () => {
  if (character.potions > 0) {
    character.health = Math.min(character.health + 30, character.maxHealth);
    character.potions--;
    gameLog("Used potion (+30 HP)!");
    updateUI();
    animateHealEffect();
  } else {
    gameLog("No potions left!");
  }
});

function animateHealEffect() {
  const healthBar = document.getElementById('character-health-bar');
  healthBar.style.animation = 'healPulse 0.5s';
  setTimeout(() => healthBar.style.animation = '', 500);
}

document.getElementById("craft-potion").addEventListener("click", () => {
  if (character.herbs >= 3) {
    character.herbs -= 3;
    character.potions++;
    gameLog("Crafted 1 potion!");
    updateUI();
  } else {
    gameLog("Need 3 herbs to craft!");
  }
});

// Shop System
document.getElementById("buy-potion").addEventListener("click", () => {
  if (character.gold >= 10) {
    character.gold -= 10;
    character.potions++;
    gameLog("Bought 1 potion!");
    updateUI();
  } else {
    gameLog("Need 10 gold!");
  }
});

document.getElementById("buy-sword").addEventListener("click", () => {
  if (character.gold >= 50) {
    character.gold -= 50;
    character.equipment.weapon = { name: "Steel Sword", attack: 8 };
    gameLog("Equipped Steel Sword (+8 attack)!");
    updateUI();
  } else {
    gameLog("Need 50 gold!");
  }
});

// Save/Load System
document.getElementById("save-button").addEventListener("click", () => {
  const saveData = {
    character: character,
    currentEnemy: currentEnemy
  };
  localStorage.setItem("rpgSave", JSON.stringify(saveData));
  gameLog("Game saved!");
  animateSaveButton();
});

function animateSaveButton() {
  const saveBtn = document.getElementById('save-button');
  saveBtn.classList.add('pulse-animation');
  setTimeout(() => saveBtn.classList.remove('pulse-animation'), 1000);
}

document.getElementById("load-button").addEventListener("click", () => {
  try {
    const savedData = JSON.parse(localStorage.getItem("rpgSave"));
    if (savedData?.character && savedData?.currentEnemy) {
      Object.assign(character, savedData.character);
      currentEnemy = savedData.currentEnemy;
      gameLog("Game loaded!");
      updateUI();
      initializeClassSkills(character.class);
      classSelectionDiv.style.display = 'none';
    } else {
      gameLog("No save file found!");
    }
  } catch (e) {
    gameLog("Corrupted save file!");
  }
});

// Achievements
function checkAchievements() {
  achievements.forEach(achievement => {
    if (!character.achievements.includes(achievement.id) && 
        achievement.check(character)) {
      character.achievements.push(achievement.id);
      const achievementList = document.getElementById("achievement-list");
      
      if (!achievementList.querySelector('.achievement-badge')) {
        achievementList.innerHTML = '';
      }
      
      const badge = document.createElement('div');
      badge.className = 'achievement-badge slide-in';
      badge.textContent = achievement.name;
      achievementList.appendChild(badge);
      gameLog(`Achievement Unlocked: ${achievement.name}!`);
    }
  });
}

// UI Functions
function updateUI() {
  // Character Stats
  characterClassSpan.textContent = character.class || "None";
  characterLevelSpan.textContent = character.level;
  characterHealthSpan.textContent = character.health;
  characterMaxHealthSpan.textContent = character.maxHealth;
  characterManaSpan.textContent = character.mana;
  characterGoldSpan.textContent = character.gold;
  
  // Health Bars
  updateHealthBar('#character-health-bar', character.health, character.maxHealth);
  if (currentEnemy) {
    updateHealthBar('#enemy-health-bar', currentEnemy.health, currentEnemy.maxHealth);
  }

  // XP Display
  document.getElementById("xp-bar").textContent = 
    `${character.xp}/${character.xpNeeded} XP`;
  
  // Equipment
  document.getElementById("equipped-weapon").textContent = 
    character.equipment.weapon?.name || "None";
  document.getElementById("equipped-armor").textContent = 
    character.equipment.armor?.name || "None";
  
  // Enemy Stats
  enemyNameSpan.textContent = currentEnemy?.name || "None";
  enemyHealthSpan.textContent = currentEnemy?.health || "0";
  
  // Inventory
  potionsCountSpan.textContent = character.potions;
  herbCountSpan.textContent = character.herbs;
  
  // Dungeon
  document.getElementById("dungeon-floor").textContent = character.dungeonFloor;
}

function updateHealthBar(selector, current, max) {
  const healthPercent = (current / max) * 100;
  document.querySelector(selector).style.setProperty(
    '--health-width', 
    `${Math.max(healthPercent, 0)}%`
  );
}

function gameLog(message) {
  const logEntry = document.createElement("p");
  logEntry.className = 'game-log-entry';
  logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  gameLogDiv.appendChild(logEntry);
  gameLogDiv.scrollTop = gameLogDiv.scrollHeight;
}

// Rest Function
document.getElementById("rest-button").addEventListener("click", () => {
  character.health = Math.min(character.health + 20, character.maxHealth);
  character.mana = Math.min(character.mana + 10, character.maxMana);
  gameLog("Restored 20 HP and 10 MP!");
  updateUI();
});

// Reset Game
function resetGame() {
  Object.assign(character, {
    class: null,
    level: 1,
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    attack: 10,
    xp: 0,
    xpNeeded: 100,
    gold: 0,
    potions: 0,
    herbs: 0,
    dungeonFloor: 1,
    equipment: { weapon: null, armor: null },
    statusEffects: [],
    achievements: [],
    enemiesDefeated: 0
  });
  
  classSelectionDiv.style.display = 'block';
  currentEnemy = null;
  document.getElementById("achievement-list").innerHTML = "None yet!";
  document.getElementById("skills").innerHTML = `<h3>Class Skills</h3>`;
  updateUI();
  gameLog("Game reset. Choose your class again.");
  document.body.classList.remove('class-selected');
}

// Initialize
updateUI();