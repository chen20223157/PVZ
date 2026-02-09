/**
 * 植物编辑器
 * 提供UI界面来创建和编辑自定义植物
 */

import { PlantTemplate, PlantTemplateManager } from './PlantTemplates.js';
import { imageManager } from './ImageManager.js';

/**
 * 植物编辑器类
 */
export class PlantEditor {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;

    this.visible = false;
    this.currentTemplate = null;
    this.templates = new PlantTemplateManager();

    // 编辑器UI区域
    this.uiArea = {
      x: 200,
      y: 50,
      width: 500,
      height: 500
    };

    // 当前编辑的字段
    this.activeField = null;
    this.tempValue = '';

    // 预览位置
    this.previewPos = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2
    };
  }

  /**
   * 显示编辑器
   */
  show() {
    this.visible = true;
    // 如果没有当前模板，创建新的
    if (!this.currentTemplate) {
      this.createNewTemplate();
    }
  }

  /**
   * 隐藏编辑器
   */
  hide() {
    this.visible = false;
  }

  /**
   * 切换编辑器显示
   */
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 创建新模板
   */
  createNewTemplate() {
    this.currentTemplate = new PlantTemplate({
      id: `custom_${Date.now()}`,
      name: '新植物',
      sunCost: 100,
      health: 100,
      attackDamage: 20,
      attackSpeed: 1500,
      bulletSpeed: 5,
      color: '#00FF00',
      specialType: 'shooter'
    });
  }

  /**
   * 保存当前模板
   */
  saveTemplate() {
    if (this.currentTemplate) {
      this.templates.addTemplate(this.currentTemplate);
      this.templates.applyTemplatesToConfig();
      // 重新初始化植物冷却
      this.game.initPlantCooldowns();
    }
  }

  /**
   * 保存并关闭
   */
  saveAndClose() {
    this.saveTemplate();
    this.hide();
  }

  /**
   * 更新
   */
  update(deltaTime) {
    // 编辑器不需要更新
  }

  /**
   * 绘制
   */
  draw(ctx) {
    if (!this.visible) return;

    // 半透明背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 编辑器面板
    this.drawPanel(ctx);

    // 绘制植物预览
    if (this.currentTemplate) {
      this.drawPlantPreview(ctx);
    }
  }

  /**
   * 绘制编辑器面板
   */
  drawPanel(ctx) {
    const ui = this.uiArea;

    // 面板背景
    ctx.fillStyle = 'rgba(30, 30, 40, 0.95)';
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(ui.x, ui.y, ui.width, ui.height, 15);
    ctx.fill();
    ctx.stroke();

    // 标题
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('植物编辑器', ui.x + ui.width / 2, ui.y + 40);

    // 绘制字段
    this.drawFields(ctx);
  }

  /**
   * 绘制字段列表
   */
  drawFields(ctx) {
    const fields = this.getTemplateFields();
    const startY = 90;
    const lineHeight = 35;

    ctx.textAlign = 'left';
    ctx.font = '16px Arial';

    fields.forEach((field, index) => {
      const y = startY + index * lineHeight;
      const x = this.uiArea.x + 30;

      // 标签
      ctx.fillStyle = '#AAA';
      ctx.fillText(field.label, x, y);

      // 值
      ctx.fillStyle = '#4CAF50';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(field.value, x + 150, y);
      ctx.font = '16px Arial';
    });

    // 操作说明
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.font = '14px Arial';
    const instructions = [
      '点击字段编辑数值',
      '按 S 保存模板',
      '按 Enter 保存并关闭',
      '按 Esc 取消'
    ];

    instructions.forEach((text, index) => {
      ctx.fillText(text, this.uiArea.x + this.uiArea.width / 2,
                  this.uiArea.y + 430 + index * 20);
    });
  }

  /**
   * 获取模板字段
   */
  getTemplateFields() {
    if (!this.currentTemplate) return [];

    return [
      { label: '名称:', value: this.currentTemplate.name },
      { label: '阳光消耗:', value: this.currentTemplate.sunCost },
      { label: '生命值:', value: this.currentTemplate.health },
      { label: '攻击伤害:', value: this.currentTemplate.attackDamage },
      { label: '攻击速度(ms):', value: this.currentTemplate.attackSpeed },
      { label: '子弹速度:', value: this.currentTemplate.bulletSpeed },
      { label: '类型:', value: this.currentTemplate.specialType },
      { label: '颜色:', value: this.currentTemplate.color },
      { label: '大小:', value: this.currentTemplate.size }
    ];
  }

  /**
   * 绘制植物预览
   */
  drawPlantPreview(ctx) {
    if (!this.currentTemplate) return;

    const x = this.previewPos.x;
    const y = this.previewPos.y;

    ctx.save();
    ctx.translate(x, y);

    const template = this.currentTemplate;

    // 茎
    if (template.hasStem) {
      ctx.fillStyle = '#228B22';
      ctx.fillRect(-3, 0, 6, 20);
    }

    // 叶子
    if (template.hasLeaves) {
      ctx.fillStyle = template.color;
      ctx.beginPath();
      ctx.ellipse(-10, 10, 15, 8, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(10, 15, 12, 6, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 主体
    ctx.translate(0, -template.size / 2);
    ctx.fillStyle = template.color;

    switch (template.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, template.size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'ellipse':
        ctx.beginPath();
        ctx.ellipse(0, 0, template.size / 2, template.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'rect':
        ctx.fillRect(-template.size / 2, -template.size / 2, template.size, template.size);
        break;
    }

    // 枪口（如果是射手类型）
    if (template.specialType === 'shooter') {
      ctx.fillStyle = template.color;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(template.size / 2, -template.size / 4, template.size / 2, template.size / 2);
      ctx.globalAlpha = 1;
    }

    // 眼睛
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(template.size / 6, -template.size / 6, template.size / 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 标签
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('预览', x, y + 60);
  }

  /**
   * 处理点击
   */
  handleClick(x, y) {
    if (!this.visible) return false;

    const ui = this.uiArea;

    // 检查是否点击了编辑器外部
    if (x < ui.x || x > ui.x + ui.width ||
        y < ui.y || y > ui.y + ui.height) {
      // 点击外部不关闭，防止误操作
      return true;
    }

    // 检查字段点击（简化版：通过Y坐标判断）
    const fields = this.getTemplateFields();
    const startY = ui.y + 90;
    const lineHeight = 35;

    for (let i = 0; i < fields.length; i++) {
      const fieldY = startY + i * lineHeight;
      if (y >= fieldY - 15 && y <= fieldY + 5) {
        this.activeField = i;
        this.tempValue = String(fields[i].value);
        return true;
      }
    }

    return true;
  }

  /**
   * 处理键盘输入
   */
  handleKeyDown(e) {
    if (!this.visible) return;

    // 保存
    if (e.key === 's' || e.key === 'S') {
      this.saveTemplate();
      return;
    }

    if (e.key === 'Enter') {
      this.saveAndClose();
      return;
    }

    // 取消
    if (e.key === 'Escape') {
      this.hide();
      return;
    }

    // 编辑字段
    if (this.activeField !== null) {
      const fields = this.getTemplateFields();
      const field = fields[this.activeField];

      // 处理数字输入
      if (['sunCost', 'health', 'attackDamage', 'attackSpeed',
           'bulletSpeed', 'size'].includes(field.key)) {
        if (e.key >= '0' && e.key <= '9') {
          this.tempValue += e.key;
          this.updateFieldValue(field.key, parseInt(this.tempValue) || 0);
        } else if (e.key === 'Backspace') {
          this.tempValue = this.tempValue.slice(0, -1);
          this.updateFieldValue(field.key, parseInt(this.tempValue) || 0);
        }
      }

      // 颜色输入（简化版，预设颜色）
      if (field.key === 'color') {
        const colors = ['#00FF00', '#FFD700', '#DC143C', '#00BFFF', '#FFA500', '#9370DB'];
        const currentIndex = colors.indexOf(this.tempValue);
        if (currentIndex >= 0) {
          const newIndex = (currentIndex + 1) % colors.length;
          this.tempValue = colors[newIndex];
          this.updateFieldValue(field.key, this.tempValue);
        }
      }

      // 类型输入
      if (field.key === 'specialType') {
        const types = ['shooter', 'producer', 'wall', 'bomb', 'none'];
        const currentIndex = types.indexOf(this.tempValue);
        if (currentIndex >= 0) {
          const newIndex = (currentIndex + 1) % types.length;
          this.tempValue = types[newIndex];
          this.updateFieldValue(field.key, this.tempValue);
        }
      }

      // 形状输入
      if (field.key === 'shape') {
        const shapes = ['circle', 'ellipse', 'rect'];
        const currentIndex = shapes.indexOf(this.tempValue);
        if (currentIndex >= 0) {
          const newIndex = (currentIndex + 1) % shapes.length;
          this.tempValue = shapes[newIndex];
          this.updateFieldValue(field.key, this.tempValue);
        }
      }
    }
  }

  /**
   * 更新字段值
   */
  updateFieldValue(key, value) {
    if (!this.currentTemplate) return;

    const mapping = {
      '名称': 'name',
      '阳光消耗': 'sunCost',
      '生命值': 'health',
      '攻击伤害': 'attackDamage',
      '攻击速度': 'attackSpeed',
      '子弹速度': 'bulletSpeed',
      '类型': 'specialType',
      '颜色': 'color',
      '大小': 'size'
    };

    const prop = mapping[key];
    if (prop && this.currentTemplate.hasOwnProperty(prop)) {
      this.currentTemplate[prop] = value;
    }
  }

  /**
   * 获取模板字段
   */
  getTemplateFields() {
    if (!this.currentTemplate) return [];

    return [
      { key: '名称', label: '名称:', value: this.currentTemplate.name },
      { key: '阳光消耗', label: '阳光消耗:', value: this.currentTemplate.sunCost },
      { key: '生命值', label: '生命值:', value: this.currentTemplate.health },
      { key: '攻击伤害', label: '攻击伤害:', value: this.currentTemplate.attackDamage },
      { key: '攻击速度', label: '攻击速度:', value: this.currentTemplate.attackSpeed },
      { key: '子弹速度', label: '子弹速度:', value: this.currentTemplate.bulletSpeed },
      { key: '类型', label: '类型:', value: this.currentTemplate.specialType },
      { key: '颜色', label: '颜色:', value: this.currentTemplate.color },
      { key: '大小', label: '大小:', value: this.currentTemplate.size }
    ];
  }
}
