/**
 * 粒子系统
 * 用于处理各种视觉效果（火花、碎片、肢体散落等）
 */

import { Config } from './config.js';
import { ParticlePool } from './ObjectPool.js';
import { Particle } from './Particle.js';

// 导出 Particle 类供其他模块使用
export { Particle };

/**
 * 粒子系统管理器
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.pool = new ParticlePool(Config.POOL.PARTICLE_SIZE);
  }

  /**
   * 发射粒子
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {string} type - 粒子类型
   * @param {Object} options - 粒子选项
   */
  emit(x, y, type, options = {}) {
    const particleConfig = Config.PARTICLES[type.toUpperCase()];

    switch (type) {
      case 'spark':
        // 灰色火花（僵尸被击中）
        this.emitMultiple(x, y, type, {
          count: options.count || 5,
          color: particleConfig.color,
          minSize: particleConfig.minSize,
          maxSize: particleConfig.maxSize,
          life: particleConfig.life,
          velocity: particleConfig.velocity
        });
        break;

      case 'leaf':
        // 绿色碎片（植物被啃咬）
        this.emitMultiple(x, y, type, {
          count: options.count || 3,
          color: particleConfig.color,
          minSize: particleConfig.minSize,
          maxSize: particleConfig.maxSize,
          life: particleConfig.life,
          velocity: particleConfig.velocity
        });
        break;

      case 'limb':
        // 肢体散落（僵尸死亡）
        this.emitMultiple(x, y, type, {
          count: options.count || 8,
          color: particleConfig.color,
          minSize: particleConfig.minSize,
          maxSize: particleConfig.maxSize,
          life: particleConfig.life,
          velocity: particleConfig.velocity
        });
        break;

      default:
        // 自定义粒子
        this.emitSingle(x, y, type, options);
    }
  }

  /**
   * 发射多个粒子
   */
  emitMultiple(x, y, type, options) {
    // 严格限制粒子数量，防止性能问题
    const maxParticles = Config.PERFORMANCE.MAX_ACTIVE_PARTICLES;
    const count = options.count || 1;
    
    // 如果已达到上限，跳过部分粒子
    if (this.particles.length >= maxParticles) {
      return;
    }
    
    const actualCount = Math.min(count, maxParticles - this.particles.length);
    if (actualCount <= 0) return;

    for (let i = 0; i < actualCount; i++) {
      const size = options.minSize + Math.random() * (options.maxSize - options.minSize);
      const particle = this.pool.get();

      particle.init(x, y, type, {
        color: options.color,
        size: size,
        life: options.life + Math.random() * 5,
        velocity: options.velocity,
        gravity: type === 'limb' ? 0.15 : type === 'leaf' ? 0.05 : 0,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });

      this.particles.push(particle);
    }
  }

  /**
   * 发射单个粒子
   */
  emitSingle(x, y, type, options) {
    const particle = this.pool.get();
    particle.init(x, y, type, options);
    this.particles.push(particle);
  }

  /**
   * 爆炸效果
   */
  explode(x, y, radius, color = '#FF4500') {
    // 限制粒子数量
    if (this.particles.length >= Config.PERFORMANCE.MAX_ACTIVE_PARTICLES) {
      return;
    }
    
    const count = Math.min(15, Config.PERFORMANCE.MAX_ACTIVE_PARTICLES - this.particles.length); // 减少数量
    for (let i = 0; i < count; i++) {
      const particle = this.pool.get();
      const angle = (i / count) * Math.PI * 2;
      const speed = 3 + Math.random() * 2;

      particle.init(x, y, 'circle', {
        color: color,
        size: 3 + Math.random() * 3,
        life: 20 + Math.random() * 10,
        velocity: speed,
        alpha: 1,
        gravity: 0.1,
        rotationSpeed: 0.1
      });

      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;

      this.particles.push(particle);
    }
  }

  /**
   * 更新所有粒子
   */
  update() {
    // 使用写索引模式，避免 splice 操作
    let writeIndex = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      if (particle.update()) {
        this.particles[writeIndex++] = particle;
      } else {
        this.pool.release(particle);
      }
    }
    // 截断数组
    this.particles.length = writeIndex;
  }

  /**
   * 绘制所有粒子
   */
  draw(ctx) {
    for (const particle of this.particles) {
      particle.draw(ctx);
    }
  }

  /**
   * 清空所有粒子
   */
  clear() {
    for (const particle of this.particles) {
      this.pool.release(particle);
    }
    this.particles = [];
  }

  /**
   * 获取当前粒子数量
   */
  getCount() {
    return this.particles.length;
  }
}
