/**
 * 关卡选择界面
 */

import { levelSystem } from './LevelSystem.js';

export class LevelSelect {
  constructor(canvas, onLevelStart) {
    this.canvas = canvas;
    this.onLevelStart = onLevelStart;
    this.visible = false;
    
    // UI配置
    this.panelWidth = 800;
    this.panelHeight = 550;
    this.panelX = 50;
    this.panelY = 25;
    
    // 关卡卡片配置
    this.cardWidth = 180;
    this.cardHeight = 120;
    this.cardPadding = 15;
    this.cols = 4;
    
    // 滚动
    this.scrollOffset = 0;
    this.maxScroll = 0;
    
    // 按钮
    this.closeButton = {
      x: this.panelX + this.panelWidth - 50,
      y: this.panelY + 10,
      width: 40,
      height: 40
    };
  }
  
  /**
   * 显示/隐藏
   */
  toggle() {
    this.visible = !this.visible;
    if (this.visible) {
      this.scrollOffset = 0;
    }
  }
  
  /**
   * 显示
   */
  show() {
    this.visible = true;
    this.scrollOffset = 0;
  }
  
  /**
   * 隐藏
   */
  hide() {
    this.visible = false;
  }
  
  /**
   * 处理点击
   */
  handleClick(x, y) {
    if (!this.visible) return false;
    
    // 关闭按钮
    if (x >= this.closeButton.x && x <= this.closeButton.x + this.closeButton.width &&
        y >= this.closeButton.y && y <= this.closeButton.y + this.closeButton.height) {
      this.hide();
      return true;
    }
    
    // 关卡卡片
    if (this.handleLevelCardClick(x, y)) {
      return true;
    }
    
    // 点击面板区域
    if (x >= this.panelX && x <= this.panelX + this.panelWidth &&
        y >= this.panelY && y <= this.panelY + this.panelHeight) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 处理关卡卡片点击
   */
  handleLevelCardClick(x, y) {
    const levels = levelSystem.getLevels();
    const contentX = this.panelX + 20;
    const contentY = this.panelY + 80;
    const contentWidth = this.panelWidth - 40;
    const contentHeight = this.panelHeight - 100;
    
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const row = Math.floor(i / this.cols);
      const col = i % this.cols;
      
      const cardX = contentX + col * (this.cardWidth + this.cardPadding);
      const cardY = contentY + row * (this.cardHeight + this.cardPadding) - this.scrollOffset;
      
      // 跳过不可见的
      if (cardY + this.cardHeight < contentY || cardY > contentY + contentHeight) {
        continue;
      }
      
      // 检查点击
      if (x >= cardX && x <= cardX + this.cardWidth &&
          y >= cardY && y <= cardY + this.cardHeight) {
        
        // 检查是否解锁
        if (levelSystem.isLevelUnlocked(level.id)) {
          this.hide();
          this.onLevelStart(level.id);
        }
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 处理滚轮
   */
  handleWheel(deltaY) {
    if (!this.visible) return false;
    
    this.scrollOffset += deltaY * 0.5;
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScroll));
    
    return true;
  }
  
  /**
   * 绘制
   */
  draw(ctx) {
    if (!this.visible) return;
    
    ctx.save();
    
    // 半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 面板背景
    ctx.fillStyle = 'rgba(30, 30, 30, 0.95)';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    this.roundRect(ctx, this.panelX, this.panelY, this.panelWidth, this.panelHeight, 10);
    ctx.fill();
    ctx.stroke();
    
    // 标题
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('关卡选择', this.panelX + this.panelWidth / 2, this.panelY + 20);
    
    // 关闭按钮
    ctx.fillStyle = '#FF4444';
    this.roundRect(ctx, this.closeButton.x, this.closeButton.y, 
                   this.closeButton.width, this.closeButton.height, 5);
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('×', this.closeButton.x + this.closeButton.width / 2,
                      this.closeButton.y + this.closeButton.height / 2);
    
    // 绘制关卡卡片
    this.drawLevelCards(ctx);
    
    ctx.restore();
  }
  
  /**
   * 绘制关卡卡片
   */
  drawLevelCards(ctx) {
    const levels = levelSystem.getLevels();
    const contentX = this.panelX + 20;
    const contentY = this.panelY + 80;
    const contentWidth = this.panelWidth - 40;
    const contentHeight = this.panelHeight - 100;
    
    // 裁剪
    ctx.save();
    ctx.beginPath();
    ctx.rect(contentX, contentY, contentWidth, contentHeight);
    ctx.clip();
    
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const row = Math.floor(i / this.cols);
      const col = i % this.cols;
      
      const cardX = contentX + col * (this.cardWidth + this.cardPadding);
      const cardY = contentY + row * (this.cardHeight + this.cardPadding) - this.scrollOffset;
      
      // 跳过不可见的
      if (cardY + this.cardHeight < contentY || cardY > contentY + contentHeight) {
        continue;
      }
      
      this.drawLevelCard(ctx, level, cardX, cardY);
    }
    
    ctx.restore();
    
    // 计算滚动距离
    const rows = Math.ceil(levels.length / this.cols);
    const totalHeight = rows * (this.cardHeight + this.cardPadding);
    this.maxScroll = Math.max(0, totalHeight - contentHeight);
    
    // 滚动条
    if (this.maxScroll > 0) {
      this.drawScrollbar(ctx, contentX, contentY, contentWidth, contentHeight);
    }
  }
  
  /**
   * 绘制关卡卡片
   */
  drawLevelCard(ctx, level, x, y) {
    const unlocked = levelSystem.isLevelUnlocked(level.id);
    const completed = levelSystem.isLevelCompleted(level.id);
    
    // 背景
    if (!unlocked) {
      ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
    } else if (completed) {
      ctx.fillStyle = 'rgba(50, 100, 50, 0.9)';
    } else {
      ctx.fillStyle = 'rgba(100, 70, 30, 0.9)';
    }
    
    this.roundRect(ctx, x, y, this.cardWidth, this.cardHeight, 8);
    ctx.fill();
    
    // 边框
    ctx.strokeStyle = completed ? '#4CAF50' : unlocked ? '#FFD700' : '#666';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 关卡编号
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`第 ${level.id} 关`, x + this.cardWidth / 2, y + 10);
    
    // 关卡名称
    ctx.font = '14px Arial';
    ctx.fillText(level.name.split(' - ')[1] || level.name, x + this.cardWidth / 2, y + 45);
    
    // 难度
    const difficultyText = {
      'easy': '简单',
      'medium': '中等',
      'hard': '困难',
      'extreme': '极难'
    }[level.difficulty] || '未知';
    
    ctx.font = '12px Arial';
    ctx.fillStyle = level.difficulty === 'extreme' ? '#FF0000' : 
                    level.difficulty === 'hard' ? '#FF6600' :
                    level.difficulty === 'medium' ? '#FFAA00' : '#00FF00';
    ctx.fillText(difficultyText, x + this.cardWidth / 2, y + 65);
    
    // 状态图标
    if (!unlocked) {
      ctx.fillStyle = '#999';
      ctx.font = '24px Arial';
      ctx.fillText('🔒', x + this.cardWidth / 2, y + 85);
    } else if (completed) {
      ctx.fillStyle = '#4CAF50';
      ctx.font = '24px Arial';
      ctx.fillText('✓', x + this.cardWidth / 2, y + 85);
    } else {
      ctx.fillStyle = '#FFD700';
      ctx.font = '16px Arial';
      ctx.fillText('点击开始', x + this.cardWidth / 2, y + 90);
    }
  }
  
  /**
   * 绘制滚动条
   */
  drawScrollbar(ctx, x, y, width, height) {
    const scrollbarX = x + width - 10;
    const scrollbarY = y;
    const scrollbarHeight = height;
    const thumbHeight = Math.max(30, scrollbarHeight * (scrollbarHeight / (scrollbarHeight + this.maxScroll)));
    const thumbY = scrollbarY + (this.scrollOffset / this.maxScroll) * (scrollbarHeight - thumbHeight);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.roundRect(ctx, scrollbarX, scrollbarY, 8, scrollbarHeight, 4);
    ctx.fill();
    
    ctx.fillStyle = '#FFD700';
    this.roundRect(ctx, scrollbarX, thumbY, 8, thumbHeight, 4);
    ctx.fill();
  }
  
  /**
   * 绘制圆角矩形
   */
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
