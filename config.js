/**
 * 游戏配置文件
 * 包含所有游戏平衡性参数，方便调整
 */

export const Config = {
  // 网格设置
  GRID: {
    ROWS: 5,
    COLS: 9,
    CELL_WIDTH: 80,
    CELL_HEIGHT: 90,
    START_X: 140,
    START_Y: 100
  },

  // 画布尺寸
  CANVAS: {
    WIDTH: 900,
    HEIGHT: 600
  },

  // 游戏基础设置
  GAME: {
    FPS: 60,
    SUN_START: 150,
    ZOMBIE_SPAWN_INTERVAL: 10000, // 毫秒
    NATURAL_SUN_INTERVAL: 8000,   // 毫秒
    MAX_PARTICLES: 100
  },

  // 植物配置
  PLANTS: {
    // 豌豆射手
    PEASHOOTER: {
      id: 'peashooter',
      name: '豌豆射手',
      sunCost: 100,
      cooldown: 5000,
      health: 100,
      attackDamage: 20,
      attackSpeed: 1500,  // 发射间隔(毫秒)
      bulletSpeed: 5,
      bulletType: 'normal'
    },

    // 向日葵
    SUNFLOWER: {
      id: 'sunflower',
      name: '向日葵',
      sunCost: 50,
      cooldown: 5000,
      health: 80,
      productionInterval: 24000, // 生产阳光间隔
      sunAmount: 25
    },

    // 坚果
    WALLNUT: {
      id: 'wallnut',
      name: '坚果',
      sunCost: 50,
      cooldown: 20000,
      health: 400,  // 高生命值
      isWall: true
    },

    // 寒冰射手
    SNOWPEA: {
      id: 'snowpea',
      name: '寒冰射手',
      sunCost: 175,
      cooldown: 5000,
      health: 100,
      attackDamage: 20,
      attackSpeed: 1500,
      bulletSpeed: 5,
      bulletType: 'slow'  // 减速子弹
    },

    // 樱桃炸弹
    CHERRY_BOMB: {
      id: 'cherry_bomb',
      name: '樱桃炸弹',
      sunCost: 150,
      cooldown: 30000,
      health: 100,
      explodeDamage: 180,
      explodeRadius: 100,
      explodeDelay: 1000  // 种植后多久爆炸
    }
  },

  // 僵尸配置
  ZOMBIES: {
    // 普通僵尸
    NORMAL: {
      id: 'normal',
      name: '普通僵尸',
      health: 150,       // 降低难度
      damage: 20,        // 每次啃咬伤害
      attackSpeed: 1500, // 攻击间隔(毫秒)
      moveSpeed: 0.008,  // 每帧移动像素（降低速度）
      score: 100
    },

    // 路障僵尸
    CONEHEAD: {
      id: 'conehead',
      name: '路障僵尸',
      health: 400,       // 降低难度
      damage: 20,
      attackSpeed: 1500,
      moveSpeed: 0.008,  // 每帧移动像素
      score: 200
    },

    // 铁桶僵尸
    BUCKETHEAD: {
      id: 'buckethead',
      name: '铁桶僵尸',
      health: 800,       // 降低难度
      damage: 20,
      attackSpeed: 1500,
      moveSpeed: 0.008,  // 每帧移动像素
      score: 300
    },

    // 旗帜僵尸
    FLAG: {
      id: 'flag',
      name: '旗帜僵尸',
      health: 150,
      damage: 20,
      attackSpeed: 1500,
      moveSpeed: 0.012,  // 比普通僵尸快一些
      score: 150
    }
  },

  // 子弹配置
  BULLETS: {
    NORMAL: {
      type: 'normal',
      damage: 20,
      radius: 10,        // 增大一倍：5 -> 10
      color: '#00FF00'
    },
    SLOW: {
      type: 'slow',
      damage: 20,
      radius: 10,        // 增大一倍：5 -> 10
      color: '#0066FF',  // 改为蓝色
      slowFactor: 0.5,  // 减速50%
      slowDuration: 3000  // 减速持续时间(毫秒)
    },
    SPLASH: {
      type: 'splash',
      damage: 15,
      radius: 16,        // 增大一倍：8 -> 16
      color: '#FF6347',
      splashRadius: 50,  // 溅射范围
      splashDamage: 10
    }
  },

  // 粒子配置
  PARTICLES: {
    // 火色粒子（僵尸被击中）
    SPARK: {
      color: '#808080',
      minSize: 2,
      maxSize: 4,
      life: 20,
      velocity: 2
    },
    // 绿色碎片（植物被啃咬）
    LEAF: {
      color: '#32CD32',
      minSize: 3,
      maxSize: 6,
      life: 30,
      velocity: 1.5
    },
    // 肢体散落（僵尸死亡）
    LIMB: {
      color: '#6B8E23',
      minSize: 5,
      maxSize: 10,
      life: 40,
      velocity: 3
    },
    // 淡出效果
    FADE: {
      life: 30
    }
  },

  // 视觉效果配置
  VISUAL: {
    FLASH_WHITE_DURATION: 100,  // 受击闪白持续时间(毫秒)
    FLASH_WHITE_COLOR: 'rgba(255, 255, 255, 0.7)',

    // 云朵配置
    CLOUDS: {
      count: 5,
      speed: 0.2,
      minSize: 60,
      maxSize: 100
    }
  },

  // 阳光配置
  SUN: {
    RADIUS: 25,
    VALUE: 25,
    COLLECTION_DURATION: 500,  // 收集动画时长(毫秒)
    NATURAL_SUN_COUNT: 25,
    SUNFLOWER_SUN_COUNT: 25
  },

  // UI 配置
  UI: {
    // 植物选择栏
    PLANT_BAR: {
      X: 10,
      Y: 100,
      CELL_SIZE: 60,
      PADDING: 5
    },

    // 铲子按钮位置
    SHOVEL: {
      X: 10,
      Y: 450,
      WIDTH: 60,
      HEIGHT: 60
    },

    // 阳光计数器位置
    SUN_COUNTER: {
      X: 20,
      Y: 30
    },

    // 进度条
    LOADING_BAR: {
      WIDTH: 400,
      HEIGHT: 30,
      X: 250,
      Y: 400
    }
  },

  // 对象池配置
  POOL: {
    BULLET_SIZE: 100,      // 增加子弹池大小以应对更多子弹
    PARTICLE_SIZE: 200      // 增加粒子池大小
  },
  // 性能限制
  PERFORMANCE: {
    MAX_ACTIVE_BULLETS: 100,   // 最大同时存在的子弹数（降低以提升性能）
    MAX_ACTIVE_PARTICLES: 100, // 最大同时存在的粒子数（降低以提升性能）
    MAX_ACTIVE_ZOMBIES: 20,    // 最大同时存在的僵尸数（降低以提升性能）
    VIEWPORT_PADDING: 100       // 视口填充，用于剔除屏幕外实体
  },
  
  // 调试选项
  DEBUG: {
    SHOW_PERF: false,          // 显示性能信息
    SHOW_GRID: false,          // 显示网格
    SHOW_COLLISION: false      // 显示碰撞框
  }
};
