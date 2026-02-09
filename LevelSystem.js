/**
 * 关卡系统
 * 管理关卡数据、进度和解锁
 */

export class LevelSystem {
  constructor() {
    // 关卡数据
    this.levels = [
      {
        id: 1,
        name: '第一关 - 豌豆射手',
        difficulty: 'easy',
        maxZombies: 10,
        zombieTypes: ['normal'],
        zombieSpawnInterval: 15000,
        naturalSunInterval: 8000,
        startSun: 200,
        unlockPlant: 'peashooter',
        rewards: { sun: 100 }
      },
      {
        id: 2,
        name: '第二关 - 向日葵',
        difficulty: 'easy',
        maxZombies: 15,
        zombieTypes: ['normal'],
        zombieSpawnInterval: 12000,
        naturalSunInterval: 10000,
        startSun: 150,
        unlockPlant: 'sunflower',
        rewards: { sun: 150 }
      },
      {
        id: 3,
        name: '第三关 - 防御',
        difficulty: 'easy',
        maxZombies: 20,
        zombieTypes: ['normal', 'conehead'],
        zombieSpawnInterval: 10000,
        naturalSunInterval: 10000,
        startSun: 150,
        unlockPlant: 'wallnut',
        rewards: { sun: 200 }
      },
      {
        id: 4,
        name: '第四关 - 防御',
        difficulty: 'medium',
        maxZombies: 25,
        zombieTypes: ['normal', 'conehead'],
        zombieSpawnInterval: 9000,
        naturalSunInterval: 10000,
        startSun: 150,
        unlockPlant: 'cherry_bomb',
        rewards: { sun: 250 }
      },
      {
        id: 5,
        name: '第五关 - 爆破',
        difficulty: 'medium',
        maxZombies: 30,
        zombieTypes: ['normal', 'conehead', 'buckethead'],
        zombieSpawnInterval: 8000,
        naturalSunInterval: 12000,
        startSun: 150,
        unlockPlant: 'snowpea',
        rewards: { sun: 300 }
      },
      {
        id: 6,
        name: '第六关 - 冰冻',
        difficulty: 'medium',
        maxZombies: 35,
        zombieTypes: ['normal', 'conehead', 'buckethead'],
        zombieSpawnInterval: 7500,
        naturalSunInterval: 12000,
        startSun: 150,
        unlockPlant: null,
        rewards: { sun: 350 }
      },
      {
        id: 7,
        name: '第七关 - 挑战',
        difficulty: 'hard',
        maxZombies: 40,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 7000,
        naturalSunInterval: 12000,
        startSun: 150,
        unlockPlant: null,
        rewards: { sun: 400 }
      },
      {
        id: 8,
        name: '第八关 - 旗帜僵尸',
        difficulty: 'hard',
        maxZombies: 45,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 6500,
        naturalSunInterval: 12000,
        startSun: 150,
        unlockPlant: null,
        rewards: { sun: 450 }
      },
      {
        id: 9,
        name: '第九关 - 困难',
        difficulty: 'hard',
        maxZombies: 50,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 6000,
        naturalSunInterval: 12000,
        startSun: 150,
        unlockPlant: null,
        rewards: { sun: 500 }
      },
      {
        id: 10,
        name: '第十关 - 终极挑战',
        difficulty: 'extreme',
        maxZombies: 60,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 5500,
        naturalSunInterval: 12000,
        startSun: 150,
        unlockPlant: null,
        rewards: { sun: 1000 }
      }
    ];
    
    // 从存储加载进度
    this.progress = this.loadProgress();
    
    // 当前关卡
    this.currentLevel = null;
  }
  
  /**
   * 加载进度
   */
  loadProgress() {
    try {
      const saved = localStorage.getItem('levelProgress');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('加载关卡进度失败:', e);
    }
    
    // 默认进度：第一关解锁，豌豆射手默认可用
    return {
      unlockedLevels: [1],
      completedLevels: [],
      unlockedPlants: ['peashooter'],  // 默认解锁豌豆射手
      totalStars: 0
    };
  }
  
  /**
   * 保存进度
   */
  saveProgress() {
    try {
      localStorage.setItem('levelProgress', JSON.stringify(this.progress));
    } catch (e) {
      console.error('保存关卡进度失败:', e);
    }
  }
  
  /**
   * 获取关卡
   */
  getLevel(levelId) {
    return this.levels.find(l => l.id === levelId);
  }
  
  /**
   * 关卡是否解锁
   */
  isLevelUnlocked(levelId) {
    return this.progress.unlockedLevels.includes(levelId);
  }
  
  /**
   * 关卡是否完成
   */
  isLevelCompleted(levelId) {
    return this.progress.completedLevels.includes(levelId);
  }
  
  /**
   * 植物是否解锁
   */
  isPlantUnlocked(plantType) {
    // 向日葵默认解锁
    if (plantType === 'sunflower') return true;
    return this.progress.unlockedPlants.includes(plantType);
  }
  
  /**
   * 开始关卡
   */
  startLevel(levelId) {
    const level = this.getLevel(levelId);
    if (!level) return null;
    
    if (!this.isLevelUnlocked(levelId)) {
      console.warn('关卡未解锁:', levelId);
      return null;
    }
    
    this.currentLevel = level;
    return level;
  }
  
  /**
   * 完成关卡
   */
  completeLevel(levelId) {
    const level = this.getLevel(levelId);
    if (!level) return;
    
    // 添加到已完成
    if (!this.progress.completedLevels.includes(levelId)) {
      this.progress.completedLevels.push(levelId);
    }
    
    // 解锁下一关
    const nextLevelId = levelId + 1;
    if (nextLevelId <= this.levels.length) {
      if (!this.progress.unlockedLevels.includes(nextLevelId)) {
        this.progress.unlockedLevels.push(nextLevelId);
      }
    }
    
    // 解锁植物
    if (level.unlockPlant && !this.progress.unlockedPlants.includes(level.unlockPlant)) {
      this.progress.unlockedPlants.push(level.unlockPlant);
    }
    
    // 保存进度
    this.saveProgress();
  }
  
  /**
   * 获取已解锁的植物列表
   */
  getUnlockedPlants() {
    // 向日葵总是解锁的
    const plants = ['sunflower', ...this.progress.unlockedPlants];
    return [...new Set(plants)]; // 去重
  }
  
  /**
   * 重置进度
   */
  resetProgress() {
    this.progress = {
      unlockedLevels: [1],
      completedLevels: [],
      unlockedPlants: [],
      totalStars: 0
    };
    this.saveProgress();
  }
  
  /**
   * 获取关卡列表
   */
  getLevels() {
    return this.levels;
  }
  
  /**
   * 获取当前关卡
   */
  getCurrentLevel() {
    return this.currentLevel;
  }
}

// 全局实例
export const levelSystem = new LevelSystem();
