/**
 * 登录界面
 * 包含加载进度条和动态云朵背景
 */

import { Config } from './config.js';

/**
 * 云朵类
 */
export class Cloud {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.reset();
  }

  reset() {
    this.x = -150;
    this.y = Math.random() * 200 + 50;
    this.size = Config.VISUAL.CLOUDS.minSize + Math.random() *
                (Config.VISUAL.CLOUDS.maxSize - Config.VISUAL.CLOUDS.minSize);
    this.speed = Config.VISUAL.CLOUDS.speed + Math.random() * 0.3;
    this.alpha = 0.3 + Math.random() * 0.4;
    this.puffs = this.generatePuffs();
  }

  generatePuffs() {
    const puffCount = 3 + Math.floor(Math.random() * 3);
    const puffs = [];

    for (let i = 0; i < puffCount; i++) {
      puffs.push({
        x: (i - puffCount / 2) * this.size * 0.5,
        y: (Math.random() - 0.5) * this.size * 0.3,
        r: this.size * (0.3 + Math.random() * 0.2)
      });
    }

    return puffs;
  }

  update(deltaTime) {
    this.x += this.speed * deltaTime / 16.67;

    // 如果云朵移出屏幕，重置
    if (this.x > this.canvasWidth + 150) {
      this.reset();
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    for (const puff of this.puffs) {
      const gradient = ctx.createRadialGradient(
        this.x + puff.x, this.y + puff.y, 0,
        this.x + puff.x, this.y + puff.y, puff.r
      );
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x + puff.x, this.y + puff.y, puff.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * 登录界面类
 */
export class LoginScreen {
  constructor(canvasWidth, canvasHeight, onLoadingComplete) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.onLoadingComplete = onLoadingComplete;

    this.isLoading = true;
    this.loadingProgress = 0;
    this.loadingSpeed = 0.5; // 每帧增加的进度（0-100）

    // 背景云朵
    this.clouds = [];
    const cloudCount = Config.VISUAL.CLOUDS.count;
    for (let i = 0; i < cloudCount; i++) {
      const cloud = new Cloud(canvasWidth, canvasHeight);
      cloud.x = (canvasWidth / cloudCount) * i;
      this.clouds.push(cloud);
    }

    // 标题
    this.title = '植物大战僵尸';
    this.subtitle = 'Canvas Edition';
  }

  /**
   * 更新登录界面
   */
  update(deltaTime) {
    // 更新云朵
    for (const cloud of this.clouds) {
      cloud.update(deltaTime);
    }

    // 更新加载进度
    if (this.isLoading) {
      this.loadingProgress += this.loadingSpeed;

      // 添加一些随机波动使进度看起来更自然
      this.loadingProgress += (Math.random() - 0.5) * 0.2;
      this.loadingProgress = Math.max(0, Math.min(100, this.loadingProgress));

      // 加载完成
      if (this.loadingProgress >= 100) {
        this.isLoading = false;
        // 稍等一下再进入游戏
        setTimeout(() => {
          if (this.onLoadingComplete && typeof this.onLoadingComplete === 'function') {
            this.onLoadingComplete();
          }
        }, 500);
      }
    }
  }

  /**
   * 绘制登录界面
   */
  draw(ctx) {
    // 绘制天空背景渐变
    this.drawBackground(ctx);

    // 绘制云朵
    for (const cloud of this.clouds) {
      cloud.draw(ctx);
    }

    // 绘制标题
    this.drawTitle(ctx);

    // 绘制进度条
    if (this.isLoading) {
      this.drawProgressBar(ctx);
    } else {
      // 加载完成后显示开始提示
      this.drawStartPrompt(ctx);
    }
  }

  /**
   * 绘制背景
   */
  drawBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    gradient.addColorStop(0, '#87CEEB'); // 天蓝色
    gradient.addColorStop(0.5, '#98D8C8');
    gradient.addColorStop(1, '#F7DC6F');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // 绘制草地
    const grassGradient = ctx.createLinearGradient(0, this.canvasHeight * 0.6, 0, this.canvasHeight);
    grassGradient.addColorStop(0, '#27AE60');
    grassGradient.addColorStop(1, '#1E8449');

    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, this.canvasHeight * 0.6, this.canvasWidth, this.canvasHeight * 0.4);

    // 绘制草地纹理
    this.drawGrassTexture(ctx);
  }

  /**
   * 绘制草地纹理
   */
  drawGrassTexture(ctx) {
    ctx.fillStyle = '#2ECC71';
    const grassY = this.canvasHeight * 0.6;

    for (let i = 0; i < 50; i++) {
      const x = (i * this.canvasWidth / 50 + Date.now() * 0.01) % this.canvasWidth;
      const y = grassY + Math.random() * this.canvasHeight * 0.4;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y - 10 - Math.random() * 5);
      ctx.lineTo(x + 3, y - 8 - Math.random() * 5);
      ctx.closePath();
      ctx.fill();
    }
  }

  /**
   * 绘制标题
   */
  drawTitle(ctx) {
    // 标题阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.font = 'bold 64px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.title, this.canvasWidth / 2 + 3, this.canvasHeight / 2 - 100 + 3);

    // 副标题阴影
    ctx.font = 'italic 32px Arial, sans-serif';
    ctx.fillText(this.subtitle, this.canvasWidth / 2 + 2, this.canvasHeight / 2 - 40 + 2);

    // 主标题
    const titleGradient = ctx.createLinearGradient(0, this.canvasHeight / 2 - 140, 0, this.canvasHeight / 2 - 60);
    titleGradient.addColorStop(0, '#2ECC71');
    titleGradient.addColorStop(0.5, '#58D68D');
    titleGradient.addColorStop(1, '#2ECC71');

    ctx.fillStyle = titleGradient;
    ctx.font = 'bold 64px Arial, sans-serif';
    ctx.strokeStyle = '#1E8449';
    ctx.lineWidth = 3;
    ctx.strokeText(this.title, this.canvasWidth / 2, this.canvasHeight / 2 - 100);
    ctx.fillText(this.title, this.canvasWidth / 2, this.canvasHeight / 2 - 100);

    // 副标题
    ctx.fillStyle = '#F4D03F';
    ctx.font = 'italic 32px Arial, sans-serif';
    ctx.strokeStyle = '#D4AC0D';
    ctx.lineWidth = 2;
    ctx.strokeText(this.subtitle, this.canvasWidth / 2, this.canvasHeight / 2 - 40);
    ctx.fillText(this.subtitle, this.canvasWidth / 2, this.canvasHeight / 2 - 40);

    // 装饰性植物图标
    this.drawDecorationPlants(ctx);
  }

  /**
   * 绘制装饰性植物
   */
  drawDecorationPlants(ctx) {
    const plants = [
      { x: this.canvasWidth / 2 - 150, y: this.canvasHeight / 2 + 20, type: 'peashooter' },
      { x: this.canvasWidth / 2, y: this.canvasHeight / 2 + 30, type: 'sunflower' },
      { x: this.canvasWidth / 2 + 150, y: this.canvasHeight / 2 + 20, type: 'wallnut' }
    ];

    for (const plant of plants) {
      this.drawSimplePlant(ctx, plant.x, plant.y, plant.type);
    }
  }

  /**
   * 绘制简单植物图标
   */
  drawSimplePlant(ctx, x, y, type) {
    ctx.save();
    ctx.translate(x, y);

    // 简化版植物
    ctx.fillStyle = '#228B22';
    ctx.fillRect(-3, 0, 6, 20);

    switch (type) {
      case 'peashooter':
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(0, -10, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(10, -15, 12, 12);
        break;

      case 'sunflower':
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(Math.cos(angle) * 15, Math.sin(angle) * 15, 6, 3, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(0, -10, 10, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'wallnut':
        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.ellipse(0, -5, 15, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-4, -10, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4, -10, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  /**
   * 绘制进度条
   */
  drawProgressBar(ctx) {
    const bar = Config.UI.LOADING_BAR;
    const x = bar.X;
    const y = bar.Y;
    const width = bar.WIDTH;
    const height = bar.HEIGHT;

    // 进度条背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, height / 2);
    ctx.fill();

    // 进度条边框
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 进度条填充
    const progressWidth = width * (this.loadingProgress / 100);
    const fillGradient = ctx.createLinearGradient(x, y, x + width, y);
    fillGradient.addColorStop(0, '#2ECC71');
    fillGradient.addColorStop(0.5, '#58D68D');
    fillGradient.addColorStop(1, '#2ECC71');

    ctx.fillStyle = fillGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, progressWidth, height, height / 2);
    ctx.fill();

    // 进度文字
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`加载中... ${Math.floor(this.loadingProgress)}%`, x + width / 2, y + height / 2);
  }

  /**
   * 绘制开始提示
   */
  drawStartPrompt(ctx) {
    const promptText = '点击任意位置开始游戏';
    const blinkAlpha = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;

    ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(promptText, this.canvasWidth / 2, this.canvasHeight / 2 + 150);

    // 箭头指示
    ctx.fillStyle = `rgba(255, 215, 0, ${blinkAlpha})`;
    const arrowY = this.canvasHeight / 2 + 110 + Math.sin(Date.now() * 0.005) * 5;
    ctx.beginPath();
    ctx.moveTo(this.canvasWidth / 2 - 15, arrowY);
    ctx.lineTo(this.canvasWidth / 2 + 15, arrowY);
    ctx.lineTo(this.canvasWidth / 2, arrowY + 15);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 处理点击
   */
  handleClick() {
    if (!this.isLoading && typeof this.onLoadingComplete === 'function') {
      this.onLoadingComplete();
      return true;
    }
    return false;
  }

  /**
   * 检查是否加载完成
   */
  isLoaded() {
    return !this.isLoading;
  }
}
