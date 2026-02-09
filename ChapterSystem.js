/**
 * 章节关卡系统 v4.0
 * 实现多章节、植物解锁、金币系统
 */

export class ChapterSystem {
  constructor() {
    // 章节定义
    this.chapters = [
      {
        id: 1,
        name: '第1章 草坪保卫战',
        theme: 'day',
        icon: '🌞',
        description: '白天关卡，学习基础防御',
        unlocked: true,
        levels: this.createChapter1()
      },
      {
        id: 2,
        name: '第2章 夜幕降临',
        theme: 'night',
        icon: '🌙',
        description: '夜晚关卡，资源管理挑战',
        unlocked: false,
        levels: this.createChapter2()
      },
      {
        id: 3,
        name: '第3章 泳池保卫战',
        theme: 'pool',
        icon: '🏊',
        description: '水池关卡，地形变化',
        unlocked: false,
        levels: this.createChapter3()
      },
      {
        id: 4,
        name: '第4章 屋顶危机',
        theme: 'roof',
        icon: '🏠',
        description: '屋顶关卡，斜坡挑战',
        unlocked: false,
        levels: this.createChapter4()
      },
      {
        id: 5,
        name: '最终挑战',
        theme: 'final',
        icon: '🎖️',
        description: '终极Boss战',
        unlocked: false,
        levels: this.createChapter5()
      }
    ];

    // 加载进度
    this.progress = this.loadProgress();
  }

  /**
   * 第1章：草坪保卫战（新手教学）
   */
  createChapter1() {
    return [
      {
        id: '1-1',
        name: '1-1 初次相遇',
        difficulty: 'tutorial',
        maxZombies: 8,
        zombieTypes: ['normal'],
        zombieSpawnInterval: 20000,
        startSun: 250,
        unlockPlant: 'peashooter',
        unlockName: '豌豆射手',
        unlockIcon: '💚',
        description: '基础输出植物',
        coins: 800,
        theme: 'day'
      },
      {
        id: '1-2',
        name: '1-2 阳光工厂',
        difficulty: 'easy',
        maxZombies: 12,
        zombieTypes: ['normal'],
        zombieSpawnInterval: 15000,
        startSun: 200,
        unlockPlant: 'sunflower',
        unlockName: '向日葵',
        unlockIcon: '🌻',
        description: '阳光制造机',
        coins: 800,
        theme: 'day'
      },
      {
        id: '1-3',
        name: '1-3 第一道防线',
        difficulty: 'easy',
        maxZombies: 15,
        zombieTypes: ['normal', 'conehead'],
        zombieSpawnInterval: 12000,
        startSun: 200,
        unlockPlant: 'wallnut',
        unlockName: '坚果墙',
        unlockIcon: '🪨',
        description: '第一道防线',
        coins: 900,
        theme: 'day'
      },
      {
        id: '1-4',
        name: '1-4 地下陷阱',
        difficulty: 'easy',
        maxZombies: 18,
        zombieTypes: ['normal', 'conehead'],
        zombieSpawnInterval: 11000,
        startSun: 200,
        unlockPlant: 'potatomine',
        unlockName: '土豆地雷',
        unlockIcon: '🧨',
        description: '陷阱杀手',
        coins: 950,
        theme: 'day'
      },
      {
        id: '1-5',
        name: '1-5 冰冻战术',
        difficulty: 'medium',
        maxZombies: 20,
        zombieTypes: ['normal', 'conehead'],
        zombieSpawnInterval: 10000,
        startSun: 200,
        unlockPlant: 'snowpea',
        unlockName: '寒冰射手',
        unlockIcon: '❄️',
        description: '减速输出',
        coins: 1000,
        theme: 'day'
      },
      {
        id: '1-6',
        name: '1-6 核弹时刻',
        difficulty: 'medium',
        maxZombies: 25,
        zombieTypes: ['normal', 'conehead', 'buckethead'],
        zombieSpawnInterval: 9000,
        startSun: 200,
        unlockPlant: 'cherry_bomb',
        unlockName: '樱桃炸弹',
        unlockIcon: '💥',
        description: '群伤核弹',
        coins: 1200,
        theme: 'day'
      },
      {
        id: '1-7',
        name: '1-7 吞噬者',
        difficulty: 'medium',
        maxZombies: 28,
        zombieTypes: ['normal', 'conehead', 'buckethead'],
        zombieSpawnInterval: 8500,
        startSun: 200,
        unlockPlant: 'chomper',
        unlockName: '大嘴花',
        unlockIcon: '😈',
        description: '近战吞噬',
        coins: 1300,
        theme: 'day'
      },
      {
        id: '1-8',
        name: '1-8 双倍火力',
        difficulty: 'hard',
        maxZombies: 30,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 8000,
        startSun: 200,
        unlockPlant: 'repeater',
        unlockName: '双发射手',
        unlockIcon: '🔫',
        description: '双倍火力',
        coins: 1500,
        theme: 'day'
      },
      {
        id: '1-9',
        name: '1-9 终极清场',
        difficulty: 'hard',
        maxZombies: 35,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 7500,
        startSun: 200,
        unlockPlant: 'jalapeno',
        unlockName: '火爆辣椒',
        unlockIcon: '🌶️',
        description: '全行秒杀',
        coins: 1800,
        boss: false,
        theme: 'day'
      },
      {
        id: '1-10',
        name: '1-10 章节Boss',
        difficulty: 'boss',
        maxZombies: 40,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 7000,
        startSun: 250,
        unlockPlant: null,
        coins: 2500,
        boss: true,
        bossReward: 500,
        theme: 'day'
      }
    ];
  }

  /**
   * 第2章：夜幕降临（资源管理）
   */
  createChapter2() {
    return [
      {
        id: '2-1',
        name: '2-1 黑暗来袭',
        difficulty: 'easy',
        maxZombies: 30,
        zombieTypes: ['normal', 'conehead'],
        zombieSpawnInterval: 10000,
        startSun: 100,
        unlockPlant: 'sunshrroom',
        unlockName: '小太阳',
        unlockIcon: '☀️',
        description: '夜间阳光',
        coins: 1200,
        theme: 'night'
      },
      {
        id: '2-2',
        name: '2-2 蘑菇军团',
        difficulty: 'easy',
        maxZombies: 35,
        zombieTypes: ['normal', 'conehead', 'buckethead'],
        zombieSpawnInterval: 9000,
        startSun: 100,
        unlockPlant: 'puffshroom',
        unlockName: '小喷菇',
        unlockIcon: '🍄',
        description: '廉价输出',
        coins: 1300,
        theme: 'night'
      },
      {
        id: '2-3',
        name: '2-3 核武蘑菇',
        difficulty: 'medium',
        maxZombies: 40,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 8500,
        startSun: 100,
        unlockPlant: 'doomshroom',
        unlockName: '毁灭菇',
        unlockIcon: '🍄',
        description: '范围核弹',
        coins: 1500,
        theme: 'night'
      },
      {
        id: '2-4',
        name: '2-4 咖啡时光',
        difficulty: 'medium',
        maxZombies: 45,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 8000,
        startSun: 150,
        unlockPlant: 'coffeebean',
        unlockName: '咖啡豆',
        unlockIcon: '☕',
        description: '唤醒蘑菇',
        coins: 1600,
        theme: 'night'
      },
      {
        id: '2-5',
        name: '2-5 地刺陷阱',
        difficulty: 'hard',
        maxZombies: 50,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 7500,
        startSun: 150,
        unlockPlant: 'spikeweed',
        unlockName: '地刺',
        unlockIcon: '🌵',
        description: '地面陷阱',
        coins: 2000,
        boss: true,
        bossReward: 800,
        theme: 'night'
      }
    ];
  }

  /**
   * 第3章：泳池保卫战（地形变化）
   */
  createChapter3() {
    return [
      {
        id: '3-1',
        name: '3-1 水上平台',
        difficulty: 'medium',
        maxZombies: 35,
        zombieTypes: ['normal', 'conehead', 'buckethead'],
        zombieSpawnInterval: 9000,
        startSun: 200,
        unlockPlant: 'lilypad',
        unlockName: '莲叶',
        unlockIcon: '🍃',
        description: '水上平台',
        coins: 1800,
        theme: 'pool'
      },
      {
        id: '3-2',
        name: '3-2 水下射手',
        difficulty: 'medium',
        maxZombies: 40,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 8500,
        startSun: 200,
        unlockPlant: 'seashroom',
        unlockName: '海蘑菇',
        unlockIcon: '💧',
        description: '水下输出',
        coins: 2000,
        theme: 'pool'
      },
      {
        id: '3-3',
        name: '3-3 冰封之海',
        difficulty: 'hard',
        maxZombies: 45,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 8000,
        startSun: 200,
        unlockPlant: 'wintermelon',
        unlockName: '冰西瓜',
        unlockIcon: '🌊',
        description: '水上冰冻',
        coins: 2200,
        theme: 'pool'
      },
      {
        id: '3-4',
        name: '3-4 深海巨口',
        difficulty: 'hard',
        maxZombies: 50,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 7500,
        startSun: 200,
        unlockPlant: 'tanglekelp',
        unlockName: '缠绕海草',
        unlockIcon: '🌊',
        description: '水下吞噬',
        coins: 2500,
        boss: true,
        bossReward: 1500,
        theme: 'pool'
      }
    ];
  }

  /**
   * 第4章：屋顶危机（斜坡挑战）
   */
  createChapter4() {
    return [
      {
        id: '4-1',
        name: '4-1 屋顶初战',
        difficulty: 'hard',
        maxZombies: 40,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 8000,
        startSun: 200,
        unlockPlant: 'threepeater',
        unlockName: '三线射手',
        unlockIcon: '📈',
        description: '三线输出',
        coins: 2500,
        theme: 'roof'
      },
      {
        id: '4-2',
        name: '4-2 南瓜保护',
        difficulty: 'hard',
        maxZombies: 45,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 7500,
        startSun: 200,
        unlockPlant: 'pumpkin',
        unlockName: '南瓜护甲',
        unlockIcon: '🎃',
        description: '额外护甲',
        coins: 2800,
        theme: 'roof'
      },
      {
        id: '4-3',
        name: '4-3 空中威胁',
        difficulty: 'hard',
        maxZombies: 50,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 7000,
        startSun: 200,
        unlockPlant: 'umbrellaleaf',
        unlockName: '叶子保护伞',
        unlockIcon: '☔',
        description: '防空中攻击',
        coins: 3000,
        theme: 'roof'
      },
      {
        id: '4-4',
        name: '4-4 磁力护盾',
        difficulty: 'boss',
        maxZombies: 60,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 6500,
        startSun: 250,
        unlockPlant: 'magnetshroom',
        unlockName: '磁力菇',
        unlockIcon: '🧲',
        description: '拆除金属',
        coins: 3500,
        boss: true,
        bossReward: 3000,
        theme: 'roof'
      }
    ];
  }

  /**
   * 第5章：最终挑战
   */
  createChapter5() {
    return [
      {
        id: '5-1',
        name: '5-1 终极之战',
        difficulty: 'final',
        maxZombies: 100,
        zombieTypes: ['normal', 'conehead', 'buckethead', 'flag'],
        zombieSpawnInterval: 5000,
        startSun: 500,
        unlockPlant: 'imitater',
        unlockName: '模仿者',
        unlockIcon: '👥',
        description: '复制任意植物',
        coins: 5000,
        boss: true,
        bossReward: 5000,
        theme: 'final'
      }
    ];
  }

  /**
   * 加载进度
   */
  loadProgress() {
    try {
      const saved = localStorage.getItem('chapterProgress');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('加载章节进度失败:', e);
    }

    // 默认进度
    return {
      currentChapter: 1,
      unlockedChapters: [1],
      completedLevels: [],
      unlockedPlants: ['peashooter'],  // 默认解锁豌豆射手
      totalCoins: 0,
      earnedCoins: 0,
      totalStars: 0
    };
  }

  /**
   * 保存进度
   */
  saveProgress() {
    try {
      localStorage.setItem('chapterProgress', JSON.stringify(this.progress));
    } catch (e) {
      console.error('保存章节进度失败:', e);
    }
  }

  /**
   * 获取章节
   */
  getChapter(chapterId) {
    return this.chapters.find(c => c.id === chapterId);
  }

  /**
   * 获取关卡
   */
  getLevel(levelId) {
    for (const chapter of this.chapters) {
      const level = chapter.levels.find(l => l.id === levelId);
      if (level) {
        return level;
      }
    }
    return null;
  }

  /**
   * 章节是否解锁
   */
  isChapterUnlocked(chapterId) {
    return this.progress.unlockedChapters.includes(chapterId);
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
  isPlantUnlocked(plantId) {
    return this.progress.unlockedPlants.includes(plantId);
  }

  /**
   * 完成关卡
   */
  completeLevel(levelId, starsEarned = 3, coinsEarned = 0) {
    // 标记完成
    if (!this.progress.completedLevels.includes(levelId)) {
      this.progress.completedLevels.push(levelId);
    }

    // 获取关卡信息
    const level = this.getLevel(levelId);
    if (!level) return;

    // 解锁植物
    if (level.unlockPlant && !this.progress.unlockedPlants.includes(level.unlockPlant)) {
      this.progress.unlockedPlants.push(level.unlockPlant);
    }

    // 增加金币
    const totalCoins = (level.coins || 0) + coinsEarned + (level.bossReward || 0);
    this.progress.totalCoins += totalCoins;
    this.progress.earnedCoins += totalCoins;

    // 增加星星
    this.progress.totalStars += starsEarned;

    // 检查是否解锁下一章节
    this.checkChapterUnlock(levelId);

    this.saveProgress();
  }

  /**
   * 检查章节解锁
   */
  checkChapterUnlock(completedLevelId) {
    const [chapterId, levelNum] = completedLevelId.split('-').map(Number);
    const chapter = this.getChapter(chapterId);
    
    if (!chapter) return;

    // 如果完成了该章节的最后一关，解锁下一章节
    const isLastLevel = levelNum === chapter.levels.length;
    if (isLastLevel) {
      const nextChapterId = chapterId + 1;
      if (!this.progress.unlockedChapters.includes(nextChapterId) && nextChapterId <= this.chapters.length) {
        this.progress.unlockedChapters.push(nextChapterId);
        this.progress.currentChapter = nextChapterId;
      }
    }
  }

  /**
   * 获取已解锁的植物列表
   */
  getUnlockedPlants() {
    return this.progress.unlockedPlants;
  }

  /**
   * 花费金币
   */
  spendCoins(amount) {
    if (this.progress.totalCoins >= amount) {
      this.progress.totalCoins -= amount;
      this.saveProgress();
      return true;
    }
    return false;
  }

  /**
   * 添加金币
   */
  addCoins(amount) {
    this.progress.totalCoins += amount;
    this.progress.earnedCoins += amount;
    this.saveProgress();
  }

  /**
   * 重置进度
   */
  resetProgress() {
    this.progress = {
      currentChapter: 1,
      unlockedChapters: [1],
      completedLevels: [],
      unlockedPlants: ['peashooter'],
      totalCoins: 0,
      earnedCoins: 0,
      totalStars: 0
    };
    this.saveProgress();
  }

  /**
   * 获取章节进度
   */
  getChapterProgress(chapterId) {
    const chapter = this.getChapter(chapterId);
    if (!chapter) return { completed: 0, total: 0, percentage: 0 };

    const total = chapter.levels.length;
    const completed = chapter.levels.filter(level => 
      this.isLevelCompleted(level.id)
    ).length;

    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100)
    };
  }
}

// 导出单例
export const chapterSystem = new ChapterSystem();
