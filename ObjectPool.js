/**
 * 对象池系统
 * 用于管理子弹和粒子对象的重用，避免频繁创建/销毁导致的内存问题
 */

import { Particle } from './Particle.js';

export class ObjectPool {
  /**
   * 创建对象池
   * @param {Function} createFn 创建对象的函数
   * @param {Function} resetFn 重置对象的函数
   * @param {number} initialSize 初始大小
   */
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.activeCount = 0;

    // 预分配对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  /**
   * 获取一个对象
   * @returns {Object} 对象实例
   */
  get() {
    let obj = this.pool.pop();

    // 如果池中没有可用对象，创建新的
    if (!obj) {
      obj = this.createFn();
      // 记录需要扩展池大小
      console.log('对象池扩展，建议增加初始大小');
    }

    this.activeCount++;
    return obj;
  }

  /**
   * 释放对象回池
   * @param {Object} obj 要释放的对象
   */
  release(obj) {
    // 重置对象状态
    this.resetFn(obj);
    this.pool.push(obj);
    this.activeCount--;
  }

  /**
   * 获取当前活动对象数量
   */
  getActiveCount() {
    return this.activeCount;
  }

  /**
   * 获取池中可用对象数量
   */
  getAvailableCount() {
    return this.pool.length;
  }

  /**
   * 清空对象池（慎用）
   */
  clear() {
    this.pool = [];
    this.activeCount = 0;
  }
}

/**
 * 子弹对象池
 */
export class BulletPool extends ObjectPool {
  constructor(initialSize = 50) {
    super(
      () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, damage: 0, type: 'normal', radius: 5 }),
      (obj) => {
        obj.active = false;
        obj.x = 0;
        obj.y = 0;
        obj.vx = 0;
        obj.vy = 0;
        obj.damage = 0;
        obj.type = 'normal';
        obj.radius = 5;
      },
      initialSize
    );
  }
}

/**
 * 粒子对象池
 */
export class ParticlePool extends ObjectPool {
  constructor(initialSize = 100) {
    super(
      () => new Particle(),
      (obj) => {
        obj.active = false;
        obj.x = 0;
        obj.y = 0;
        obj.vx = 0;
        obj.vy = 0;
        obj.life = 0;
        obj.maxLife = 0;
        obj.color = '#FFFFFF';
        obj.size = 2;
        obj.type = 'spark';
        obj.alpha = 1;
        obj.rotation = 0;
        obj.rotationSpeed = 0;
      },
      initialSize
    );
  }
}
