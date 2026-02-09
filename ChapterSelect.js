/**
 * 章节选择界面 v4.0
 * 显示章节和关卡选择
 */

import { chapterSystem } from './ChapterSystem.js';

export class ChapterSelect {
  constructor(canvas, onLevelStart) {
    this.canvas = canvas;
    this.onLevelStart = onLevelStart;
    this.visible = false;
    
    // 当前显示的章节
    this.currentChapter = chapterSystem.progress.currentChapter;
    
    // 滚动偏移
    this.scrollOffset = 0;
    this.maxScroll = 0;
    
    // 布局参数
    this.padding = 40;
    this.chapterHeight = 120;
    this.levelCardWidth = 180;
    this.levelCardHeight = 140;
    this.levelGap = 20;
  }

  /**
   * 显示界面
   */
  show() {
    this.visible = true;
    this.currentChapter = chapterSystem.progress.currentChapter;
    this.scrollOffset = 0;
  }

  /**
   * 隐藏界面
   */
  hide() {
    this.visible = false;
  }

  /**
   * 切换显示状态
   */
  toggle() {
    this.visible = !this.visible;
    if (this.visible) {
      this.currentChapter = chapterSystem.progress.currentChapter;
    }
  }

  /**
   * 处理点击
   */
  handleClick(x, y) {
    if (!this.visible) return false;

    // 检查关闭按钮
    const closeX = this.canvas.width - 60;
    const closeY = 20;
    if (x >= closeX && x <= closeX + 40 && y >= closeY && y <= closeY + 40) {
      this.hide();
      return true;
    }

    // 检查章节切换按钮
    if (this.handleChapterTabClick(x, y)) {
      return true;
    }

    // 检查关卡卡片点击
    if (this.handleLevelCardClick(x, y)) {
      return true;
    }

    return false;
  }

  /**
   * 处理章节标签点击
   */
  handleChapterTabClick(x, y) {
    const tabY = 80;
    const tabHeight = 60;
    const tabWidth = 140;
    const tabGap = 10;

    for (let i = 0; i < chapterSystem.chapters.length; i++) {
      const chapter = chapterSystem.chapters[i];
      const tabX = this.padding + i * (tabWidth + tabGap);

      if (x >= tabX && x <= tabX + tabWidth &&
          y >= tabY && y <= tabY + tabHeight) {
        
        if (chapterSystem.isChapterUnlocked(chapter.id)) {
          this.currentChapter = chapter.id;
          this.scrollOffset = 0;
          return true;
        } else {
          // 未解锁提示
          alert(`完成第${chapter.id - 1}章所有关卡后解锁！`);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 处理关卡卡片点击
   */
  handleLevelCardClick(x, y) {
    const chapter = chapterSystem.getChapter(this.currentChapter);
    if (!chapter) return false;

    const startY = 180;
    const cols = Math.floor((this.canvas.width - this.padding * 2 + this.levelGap) / (this.levelCardWidth + this.levelGap));
    
    for (let i = 0; i < chapter.levels.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      const cardX = this.padding + col * (this.levelCardWidth + this.levelGap);
      const cardY = startY + row * (this.levelCardHeight + this.levelGap) - this.scrollOffset;

      // 检查卡片是否在可见范围内
      if (cardY + this.levelCardHeight < 0 || cardY > this.canvas.height) {
        continue;
      }

      if (x >= cardX && x <= cardX + this.levelCardWidth &&
          y >= cardY && y <= cardY + this.levelCardHeight) {
        
        const level = chapter.levels[i];
        
        // 检查关卡是否解锁（第一关总是解锁的）
        if (i === 0 || chapterSystem.isLevelCompleted(chapter.levels[i - 1].id)) {
          this.onLevelStart(level.id);
          this.hide();
          return true;
        } else {
          alert('请先完成前一关！');
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 处理滚轮
   */
  handleWheel(deltaY) {
    if (!this.visible) return;

    this.scrollOffset += deltaY * 0.5;
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScroll));
  }

  /**
   * 绘制界面
   */
  draw(ctx) {
    if (!this.visible) return;

    // 半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制标题
    this.drawTitle(ctx);

    // 绘制章节标签
    this.drawChapterTabs(ctx);

    // 绘制关卡卡片
    this.drawLevelCards(ctx);

    // 绘制金币和进度信息
    this.drawProgressInfo(ctx);

    // 绘制关闭按钮
    this.drawCloseButton(ctx);
  }

  /**
   * 绘制标题
   */
  drawTitle(ctx) {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🎮 关卡选择', this.canvas.width / 2, 20);
  }

  /**
   * 绘制章节标签
   */
  drawChapterTabs(ctx) {
    const tabY = 80;
    const tabHeight = 60;
    const tabWidth = 140;
    const tabGap = 10;

    for (let i = 0; i < chapterSystem.chapters.length; i++) {
      const chapter = chapterSystem.chapters[i];
      const tabX = this.padding + i * (tabWidth + tabGap);
      const isUnlocked = chapterSystem.isChapterUnlocked(chapter.id);
      const isCurrent = chapter.id === this.currentChapter;

      // 背景
      if (isCurrent) {
        ctx.fillStyle = '#4CAF50';
      } else if (isUnlocked) {
        ctx.fillStyle = '#2196F3';
      } else {
        ctx.fillStyle = '#666';
      }

      this.roundRect(ctx, tabX, tabY, tabWidth, tabHeight, 10);
      ctx.fill();

      // 边框
      if (isCurrent) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        this.roundRect(ctx, tabX, tabY, tabWidth, tabHeight, 10);
        ctx.stroke();
      }

      // 图标
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isUnlocked ? '#FFF' : '#999';
      ctx.fillText(chapter.icon, tabX + tabWidth / 2, tabY + 20);

      // 文字
      ctx.font = 'bold 12px Arial';
      const chapterText = `第${chapter.id}章`;
      ctx.fillText(chapterText, tabX + tabWidth / 2, tabY + 45);

      // 锁定图标
      if (!isUnlocked) {
        ctx.font = '24px Arial';
        ctx.fillText('🔒', tabX + tabWidth / 2, tabY + tabHeight / 2);
      }
    }
  }

  /**
   * 绘制关卡卡片
   */
  drawLevelCards(ctx) {
    const chapter = chapterSystem.getChapter(this.currentChapter);
    if (!chapter) return;

    const startY = 180;
    const cols = Math.floor((this.canvas.width - this.padding * 2 + this.levelGap) / (this.levelCardWidth + this.levelGap));

    // 计算最大滚动距离
    const rows = Math.ceil(chapter.levels.length / cols);
    this.maxScroll = Math.max(0, rows * (this.levelCardHeight + this.levelGap) - (this.canvas.height - startY - this.padding));

    // 绘制章节信息
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${chapter.icon} ${chapter.name}`, this.padding, 160);

    // 裁剪区域
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, startY, this.canvas.width, this.canvas.height - startY);
    ctx.clip();

    for (let i = 0; i < chapter.levels.length; i++) {
      const level = chapter.levels[i];
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      const cardX = this.padding + col * (this.levelCardWidth + this.levelGap);
      const cardY = startY + row * (this.levelCardHeight + this.levelGap) - this.scrollOffset;

      // 检查卡片是否在可见范围内
      if (cardY + this.levelCardHeight < startY || cardY > this.canvas.height) {
        continue;
      }

      this.drawLevelCard(ctx, level, cardX, cardY, i);
    }

    ctx.restore();
  }

  /**
   * 绘制单个关卡卡片
   */
  drawLevelCard(ctx, level, x, y, index) {
    const isCompleted = chapterSystem.isLevelCompleted(level.id);
    const isUnlocked = index === 0 || chapterSystem.isLevelCompleted(chapterSystem.getChapter(this.currentChapter).levels[index - 1].id);

    // 背景
    if (isCompleted) {
      ctx.fillStyle = '#4CAF50';
    } else if (isUnlocked) {
      ctx.fillStyle = '#2196F3';
    } else {
      ctx.fillStyle = '#555';
    }

    this.roundRect(ctx, x, y, this.levelCardWidth, this.levelCardHeight, 15);
    ctx.fill();

    // 边框
    ctx.strokeStyle = isCompleted ? '#FFD700' : (isUnlocked ? '#FFF' : '#777');
    ctx.lineWidth = 2;
    this.roundRect(ctx, x, y, this.levelCardWidth, this.levelCardHeight, 15);
    ctx.stroke();

    // 关卡名称
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(level.name, x + this.levelCardWidth / 2, y + 10);

    // 难度
    ctx.font = '12px Arial';
    const difficultyText = this.getDifficultyText(level.difficulty);
    ctx.fillText(difficultyText, x + this.levelCardWidth / 2, y + 30);

    // 僵尸数量
    ctx.font = '14px Arial';
    ctx.fillText(`🧟 ${level.maxZombies}只`, x + this.levelCardWidth / 2, y + 50);

    // 金币奖励
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`💰 ${level.coins}`, x + this.levelCardWidth / 2, y + 70);

    // 解锁植物
    if (level.unlockPlant) {
      ctx.fillStyle = '#FFF';
      ctx.font = '24px Arial';
      ctx.fillText(level.unlockIcon, x + this.levelCardWidth / 2, y + 90);
      ctx.font = '11px Arial';
      ctx.fillText(level.unlockName, x + this.levelCardWidth / 2, y + 115);
    }

    // 完成标记
    if (isCompleted) {
      ctx.font = '32px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('✓', x + this.levelCardWidth - 25, y + 10);
    }

    // 锁定标记
    if (!isUnlocked) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      this.roundRect(ctx, x, y, this.levelCardWidth, this.levelCardHeight, 15);
      ctx.fill();

      ctx.font = '48px Arial';
      ctx.fillStyle = '#999';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒', x + this.levelCardWidth / 2, y + this.levelCardHeight / 2);
    }

    // Boss标记
    if (level.boss) {
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#FF4444';
      ctx.fillText('BOSS', x + this.levelCardWidth / 2, y + this.levelCardHeight - 15);
    }
  }

  /**
   * 绘制进度信息
   */
  drawProgressInfo(ctx) {
    const infoY = this.canvas.height - 60;
    
    // 金币
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`💰 金币: ${chapterSystem.progress.totalCoins}`, this.padding, infoY);

    // 星星
    ctx.fillStyle = '#FFF';
    ctx.fillText(`⭐ 星星: ${chapterSystem.progress.totalStars}`, this.padding + 200, infoY);

    // 章节进度
    const progress = chapterSystem.getChapterProgress(this.currentChapter);
    ctx.fillText(`📊 进度: ${progress.completed}/${progress.total} (${progress.percentage}%)`, 
      this.padding + 400, infoY);
  }

  /**
   * 绘制关闭按钮
   */
  drawCloseButton(ctx) {
    const closeX = this.canvas.width - 60;
    const closeY = 20;
    const size = 40;

    ctx.fillStyle = '#F44336';
    this.roundRect(ctx, closeX, closeY, size, size, 5);
    ctx.fill();

    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(closeX + 12, closeY + 12);
    ctx.lineTo(closeX + size - 12, closeY + size - 12);
    ctx.moveTo(closeX + size - 12, closeY + 12);
    ctx.lineTo(closeX + 12, closeY + size - 12);
    ctx.stroke();
  }

  /**
   * 获取难度文本
   */
  getDifficultyText(difficulty) {
    const map = {
      'tutorial': '⭐ 教学',
      'easy': '⭐⭐ 简单',
      'medium': '⭐⭐⭐ 中等',
      'hard': '⭐⭐⭐⭐ 困难',
      'boss': '⭐⭐⭐⭐⭐ BOSS',
      'final': '⭐⭐⭐⭐⭐⭐ 终极'
    };
    return map[difficulty] || difficulty;
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
