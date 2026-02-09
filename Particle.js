/**
 * 单个粒子类
 * 用于各种视觉效果
 */

export class Particle {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0;
    this.color = '#FFFFFF';
    this.size = 2;
    this.type = 'spark';
    this.alpha = 1;
    this.rotation = 0;
    this.rotationSpeed = 0;
  }

  /**
   * 初始化粒子
   */
  init(x, y, type, options = {}) {
    this.active = true;
    this.x = x;
    this.y = y;
    this.type = type;
    this.life = options.life || 30;
    this.maxLife = this.life;
    this.color = options.color || '#FFFFFF';
    this.size = options.size || 2;
    this.alpha = options.alpha || 1;
    this.rotation = options.rotation || 0;
    this.rotationSpeed = options.rotationSpeed || 0;

    // 随机速度方向
    const angle = Math.random() * Math.PI * 2;
    const speed = options.velocity || 2;
    this.vx = Math.cos(angle) * speed * (0.5 + Math.random());
    this.vy = Math.sin(angle) * speed * (0.5 + Math.random()) - speed * 0.5;

    // 重力效果
    this.gravity = options.gravity || 0.1;

    // 淡出效果
    this.fade = options.fade !== undefined ? options.fade : true;
  }

  /**
   * 更新粒子
   */
  update() {
    if (!this.active) return false;

    this.life--;
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.rotation += this.rotationSpeed;

    // 淡出效果
    if (this.fade) {
      this.alpha = this.life / this.maxLife;
    }

    // 粒子生命周期结束
    if (this.life <= 0) {
      this.active = false;
      return false;
    }

    return true;
  }

  /**
   * 绘制粒子
   */
  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    switch (this.type) {
      case 'spark':
        this.drawSpark(ctx);
        break;
      case 'leaf':
        this.drawLeaf(ctx);
        break;
      case 'limb':
        this.drawLimb(ctx);
        break;
      case 'circle':
        this.drawCircle(ctx);
        break;
      default:
        this.drawCircle(ctx);
    }

    ctx.restore();
  }

  /**
   * 绘制火花（灰色圆形）
   */
  drawSpark(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制叶子（绿色椭圆）
   */
  drawLeaf(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制肢体（不规则形状）
   */
  drawLimb(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
  }

  /**
   * 绘制圆形
   */
  drawCircle(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}
