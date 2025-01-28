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
  { 
    id: 1, 
    name: "First Blood", 
    description: "Defeat your first enemy",
    check: c => c.enemiesDefeated >= 1 
  },
  { 
    id: 2, 
    name: "Novice Warrior", 
    description: "Defeat 5 enemies",
    check: c => c.enemiesDefeated >= 5 
  },
  { 
    id: 3, 
    name: "Master Adventurer", 
    description: "Reach level 5",
    check: c => c.level >= 5 
  }
];

let currentEnemy = null;
let inDungeon = false;

// DOM Elements
const classSelectionDiv = document.getElementById("class-selection");
const gameLogDiv = document.getElementById("game-log");

// Core Game Functions
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
  
  const damage = Math.floor(calculateTotalAttack() * (Math.random() * 0.3 + 0.85));
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
    character.health = character.maxHealth;
    character.mana = character.maxMana;
    character.xp = excessXP;
    character.xpNeeded = Math.floor(character.xpNeeded * 1.5);
    
    gameLog(`Level up! Now level ${character.level}!`);
    document.getElementById('character-max-health').classList.add('glow-text');
    document.getElementById('character-max-mana').classList.add('glow-text');
    setTimeout(() => {
      document.getElementById('character-max-health').classList.remove('glow-text');
      document.getElementById('character-max-mana').classList.remove('glow-text');
    }, 1000);
  }
  updateUI();
}

function calculateTotalAttack() {
  return character.attack + (character.equipment.weapon?.attack || 0);
}

// Dungeon System
document.getElementById("enter-dungeon").addEventListener("click", () => {
  inDungeon = true;
  spawnNewEnemy();
  gameLog(`Entered dungeon floor ${character.dungeonFloor}`);
  updateUI();
});

function completeDungeon() {
  inDungeon = false;
  currentEnemy = null;
  gameLog("Left the dungeon");
  updateUI();
}

// Achievements System
function checkAchievements() {
  achievements.forEach(achievement => {
    if (!character.achievements.includes(achievement.id) && 
        achievement.check(character)) {
      character.achievements.push(achievement.id);
      const achievementList = document.getElementById("achievement-list");
      
      const badge = document.createElement('div');
      badge.className = 'achievement-badge';
      badge.innerHTML = `
        <div class="achievement-title">${achievement.name}</div>
        <div class="achievement-description">${achievement.description}</div>
      `;
      achievementList.appendChild(badge);
      gameLog(`Achievement Unlocked: ${achievement.name}!`);
    }
  });
}

// UI Functions
function updateUI() {
  // Character Stats
  document.getElementById("character-class").textContent = character.class || "None";
  document.getElementById("character-level").textContent = character.level;
  document.getElementById("character-health").textContent = character.health;
  document.getElementById("character-max-health").textContent = character.maxHealth;
  document.getElementById("character-mana").textContent = character.mana;
  document.getElementById("character-max-mana").textContent = character.maxMana;
  document.getElementById("character-attack").textContent = calculateTotalAttack();
  document.getElementById("character-gold").textContent = character.gold;
  
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
  
  // Enemy Stats
  const enemyCard = document.querySelector(".enemy-card");
  enemyCard.style.display = inDungeon ? "block" : "none";
  if (currentEnemy) {
    document.getElementById("enemy-name").textContent = currentEnemy.name;
    document.getElementById("enemy-health").textContent = currentEnemy.health;
  }
  
  // Inventory
  document.getElementById("potions-count").textContent = character.potions;
  document.getElementById("herb-count").textContent = character.herbs;
  
  // Dungeon
  document.getElementById("dungeon-floor").textContent = character.dungeonFloor;
}

// Event Listeners
document.getElementById("attack-button").addEventListener("click", attack);
document.getElementById("rest-button").addEventListener("click", () => {
  character.health = Math.min(character.health + 20, character.maxHealth);
  character.mana = Math.min(character.mana + 10, character.maxMana);
  gameLog("Restored 20 HP and 10 MP!");
  updateUI();
});

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

// Initialize Game
document.querySelectorAll('.class-button').forEach(button => {
  button.addEventListener('click', (e) => {
    character.class = e.target.dataset.class;
    classSelectionDiv.style.display = 'none';
    initializeClassSkills(character.class);
    gameLog(`You became a ${character.class}!`);
    document.body.classList.add('class-selected');
  });
});

// Remaining utility functions (updateHealthBar, gameLog, etc.) remain the same as previous
// version but with the log limit improvement mentioned earlier