/**
 * 植物系统
 * 包含所有植物类型和它们的逻辑
 */

import { Config } from './config.js';
import { imageManager } from './ImageManager.js';

/**
 * 植物基类
 */
export class Plant {
  constructor(type, x, y, row, col) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.row = row;
    this.col = col;
    this.active = true;

    // 从配置获取属性
    const config = Config.PLANTS[type.toUpperCase()];
    this.name = config.name;
    this.health = config.health;
    this.maxHealth = config.health;
    this.sunCost = config.sunCost;
    this.isWall = config.isWall || false;

    // 攻击属性
    this.attackDamage = config.attackDamage || 0;
    this.attackSpeed = config.attackSpeed || 0;
    this.bulletSpeed = config.bulletSpeed || 0;
    this.bulletType = config.bulletType || 'normal';

    // 向日葵生产阳光属性
    this.productionInterval = config.productionInterval || 0;
    this.sunAmount = config.sunAmount || 0;

    // 状态
    this.attackTimer = 0;
    this.productionTimer = 0;

    // 视觉效果
    this.flashTimer = 0;
    this.hitEffect = false;

    // 动画
    this.animation = 'idle';
    this.animationTimer = 0;
    this.animationFrame = 0;
  }

  /**
   * 更新植物
   */
  update(deltaTime, game) {
    // 恢复受击效果
    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
      if (this.flashTimer <= 0) {
        this.hitEffect = false;
      }
    }

    // 攻击逻辑
    if (this.attackSpeed > 0) {
      this.attackTimer += deltaTime;
      if (this.attackTimer >= this.attackSpeed) {
        this.attackTimer = 0;
        this.shoot(game);
      }
    }

    // 生产阳光逻辑（向日葵）
    if (this.productionInterval > 0) {
      this.productionTimer += deltaTime;
      if (this.productionTimer >= this.productionInterval) {
        this.productionTimer = 0;
        this.produceSun(game);
      }
    }
    
    // 樱桃炸弹爆炸逻辑
    if (this.type === 'cherry_bomb') {
      this.productionTimer += deltaTime;
      if (this.productionTimer >= 1500) { // 1.5秒后爆炸
        this.explode(game);
      }
    }

    // 更新动画
    this.updateAnimation(deltaTime);
  }
  
  /**
   * 樱桃炸弹爆炸
   */
  explode(game) {
    if (!this.active) return;
    
    const explodeRadius = 150; // 爆炸范围
    const explodeDamage = 200; // 爆炸伤害
    
    // 对范围内的僵尸造成伤害
    for (const zombie of game.zombies) {
      if (!zombie.active || zombie.isDead) continue;
      
      const dx = zombie.x - this.x;
      const dy = zombie.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= explodeRadius) {
        zombie.takeDamage(explodeDamage, game);
      }
    }
    
    // 爆炸粒子效果
    game.spawnParticle(this.x, this.y, 'circle', { count: 20 });
    game.particleSystem.explode(this.x, this.y, explodeRadius, '#FF4500');
    
    // 移除自己
    this.active = false;
    game.removePlant(this.row, this.col);
  }

  /**
   * 攻击（发射子弹）
   */
  shoot(game) {
    // 子弹从植物头部位置发射
    const bulletX = this.x + 20;
    const bulletY = this.y - 10;

    game.spawnBullet(bulletX, bulletY, this.attackDamage, this.bulletSpeed, this.bulletType);
  }

  /**
   * 生产阳光（向日葵）
   */
  produceSun(game) {
    // 在向日葵附近生成阳光
    const offsetX = (Math.random() - 0.5) * 40;
    const offsetY = (Math.random() - 0.5) * 20;
    game.spawnSun(this.x + offsetX, this.y + offsetY, false);
  }

  /**
   * 受到伤害
   */
  takeDamage(damage, game) {
    this.health -= damage;

    // 触发受击效果
    this.hitEffect = true;
    this.flashTimer = Config.VISUAL.FLASH_WHITE_DURATION;

    // 产生绿色碎片粒子（减少数量）
    game.spawnParticle(this.x, this.y, 'leaf', { count: 1 });

    // 检查是否死亡
    if (this.health <= 0) {
      this.die(game);
    }
  }

  /**
   * 死亡
   */
  die(game) {
    this.active = false;

    // 产生更多碎片（减少数量）
    game.spawnParticle(this.x, this.y, 'leaf', { count: 3 });

    // 移除植物，恢复网格可用性
    game.removePlant(this.row, this.col);
  }

  /**
   * 更新动画
   */
  updateAnimation(deltaTime) {
    this.animationTimer += deltaTime;
    if (this.animationTimer > 200) { // 每200ms切换一帧
      this.animationTimer = 0;
      this.animationFrame = (this.animationFrame + 1) % 2;
    }
  }

  /**
   * 绘制植物
   */
  draw(ctx) {
    ctx.save();

    // 受击闪白效果
    if (this.hitEffect) {
      ctx.globalAlpha = 0.5 + Math.sin(this.flashTimer / 10) * 0.5;
    }

    // 检查是否有自定义图片
    const img = imageManager.getImage(`plant_${this.type}`);
    if (img) {
      this.drawPlantImage(ctx, img);
    } else {
      this.drawPlant(ctx);
    }

    ctx.restore();

    // 始终绘制血条
    this.drawHealthBar(ctx);
  }
  
  /**
   * 绘制植物图片
   */
  drawPlantImage(ctx, img) {
    const size = 80;
    const imgX = this.x - size / 2;
    const imgY = this.y - size / 2;
    
    try {
      ctx.drawImage(img, imgX, imgY, size, size);
    } catch (e) {
      // 图片加载失败，使用默认绘制
      this.drawPlant(ctx);
    }
  }

  /**
   * 绘制具体植物（子类可覆盖）
   */
  drawPlant(ctx) {
    ctx.translate(this.x, this.y);

    // 检查是否为自定义植物
    const plantConfig = Config.PLANTS[this.type.toUpperCase()];
    if (plantConfig && plantConfig._custom) {
      this.drawCustomPlant(ctx, plantConfig);
      return;
    }

    // 根据类型绘制不同的植物
    switch (this.type) {
      case 'peashooter':
        this.drawPeashooter(ctx);
        break;
      case 'sunflower':
        this.drawSunflower(ctx);
        break;
      case 'wallnut':
        this.drawWallnut(ctx);
        break;
      case 'snowpea':
        this.drawSnowpea(ctx);
        break;
      case 'cherry_bomb':
        this.drawCherryBomb(ctx);
        break;
    }
  }

  /**
   * 绘制自定义植物
   */
  drawCustomPlant(ctx, config) {
    const color = config._color || '#00FF00';
    const size = config._size || 30;
    const shape = config._shape || 'circle';
    const specialType = config._specialType || 'none';
    const hasStem = config._hasStem !== false;
    const hasLeaves = config._hasLeaves !== false;

    // 茎
    if (hasStem) {
      ctx.fillStyle = '#228B22';
      ctx.fillRect(-3, 0, 6, 20);
    }

    // 叶子
    if (hasLeaves) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(-10, 10, 15, 8, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(10, 15, 12, 6, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 主体
    const headOffset = Math.sin(this.animationFrame * Math.PI) * 2;
    ctx.translate(0, -20 + headOffset);
    ctx.fillStyle = color;

    switch (shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'ellipse':
        ctx.beginPath();
        ctx.ellipse(0, 0, size / 2, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'rect':
        ctx.fillRect(-size / 2, -size / 2, size, size);
        break;
    }

    // 枪口（如果是射手类型）
    if (specialType === 'shooter') {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(size / 2, -size / 4, size / 2, size / 2);
      ctx.globalAlpha = 1;
    }

    // 眼睛
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(size / 6, -size / 6, size / 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(size / 5, -size / 5, size / 20, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制豌豆射手
   */
  drawPeashooter(ctx) {
    // 茎
    ctx.fillStyle = '#228B22';
    ctx.fillRect(-5, 0, 10, 20);

    // 叶子
    ctx.beginPath();
    ctx.ellipse(-10, 10, 15, 8, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10, 15, 12, 6, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 头部（根据动画帧略微摆动）
    const headOffset = Math.sin(this.animationFrame * Math.PI) * 2;
    ctx.translate(0, -20 + headOffset);

    // 头部主体
    ctx.fillStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // 枪口
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(10, -8, 15, 16);

    // 眼睛
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(5, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(6, -6, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制向日葵
   */
  drawSunflower(ctx) {
    // 茎
    ctx.fillStyle = '#228B22';
    ctx.fillRect(-3, 0, 6, 25);

    // 叶子
    ctx.beginPath();
    ctx.ellipse(-8, 12, 12, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, 18, 10, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 头部
    ctx.translate(0, -20);

    // 花瓣（旋转动画）
    ctx.rotate(this.animationTimer * 0.005);

    const petalCount = 12;
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(angle) * 18,
        Math.sin(angle) * 18,
        8, 4, angle, 0, Math.PI * 2
      );
      ctx.fill();
    }

    ctx.rotate(-this.animationTimer * 0.005);

    // 花心
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // 花心纹理
    ctx.fillStyle = '#D2691E';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * 5,
        Math.sin(angle) * 5,
        2, 0, Math.PI * 2
      );
      ctx.fill();
    }
  }

  /**
   * 绘制坚果
   */
  drawWallnut(ctx) {
    ctx.translate(0, -5);

    // 主体（根据健康度变化外观）
    const damageRatio = this.health / this.maxHealth;
    const hasCracks = damageRatio < 0.5;
    const hasMoreCracks = damageRatio < 0.25;

    ctx.fillStyle = hasCracks ? '#D2B48C' : '#DEB887';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 纹理
    ctx.fillStyle = '#CD853F';
    ctx.beginPath();
    ctx.ellipse(0, -5, 15, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-6, -8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -8, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-5, -9, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7, -9, 2, 0, Math.PI * 2);
    ctx.fill();

    // 裂缝
    if (hasCracks) {
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 5);
      ctx.lineTo(-5, 10);
      ctx.lineTo(-3, 8);
      ctx.stroke();
    }

    if (hasMoreCracks) {
      ctx.beginPath();
      ctx.moveTo(8, 2);
      ctx.lineTo(12, 7);
      ctx.lineTo(10, 5);
      ctx.stroke();
    }
  }

  /**
   * 绘制寒冰射手
   */
  drawSnowpea(ctx) {
    // 茎（冰蓝色）
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(-5, 0, 10, 20);

    // 叶子
    ctx.beginPath();
    ctx.ellipse(-10, 10, 15, 8, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10, 15, 12, 6, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 头部
    const headOffset = Math.sin(this.animationFrame * Math.PI) * 2;
    ctx.translate(0, -20 + headOffset);

    // 头部主体（冰蓝色）
    ctx.fillStyle = '#00BFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // 枪口（更长）
    ctx.fillStyle = '#1E90FF';
    ctx.fillRect(10, -8, 18, 16);

    // 冰晶装饰
    ctx.fillStyle = '#E0FFFF';
    ctx.beginPath();
    ctx.moveTo(22, -5);
    ctx.lineTo(28, 0);
    ctx.lineTo(22, 5);
    ctx.closePath();
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(5, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(6, -6, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制樱桃炸弹
   */
  drawCherryBomb(ctx) {
    ctx.translate(0, -10);

    // 爆炸倒计时效果
    const progress = Math.min(this.productionTimer / 1000, 1);
    const scale = 1 + progress * 0.2;
    ctx.scale(scale, scale);

    // 茎
    ctx.fillStyle = '#228B22';
    ctx.fillRect(-2, 15, 4, 15);

    // 樱桃1
    ctx.fillStyle = '#DC143C';
    ctx.beginPath();
    ctx.arc(-10, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.arc(-12, -3, 6, 0, Math.PI * 2);
    ctx.fill();

    // 樱桃2
    ctx.fillStyle = '#DC143C';
    ctx.beginPath();
    ctx.arc(10, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.arc(12, -3, 6, 0, Math.PI * 2);
    ctx.fill();

    // 导火索火花
    if (progress < 1) {
      ctx.fillStyle = '#FF4500';
      ctx.beginPath();
      ctx.arc(0, -20 + Math.random() * 5, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.arc(0, -20 + Math.random() * 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * 绘制血条
   */
  drawHealthBar(ctx) {
    const barWidth = 40;
    const barHeight = 6;
    const x = this.x - barWidth / 2;
    const y = this.y - 50;

    // 背景
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);

    // 血量
    const healthRatio = this.health / this.maxHealth;
    ctx.fillStyle = healthRatio > 0.3 ? '#00FF00' : '#FF0000';
    ctx.fillRect(x, y, barWidth * healthRatio, barHeight);

    // 边框
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

  /**
   * 获取碰撞盒
   */
  getBounds() {
    return {
      x: this.x - 20,
      y: this.y - 40,
      width: 40,
      height: 50
    };
  }
}
