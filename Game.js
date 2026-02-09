/**
 * 主游戏引擎
 * 整合所有系统，管理游戏循环和状态
 */

import { Config } from './config.js';
import { Grid } from './Grid.js';
import { Plant } from './Plant.js';
import { Zombie } from './Zombie.js';
import { BulletManager } from './Bullet.js';
import { ParticleSystem } from './ParticleSystem.js';
import { SunManager } from './Sun.js';
import { LoginScreen } from './LoginScreen.js';
import { PlantEditor } from './PlantEditor.js';
import { templateManager } from './PlantTemplates.js';
import { AssetUploader } from './AssetUploader.js';
import { PerformanceMonitor, RowBasedSystem } from './PerformanceOptimizer.js';
import { levelSystem } from './LevelSystem.js';
import { LevelSelect } from './LevelSelect.js';
import { LawnmowerManager } from './Lawnmower.js';

/**
 * 游戏状态枚举
 */
export const GameState = {
  LOADING: 'loading',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  WIN: 'win'
};

/**
 * 主游戏类
 */
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 初始化画布尺寸
    this.canvas.width = Config.CANVAS.WIDTH;
    this.canvas.height = Config.CANVAS.HEIGHT;

    // 游戏状态
    this.state = GameState.LOADING;

    // 系统管理器
    this.grid = new Grid();
    this.bulletManager = new BulletManager();
    this.particleSystem = new ParticleSystem();
    this.sunManager = new SunManager();

    // 实体列表
    this.plants = [];
    this.zombies = [];

    // 关卡系统
    this.levelSystem = levelSystem;
    this.currentLevelData = null;
    this.levelSelect = new LevelSelect(this.canvas, (levelId) => this.startLevel(levelId));
    
    // 小推车系统
    this.lawnmowerManager = new LawnmowerManager(Config.GRID.ROWS);
    
    // 游戏数据
    this.score = 0;
    this.zombiesKilled = 0;
    this.zombiesSpawned = 0;
    this.maxZombies = 20; // 本关卡僵尸总数
    this.zombieSpawnTimer = 0;
    this.sunSpawnTimer = 0;

    // 植物选择
    this.selectedPlant = null;
    this.plantCooldowns = {};
    this.initPlantCooldowns();

    // 铲子状态
    this.isShovelActive = false;

    // 鼠标位置
    this.mouseX = 0;
    this.mouseY = 0;

    // 登录界面
    this.loginScreen = new LoginScreen(
      this.canvas.width,
      this.canvas.height,
      () => this.showLevelSelect()
    );

    // 植物编辑器
    this.plantEditor = new PlantEditor(this.canvas, this);
    
    // 资源上传器
    this.assetUploader = new AssetUploader(this);

    // 加载自定义植物模板
    templateManager.applyTemplatesToConfig();

    // 时间控制
    this.lastTime = 0;
    this.deltaTime = 0;
    
    // 性能优化：使用离屏Canvas缓存背景
    this.backgroundCache = null;
    this.needsBackgroundRedraw = true;
    
    // 性能监控和优化
    this.performanceMonitor = new PerformanceMonitor();
    this.zombieRowSystem = new RowBasedSystem(Config.GRID.ROWS);
    
    // 跳帧优化：降低更新频率
    this.updateCounter = 0;
    this.updateInterval = 1; // 每帧都更新
    
    // 渲染优化：只绘制可见区域
    this.viewportPadding = 100;

    // 事件监听
    this.setupEventListeners();
  }

  /**
   * 初始化植物冷却
   */
  initPlantCooldowns() {
    for (const plantKey in Config.PLANTS) {
      this.plantCooldowns[plantKey.toLowerCase()] = {
        timer: 0,
        duration: Config.PLANTS[plantKey].cooldown
      };
    }
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleClick(x, y);
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      // 右键取消选择
      this.cancelPlantSelection();
    });

    // 键盘事件（暂停游戏和编辑器）
    document.addEventListener('keydown', (e) => {
      // 先处理编辑器键盘事件
      if (this.plantEditor.visible) {
        this.plantEditor.handleKeyDown(e);
        return;
      }

      // 植物编辑器快捷键 (E)
      if (e.key === 'e' || e.key === 'E') {
        if (this.state === GameState.PLAYING) {
          this.plantEditor.toggle();
        }
        return;
      }
      
      // 资源上传器快捷键 (I)
      if (e.key === 'i' || e.key === 'I') {
        if (this.state === GameState.PLAYING) {
          this.assetUploader.toggle();
        }
        return;
      }
      
      // 关卡选择快捷键 (L)
      if (e.key === 'l' || e.key === 'L') {
        if (this.state === GameState.PLAYING || this.state === GameState.WIN || this.state === GameState.GAME_OVER) {
          this.showLevelSelect();
        }
        return;
      }

      // 暂停游戏
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        this.togglePause();
      }
    });
    
    // 滚轮事件（用于资源上传器和关卡选择滚动）
    this.canvas.addEventListener('wheel', (e) => {
      if (this.assetUploader.visible) {
        e.preventDefault();
        this.assetUploader.handleWheel(e.deltaY);
      } else if (this.levelSelect.visible) {
        e.preventDefault();
        this.levelSelect.handleWheel(e.deltaY);
      }
    }, { passive: false });
  }

  /**
   * 启动游戏循环
   */
  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  /**
   * 游戏主循环
   */
  gameLoop(currentTime) {
    // 开始性能监控
    this.performanceMonitor.startFrame();
    
    // 计算时间差
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 确保时间差合理
    if (deltaTime <= 0 || deltaTime > 100) {
      deltaTime = 16.67; // 使用60fps的标准帧时间
    }

    // 限制最大时间差，防止切换标签页后时间跳跃
    deltaTime = Math.min(deltaTime, 50);

    this.update(deltaTime);
    this.draw();
    
    // 结束性能监控
    this.performanceMonitor.endFrame();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  /**
   * 更新游戏
   */
  update(deltaTime) {
    // 植物编辑器总是更新
    this.plantEditor.update(deltaTime);
    
    // 资源上传器总是更新
    this.assetUploader.update(deltaTime);

    switch (this.state) {
      case GameState.LOADING:
        // 如果关卡选择界面打开，不更新登录界面
        if (!this.levelSelect.visible) {
          this.loginScreen.update(deltaTime);
        }
        break;

      case GameState.PLAYING:
        // 如果编辑器或上传器打开，不更新游戏
        if (!this.plantEditor.visible && !this.assetUploader.visible && !this.levelSelect.visible) {
          this.updateGame(deltaTime);
        }
        break;

      case GameState.PAUSED:
        // 暂停时不更新游戏
        break;

      case GameState.GAME_OVER:
      case GameState.WIN:
        // 游戏结束时不更新
        break;
    }
  }

  /**
   * 更新游戏逻辑
   */
  updateGame(deltaTime) {
    // 更新计数器
    this.updateCounter++;
    
    // 更新冷却时间（轻量级，每帧都更新）
    this.updateCooldowns(deltaTime);

    // 生成僵尸
    this.spawnZombies(deltaTime);

    // 生成自然阳光
    this.spawnNaturalSun(deltaTime);

    // 更新植物（使用写索引模式，避免 filter）
    let plantWriteIndex = 0;
    for (let i = 0; i < this.plants.length; i++) {
      const plant = this.plants[i];
      if (plant.active) {
        plant.update(deltaTime, this);
        this.plants[plantWriteIndex++] = plant;
      }
    }
    this.plants.length = plantWriteIndex;

    // 清空并重建僵尸行系统
    this.zombieRowSystem.clear();
    
    // 更新僵尸并按行分组
    let zombieWriteIndex = 0;
    for (let i = 0; i < this.zombies.length; i++) {
      const zombie = this.zombies[i];
      zombie.update(deltaTime);

      // 移除已死亡的僵尸
      if (zombie.isDead) {
        this.zombiesKilled++;
      } else {
        this.zombies[zombieWriteIndex++] = zombie;
        // 将活着的僵尸加入行系统
        this.zombieRowSystem.insert(zombie, zombie.y);
      }
    }
    this.zombies.length = zombieWriteIndex;
    
    // 更新小推车并检查触发
    this.lawnmowerManager.checkTrigger(this.zombies);
    this.lawnmowerManager.update(deltaTime, this);
    
    // 检查僵尸是否到达房子（小推车都用完了）
    if (!this.lawnmowerManager.hasActiveLawnmowers()) {
      for (const zombie of this.zombies) {
        if (zombie.x <= Config.GRID.START_X - 60) {
          this.gameOver();
          break;
        }
      }
    }

    // 更新子弹
    this.bulletManager.update(deltaTime);

    // 子弹碰撞检测（使用行系统优化）
    this.bulletManager.checkCollisionsOptimized(this, this.zombieRowSystem);

    // 更新粒子（限制频率）
    if (this.updateCounter % this.updateInterval === 0) {
      this.particleSystem.update();
    }

    // 更新阳光
    this.sunManager.update(deltaTime);

    // 检查胜利条件
    this.checkWinCondition();
    
    // 更新性能统计
    this.performanceMonitor.stats.activeEntities = 
      this.plants.length + this.zombies.length + 
      this.bulletManager.bullets.length + this.particleSystem.particles.length;
  }

  /**
   * 更新冷却时间
   */
  updateCooldowns(deltaTime) {
    for (const key in this.plantCooldowns) {
      const cooldown = this.plantCooldowns[key];
      if (cooldown.timer > 0) {
        cooldown.timer = Math.max(0, cooldown.timer - deltaTime);
      }
    }
  }

  /**
   * 生成僵尸
   */
  spawnZombies(deltaTime) {
    if (this.zombiesSpawned >= this.maxZombies) return;

    // 限制场上最大僵尸数量，防止卡顿
    if (this.zombies.length >= Config.PERFORMANCE.MAX_ACTIVE_ZOMBIES) {
      return;
    }

    this.zombieSpawnTimer += deltaTime;
    
    // 使用关卡配置的生成间隔
    const spawnInterval = this.currentLevelData ? 
      this.currentLevelData.zombieSpawnInterval : 
      Config.GAME.ZOMBIE_SPAWN_INTERVAL;

    if (this.zombieSpawnTimer >= spawnInterval) {
      this.zombieSpawnTimer = 0;

      // 随机选择行
      const row = Math.floor(Math.random() * Config.GRID.ROWS);

      // 使用关卡配置的僵尸类型
      let zombieTypes = this.currentLevelData && this.currentLevelData.zombieTypes ? 
        this.currentLevelData.zombieTypes : 
        ['normal', 'conehead', 'buckethead'];
      
      // 随机选择僵尸类型
      const type = zombieTypes[Math.floor(Math.random() * zombieTypes.length)];

      const zombie = new Zombie(type, row, this);
      this.zombies.push(zombie);
      this.zombiesSpawned++;
    }
  }

  /**
   * 生成自然阳光
   */
  spawnNaturalSun(deltaTime) {
    this.sunSpawnTimer += deltaTime;

    if (this.sunSpawnTimer >= Config.GAME.NATURAL_SUN_INTERVAL) {
      this.sunSpawnTimer = 0;
      this.sunManager.spawnNaturalSun();
    }
  }

  /**
   * 检查胜利条件
   */
  checkWinCondition() {
    if (this.zombiesSpawned >= this.maxZombies && this.zombies.length === 0) {
      this.win();
    }
  }

  /**
   * 绘制游戏
   */
  draw() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    switch (this.state) {
      case GameState.LOADING:
        this.loginScreen.draw(this.ctx);
        // 绘制关卡选择界面（如果打开）
        this.levelSelect.draw(this.ctx);
        break;

      case GameState.PLAYING:
      case GameState.PAUSED:
        this.drawGame();
        break;

      case GameState.GAME_OVER:
        this.drawGame();
        this.drawGameOver();
        break;

      case GameState.WIN:
        this.drawGame();
        this.drawWin();
        break;
    }

    // 绘制植物编辑器（在所有内容之上）
    this.plantEditor.draw(this.ctx);
    
    // 绘制资源上传器（在最上层）
    this.assetUploader.draw(this.ctx);
    
    // 绘制关卡选择（最上层）
    if (this.state === GameState.PLAYING || this.state === GameState.WIN || this.state === GameState.GAME_OVER) {
      this.levelSelect.draw(this.ctx);
    }
  }

  /**
   * 绘制游戏场景
   */
  drawGame() {
    // 绘制背景（使用缓存优化）
    this.drawBackgroundCached();

    // 绘制网格（可选，用于调试）
    // this.grid.draw(this.ctx);

    // 绘制格子高亮
    this.drawCellHighlight();

    // 绘制植物（带视口剔除）
    this.drawEntities(this.plants);

    // 绘制僵尸（带视口剔除）
    this.drawEntities(this.zombies);

    // 绘制子弹（子弹通常在屏幕内，不需要剔除）
    this.bulletManager.draw(this.ctx);

    // 绘制粒子
    this.particleSystem.draw(this.ctx);

    // 绘制阳光
    this.sunManager.draw(this.ctx);
    
    // 绘制小推车
    this.lawnmowerManager.draw(this.ctx);

    // 绘制植物选择栏
    this.drawPlantBar();

    // 绘制铲子按钮
    this.drawShovel();

    // 绘制UI
    this.drawUI();
    
    // 绘制关卡进度（右下角）
    this.drawLevelProgress();

    // 绘制暂停遮罩
    if (this.state === GameState.PAUSED) {
      this.drawPauseOverlay();
    }
  }
  
  /**
   * 绘制实体（带视口剔除优化）
   */
  drawEntities(entities) {
    const padding = this.viewportPadding;
    const minX = -padding;
    const maxX = this.canvas.width + padding;
    const minY = -padding;
    const maxY = this.canvas.height + padding;
    
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      
      // 视口剔除：跳过屏幕外的实体
      if (entity.x < minX || entity.x > maxX || 
          entity.y < minY || entity.y > maxY) {
        continue;
      }
      
      entity.draw(this.ctx);
    }
  }
  
  /**
   * 绘制背景（使用缓存）
   */
  drawBackgroundCached() {
    // 如果需要重绘背景或者缓存不存在
    if (this.needsBackgroundRedraw || !this.backgroundCache) {
      // 创建离屏Canvas
      if (!this.backgroundCache) {
        this.backgroundCache = document.createElement('canvas');
        this.backgroundCache.width = this.canvas.width;
        this.backgroundCache.height = this.canvas.height;
      }
      
      const cacheCtx = this.backgroundCache.getContext('2d');
      
      // 在离屏Canvas上绘制背景
      this.drawBackgroundOnContext(cacheCtx);
      
      this.needsBackgroundRedraw = false;
    }
    
    // 将缓存的背景绘制到主Canvas
    this.ctx.drawImage(this.backgroundCache, 0, 0);
  }
  
  /**
   * 在指定上下文绘制背景
   */
  drawBackgroundOnContext(ctx) {
    // 天空
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.4, '#B0E0E6');
    skyGradient.addColorStop(1, '#F0E68C');

    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 草地网格
    for (let row = 0; row < Config.GRID.ROWS; row++) {
      const y = Config.GRID.START_Y + row * Config.GRID.CELL_HEIGHT;

      for (let col = 0; col < Config.GRID.COLS; col++) {
        const x = Config.GRID.START_X + col * Config.GRID.CELL_WIDTH;

        // 格子颜色交替
        const isEven = (row + col) % 2 === 0;
        ctx.fillStyle = isEven ? '#2ECC71' : '#27AE60';
        ctx.fillRect(x, y, Config.GRID.CELL_WIDTH, Config.GRID.CELL_HEIGHT);

        // 格子边框
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, Config.GRID.CELL_WIDTH, Config.GRID.CELL_HEIGHT);
      }
    }

    // 房子
    this.drawHouseOnContext(ctx);

    // 僵尸生成区
    ctx.fillStyle = 'rgba(50, 50, 50, 0.3)';
    ctx.fillRect(this.canvas.width - 100, Config.GRID.START_Y, 100, Config.GRID.ROWS * Config.GRID.CELL_HEIGHT);
  }
  
  /**
   * 在指定上下文绘制房子
   */
  drawHouseOnContext(ctx) {
    const houseX = 10;
    const houseY = Config.GRID.START_Y + Config.GRID.ROWS * Config.GRID.CELL_HEIGHT - 100;
    const houseWidth = 100;
    const houseHeight = 80;

    // 房子主体
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(houseX, houseY, houseWidth, houseHeight);

    // 屋顶
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(houseX - 10, houseY);
    ctx.lineTo(houseX + houseWidth / 2, houseY - 40);
    ctx.lineTo(houseX + houseWidth + 10, houseY);
    ctx.closePath();
    ctx.fill();

    // 门
    ctx.fillStyle = '#654321';
    ctx.fillRect(houseX + 35, houseY + 30, 30, 50);

    // 窗户
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(houseX + 10, houseY + 10, 20, 20);
    ctx.fillRect(houseX + 70, houseY + 10, 20, 20);
  }


  /**
   * 绘制格子高亮
   */
  drawCellHighlight() {
    if (this.selectedPlant) {
      const gridPos = this.grid.screenToGrid(this.mouseX, this.mouseY);

      if (gridPos && this.grid.isCellEmptyByIndex(gridPos.index)) {
        this.grid.highlightCell(this.ctx, gridPos.row, gridPos.col, 'rgba(255, 255, 0, 0.3)');
      } else if (gridPos) {
        this.grid.highlightCell(this.ctx, gridPos.row, gridPos.col, 'rgba(255, 0, 0, 0.3)');
      }
    } else if (this.isShovelActive) {
      const gridPos = this.grid.screenToGrid(this.mouseX, this.mouseY);

      if (gridPos) {
        const plant = this.grid.getPlantAtCell(gridPos.row, gridPos.col);
        if (plant && plant.active) {
          // 有植物，显示红色高亮
          this.grid.highlightCell(this.ctx, gridPos.row, gridPos.col, 'rgba(255, 100, 100, 0.5)');
        }
      }
    }
  }

  /**
   * 绘制植物选择栏
   */
  drawPlantBar() {
    const bar = Config.UI.PLANT_BAR;
    const cellSize = bar.CELL_SIZE;
    const padding = bar.PADDING;
    
    // 获取已解锁的植物列表
    const unlockedPlants = this.levelSystem.getUnlockedPlants();

    // 背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.roundRect(bar.X - 5, bar.Y - 5, cellSize + 10, (cellSize + padding) * 5 + padding * 2 + 10, 10);
    this.ctx.fill();

    // 绘制植物卡片
    let index = 0;
    for (const plantKey in Config.PLANTS) {
      const plant = Config.PLANTS[plantKey];
      const cooldown = this.plantCooldowns[plantKey.toLowerCase()];
      const isUnlocked = unlockedPlants.includes(plantKey.toLowerCase());

      const x = bar.X;
      const y = bar.Y + index * (cellSize + padding);

      // 卡片背景
      if (!isUnlocked) {
        // 未解锁：灰色
        this.ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
      } else if (this.selectedPlant === plantKey.toLowerCase()) {
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
      } else if (cooldown.timer > 0 || this.sunManager.getSunCount() < plant.sunCost) {
        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
      } else {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      }

      this.ctx.roundRect(x, y, cellSize, cellSize, 5);
      this.ctx.fill();

      // 绘制植物图标（简化）
      if (isUnlocked) {
        this.drawPlantIcon(x + cellSize / 2, y + cellSize / 2, plantKey.toLowerCase());
      } else {
        // 未解锁显示锁
        this.ctx.fillStyle = '#666';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🔒', x + cellSize / 2, y + cellSize / 2);
      }

      // 阳光消耗
      if (isUnlocked) {
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(plant.sunCost, x + 5, y + cellSize - 5);
      }

      // 冷却遮罩
      if (isUnlocked && cooldown.timer > 0) {
        const cooldownProgress = cooldown.timer / cooldown.duration;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, cellSize, cellSize * cooldownProgress);
      }

      index++;
    }
  }

  /**
   * 绘制植物图标
   */
  drawPlantIcon(x, y, type) {
    this.ctx.save();
    this.ctx.translate(x, y);

    switch (type) {
      case 'peashooter':
        this.ctx.fillStyle = '#00FF00';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#32CD32';
        this.ctx.fillRect(8, -8, 10, 10);
        break;

      case 'sunflower':
        this.ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          this.ctx.beginPath();
          this.ctx.ellipse(Math.cos(angle) * 12, Math.sin(angle) * 12, 5, 3, angle, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'wallnut':
        this.ctx.fillStyle = '#DEB887';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 12, 15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(-3, -3, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(3, -3, 2, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'snowpea':
        this.ctx.fillStyle = '#00BFFF';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#1E90FF';
        this.ctx.fillRect(8, -8, 12, 10);
        break;

      case 'cherry_bomb':
        this.ctx.fillStyle = '#DC143C';
        this.ctx.beginPath();
        this.ctx.arc(-6, 3, 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(6, 3, 10, 0, Math.PI * 2);
        this.ctx.fill();
        break;
    }

    this.ctx.restore();
  }

  /**
   * 绘制铲子按钮
   */
  drawShovel() {
    const shovel = Config.UI.SHOVEL;
    const ctx = this.ctx;

    ctx.save();

    // 背景
    if (this.isShovelActive) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    }
    ctx.roundRect(shovel.X - 5, shovel.Y - 5, shovel.WIDTH + 10, shovel.HEIGHT + 10, 10);
    ctx.fill();

    // 铲子图标
    ctx.translate(shovel.X + shovel.WIDTH / 2, shovel.Y + shovel.HEIGHT / 2);

    // 铲子柄
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(-3, -5);
    ctx.lineTo(3, -5);
    ctx.lineTo(5, 15);
    ctx.lineTo(-5, 15);
    ctx.closePath();
    ctx.fill();

    // 铲子头
    ctx.fillStyle = '#A9A9A9';
    ctx.beginPath();
    ctx.moveTo(-8, 15);
    ctx.lineTo(-15, 5);
    ctx.lineTo(-18, -5);
    ctx.lineTo(-12, -8);
    ctx.lineTo(8, -8);
    ctx.lineTo(12, -5);
    ctx.lineTo(15, 5);
    ctx.lineTo(8, 15);
    ctx.closePath();
    ctx.fill();

    // 铲子边缘
    ctx.strokeStyle = '#696969';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(-12, -8);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-16, -5);
    ctx.lineTo(-14, -6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // 提示文字
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('铲子', shovel.X + shovel.WIDTH / 2, shovel.Y + shovel.HEIGHT + 20);
  }

  /**
   * 绘制UI
   */
  drawUI() {
    // 阳光计数器
    const sunCounter = Config.UI.SUN_COUNTER;

    // 阳光图标
    this.ctx.save();
    this.ctx.translate(sunCounter.X, sunCounter.Y);

    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
    gradient.addColorStop(0, '#FFFACD');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 18, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();

    // 阳光数量
    this.ctx.fillStyle = '#FFF';
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 3;
    this.ctx.font = 'bold 28px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.strokeText(this.sunManager.getSunCount(), sunCounter.X + 40, sunCounter.Y - 10);
    this.ctx.fillText(this.sunManager.getSunCount(), sunCounter.X + 40, sunCounter.Y - 10);

    // 分数
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`分数: ${this.score}`, this.canvas.width - 20, 30);
    this.ctx.fillText(`僵尸: ${this.zombiesKilled}/${this.maxZombies}`, this.canvas.width - 20, 55);
    
    // 性能信息（调试用）
    if (Config.DEBUG && Config.DEBUG.SHOW_PERF) {
      const stats = this.performanceMonitor.getStats();
      this.ctx.fillStyle = this.performanceMonitor.isLagging() ? '#FF0000' : '#00FF00';
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`FPS: ${this.performanceMonitor.getFPS()}`, 10, 140);
      this.ctx.fillText(`FrameTime: ${stats.avgFrameTime.toFixed(2)}ms`, 10, 155);
      this.ctx.fillText(`Entities: ${stats.activeEntities}`, 10, 170);
    }
  }

  /**
   * 绘制暂停遮罩
   */
  drawPauseOverlay() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('暂停', this.canvas.width / 2, this.canvas.height / 2);

    this.ctx.font = '24px Arial';
    this.ctx.fillText('按 ESC 或 P 继续', this.canvas.width / 2, this.canvas.height / 2 + 50);
  }

  /**
   * 绘制游戏结束
   */
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#FF0000';
    this.ctx.font = 'bold 64px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 2 - 80);

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '28px Arial';
    this.ctx.fillText(`最终分数: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    if (this.currentLevelData) {
      this.ctx.fillStyle = '#AAA';
      this.ctx.font = '20px Arial';
      this.ctx.fillText(`关卡 ${this.currentLevelData.id}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
    
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = '24px Arial';
    this.ctx.fillText('按 L 选择关卡', this.canvas.width / 2, this.canvas.height / 2 + 60);
    
    this.ctx.fillStyle = '#888';
    this.ctx.font = '18px Arial';
    this.ctx.fillText('或刷新页面重新开始', this.canvas.width / 2, this.canvas.height / 2 + 95);
  }

  /**
   * 绘制胜利
   */
  drawWin() {
    this.ctx.fillStyle = 'rgba(0, 100, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 64px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('胜利！', this.canvas.width / 2, this.canvas.height / 2 - 80);

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '28px Arial';
    this.ctx.fillText(`最终分数: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    // 显示解锁的植物
    if (this.currentLevelData && this.currentLevelData.unlockPlant) {
      const plantName = Config.PLANTS[this.currentLevelData.unlockPlant.toUpperCase()]?.name || this.currentLevelData.unlockPlant;
      this.ctx.fillStyle = '#4CAF50';
      this.ctx.fillText(`🎉 解锁新植物：${plantName}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
    
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '24px Arial';
    this.ctx.fillText('按 L 选择关卡', this.canvas.width / 2, this.canvas.height / 2 + 80);
  }
  
  /**
   * 绘制关卡进度（右下角）
   */
  drawLevelProgress() {
    if (!this.currentLevelData) return;
    
    const x = this.canvas.width - 180;
    const y = this.canvas.height - 80;
    const width = 170;
    const height = 70;
    
    // 背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.roundRect(x, y, width, height, 8);
    this.ctx.fill();
    
    // 边框
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // 关卡信息
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(`关卡 ${this.currentLevelData.id}`, x + 10, y + 10);
    
    // 进度条
    const progressBarX = x + 10;
    const progressBarY = y + 35;
    const progressBarWidth = width - 20;
    const progressBarHeight = 20;
    
    // 进度条背景
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
    
    // 进度条填充
    const progress = this.zombiesKilled / this.maxZombies;
    this.ctx.fillStyle = progress >= 1 ? '#4CAF50' : '#FFD700';
    this.ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight);
    
    // 进度条边框
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
    
    // 进度文字
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`${this.zombiesKilled}/${this.maxZombies}`, 
      progressBarX + progressBarWidth / 2, 
      progressBarY + progressBarHeight / 2);
  }

  /**
   * 处理点击
   */
  handleClick(x, y) {
    // 关卡选择界面（最高优先级）
    if (this.levelSelect.visible) {
      this.levelSelect.handleClick(x, y);
      return;
    }
    
    // 登录界面
    if (this.state === GameState.LOADING) {
      if (this.loginScreen.isLoaded()) {
        this.loginScreen.handleClick();
      }
      return;
    }
    
    // 资源上传器
    if (this.assetUploader.visible) {
      this.assetUploader.handleClick(x, y);
      return;
    }

    // 植物编辑器
    if (this.plantEditor.visible) {
      this.plantEditor.handleClick(x, y);
      return;
    }

    // 游戏结束或胜利状态
    if (this.state === GameState.GAME_OVER || this.state === GameState.WIN) {
      return;
    }

    // 暂停状态
    if (this.state === GameState.PAUSED) {
      return;
    }

    // 检查是否点击了阳光
    if (this.sunManager.handleClick(x, y)) {
      return;
    }

    // 检查是否点击了植物选择栏
    if (this.checkPlantBarClick(x, y)) {
      return;
    }

    // 检查是否点击了铲子按钮
    if (this.checkShovelClick(x, y)) {
      return;
    }

    // 使用铲子铲除植物
    if (this.isShovelActive) {
      this.tryRemovePlant(x, y);
      return;
    }

    // 放置植物
    if (this.selectedPlant) {
      this.tryPlacePlant(x, y);
    }
  }

  /**
   * 检查植物选择栏点击
   */
  checkPlantBarClick(x, y) {
    const bar = Config.UI.PLANT_BAR;
    const cellSize = bar.CELL_SIZE;
    const padding = bar.PADDING;
    const unlockedPlants = this.levelSystem.getUnlockedPlants();

    let index = 0;
    for (const plantKey in Config.PLANTS) {
      const plant = Config.PLANTS[plantKey];
      const cardX = bar.X;
      const cardY = bar.Y + index * (cellSize + padding);

      if (x >= cardX && x <= cardX + cellSize &&
          y >= cardY && y <= cardY + cellSize) {
        
        // 检查是否解锁
        const isUnlocked = unlockedPlants.includes(plantKey.toLowerCase());
        if (!isUnlocked) {
          return true; // 未解锁，不做任何操作
        }
        
        // 检查冷却和阳光
        const cooldown = this.plantCooldowns[plantKey.toLowerCase()];
        if (cooldown.timer <= 0 && this.sunManager.getSunCount() >= plant.sunCost) {
          this.selectedPlant = plantKey.toLowerCase();
        }
        return true;
      }

      index++;
    }

    return false;
  }

  /**
   * 检查铲子按钮点击
   */
  checkShovelClick(x, y) {
    const shovel = Config.UI.SHOVEL;

    if (x >= shovel.X && x <= shovel.X + shovel.WIDTH &&
        y >= shovel.Y && y <= shovel.Y + shovel.HEIGHT) {
      this.toggleShovel();
      return true;
    }

    return false;
  }

  /**
   * 尝试放置植物
   */
  tryPlacePlant(x, y) {
    const gridPos = this.grid.screenToGrid(x, y);

    if (gridPos && this.grid.isCellEmptyByIndex(gridPos.index)) {
      const plantConfig = Config.PLANTS[this.selectedPlant.toUpperCase()];

      // 扣除阳光
      if (this.sunManager.spendSun(plantConfig.sunCost)) {
        // 创建植物
        const plant = new Plant(
          this.selectedPlant,
          gridPos.centerX,
          gridPos.centerY,
          gridPos.row,
          gridPos.col
        );

        // 放置到网格
        this.grid.placePlant(gridPos.row, gridPos.col, plant);
        this.plants.push(plant);

        // 设置冷却
        this.plantCooldowns[this.selectedPlant].timer = plantConfig.cooldown;

        // 取消选择
        this.cancelPlantSelection();

        // 放置音效（可选）
        this.playSound('place');
      }
    } else {
      // 放置失败，取消选择
      this.cancelPlantSelection();
    }
  }

  /**
   * 取消植物选择
   */
  cancelPlantSelection() {
    this.selectedPlant = null;
    this.isShovelActive = false;
  }

  /**
   * 切换铲子状态
   */
  toggleShovel() {
    this.isShovelActive = !this.isShovelActive;
    this.selectedPlant = null; // 铲子激活时取消植物选择
  }

  /**
   * 尝试铲除植物
   */
  tryRemovePlant(x, y) {
    const gridPos = this.grid.screenToGrid(x, y);

    if (gridPos) {
      const plant = this.grid.getPlantAtCell(gridPos.row, gridPos.col);

      if (plant && plant.active) {
        // 计算返还的阳光（植物价值的一半）
        const refundSun = Math.floor(plant.sunCost / 2);

        // 生成铲除粒子效果
        this.spawnParticle(plant.x, plant.y, 'leaf', { count: 8 });

        // 生成返还的阳光
        if (refundSun > 0) {
          this.sunManager.addSun(refundSun);
          // 显示阳光获取动画
          this.sunManager.spawnSun(plant.x, plant.y, false);
        }

        // 移除植物
        plant.active = false;
        this.grid.removePlant(gridPos.row, gridPos.col);

        // 铲除音效
        this.playSound('shovel');

        // 取消铲子状态
        this.cancelPlantSelection();
      }
    }
  }

  /**
   * 切换暂停
   */
  togglePause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
    } else if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
    }
  }

  /**
   * 显示关卡选择
   */
  showLevelSelect() {
    this.levelSelect.show();
    this.state = GameState.LOADING; // 使用LOADING状态显示关卡选择
  }
  
  /**
   * 开始关卡
   */
  startLevel(levelId) {
    const levelData = this.levelSystem.startLevel(levelId);
    if (!levelData) {
      alert('关卡未解锁！');
      return;
    }
    
    this.currentLevelData = levelData;
    
    // 重置游戏状态
    this.resetGame();
    
    // 应用关卡配置
    this.maxZombies = levelData.maxZombies;
    this.sunManager.setSunCount(levelData.startSun);
    
    // 开始游戏
    this.state = GameState.PLAYING;
  }
  
  /**
   * 重置游戏
   */
  resetGame() {
    this.plants = [];
    this.zombies = [];
    this.score = 0;
    this.zombiesKilled = 0;
    this.zombiesSpawned = 0;
    this.zombieSpawnTimer = 0;
    this.sunSpawnTimer = 0;
    this.selectedPlant = null;
    this.isShovelActive = false;
    
    this.grid = new Grid();
    this.bulletManager.clear();
    this.particleSystem.clear();
    this.sunManager.clear();
    this.lawnmowerManager.reset();
    this.initPlantCooldowns();
  }
  
  /**
   * 开始游戏（保留兼容性）
   */
  startGame() {
    this.showLevelSelect();
  }

  /**
   * 游戏结束
   */
  gameOver() {
    this.state = GameState.GAME_OVER;
  }

  /**
   * 胜利
   */
  win() {
    this.state = GameState.WIN;
    
    // 完成当前关卡
    if (this.currentLevelData) {
      this.levelSystem.completeLevel(this.currentLevelData.id);
      
      // 显示解锁的植物
      if (this.currentLevelData.unlockPlant) {
        setTimeout(() => {
          const plantName = Config.PLANTS[this.currentLevelData.unlockPlant.toUpperCase()]?.name || this.currentLevelData.unlockPlant;
          alert(`恭喜！解锁新植物：${plantName}！`);
        }, 500);
      }
    }
  }

  /**
   * 增加分数
   */
  addScore(points) {
    this.score += points;
  }

  /**
   * 生成子弹
   */
  spawnBullet(x, y, damage, speed, type) {
    this.bulletManager.spawnBullet(x, y, damage, speed, type);
  }

  /**
   * 生成粒子
   */
  spawnParticle(x, y, type, options) {
    this.particleSystem.emit(x, y, type, options);
  }

  /**
   * 生成阳光
   */
  spawnSun(x, y, isNatural = false) {
    this.sunManager.spawnSun(x, y, isNatural);
  }

  /**
   * 移除植物
   */
  removePlant(row, col) {
    this.grid.removePlant(row, col);
  }

  /**
   * 播放音效（占位）
   */
  playSound(type) {
    // 可以在这里添加音效播放逻辑
    console.log(`Play sound: ${type}`);
  }
}
