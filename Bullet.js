/**
 * 子弹系统
 * 包含不同类型的子弹（普通、减速、溅射）
 */

import { Config } from './config.js';
import { BulletPool } from './ObjectPool.js';

/**
 * 子弹类
 */
export class Bullet {
  constructor(x, y, damage, speed, type, pool = null) {
    this.active = true;
    this.x = x;
    this.y = y;
    this.vx = speed;
    this.vy = 0;
    this.damage = damage;
    this.speed = speed;
    this.type = type;
    this.pool = pool;

    // 从配置获取子弹属性
    const bulletConfig = Config.BULLETS[type.toUpperCase()];
    this.radius = bulletConfig.radius;
    this.color = bulletConfig.color;

    // 特殊效果
    this.slowFactor = bulletConfig.slowFactor || 1;
    this.slowDuration = bulletConfig.slowDuration || 0;
    this.splashRadius = bulletConfig.splashRadius || 0;
    this.splashDamage = bulletConfig.splashDamage || 0;

    // 旋转动画
    this.rotation = 0;
    this.rotationSpeed = 0.1;
  }

  /**
   * 更新子弹
   */
  update(deltaTime) {
    this.x += this.vx * deltaTime / 16.67; // 标准化为 60fps
    this.rotation += this.rotationSpeed;

    // 检查是否超出屏幕
    if (this.x > Config.CANVAS.WIDTH + 50) {
      this.deactivate();
    }
  }

  /**
   * 绘制子弹
   */
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    switch (this.type) {
      case 'normal':
        this.drawNormalBullet(ctx);
        break;
      case 'slow':
        this.drawSlowBullet(ctx);
        break;
      case 'splash':
        this.drawSplashBullet(ctx);
        break;
      default:
        this.drawNormalBullet(ctx);
    }

    ctx.restore();
  }

  /**
   * 绘制普通子弹（绿色豌豆）
   */
  drawNormalBullet(ctx) {
    // 主体
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 高光（比例调整）
    ctx.fillStyle = '#90EE90';
    ctx.beginPath();
    ctx.arc(-3, -3, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制减速子弹（冰蓝色）
   */
  drawSlowBullet(ctx) {
    // 外层光晕（蓝色）
    ctx.fillStyle = 'rgba(0, 102, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
    ctx.fill();

    // 主体（深蓝色）
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 冰晶效果（加粗）
    ctx.strokeStyle = '#CCE6FF';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * (this.radius + 5), Math.sin(angle) * (this.radius + 5));
      ctx.stroke();
    }

    // 高光（比例调整）
    ctx.fillStyle = '#E0F2FF';
    ctx.beginPath();
    ctx.arc(-3, -3, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制溅射子弹（红色）
   */
  drawSplashBullet(ctx) {
    // 主体
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 溅射范围指示器
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, this.splashRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 高光（比例调整）
    ctx.fillStyle = '#FF9999';
    ctx.beginPath();
    ctx.arc(-3, -3, 4, 0, Math.PI * 2);
    ctx.fill();

    // 高光
    ctx.fillStyle = '#FFA07A';
    ctx.beginPath();
    ctx.arc(-2, -2, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 获取碰撞盒
   */
  getBounds() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }

  /**
   * 检测与僵尸的碰撞
   */
  checkCollision(zombie) {
    if (!zombie.active) return false;

    const bounds = this.getBounds();
    const zombieBounds = zombie.getBounds();

    return bounds.x < zombieBounds.x + zombieBounds.width &&
           bounds.x + bounds.width > zombieBounds.x &&
           bounds.y < zombieBounds.y + zombieBounds.height &&
           bounds.y + bounds.height > zombieBounds.y;
  }

  /**
   * 命中僵尸
   */
  hitZombie(zombie, game) {
    // 造成伤害
    zombie.takeDamage(this.damage, game);

    // 减速效果
    if (this.type === 'slow' && this.slowFactor < 1) {
      zombie.applySlow(this.slowFactor, this.slowDuration);
    }

    // 溅射效果
    if (this.type === 'splash' && this.splashRadius > 0) {
      this.applySplashDamage(game);
    }

    this.deactivate();
  }

  /**
   * 溅射伤害
   */
  applySplashDamage(game) {
    for (const zombie of game.zombies) {
      if (!zombie.active) continue;

      const dx = zombie.x - this.x;
      const dy = zombie.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.splashRadius) {
        zombie.takeDamage(this.splashDamage, game);
      }
    }

    // 溅射爆炸效果
    game.spawnParticle(this.x, this.y, 'spark', { count: 8 });
  }

  /**
   * 停用子弹（返回对象池或标记为不活跃）
   */
  deactivate() {
    this.active = false;
    if (this.pool) {
      this.pool.release(this);
    }
  }
}

/**
 * 子弹管理器（使用对象池）
 */
export class BulletManager {
  constructor() {
    this.bullets = [];
    this.pool = new BulletPool(Config.POOL.BULLET_SIZE);
  }

  /**
   * 创建子弹（使用对象池）
   */
  spawnBullet(x, y, damage, speed, type) {
    // 限制最大子弹数量，防止性能问题
    if (this.bullets.length >= Config.POOL.BULLET_SIZE * 2) {
      return null;
    }

    const bullet = new Bullet(x, y, damage, speed, type, this.pool);
    this.bullets.push(bullet);
    return bullet;
  }

  /**
   * 更新所有子弹
   */
  update(deltaTime) {
    // 从后往前遍历，避免 splice 造成索引问题
    let writeIndex = 0;
    for (let i = 0; i < this.bullets.length; i++) {
      const bullet = this.bullets[i];
      bullet.update(deltaTime);

      if (bullet.active) {
        this.bullets[writeIndex++] = bullet;
      } else {
        // 返回对象池
        if (bullet.pool) {
          bullet.pool.release(bullet);
        }
      }
    }
    // 截断数组
    this.bullets.length = writeIndex;
  }

  /**
   * 绘制所有子弹
   */
  draw(ctx) {
    for (const bullet of this.bullets) {
      bullet.draw(ctx);
    }
  }

  /**
   * 清空所有子弹
   */
  clear() {
    this.bullets = [];
  }

  /**
   * 获取当前子弹数量
   */
  getCount() {
    return this.bullets.length;
  }

  /**
   * 检测所有子弹与僵尸的碰撞
   * 优化：先按僵尸X坐标排序，减少不必要的碰撞检测
   */
  checkCollisions(game) {
    const zombies = game.zombies;
    const bulletCount = this.bullets.length;
    const zombieCount = zombies.length;

    // 如果任一列表为空，直接返回
    if (bulletCount === 0 || zombieCount === 0) {
      return;
    }

    for (let i = 0; i < bulletCount; i++) {
      const bullet = this.bullets[i];
      if (!bullet.active) continue;

      // 只检查子弹前方一定范围内的僵尸（优化空间）
      const bulletX = bullet.x;
      const maxCheckDistance = 50; // 子弹检测范围

      for (let j = 0; j < zombieCount; j++) {
        const zombie = zombies[j];
        if (!zombie.active || zombie.isDead) continue;

        // 快速排除：如果僵尸在子弹后方太远，跳过
        if (zombie.x < bulletX - maxCheckDistance) {
          continue;
        }
        // 如果僵尸在子弹前方太远，跳过（注意：不能break，因为没有排序）
        if (zombie.x > bulletX + maxCheckDistance) {
          continue;
        }

        // 检查同一行的僵尸（进一步优化）
        // 计算僵尸所在的行
        const zombieRow = Math.floor((zombie.y - Config.GRID.START_Y) / Config.GRID.CELL_HEIGHT);
        const bulletRow = Math.floor((bullet.y - Config.GRID.START_Y) / Config.GRID.CELL_HEIGHT);

        if (zombieRow !== bulletRow) {
          continue;
        }

        if (bullet.checkCollision(zombie)) {
          bullet.hitZombie(zombie, game);
          break; // 每个子弹只能击中一个僵尸
        }
      }
    }
  }
  
  /**
   * 优化的碰撞检测 - 使用行系统
   */
  checkCollisionsOptimized(game, zombieRowSystem) {
    const bulletCount = this.bullets.length;

    // 如果没有子弹，直接返回
    if (bulletCount === 0) {
      return;
    }

    for (let i = 0; i < bulletCount; i++) {
      const bullet = this.bullets[i];
      if (!bullet.active) continue;

      // 只检查子弹所在行的僵尸
      const bulletRow = Math.floor((bullet.y - Config.GRID.START_Y) / Config.GRID.CELL_HEIGHT);
      const zombiesInRow = zombieRowSystem.getRowObjects(bulletRow);

      if (zombiesInRow.length === 0) continue;

      const bulletX = bullet.x;
      const maxCheckDistance = 50;

      for (let j = 0; j < zombiesInRow.length; j++) {
        const zombie = zombiesInRow[j];
        if (!zombie.active || zombie.isDead) continue;

        // 快速距离检测
        const dx = zombie.x - bulletX;
        if (dx < -maxCheckDistance || dx > maxCheckDistance) {
          continue;
        }

        if (bullet.checkCollision(zombie)) {
          bullet.hitZombie(zombie, game);
          break;
        }
      }
    }
  }
}
