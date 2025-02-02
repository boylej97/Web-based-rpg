// ========================
// GAME DATA CONFIGURATION
// ========================
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
  enemiesDefeated: 0,
  stats: {
    strength: 10,
    intelligence: 10,
    agility: 10
  }
};

const enemies = [
  {
    name: "Goblin",
    health: 50,
    attack: 5,
    herbs: 1,
    gold: 5,
    resistance: 0.1,
    abilities: [
      {
        name: "Poison Dart",
        chance: 0.2,
        effect: () => character.statusEffects.push('poisoned')
      }
    ]
  },
  {
    name: "Orc",
    health: 80,
    attack: 10,
    herbs: 2,
    gold: 10,
    resistance: 0.2
  },
  {
    name: "Dragon",
    health: 150,
    attack: 20,
    herbs: 5,
    gold: 50,
    resistance: 0.4,
    abilities: [
      {
        name: "Fire Breath",
        chance: 0.4,
        effect: () => {
          character.statusEffects.push('burning');
          gameLog("The dragon's fire breath scorches you!");
        }
      }
    ]
  }
];

const achievements = [
  { id: 1, name: "First Blood", check: c => c.enemiesDefeated >= 1 },
  { id: 2, name: "Novice Warrior", check: c => c.enemiesDefeated >= 5 },
  { id: 3, name: "Master Adventurer", check: c => c.level >= 5 },
  { id: 4, name: "Dungeon Master", check: c => c.dungeonFloor >= 10 }
];

const statusEffects = {
  poisoned: {
    duration: 3,
    effect: () => {
      const damage = Math.floor(character.maxHealth * 0.05);
      character.health -= damage;
      gameLog(`Poison deals ${damage} damage!`);
    }
  },
  burning: {
    duration: 2,
    effect: () => {
      const damage = Math.floor(character.maxHealth * 0.08);
      character.health -= damage;
      gameLog(`Burning deals ${damage} damage!`);
    }
  }
};

let currentEnemy = null;
let inDungeon = false;

// ========================
// DOM ELEMENTS
// ========================
const classSelectionDiv = document.getElementById("class-selection");
const gameLogDiv = document.getElementById("game-log");
const characterElements = {
  class: document.getElementById("character-class"),
  level: document.getElementById("character-level"),
  health: document.getElementById("character-health"),
  maxHealth: document.getElementById("character-max-health"),
  mana: document.getElementById("character-mana"),
  gold: document.getElementById("character-gold"),
  attack: document.getElementById("character-attack")
};

// ========================
// CORE GAME SYSTEMS
// ========================
function spawnNewEnemy() {
  if (!inDungeon) return;

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

function attack() {
  if (!inDungeon || !currentEnemy) return;

  const critChance = character.class === 'rogue' ? 0.2 : 0.05;
  const isCrit = Math.random() < critChance;
  const baseDamage = calculateTotalAttack();
  let damage = Math.floor(baseDamage * (Math.random() * 0.3 + 0.85));
  
  if (isCrit) {
    damage = Math.floor(damage * 1.5);
    gameLog(`Critical hit!`);
  }
  
  if (currentEnemy.resistance) {
    damage = Math.floor(damage * (1 - currentEnemy.resistance));
  }

  currentEnemy.health -= damage;
  gameLog(`You attacked ${currentEnemy.name} for ${damage} damage!`);
  animateDamageEffect('#enemy-health-bar');

  if (currentEnemy.health <= 0) {
    handleEnemyDefeat();
  } else {
    enemyAttack();
  }
  
  processStatusEffects();
  updateUI();
}

function enemyAttack() {
  if (currentEnemy.abilities) {
    currentEnemy.abilities.forEach(ability => {
      if (Math.random() < ability.chance) {
        ability.effect();
        gameLog(`${currentEnemy.name} used ${ability.name}!`);
      }
    });
  }

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

// ========================
// PROGRESSION SYSTEMS
// ========================
function checkLevelUp() {
  const classGrowth = {
    warrior: { health: 30, attack: 7 },
    mage: { mana: 20, attack: 3 },
    rogue: { health: 20, attack: 5 }
  };

  while (character.xp >= character.xpNeeded) {
    const growth = classGrowth[character.class] || {};
    const excessXP = character.xp - character.xpNeeded;
    
    character.level++;
    character.maxHealth += growth.health || 20;
    character.maxMana += growth.mana || 10;
    character.attack += growth.attack || 5;
    character.health = character.maxHealth;
    character.mana = character.maxMana;
    character.xp = excessXP;
    character.xpNeeded = Math.floor(character.xpNeeded * 1.5);
    
    gameLog(`Level up! Now level ${character.level}!`);
    animateLevelUp();
  }
  updateUI();
}

function updateDungeonDifficulty() {
  if (character.enemiesDefeated % 5 === 0) {
    character.dungeonFloor++;
    gameLog(`Advanced to dungeon floor ${character.dungeonFloor}!`);
  }
}

// ========================
// CLASS SYSTEM
// ========================
function initializeClassSkills(className) {
  const skillsDiv = document.getElementById("skills");
  skillsDiv.innerHTML = `<h3>Class Skills</h3>`;

  const skills = {
    warrior: [
      { name: "Power Strike", cost: 10, action: warriorStrike }
    ],
    mage: [
      { name: "Fireball", cost: 20, action: fireball }
    ],
    rogue: [
      { name: "Backstab", cost: 15, action: backstab }
    ]
  };

  (skills[className] || []).forEach(skill => {
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

// ========================
// INVENTORY & CRAFTING
// ========================
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

// ========================
// SHOP SYSTEM
// ========================
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

// ========================
// STATUS EFFECTS SYSTEM
// ========================
function processStatusEffects() {
  character.statusEffects.forEach((effect, index) => {
    const handler = statusEffects[effect];
    if (handler.duration-- <= 0) {
      character.statusEffects.splice(index, 1);
    } else {
      handler.effect();
    }
  });
}

// ========================
// UI SYSTEM
// ========================
function updateUI() {
  // Character Stats
  characterElements.class.textContent = character.class || "None";
  characterElements.level.textContent = character.level;
  characterElements.health.textContent = character.health;
  characterElements.maxHealth.textContent = character.maxHealth;
  characterElements.mana.textContent = character.mana;
  characterElements.gold.textContent = character.gold;
  characterElements.attack.textContent = calculateTotalAttack();

  // Health Bars
  updateHealthBar('#character-health-bar', character.health, character.maxHealth);
  if (currentEnemy) {
    updateHealthBar('#enemy-health-bar', currentEnemy.health, currentEnemy.maxHealth);
  }

  // Status Effects
  const statusDisplay = document.getElementById("status-effects");
  statusDisplay.innerHTML = character.statusEffects
    .map(effect => `<div class="status-effect ${effect}">${effect}</div>`)
    .join('');

  // Equipment
  document.getElementById("equipped-weapon").textContent = 
    character.equipment.weapon?.name || "None";
  document.getElementById("equipped-armor").textContent = 
    character.equipment.armor?.name || "None";
  
  // Inventory
  document.getElementById("potions-count").textContent = character.potions;
  document.getElementById("herb-count").textContent = character.herbs;
  
  // Dungeon
  document.getElementById("dungeon-floor").textContent = character.dungeonFloor;
}

// ========================
// UTILITY FUNCTIONS
// ========================
function calculateTotalAttack() {
  return Math.floor(
    (character.attack + (character.equipment.weapon?.attack || 0)) * 
    (1 + (character.dungeonFloor * 0.03))
  );
}

function gameLog(message) {
  const logEntry = document.createElement("p");
  logEntry.className = 'game-log-entry';
  logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  gameLogDiv.appendChild(logEntry);
  gameLogDiv.scrollTop = gameLogDiv.scrollHeight;
}

// ========================
// ANIMATION SYSTEM
// ========================
function animateEnemyAppearance() {
  const enemyCard = document.querySelector('.enemy-card');
  if (!enemyCard) return;

  enemyCard.style.animation = 'none';
  void enemyCard.offsetHeight;
  enemyCard.style.animation = 'slideIn 0.5s ease-out, float 3s ease-in-out infinite';
}

function animateDamageEffect(selector) {
  const element = document.querySelector(selector);
  if (!element) return;

  element.classList.add('damage-pulse');
  setTimeout(() => element.classList.remove('damage-pulse'), 300);
}

function animateHealEffect() {
  const healthBar = document.getElementById('character-health-bar');
  healthBar.style.animation = 'healPulse 0.5s';
  setTimeout(() => healthBar.style.animation = '', 500);
}

// ========================
// SAVE/LOAD SYSTEM
// ========================
document.getElementById("save-button").addEventListener("click", () => {
  const saveData = {
    character: character,
    currentEnemy: currentEnemy
  };
  localStorage.setItem("rpgSave", JSON.stringify(saveData));
  gameLog("Game saved!");
});

document.getElementById("load-button").addEventListener("click", () => {
  try {
    const savedData = JSON.parse(localStorage.getItem("rpgSave"));
    if (!validateSaveData(savedData)) throw new Error("Invalid save data");
    
    Object.assign(character, savedData.character);
    currentEnemy = savedData.currentEnemy;
    gameLog("Game loaded!");
    updateUI();
    initializeClassSkills(character.class);
    classSelectionDiv.style.display = 'none';
  } catch (e) {
    gameLog("Corrupted save file!");
  }
});

function validateSaveData(data) {
  return data?.character?.level !== undefined && 
         data?.currentEnemy?.name !== undefined;
}

// ========================
// GAME INITIALIZATION
// ========================
document.querySelectorAll('.class-button').forEach(button => {
  button.addEventListener('click', (e) => {
    character.class = e.target.dataset.class;
    classSelectionDiv.style.display = 'none';
    initializeClassSkills(character.class);
    inDungeon = true;
    spawnNewEnemy();
    updateUI();
    gameLog(`You became a ${character.class}!`);
    document.body.classList.add('class-selected');
  });
});

document.getElementById("rest-button").addEventListener("click", () => {
  character.health = Math.min(character.health + 20, character.maxHealth);
  character.mana = Math.min(character.mana + 10, character.maxMana);
  gameLog("Restored 20 HP and 10 MP!");
  updateUI();
});

// Initial UI Setup
updateUI();
