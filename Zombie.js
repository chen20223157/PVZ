/**
 * 僵尸系统
 * 包含僵尸AI、攻击逻辑和状态机集成
 */

import { Config } from './config.js';
import { StateMachine, WalkingState, AttackingState, DyingState, FrozenState } from './FSM.js';
import { imageManager } from './ImageManager.js';

/**
 * 僵尸基类
 */
export class Zombie {
  constructor(type, row, game) {
    this.type = type;
    this.row = row;
    this.game = game;

    // 从配置获取属性
    const config = Config.ZOMBIES[type.toUpperCase()];
    this.name = config.name;
    this.health = config.health;
    this.maxHealth = config.health;
    this.damage = config.damage;
    this.attackSpeed = config.attackSpeed;
    this.baseSpeed = config.moveSpeed;
    this.speed = this.baseSpeed;
    this.score = config.score;

    // 初始位置（屏幕右侧）
    this.x = Config.CANVAS.WIDTH + 50;
    this.y = Config.GRID.START_Y + row * Config.GRID.CELL_HEIGHT + Config.GRID.CELL_HEIGHT / 2;

    // 状态
    this.active = true;
    this.isDead = false;
    this.gameOver = false;

    // 攻击目标
    this.targetPlant = null;
    this.attackTimer = 0;

    // 状态机
    this.fsm = new StateMachine();
    this.fsm.changeState(new WalkingState(), this);

    // 视觉效果
    this.flashTimer = 0;
    this.hitEffect = false;
    this.animation = 'walking';
    this.animationTimer = 0;
    this.animationFrame = 0;

    // 冰冻效果
    this.isFrozen = false;
    this.slowTimer = 0;
    this.originalSpeed = this.baseSpeed;

    // 摆动动画
    this.wobbleTimer = 0;
    this.wobbleAmount = 0;
  }

  /**
   * 更新僵尸
   */
  update(deltaTime) {
    if (!this.active || this.isDead) return;

    // 更新状态机
    this.fsm.update(this, deltaTime);

    // 恢复受击效果
    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
      if (this.flashTimer <= 0) {
        this.hitEffect = false;
      }
    }

    // 更新动画
    this.updateAnimation(deltaTime);

    // 摆动效果
    this.wobbleTimer += deltaTime * 0.005;
    this.wobbleAmount = Math.sin(this.wobbleTimer) * 2;
  }

  /**
   * 更改状态
   */
  changeState(newState) {
    this.fsm.changeState(newState, this);
  }

  /**
   * 检测是否应该攻击
   */
  shouldAttack() {
    const plants = this.game.grid.getPlantsInRow(this.row);

    for (const { plant, col } of plants) {
      // 检查僵尸是否到达植物位置
      if (this.x - plant.x <= 20 && this.x > plant.x) {
        this.targetPlant = plant;
        return true;
      }
    }

    this.targetPlant = null;
    return false;
  }

  /**
   * 攻击植物
   */
  attackTargetPlant() {
    if (this.targetPlant && this.targetPlant.active) {
      this.targetPlant.takeDamage(this.damage, this.game);
    }
  }

  /**
   * 受到伤害
   */
  takeDamage(damage, game) {
    this.health -= damage;

    // 触发受击效果
    this.hitEffect = true;
    this.flashTimer = Config.VISUAL.FLASH_WHITE_DURATION;

    // 产生灰色火花粒子（减少数量）
    game.spawnParticle(this.x, this.y - 20, 'spark', { count: 2 });

    // 检查是否死亡
    if (this.health <= 0) {
      this.die(game);
    }
  }

  /**
   * 应用减速效果
   */
  applySlow(slowFactor, duration) {
    // 如果已经冰冻，刷新冰冻时间
    if (this.isFrozen) {
      this.slowTimer = duration;
      return;
    }

    // 进入冰冻状态
    this.isFrozen = true;
    this.slowTimer = duration;
    this.speed = this.baseSpeed * slowFactor;

    // 保存当前状态，进入冰冻状态
    const currentState = this.fsm.currentState;
    this.fsm.changeState(new FrozenState(currentState), this);
  }

  /**
   * 死亡
   */
  die(game) {
    this.isDead = true;
    this.fsm.changeState(new DyingState(), this);

    // 增加分数
    game.addScore(this.score);
  }

  /**
   * 生成死亡粒子（肢体散落）
   */
  spawnDeathParticles() {
    this.game.spawnParticle(this.x, this.y - 20, 'limb', { count: 5 });
    this.game.spawnParticle(this.x, this.y, 'spark', { count: 3 });
  }

  /**
   * 更新动画
   */
  updateAnimation(deltaTime) {
    this.animationTimer += deltaTime;
    if (this.animationTimer > 150) { // 每150ms切换一帧
      this.animationTimer = 0;
      this.animationFrame = (this.animationFrame + 1) % 4;
    }
  }

  /**
   * 绘制僵尸
   */
  draw(ctx) {
    if (!this.active) return;

    ctx.save();

    // 受击闪白效果
    if (this.hitEffect) {
      ctx.globalAlpha = 0.7 + Math.sin(this.flashTimer / 10) * 0.3;
    }

    // 死亡淡出效果
    if (this.animation === 'dying') {
      ctx.globalAlpha *= (this.fsm.currentState?.deathTimer || 0) /
                         (this.fsm.currentState?.deathDuration || 500);
    }

    // 检查是否有自定义图片
    const img = imageManager.getImage(`zombie_${this.type}`);
    if (img) {
      this.drawZombieImage(ctx, img);
    } else {
      ctx.translate(this.x + this.wobbleAmount, this.y);

    // 绘制具体僵尸
    switch (this.type) {
      case 'normal':
        this.drawNormalZombie(ctx);
        break;
      case 'conehead':
        this.drawConeheadZombie(ctx);
        break;
      case 'buckethead':
        this.drawBucketheadZombie(ctx);
        break;
      case 'flag':
        this.drawFlagZombie(ctx);
        break;
    }
    }

    ctx.restore();

    // 绘制血条（仅当受伤时）
    if (this.health < this.maxHealth) {
      this.drawHealthBar(ctx);
    }
  }
  
  /**
   * 绘制僵尸图片
   */
  drawZombieImage(ctx, img) {
    const size = 100;
    const imgX = this.x - size / 2 + this.wobbleAmount;
    const imgY = this.y - size / 2;
    
    try {
      ctx.drawImage(img, imgX, imgY, size, size);
    } catch (e) {
      // 图片加载失败，使用默认绘制
      ctx.translate(this.x + this.wobbleAmount, this.y);
      this.drawNormalZombie(ctx);
    }
  }

  /**
   * 绘制普通僵尸
   */
  drawNormalZombie(ctx) {
    // 身体颜色（冰冻时变蓝）
    const bodyColor = this.isFrozen ? '#6B8E23' : '#32CD32';
    const clothesColor = '#4169E1';

    // 腿（走路动画）
    const legOffset = this.animation === 'walking' ?
                      Math.sin(this.animationFrame * Math.PI * 0.5) * 10 : 0;

    ctx.fillStyle = '#696969';
    // 左腿
    ctx.fillRect(-12, 20, 8, 30 + (this.animationFrame % 2 ? legOffset : -legOffset));
    // 右腿
    ctx.fillRect(4, 20, 8, 30 + (this.animationFrame % 2 ? -legOffset : legOffset));

    // 身体
    ctx.fillStyle = clothesColor;
    ctx.fillRect(-15, -15, 30, 35);

    // 领带
    ctx.fillStyle = '#DC143C';
    ctx.fillRect(-5, -15, 10, 25);

    // 手臂（攻击动画）
    const armAngle = this.animation === 'attacking' ? 0.5 : 0;

    ctx.save();
    ctx.rotate(armAngle);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-20, -10, 8, 25); // 左臂
    ctx.fillRect(12, -10, 8, 25); // 右臂
    ctx.restore();

    // 头部
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, -35, 18, 0, Math.PI * 2);
    ctx.fill();

    // 头发
    ctx.fillStyle = '#556B2F';
    ctx.beginPath();
    ctx.arc(0, -45, 15, Math.PI, 0);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-6, -38, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -38, 6, 0, Math.PI * 2);
    ctx.fill();

    // 瞳孔
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-5, -38, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7, -38, 3, 0, Math.PI * 2);
    ctx.fill();

    // 嘴巴
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -28);
    ctx.lineTo(8, -28);
    ctx.stroke();

    // 牙齿
    if (this.animation === 'attacking') {
      ctx.fillStyle = '#FFF';
      ctx.fillRect(-6, -28, 4, 6);
      ctx.fillRect(2, -28, 4, 6);
    }
  }

  /**
   * 绘制路障僵尸
   */
  drawConeheadZombie(ctx) {
    // 先画普通僵尸身体
    this.drawNormalZombieBody(ctx);

    // 路障帽子（根据血量变化）
    const healthRatio = this.health / this.maxHealth;
    const damageLevel = healthRatio < 0.35 ? 2 : healthRatio < 0.7 ? 1 : 0;

    ctx.fillStyle = '#FF6347';

    // 路障主体
    ctx.beginPath();
    ctx.moveTo(-12, -50);
    ctx.lineTo(12, -50);
    ctx.lineTo(6, -65);
    ctx.lineTo(-6, -65);
    ctx.closePath();
    ctx.fill();

    // 受损效果
    if (damageLevel >= 1) {
      ctx.strokeStyle = '#8B0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-5, -52);
      ctx.lineTo(0, -57);
      ctx.lineTo(5, -52);
      ctx.stroke();
    }

    if (damageLevel >= 2) {
      ctx.beginPath();
      ctx.moveTo(-10, -54);
      ctx.lineTo(-6, -60);
      ctx.stroke();
    }
  }

  /**
   * 绘制铁桶僵尸
   */
  drawBucketheadZombie(ctx) {
    // 先画普通僵尸身体
    this.drawNormalZombieBody(ctx);

    // 铁桶帽子（根据血量变化）
    const healthRatio = this.health / this.maxHealth;
    const damageLevel = healthRatio < 0.35 ? 2 : healthRatio < 0.7 ? 1 : 0;

    ctx.fillStyle = '#708090';

    // 铁桶主体
    ctx.beginPath();
    ctx.moveTo(-15, -50);
    ctx.lineTo(15, -50);
    ctx.lineTo(18, -75);
    ctx.lineTo(-18, -75);
    ctx.closePath();
    ctx.fill();

    // 铁桶边缘
    ctx.fillRect(-18, -75, 36, 5);

    // 受损效果
    if (damageLevel >= 1) {
      ctx.strokeStyle = '#2F4F4F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-5, -55);
      ctx.lineTo(5, -55);
      ctx.lineTo(3, -70);
      ctx.lineTo(-3, -70);
      ctx.closePath();
      ctx.stroke();
    }

    if (damageLevel >= 2) {
      ctx.beginPath();
      ctx.moveTo(8, -53);
      ctx.lineTo(12, -70);
      ctx.stroke();
    }
  }

  /**
   * 绘制普通僵尸身体（供其他僵尸类型使用）
   */
  drawNormalZombieBody(ctx) {
    const bodyColor = this.isFrozen ? '#6B8E23' : '#32CD32';
    const clothesColor = '#4169E1';

    // 腿
    const legOffset = this.animation === 'walking' ?
                      Math.sin(this.animationFrame * Math.PI * 0.5) * 10 : 0;

    ctx.fillStyle = '#696969';
    ctx.fillRect(-12, 20, 8, 30 + (this.animationFrame % 2 ? legOffset : -legOffset));
    ctx.fillRect(4, 20, 8, 30 + (this.animationFrame % 2 ? -legOffset : legOffset));

    // 身体
    ctx.fillStyle = clothesColor;
    ctx.fillRect(-15, -15, 30, 35);

    // 领带
    ctx.fillStyle = '#DC143C';
    ctx.fillRect(-5, -15, 10, 25);

    // 手臂
    const armAngle = this.animation === 'attacking' ? 0.5 : 0;

    ctx.save();
    ctx.rotate(armAngle);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-20, -10, 8, 25);
    ctx.fillRect(12, -10, 8, 25);
    ctx.restore();

    // 头部
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, -35, 18, 0, Math.PI * 2);
    ctx.fill();

    // 头发
    ctx.fillStyle = '#556B2F';
    ctx.beginPath();
    ctx.arc(0, -45, 15, Math.PI, 0);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-6, -38, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -38, 6, 0, Math.PI * 2);
    ctx.fill();

    // 瞳孔
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-5, -38, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7, -38, 3, 0, Math.PI * 2);
    ctx.fill();

    // 嘴巴
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -28);
    ctx.lineTo(8, -28);
    ctx.stroke();

    if (this.animation === 'attacking') {
      ctx.fillStyle = '#FFF';
      ctx.fillRect(-6, -28, 4, 6);
      ctx.fillRect(2, -28, 4, 6);
    }
  }

  /**
   * 绘制旗帜僵尸
   */
  drawFlagZombie(ctx) {
    // 先画普通僵尸身体
    this.drawNormalZombieBody(ctx);
    
    // 旗帜杆（在僵尸手上）
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(15, -45, 3, 55);
    
    // 旗帜
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(18, -45);
    ctx.lineTo(18, -25);
    ctx.lineTo(35, -35);
    ctx.closePath();
    ctx.fill();
    
    // 旗帜边缘
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  /**
   * 绘制血条
   */
  drawHealthBar(ctx) {
    const barWidth = 40;
    const barHeight = 6;
    const x = this.x - barWidth / 2;
    const y = this.y - 85;

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
      y: this.y - 75,
      width: 40,
      height: 95
    };
  }
}
