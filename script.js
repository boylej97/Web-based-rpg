// script.js
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

let currentEnemy = null;

// DOM Elements
const classSelectionDiv = document.getElementById("class-selection");
const characterClassSpan = document.getElementById("character-class");
const characterLevelSpan = document.getElementById("character-level");
const characterHealthSpan = document.getElementById("character-health");
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
  });
});

// Core Game Functions
function spawnNewEnemy() {
  currentEnemy = { ...enemies[Math.floor(Math.random() * enemies.length)] };
  gameLog(`A wild ${currentEnemy.name} appears!`);
}

function attack() {
  const baseDamage = character.attack + (character.equipment.weapon?.attack || 0);
  const damage = Math.floor(baseDamage * (Math.random() * 0.3 + 0.85)); // 85-115% damage
  currentEnemy.health -= damage;
  gameLog(`You attacked ${currentEnemy.name} for ${damage} damage!`);

  if (currentEnemy.health <= 0) {
    handleEnemyDefeat();
  } else {
    enemyAttack();
  }
  updateUI();
}

function enemyAttack() {
  const damage = Math.floor(currentEnemy.attack * (Math.random() * 0.3 + 0.7)); // 70-100% damage
  character.health -= damage;
  gameLog(`${currentEnemy.name} attacked you for ${damage} damage!`);

  if (character.health <= 0) {
    gameLog("Game Over! Refresh to restart.");
    resetGame();
  }
  updateUI();
}

function handleEnemyDefeat() {
  character.xp += currentEnemy.health;
  character.gold += currentEnemy.gold;
  character.herbs += currentEnemy.herbs;
  character.enemiesDefeated++;
  
  gameLog(`You defeated ${currentEnemy.name}! Gained ${currentEnemy.health} XP, ${currentEnemy.gold} gold, ${currentEnemy.herbs} herbs.`);
  
  checkLevelUp();
  checkAchievements();
  spawnNewEnemy();
}

// Progression System
function checkLevelUp() {
  if (character.xp >= character.xpNeeded) {
    character.level++;
    character.maxHealth += 20;
    character.maxMana += 10;
    character.attack += 5;
    character.health = character.maxHealth;
    character.mana = character.maxMana;
    character.xp = 0;
    character.xpNeeded = Math.floor(character.xpNeeded * 1.5);
    gameLog(`Level up! You're now level ${character.level}!`);
  }
}

// Class System
function initializeClassSkills(className) {
  const skillsDiv = document.getElementById("skills");
  skillsDiv.innerHTML = `<h3>Skills</h3>`;

  const skills = {
    warrior: [{ name: "Power Strike", cost: 10, action: warriorStrike }],
    mage: [{ name: "Fireball", cost: 20, action: fireball }],
    rogue: [{ name: "Backstab", cost: 15, action: backstab }]
  };

  skills[className].forEach(skill => {
    const button = document.createElement("button");
    button.textContent = `${skill.name} (${skill.cost} Mana)`;
    button.addEventListener("click", () => useSkill(skill));
    skillsDiv.appendChild(button);
  });
}

function useSkill(skill) {
  if (character.mana >= skill.cost) {
    character.mana -= skill.cost;
    skill.action();
    enemyAttack();
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
  } else {
    gameLog("No potions left!");
  }
});

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
});

document.getElementById("load-button").addEventListener("click", () => {
  const savedData = JSON.parse(localStorage.getItem("rpgSave"));
  if (savedData) {
    Object.assign(character, savedData.character);
    currentEnemy = savedData.currentEnemy;
    gameLog("Game loaded!");
    updateUI();
  } else {
    gameLog("No save file found!");
  }
});

// UI Functions
function updateUI() {
  characterClassSpan.textContent = character.class || "None";
  characterLevelSpan.textContent = character.level;
  characterHealthSpan.textContent = character.health;
  characterManaSpan.textContent = character.mana;
  characterGoldSpan.textContent = character.gold;
  enemyNameSpan.textContent = currentEnemy?.name || "None";
  enemyHealthSpan.textContent = currentEnemy?.health || "0";
  potionsCountSpan.textContent = character.potions;
  herbCountSpan.textContent = character.herbs;
}

function gameLog(message) {
  const logEntry = document.createElement("p");
  logEntry.textContent = message;
  gameLogDiv.appendChild(logEntry);
  gameLogDiv.scrollTop = gameLogDiv.scrollHeight;
}

function resetGame() {
  character.health = character.maxHealth;
  character.enemiesDefeated = 0;
  spawnNewEnemy();
}

// Initialize
updateUI();