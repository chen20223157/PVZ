/**
 * 网格坐标映射系统
 * 用于处理点击检测和植物放置逻辑
 */

import { Config } from './config.js';

export class Grid {
  constructor() {
    this.rows = Config.GRID.ROWS;
    this.cols = Config.GRID.COLS;
    this.cellWidth = Config.GRID.CELL_WIDTH;
    this.cellHeight = Config.GRID.CELL_HEIGHT;
    this.startX = Config.GRID.START_X;
    this.startY = Config.GRID.START_Y;

    // 网格状态：存储每个格子中的植物
    this.cells = new Array(this.rows * this.cols).fill(null);

    // 网格数据：存储每个格子的边界信息
    this.cellBounds = this.calculateCellBounds();
  }

  /**
   * 计算所有格子的边界
   */
  calculateCellBounds() {
    const bounds = [];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        bounds.push({
          row,
          col,
          index: row * this.cols + col,
          x: this.startX + col * this.cellWidth,
          y: this.startY + row * this.cellHeight,
          width: this.cellWidth,
          height: this.cellHeight,
          centerX: this.startX + col * this.cellWidth + this.cellWidth / 2,
          centerY: this.startY + row * this.cellHeight + this.cellHeight / 2
        });
      }
    }

    return bounds;
  }

  /**
   * 屏幕坐标转网格坐标
   * @param {number} x - 屏幕 X 坐标
   * @param {number} y - 屏幕 Y 坐标
   * @returns {Object|null} { row, col, index, centerX, centerY } 或 null
   */
  screenToGrid(x, y) {
    for (const cell of this.cellBounds) {
      if (this.isPointInRect(x, y, cell.x, cell.y, cell.width, cell.height)) {
        return {
          row: cell.row,
          col: cell.col,
          index: cell.index,
          centerX: cell.centerX,
          centerY: cell.centerY
        };
      }
    }
    return null;
  }

  /**
   * 网格坐标转屏幕坐标（格子中心点）
   * @param {number} row - 行号
   * @param {number} col - 列号
   * @returns {Object} { x, y }
   */
  gridToScreen(row, col) {
    return {
      x: this.startX + col * this.cellWidth + this.cellWidth / 2,
      y: this.startY + row * this.cellHeight + this.cellHeight / 2
    };
  }

  /**
   * 检测点是否在矩形内
   */
  isPointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  /**
   * 检测点是否在网格范围内
   * @param {number} x - 屏幕 X 坐标
   * @param {number} y - 屏幕 Y 坐标
   * @returns {boolean}
   */
  isPointInGrid(x, y) {
    return this.screenToGrid(x, y) !== null;
  }

  /**
   * 检查格子是否为空
   * @param {number} row - 行号
   * @param {number} col - 列号
   * @returns {boolean}
   */
  isCellEmpty(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return false;
    }
    return this.cells[row * this.cols + col] === null;
  }

  /**
   * 检查格子是否为空（通过索引）
   * @param {number} index - 格子索引
   * @returns {boolean}
   */
  isCellEmptyByIndex(index) {
    if (index < 0 || index >= this.cells.length) {
      return false;
    }
    return this.cells[index] === null;
  }

  /**
   * 在格子中放置植物
   * @param {number} row - 行号
   * @param {number} col - 列号
   * @param {Object} plant - 植物对象
   * @returns {boolean} 是否放置成功
   */
  placePlant(row, col, plant) {
    if (!this.isCellEmpty(row, col)) {
      return false;
    }

    this.cells[row * this.cols + col] = plant;
    return true;
  }

  /**
   * 移除格子中的植物
   * @param {number} row - 行号
   * @param {number} col - 列号
   */
  removePlant(row, col) {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      this.cells[row * this.cols + col] = null;
    }
  }

  /**
   * 通过坐标获取植物
   * @param {number} x - 屏幕 X 坐标
   * @param {number} y - 屏幕 Y 坐标
   * @returns {Object|null} 植物对象或 null
   */
  getPlantAt(x, y) {
    const gridPos = this.screenToGrid(x, y);
    if (gridPos) {
      return this.cells[gridPos.index];
    }
    return null;
  }

  /**
   * 通过行列获取植物
   * @param {number} row - 行号
   * @param {number} col - 列号
   * @returns {Object|null} 植物对象或 null
   */
  getPlantAtCell(row, col) {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      return this.cells[row * this.cols + col];
    }
    return null;
  }

  /**
   * 清空所有格子
   */
  clear() {
    this.cells.fill(null);
  }

  /**
   * 获取指定行所有植物
   * @param {number} row - 行号
   * @returns {Array} 植物数组
   */
  getPlantsInRow(row) {
    if (row < 0 || row >= this.rows) {
      return [];
    }

    const plants = [];
    for (let col = 0; col < this.cols; col++) {
      const plant = this.cells[row * this.cols + col];
      if (plant) {
        plants.push({ plant, col });
      }
    }
    return plants;
  }

  /**
   * 绘制网格（调试用）
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    for (const cell of this.cellBounds) {
      ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);

      // 绘制格子中心点
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(cell.centerX, cell.centerY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * 高亮显示格子（鼠标悬停效果）
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} row - 行号
   * @param {number} col - 列号
   * @param {string} color - 颜色
   */
  highlightCell(ctx, row, col, color = 'rgba(255, 255, 0, 0.3)') {
    const cell = this.cellBounds.find(c => c.row === row && c.col === col);
    if (cell) {
      ctx.fillStyle = color;
      ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
    }
  }

  /**
   * 获取网格总宽度
   */
  getTotalWidth() {
    return this.cols * this.cellWidth;
  }

  /**
   * 获取网格总高度
   */
  getTotalHeight() {
    return this.rows * this.cellHeight;
  }
}
