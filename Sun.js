/**
 * 阳光经济系统
 * 实现阳光的掉落、收集和贝塞尔曲线动画
 */

import { Config } from './config.js';

/**
 * 阳光类
 */
export class Sun {
  constructor(x, y, value = Config.SUN.VALUE, isNatural = true) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.isNatural = isNatural;

    this.active = true;
    this.radius = Config.SUN.RADIUS;
    this.targetX = Config.UI.SUN_COUNTER.X + 20;
    this.targetY = Config.UI.SUN_COUNTER.Y + 20;

    // 自然阳光掉落动画
    this.dropStartY = isNatural ? -50 : y;
    this.dropTargetY = y;
    this.dropProgress = 0;
    this.isDropping = isNatural;
    this.dropDuration = 2000; // 掉落动画时长

    // 收集动画
    this.isCollecting = false;
    this.collectProgress = 0;
    this.collectDuration = Config.SUN.COLLECTION_DURATION;
    this.collectStartX = 0;
    this.collectStartY = 0;

    // 动画
    this.rotation = 0;
    this.rotationSpeed = 0.02;
    this.pulsePhase = 0;

    // 自动消失（自然阳光）
    this.autoDestroyTimer = 0;
    this.autoDestroyDelay = 8000; // 8秒后消失
  }

  /**
   * 更新阳光
   */
  update(deltaTime) {
    if (!this.active) return;

    this.rotation += this.rotationSpeed;
    this.pulsePhase += deltaTime * 0.005;

    // 掉落动画
    if (this.isDropping) {
      this.dropProgress += deltaTime;
      const progress = Math.min(this.dropProgress / this.dropDuration, 1);

      // 缓动函数：easeOutBounce
      const bounce = this.easeOutBounce(progress);
      this.y = this.dropStartY + (this.dropTargetY - this.dropStartY) * bounce;

      if (progress >= 1) {
        this.isDropping = false;
      }
    }
    // 收集动画（贝塞尔曲线）
    else if (this.isCollecting) {
      this.collectProgress += deltaTime;
      const progress = Math.min(this.collectProgress / this.collectDuration, 1);

      // 贝塞尔曲线控制点
      const cp1x = this.collectStartX;
      const cp1y = this.collectStartY - 50;
      const cp2x = this.targetX - 50;
      const cp2y = this.targetY - 50;

      // 三次贝塞尔曲线
      const t = progress;
      this.x = this.calculateBezierPoint(
        t, this.collectStartX, cp1x, cp2x, this.targetX
      );
      this.y = this.calculateBezierPoint(
        t, this.collectStartY, cp1y, cp2y, this.targetY
      );

      // 逐渐缩小
      this.radius = Config.SUN.RADIUS * (1 - progress * 0.5);

      if (progress >= 1) {
        this.active = false;
        return this.value; // 返回收集到的阳光值
      }
    }
    // 等待收集（自动消失计时）
    else if (this.isNatural) {
      this.autoDestroyTimer += deltaTime;
      if (this.autoDestroyTimer >= this.autoDestroyDelay) {
        this.active = false;
      }
    }

    return 0;
  }

  /**
   * 绘制阳光
   */
  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // 脉冲效果（大小变化）
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;
    ctx.scale(pulse, pulse);

    // 外圈光晕
    const gradient = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, this.radius * 1.5);
    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 主体
    const sunGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
    sunGradient.addColorStop(0, '#FFFACD');
    sunGradient.addColorStop(0.5, '#FFD700');
    sunGradient.addColorStop(1, '#FFA500');
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 光芒
    const rayCount = 12;
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const rayLength = this.radius * 1.3 + Math.sin(this.pulsePhase * 2 + i) * 5;

      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius);
      ctx.lineTo(Math.cos(angle - 0.1) * rayLength, Math.sin(angle - 0.1) * rayLength);
      ctx.lineTo(Math.cos(angle + 0.1) * rayLength, Math.sin(angle + 0.1) * rayLength);
      ctx.lineTo(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius);
      ctx.fill();
    }

    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * 检测点击
   */
  checkClick(x, y) {
    if (!this.active || this.isCollecting) return false;

    const dx = this.x - x;
    const dy = this.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= this.radius + 10) {
      this.startCollecting();
      return true;
    }

    return false;
  }

  /**
   * 开始收集动画
   */
  startCollecting() {
    this.isCollecting = true;
    this.collectProgress = 0;
    this.collectStartX = this.x;
    this.collectStartY = this.y;
  }

  /**
   * easeOutBounce 缓动函数
   */
  easeOutBounce(t) {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }

  /**
   * 计算三次贝塞尔曲线上的点
   */
  calculateBezierPoint(t, p0, p1, p2, p3) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    return uuu * p0 +
           3 * uu * t * p1 +
           3 * u * tt * p2 +
           ttt * p3;
  }

  /**
   * 获取碰撞盒
   */
  getBounds() {
    return {
      x: this.x - this.radius - 10,
      y: this.y - this.radius - 10,
      width: (this.radius + 10) * 2,
      height: (this.radius + 10) * 2
    };
  }
}

/**
 * 阳光管理器
 */
export class SunManager {
  constructor() {
    this.suns = [];
    this.sunCount = Config.GAME.SUN_START;
  }

  /**
   * 生成自然阳光
   */
  spawnNaturalSun() {
    const x = Config.GRID.START_X + Math.random() * Config.GRID.COLS * Config.GRID.CELL_WIDTH;
    const y = Config.GRID.START_Y + Math.random() * Config.GRID.ROWS * Config.GRID.CELL_HEIGHT;

    const sun = new Sun(x, y, Config.SUN.NATURAL_SUN_COUNT, true);
    this.suns.push(sun);
  }

  /**
   * 生成阳光（通用）
   */
  spawnSun(x, y, isNatural = true) {
    const sun = new Sun(x, y, Config.SUN.VALUE, isNatural);
    this.suns.push(sun);
  }

  /**
   * 更新所有阳光
   */
  update(deltaTime) {
    // 使用写索引模式，避免 splice 操作
    let writeIndex = 0;
    for (let i = 0; i < this.suns.length; i++) {
      const sun = this.suns[i];
      const collected = sun.update(deltaTime);

      if (collected > 0) {
        this.sunCount += collected;
      }

      if (sun.active) {
        this.suns[writeIndex++] = sun;
      }
    }
    // 截断数组
    this.suns.length = writeIndex;
  }

  /**
   * 绘制所有阳光
   */
  draw(ctx) {
    for (const sun of this.suns) {
      sun.draw(ctx);
    }
  }

  /**
   * 处理点击
   */
  handleClick(x, y) {
    for (const sun of this.suns) {
      if (sun.checkClick(x, y)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 清空所有阳光
   */
  clear() {
    this.suns = [];
  }

  /**
   * 获取当前阳光数量
   */
  getSunCount() {
    return this.sunCount;
  }

  /**
   * 花费阳光
   */
  spendSun(amount) {
    if (this.sunCount >= amount) {
      this.sunCount -= amount;
      return true;
    }
    return false;
  }

  /**
   * 添加阳光
   */
  addSun(amount) {
    this.sunCount += amount;
  }
  
  /**
   * 设置阳光数量
   */
  setSunCount(amount) {
    this.sunCount = amount;
  }

  /**
   * 获取阳光数量
   */
  getCount() {
    return this.suns.length;
  }
}
