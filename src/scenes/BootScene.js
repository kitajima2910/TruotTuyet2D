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
    // ── Chỉ load background cho menu ──
    // Menu cần: menu-bg
    // Gameplay assets (player, tree, rock, coin, boost, map, BGM)
    // được load lazy trong LoadingScene để menu hiện ngay.
    this.load.image('menu-bg', 'assets/bg/mm.png');
    this.load.image('gameover-bg', 'assets/bg/go.png');
  }

  create() {
    // Chuyển ngay sang MenuScene — không tạo animation gì ở đây
    this.scene.start('MenuScene');
  }
}
