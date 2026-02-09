/**
 * 小推车系统
 * 最后一道防线
 */

import { Config } from './config.js';

export class Lawnmower {
  constructor(row) {
    this.row = row;
    this.x = Config.GRID.START_X - 50;
    this.y = Config.GRID.START_Y + row * Config.GRID.CELL_HEIGHT + Config.GRID.CELL_HEIGHT / 2;
    this.active = true;
    this.triggered = false;
    this.speed = 3; // 推车速度
    this.damage = 999; // 一击必杀
  }
  
  /**
   * 触发推车
   */
  trigger() {
    if (this.triggered) return;
    this.triggered = true;
  }
  
  /**
   * 更新
   */
  update(deltaTime) {
    if (!this.active || !this.triggered) return;
    
    // 向右移动
    this.x += this.speed * deltaTime / 16.67;
    
    // 超出屏幕，停用
    if (this.x > Config.CANVAS.WIDTH + 50) {
      this.active = false;
    }
  }
  
  /**
   * 绘制
   */
  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    
    if (this.triggered) {
      // 移动中的推车（有烟雾效果）
      ctx.globalAlpha = 0.8 + Math.sin(Date.now() / 100) * 0.2;
    }
    
    // 推车主体
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-15, -10, 30, 20);
    
    // 推车边缘
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.strokeRect(-15, -10, 30, 20);
    
    // 轮子
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-10, 12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10, 12, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // 草刀
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.moveTo(15, -8);
    ctx.lineTo(25, -5);
    ctx.lineTo(25, 5);
    ctx.lineTo(15, 8);
    ctx.closePath();
    ctx.fill();
    
    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(-10, -8, 15, 8);
    
    ctx.restore();
  }
  
  /**
   * 检查碰撞
   */
  checkCollision(zombie) {
    if (!this.active || !this.triggered) return false;
    if (!zombie.active || zombie.isDead) return false;
    
    // 检查同一行
    const zombieRow = Math.floor((zombie.y - Config.GRID.START_Y) / Config.GRID.CELL_HEIGHT);
    if (zombieRow !== this.row) return false;
    
    // 检查X坐标重叠
    const distance = Math.abs(zombie.x - this.x);
    return distance < 40;
  }
  
  /**
   * 碰撞僵尸
   */
  hitZombie(zombie, game) {
    zombie.takeDamage(this.damage, game);
  }
  
  /**
   * 获取碰撞盒
   */
  getBounds() {
    return {
      x: this.x - 15,
      y: this.y - 10,
      width: 30,
      height: 20
    };
  }
}

/**
 * 推车管理器
 */
export class LawnmowerManager {
  constructor(rows) {
    this.lawnmowers = [];
    this.rows = rows;
    this.init();
  }
  
  /**
   * 初始化推车
   */
  init() {
    this.lawnmowers = [];
    for (let row = 0; row < this.rows; row++) {
      this.lawnmowers.push(new Lawnmower(row));
    }
  }
  
  /**
   * 检查是否需要触发推车
   */
  checkTrigger(zombies) {
    for (const zombie of zombies) {
      if (!zombie.active || zombie.isDead) continue;
      
      // 僵尸到达左侧边界
      if (zombie.x <= Config.GRID.START_X - 30) {
        const zombieRow = Math.floor((zombie.y - Config.GRID.START_Y) / Config.GRID.CELL_HEIGHT);
        
        // 触发该行的推车
        if (zombieRow >= 0 && zombieRow < this.lawnmowers.length) {
          const lawnmower = this.lawnmowers[zombieRow];
          if (lawnmower.active && !lawnmower.triggered) {
            lawnmower.trigger();
            return true; // 触发了推车
          }
        }
      }
    }
    return false;
  }
  
  /**
   * 更新
   */
  update(deltaTime, game) {
    for (const lawnmower of this.lawnmowers) {
      if (!lawnmower.active) continue;
      
      lawnmower.update(deltaTime);
      
      // 检查与僵尸碰撞
      if (lawnmower.triggered) {
        for (const zombie of game.zombies) {
          if (lawnmower.checkCollision(zombie)) {
            lawnmower.hitZombie(zombie, game);
          }
        }
      }
    }
  }
  
  /**
   * 绘制
   */
  draw(ctx) {
    for (const lawnmower of this.lawnmowers) {
      lawnmower.draw(ctx);
    }
  }
  
  /**
   * 重置
   */
  reset() {
    this.init();
  }
  
  /**
   * 检查是否还有推车
   */
  hasActiveLawnmowers() {
    return this.lawnmowers.some(lm => lm.active && !lm.triggered);
  }
}
