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

    // ── Player shop preview (phai spritesheet) ──
    // Load sẵn 4 frame phai để cửa hàng hiển thị animation skin mặc định
    this.load.image('player-shop-p1', 'assets/player/phai/p1.png');
    this.load.image('player-shop-p2', 'assets/player/phai/p2.png');
    this.load.image('player-shop-p3', 'assets/player/phai/p3.png');
    this.load.image('player-shop-p4', 'assets/player/phai/p4.png');

    // ── Cô gái tóc vàng skin (right spritesheet) ──
    this.load.image('skin-girl-0', 'assets/skins/co-gai-toc-vang/right/0.png');
    this.load.image('skin-girl-1', 'assets/skins/co-gai-toc-vang/right/1.png');
    this.load.image('skin-girl-2', 'assets/skins/co-gai-toc-vang/right/2.png');
    this.load.image('skin-girl-3', 'assets/skins/co-gai-toc-vang/right/3.png');
    this.load.image('skin-girl-4', 'assets/skins/co-gai-toc-vang/right/4.png');
    this.load.image('skin-girl-5', 'assets/skins/co-gai-toc-vang/right/5.png');
  }

  create() {
    // ── Tạo animation preview cho cửa hàng (phai spritesheet) ──
    if (!this.anims.exists('player-shop-preview')) {
      this.anims.create({
        key: 'player-shop-preview',
        frames: [
          { key: 'player-shop-p1' },
          { key: 'player-shop-p2' },
          { key: 'player-shop-p3' },
          { key: 'player-shop-p4' },
        ],
        frameRate: 6,
        repeat: -1, // loop vô hạn
      });
    }

    // ── Animation preview cho skin Cô gái tóc vàng ──
    if (!this.anims.exists('skin-girl-preview')) {
      this.anims.create({
        key: 'skin-girl-preview',
        frames: [
          { key: 'skin-girl-0' },
          { key: 'skin-girl-1' },
          { key: 'skin-girl-2' },
          { key: 'skin-girl-3' },
          { key: 'skin-girl-4' },
          { key: 'skin-girl-5' },
        ],
        frameRate: 6,
        repeat: -1,
      });
    }

    // Chuyển ngay sang MenuScene
    this.scene.start('MenuScene');
  }
}
