/**
 * 性能优化器
 * 提供各种性能优化工具和方法
 */

import { Config } from './config.js';

/**
 * 空间分割系统 - 用于优化碰撞检测
 */
export class SpatialGrid {
  constructor(width, height, cellSize = 100) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.cells = [];
    this.clear();
  }

  /**
   * 清空所有单元格
   */
  clear() {
    this.cells = [];
    for (let i = 0; i < this.rows * this.cols; i++) {
      this.cells[i] = [];
    }
  }

  /**
   * 获取单元格索引
   */
  getCellIndex(x, y) {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return -1;
    }
    
    return row * this.cols + col;
  }

  /**
   * 插入对象到空间网格
   */
  insert(obj, x, y) {
    const index = this.getCellIndex(x, y);
    if (index !== -1) {
      this.cells[index].push(obj);
    }
  }

  /**
   * 查询附近的对象
   */
  query(x, y, radius = 0) {
    const results = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerCol = Math.floor(x / this.cellSize);
    const centerRow = Math.floor(y / this.cellSize);

    for (let r = centerRow - cellRadius; r <= centerRow + cellRadius; r++) {
      for (let c = centerCol - cellRadius; c <= centerCol + cellRadius; c++) {
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) continue;
        const index = r * this.cols + c;
        results.push(...this.cells[index]);
      }
    }

    return results;
  }
}

/**
 * 按行分组系统 - 用于快速查找同一行的实体
 */
export class RowBasedSystem {
  constructor(rows) {
    this.rows = rows;
    this.rowGroups = [];
    for (let i = 0; i < rows; i++) {
      this.rowGroups[i] = [];
    }
  }

  /**
   * 清空所有行
   */
  clear() {
    for (let i = 0; i < this.rows; i++) {
      this.rowGroups[i] = [];
    }
  }

  /**
   * 获取对象所在的行
   */
  getRow(y) {
    const row = Math.floor((y - Config.GRID.START_Y) / Config.GRID.CELL_HEIGHT);
    return Math.max(0, Math.min(row, this.rows - 1));
  }

  /**
   * 插入对象到行
   */
  insert(obj, y) {
    const row = this.getRow(y);
    this.rowGroups[row].push(obj);
  }

  /**
   * 获取某一行的所有对象
   */
  getRowObjects(row) {
    return this.rowGroups[row] || [];
  }

  /**
   * 获取某个 Y 坐标所在行的所有对象
   */
  getObjectsAtY(y) {
    const row = this.getRow(y);
    return this.rowGroups[row] || [];
  }
}

/**
 * 帧率限制器
 */
export class FrameLimiter {
  constructor(targetFPS = 60) {
    this.targetFPS = targetFPS;
    this.frameInterval = 1000 / targetFPS;
    this.lastFrameTime = 0;
  }

  /**
   * 检查是否应该渲染新帧
   */
  shouldRender(currentTime) {
    if (currentTime - this.lastFrameTime >= this.frameInterval) {
      this.lastFrameTime = currentTime;
      return true;
    }
    return false;
  }
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.fps = 60;
    this.lastFpsUpdate = performance.now();
    this.frameTimes = [];
    this.maxFrameTimes = 60;
    
    // 性能统计
    this.stats = {
      avgFrameTime: 16.67,
      maxFrameTime: 16.67,
      minFrameTime: 16.67,
      activeEntities: 0
    };
  }

  /**
   * 开始帧测量
   */
  startFrame() {
    this.frameStartTime = performance.now();
  }

  /**
   * 结束帧测量
   */
  endFrame() {
    const frameTime = performance.now() - this.frameStartTime;
    this.frameTimes.push(frameTime);
    
    if (this.frameTimes.length > this.maxFrameTimes) {
      this.frameTimes.shift();
    }

    this.frameCount++;
    const now = performance.now();

    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      
      // 计算统计信息
      this.calculateStats();
    }
  }

  /**
   * 计算性能统计
   */
  calculateStats() {
    if (this.frameTimes.length === 0) return;

    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    this.stats.avgFrameTime = sum / this.frameTimes.length;
    this.stats.maxFrameTime = Math.max(...this.frameTimes);
    this.stats.minFrameTime = Math.min(...this.frameTimes);
  }

  /**
   * 获取 FPS
   */
  getFPS() {
    return this.fps;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return this.stats;
  }

  /**
   * 是否卡顿
   */
  isLagging() {
    return this.stats.avgFrameTime > 33; // 低于 30 FPS
  }
}

/**
 * 渲染批处理 - 减少状态切换
 */
export class RenderBatcher {
  constructor(ctx) {
    this.ctx = ctx;
    this.batches = new Map();
  }

  /**
   * 添加到批次
   */
  add(type, drawFn) {
    if (!this.batches.has(type)) {
      this.batches.set(type, []);
    }
    this.batches.get(type).push(drawFn);
  }

  /**
   * 执行所有批次
   */
  flush() {
    for (const [type, drawFns] of this.batches) {
      // 按类型批量绘制，减少状态切换
      this.ctx.save();
      for (const drawFn of drawFns) {
        drawFn(this.ctx);
      }
      this.ctx.restore();
    }
    this.batches.clear();
  }

  /**
   * 清空批次
   */
  clear() {
    this.batches.clear();
  }
}

/**
 * 节流函数
 */
export function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

/**
 * 防抖函数
 */
export function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}
