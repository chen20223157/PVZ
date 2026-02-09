/**
 * 植物模板系统
 * 允许用户定义自定义植物
 */

import { Config } from './config.js';

/**
 * 植物模板类
 */
export class PlantTemplate {
  constructor(config) {
    // 基本信息
    this.id = config.id || `custom_${Date.now()}`;
    this.name = config.name || '自定义植物';
    this.description = config.description || '';

    // 属性
    this.sunCost = config.sunCost || 100;
    this.cooldown = config.cooldown || 5000;
    this.health = config.health || 100;
    this.isWall = config.isWall || false;

    // 攻击属性
    this.attackDamage = config.attackDamage || 0;
    this.attackSpeed = config.attackSpeed || 0;
    this.bulletSpeed = config.bulletSpeed || 0;
    this.bulletType = config.bulletType || 'normal';

    // 生产属性（向日葵）
    this.productionInterval = config.productionInterval || 0;
    this.sunAmount = config.sunAmount || 0;

    // 外观属性
    this.color = config.color || '#00FF00';
    this.size = config.size || 30;
    this.shape = config.shape || 'circle'; // circle, ellipse, rect
    this.hasStem = config.hasStem !== false;
    this.hasLeaves = config.hasLeaves !== false;

    // 特殊属性
    this.specialType = config.specialType || 'none'; // none, shooter, producer, wall, bomb
    this.explodeDamage = config.explodeDamage || 0;
    this.explodeRadius = config.explodeRadius || 0;
    this.explodeDelay = config.explodeDelay || 0;
  }

  /**
   * 转换为配置对象
   */
  toConfig() {
    return {
      id: this.id.toUpperCase(),
      name: this.name,
      sunCost: this.sunCost,
      cooldown: this.cooldown,
      health: this.health,
      isWall: this.isWall,
      attackDamage: this.attackDamage,
      attackSpeed: this.attackSpeed,
      bulletSpeed: this.bulletSpeed,
      bulletType: this.bulletType,
      productionInterval: this.productionInterval,
      sunAmount: this.sunAmount,
      explodeDamage: this.explodeDamage,
      explodeRadius: this.explodeRadius,
      explodeDelay: this.explodeDelay,
      // 自定义外观属性
      _custom: true,
      _color: this.color,
      _size: this.size,
      _shape: this.shape,
      _hasStem: this.hasStem,
      _hasLeaves: this.hasLeaves,
      _specialType: this.specialType
    };
  }

  /**
   * 导出为JSON
   */
  toJSON() {
    return JSON.stringify(this.toConfig(), null, 2);
  }

  /**
   * 从JSON创建模板
   */
  static fromJSON(jsonString) {
    const config = JSON.parse(jsonString);
    return new PlantTemplate(config);
  }
}

/**
 * 植物模板管理器
 */
export class PlantTemplateManager {
  constructor() {
    this.templates = [];
    this.loadTemplates();
  }

  /**
   * 加载保存的模板
   */
  loadTemplates() {
    try {
      const saved = localStorage.getItem('plantTemplates');
      if (saved) {
        const templates = JSON.parse(saved);
        this.templates = templates.map(t => new PlantTemplate(t));
      }
    } catch (e) {
      console.warn('无法加载植物模板:', e);
      this.templates = [];
    }
  }

  /**
   * 保存模板
   */
  saveTemplates() {
    try {
      const data = this.templates.map(t => t.toConfig());
      localStorage.setItem('plantTemplates', JSON.stringify(data));
    } catch (e) {
      console.error('保存植物模板失败:', e);
    }
  }

  /**
   * 添加模板
   */
  addTemplate(template) {
    this.templates.push(template);
    this.saveTemplates();
  }

  /**
   * 删除模板
   */
  removeTemplate(id) {
    this.templates = this.templates.filter(t => t.id !== id);
    this.saveTemplates();
  }

  /**
   * 更新模板
   */
  updateTemplate(id, updates) {
    const template = this.templates.find(t => t.id === id);
    if (template) {
      Object.assign(template, updates);
      this.saveTemplates();
    }
  }

  /**
   * 获取模板
   */
  getTemplate(id) {
    return this.templates.find(t => t.id === id);
  }

  /**
   * 获取所有模板
   */
  getAllTemplates() {
    return [...this.templates];
  }

  /**
   * 将模板添加到游戏配置
   */
  applyTemplatesToConfig() {
    for (const template of this.templates) {
      Config.PLANTS[template.id.toUpperCase()] = template.toConfig();
    }
  }
}

// 默认模板管理器实例
export const templateManager = new PlantTemplateManager();
