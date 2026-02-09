/**
 * 图片资源管理器
 * 支持加载和管理自定义植物/僵尸图片
 */

export class ImageManager {
  constructor() {
    this.images = new Map();
    this.pendingImages = new Map();
  }

  /**
   * 从文件加载图片
   * @param {File} file - 图片文件
   * @param {string} id - 图片ID
   * @returns {Promise<HTMLImageElement>}
   */
  async loadImageFromFile(file, id) {
    if (this.pendingImages.has(id)) {
      return this.pendingImages.get(id);
    }

    const promise = new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          this.images.set(id, img);
          this.pendingImages.delete(id);
          resolve(img);
        };
        img.onerror = () => {
          this.pendingImages.delete(id);
          reject(new Error('图片加载失败'));
        };
        img.src = event.target.result;
      };

      reader.onerror = () => {
        this.pendingImages.delete(id);
        reject(new Error('文件读取失败'));
      };

      reader.readAsDataURL(file);
    });

    this.pendingImages.set(id, promise);
    return promise;
  }

  /**
   * 从URL加载图片
   * @param {string} url - 图片URL
   * @param {string} id - 图片ID
   * @returns {Promise<HTMLImageElement>}
   */
  async loadImageFromUrl(url, id) {
    if (this.images.has(id)) {
      return this.images.get(id);
    }

    if (this.pendingImages.has(id)) {
      return this.pendingImages.get(id);
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        this.images.set(id, img);
        this.pendingImages.delete(id);
        resolve(img);
      };

      img.onerror = () => {
        this.pendingImages.delete(id);
        reject(new Error('图片加载失败: ' + url));
      };

      img.src = url;
    });

    this.pendingImages.set(id, promise);
    return promise;
  }

  /**
   * 获取已加载的图片
   * @param {string} id - 图片ID
   * @returns {HTMLImageElement|null}
   */
  getImage(id) {
    return this.images.get(id) || null;
  }

  /**
   * 检查图片是否存在
   * @param {string} id - 图片ID
   * @returns {boolean}
   */
  hasImage(id) {
    return this.images.has(id);
  }

  /**
   * 设置图片（用于动态创建）
   * @param {string} id - 图片ID
   * @param {HTMLImageElement} img - 图片对象
   */
  setImage(id, img) {
    this.images.set(id, img);
  }

  /**
   * 移除图片
   * @param {string} id - 图片ID
   */
  removeImage(id) {
    this.images.delete(id);
  }

  /**
   * 清空所有图片
   */
  clear() {
    this.images.clear();
    this.pendingImages.clear();
  }

  /**
   * 获取所有图片ID
   * @returns {string[]}
   */
  getAllIds() {
    return Array.from(this.images.keys());
  }

  /**
   * 将图片数据导出为Base64
   * @param {string} id - 图片ID
   * @returns {string|null}
   */
  exportImageAsBase64(id) {
    const img = this.getImage(id);
    if (!img) return null;
    return img.src; // 已经是 DataURL 格式
  }

  /**
   * 导出所有图片数据
   * @returns {Object}
   */
  exportAllImages() {
    const data = {};
    for (const [id, img] of this.images) {
      data[id] = img.src;
    }
    return data;
  }
}

// 全局图片管理器实例
export const imageManager = new ImageManager();
