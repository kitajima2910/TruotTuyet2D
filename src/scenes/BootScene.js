/**
 * BootScene.js — Scene khởi tạo ban đầu
 * Chuyển tiếp ngay sang MenuScene
 */

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // Chuyển sang MenuScene ngay lập tức
    this.scene.start('MenuScene');
  }
}
