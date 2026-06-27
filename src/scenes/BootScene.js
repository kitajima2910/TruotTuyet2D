/**
 * BootScene.js — Scene khởi tạo ban đầu
 * Chỉ load asset cần thiết cho MenuScene, sau đó chuyển ngay.
 * Gameplay assets được load trong LoadingScene (lazy-load).
 */

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // ── Asset chung (dùng ở nhiều scene) ──
    this.load.image('menu-bg', 'assets/bg/mm.png');
    this.load.image('gameover-bg', 'assets/bg/go.png');

    // ── Loading animation (dùng trong LoadingScene) ──
    // 16 frame nhỏ, load sẵn để LoadingScene hiển thị animation ngay
    for (let i = 1; i <= 16; i++) {
      const idx = String(i).padStart(2, '0');
      this.load.image(`ntload-${idx}`, `assets/nt-loading/nt${idx}.png`);
    }
  }

  create() {
    // Chuyển ngay sang MenuScene — không tạo animation gì ở đây
    this.scene.start('MenuScene');
  }
}
