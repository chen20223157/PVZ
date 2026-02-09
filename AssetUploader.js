/**
 * 资源上传器 v2.0
 * 管理植物和僵尸图片的导入和存储
 * 一对一对应的网格布局
 */

import { imageManager } from './ImageManager.js';
import { Config } from './config.js';

export class AssetUploader {
  constructor(game) {
    this.game = game;
    this.visible = false;
    this.selectedTab = 'plant'; // 'plant' 或 'zombie'
    
    // 图片数据存储
    this.plantImages = this.loadFromStorage('plantImages') || {};
    this.zombieImages = this.loadFromStorage('zombieImages') || {};
    
    // 植物和僵尸类型定义
    this.plantTypes = [
      { id: 'peashooter', name: '豌豆射手', icon: '🌱' },
      { id: 'sunflower', name: '向日葵', icon: '🌻' },
      { id: 'wallnut', name: '坚果墙', icon: '🥜' },
      { id: 'snowpea', name: '寒冰射手', icon: '❄️' },
      { id: 'cherry_bomb', name: '樱桃炸弹', icon: '🍒' }
    ];
    
    this.zombieTypes = [
      { id: 'normal', name: '普通僵尸', icon: '🧟' },
      { id: 'conehead', name: '路障僵尸', icon: '🚧' },
      { id: 'buckethead', name: '铁桶僵尸', icon: '🪣' }
    ];
    
    // UI 配置
    this.panelWidth = 700;
    this.panelHeight = 550;
    this.panelX = 100;
    this.panelY = 25;
    
    // 网格配置
    this.gridCols = 3;
    this.cardWidth = 200;
    this.cardHeight = 180;
    this.cardPadding = 15;
    
    // 列表滚动
    this.scrollOffset = 0;
    this.maxScroll = 0;
    
    // 按钮配置
    this.buttons = [];
    this.setupButtons();
    
    // 加载已保存的图片
    this.loadSavedImages();
  }
  
  /**
   * 从 localStorage 加载数据
   */
  loadFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('加载存储数据失败:', e);
      return null;
    }
  }
  
  /**
   * 保存到 localStorage
   */
  saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  }
  
  /**
   * 加载已保存的图片到 ImageManager
   */
  async loadSavedImages() {
    // 加载植物图片
    for (const [type, base64] of Object.entries(this.plantImages)) {
      try {
        const img = new Image();
        img.src = base64;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        imageManager.setImage(`plant_${type}`, img);
      } catch (e) {
        console.error(`加载植物图片失败: ${type}`, e);
      }
    }
    
    // 加载僵尸图片
    for (const [type, base64] of Object.entries(this.zombieImages)) {
      try {
        const img = new Image();
        img.src = base64;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        imageManager.setImage(`zombie_${type}`, img);
      } catch (e) {
        console.error(`加载僵尸图片失败: ${type}`, e);
      }
    }
  }
  
  /**
   * 设置按钮
   */
  setupButtons() {
    this.buttons = [
      {
        id: 'plant_tab',
        x: this.panelX + 20,
        y: this.panelY + 15,
        width: 120,
        height: 40,
        text: '植物图片',
        action: () => this.switchTab('plant')
      },
      {
        id: 'zombie_tab',
        x: this.panelX + 150,
        y: this.panelY + 15,
        width: 120,
        height: 40,
        text: '僵尸图片',
        action: () => this.switchTab('zombie')
      },
      {
        id: 'close',
        x: this.panelX + this.panelWidth - 50,
        y: this.panelY + 10,
        width: 40,
        height: 40,
        text: '×',
        action: () => this.toggle()
      }
    ];
  }
  
  /**
   * 切换标签页
   */
  switchTab(tab) {
    this.selectedTab = tab;
    this.scrollOffset = 0;
  }
  
  /**
   * 打开文件选择对话框
   */
  openFileDialog(type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        await this.uploadImage(file, type);
      }
    };
    
    input.click();
  }
  
  /**
   * 上传图片
   */
  async uploadImage(file, type) {
    try {
      // 读取文件为 base64
      const base64 = await this.fileToBase64(file);
      
      // 创建图片对象
      const img = new Image();
      img.src = base64;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // 保存图片
      if (this.selectedTab === 'plant') {
        this.plantImages[type] = base64;
        this.saveToStorage('plantImages', this.plantImages);
        imageManager.setImage(`plant_${type}`, img);
      } else {
        this.zombieImages[type] = base64;
        this.saveToStorage('zombieImages', this.zombieImages);
        imageManager.setImage(`zombie_${type}`, img);
      }
      
      console.log(`图片上传成功: ${type}`);
    } catch (e) {
      console.error('图片上传失败:', e);
      alert('图片上传失败，请检查文件格式');
    }
  }
  
  /**
   * 文件转 Base64
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * 删除图片
   */
  deleteImage(type) {
    const confirmed = confirm(`确定要删除 ${type} 的图片吗？`);
    if (!confirmed) return;
    
    if (this.selectedTab === 'plant') {
      delete this.plantImages[type];
      this.saveToStorage('plantImages', this.plantImages);
      imageManager.removeImage(`plant_${type}`);
    } else {
      delete this.zombieImages[type];
      this.saveToStorage('zombieImages', this.zombieImages);
      imageManager.removeImage(`zombie_${type}`);
    }
  }
  
  /**
   * 切换显示
   */
  toggle() {
    this.visible = !this.visible;
    if (this.visible) {
      this.scrollOffset = 0;
    }
  }
  
  /**
   * 更新
   */
  update(deltaTime) {
    // 暂时不需要更新逻辑
  }
  
  /**
   * 处理点击
   */
  handleClick(x, y) {
    if (!this.visible) return false;
    
    // 检查按钮点击
    for (const btn of this.buttons) {
      if (x >= btn.x && x <= btn.x + btn.width &&
          y >= btn.y && y <= btn.y + btn.height) {
        btn.action();
        return true;
      }
    }
    
    // 检查卡片点击
    if (this.handleCardClick(x, y)) {
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
   * 处理卡片点击
   */
  handleCardClick(x, y) {
    const types = this.selectedTab === 'plant' ? this.plantTypes : this.zombieTypes;
    const images = this.selectedTab === 'plant' ? this.plantImages : this.zombieImages;
    
    const contentX = this.panelX + 20;
    const contentY = this.panelY + 70;
    const contentWidth = this.panelWidth - 40;
    const contentHeight = this.panelHeight - 90;
    
    // 检查是否在内容区域
    if (x < contentX || x > contentX + contentWidth ||
        y < contentY || y > contentY + contentHeight) {
      return false;
    }
    
    const cols = this.gridCols;
    const cardWidth = this.cardWidth;
    const cardHeight = this.cardHeight;
    const padding = this.cardPadding;
    
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      const cardX = contentX + col * (cardWidth + padding);
      const cardY = contentY + row * (cardHeight + padding) - this.scrollOffset;
      
      // 跳过不可见的卡片
      if (cardY + cardHeight < contentY || cardY > contentY + contentHeight) {
        continue;
      }
      
      // 检查上传按钮
      const uploadBtnX = cardX + 10;
      const uploadBtnY = cardY + cardHeight - 45;
      const uploadBtnWidth = cardWidth - 20;
      const uploadBtnHeight = 35;
      
      if (x >= uploadBtnX && x <= uploadBtnX + uploadBtnWidth &&
          y >= uploadBtnY && y <= uploadBtnY + uploadBtnHeight) {
        if (images[type.id]) {
          // 有图片，点击删除
          this.deleteImage(type.id);
        } else {
          // 无图片，点击上传
          this.openFileDialog(type.id);
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
    
    // 半透明背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // 面板背景
    ctx.fillStyle = 'rgba(30, 30, 30, 0.95)';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    this.roundRect(ctx, this.panelX, this.panelY, this.panelWidth, this.panelHeight, 10);
    ctx.fill();
    ctx.stroke();
    
    // 绘制标签按钮
    for (const btn of this.buttons) {
      const isTabBtn = btn.id.endsWith('_tab');
      const isActive = isTabBtn && btn.id.startsWith(this.selectedTab);
      
      ctx.fillStyle = isActive ? '#FFD700' : 
                     btn.id === 'close' ? '#FF4444' :
                     'rgba(100, 100, 100, 0.8)';
      this.roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 5);
      ctx.fill();
      
      ctx.fillStyle = isActive || btn.id === 'close' ? '#000' : '#FFF';
      ctx.font = btn.id === 'close' ? 'bold 28px Arial' : 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
    }
    
    // 绘制类型网格
    this.drawTypeGrid(ctx);
    
    ctx.restore();
  }
  
  /**
   * 绘制类型网格
   */
  drawTypeGrid(ctx) {
    const types = this.selectedTab === 'plant' ? this.plantTypes : this.zombieTypes;
    const images = this.selectedTab === 'plant' ? this.plantImages : this.zombieImages;
    
    const contentX = this.panelX + 20;
    const contentY = this.panelY + 70;
    const contentWidth = this.panelWidth - 40;
    const contentHeight = this.panelHeight - 90;
    
    // 裁剪区域
    ctx.save();
    ctx.beginPath();
    ctx.rect(contentX, contentY, contentWidth, contentHeight);
    ctx.clip();
    
    const cols = this.gridCols;
    const cardWidth = this.cardWidth;
    const cardHeight = this.cardHeight;
    const padding = this.cardPadding;
    
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      const cardX = contentX + col * (cardWidth + padding);
      const cardY = contentY + row * (cardHeight + padding) - this.scrollOffset;
      
      // 跳过不可见的卡片
      if (cardY + cardHeight < contentY || cardY > contentY + contentHeight) {
        continue;
      }
      
      // 绘制卡片
      this.drawTypeCard(ctx, type, cardX, cardY, images[type.id]);
    }
    
    ctx.restore();
    
    // 计算最大滚动距离
    const rows = Math.ceil(types.length / cols);
    const totalHeight = rows * (cardHeight + padding);
    this.maxScroll = Math.max(0, totalHeight - contentHeight);
    
    // 绘制滚动条
    if (this.maxScroll > 0) {
      this.drawScrollbar(ctx, contentX, contentY, contentWidth, contentHeight);
    }
  }
  
  /**
   * 绘制类型卡片
   */
  drawTypeCard(ctx, type, x, y, imageBase64) {
    const cardWidth = this.cardWidth;
    const cardHeight = this.cardHeight;
    const hasImage = !!imageBase64;
    
    // 卡片背景
    ctx.fillStyle = hasImage ? 'rgba(50, 80, 50, 0.9)' : 'rgba(50, 50, 50, 0.9)';
    this.roundRect(ctx, x, y, cardWidth, cardHeight, 8);
    ctx.fill();
    
    // 卡片边框
    ctx.strokeStyle = hasImage ? '#4CAF50' : '#666';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 类型图标
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FFF';
    ctx.fillText(type.icon, x + cardWidth / 2, y + 10);
    
    // 类型名称
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText(type.name, x + cardWidth / 2, y + 50);
    
    // 图片预览区域
    const previewX = x + 20;
    const previewY = y + 75;
    const previewSize = cardWidth - 40;
    
    if (hasImage) {
      // 显示图片
      const img = imageManager.getImage(`${this.selectedTab}_${type.id}`);
      if (img) {
        try {
          ctx.drawImage(img, previewX, previewY, previewSize, previewSize);
          
          // 图片边框
          ctx.strokeStyle = '#4CAF50';
          ctx.lineWidth = 2;
          ctx.strokeRect(previewX, previewY, previewSize, previewSize);
        } catch (e) {
          // 图片加载失败，显示占位符
          this.drawPlaceholder(ctx, previewX, previewY, previewSize, '图片错误');
        }
      } else {
        this.drawPlaceholder(ctx, previewX, previewY, previewSize, '加载中...');
      }
    } else {
      // 显示占位符
      this.drawPlaceholder(ctx, previewX, previewY, previewSize, '暂无图片');
    }
    
    // 按钮
    const btnX = x + 10;
    const btnY = y + cardHeight - 45;
    const btnWidth = cardWidth - 20;
    const btnHeight = 35;
    
    ctx.fillStyle = hasImage ? '#FF5722' : '#4CAF50';
    this.roundRect(ctx, btnX, btnY, btnWidth, btnHeight, 5);
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hasImage ? '删除图片' : '上传图片', btnX + btnWidth / 2, btnY + btnHeight / 2);
  }
  
  /**
   * 绘制占位符
   */
  drawPlaceholder(ctx, x, y, size, text) {
    // 背景
    ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.fillRect(x, y, size, size);
    
    // 边框
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, size, size);
    ctx.setLineDash([]);
    
    // 文字
    ctx.fillStyle = '#999';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + size / 2, y + size / 2);
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
    
    // 滚动条背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.roundRect(ctx, scrollbarX, scrollbarY, 8, scrollbarHeight, 4);
    ctx.fill();
    
    // 滚动条滑块
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
