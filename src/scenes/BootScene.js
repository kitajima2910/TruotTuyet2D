/**
 * BootScene.js — Scene khởi tạo ban đầu
 * Load assets rồi chuyển sang MenuScene
 */

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // ── Load sprite frames cho Player ──
    // tren (mặc định / di chuyển lên)
    this.load.image('player-tren-1', 'assets/player/tren/t1.png');
    this.load.image('player-tren-2', 'assets/player/tren/t2.png');
    this.load.image('player-tren-3', 'assets/player/tren/t3.png');
    this.load.image('player-tren-4', 'assets/player/tren/t4.png');

    // trai (di chuyển bên trái)
    this.load.image('player-trai-1', 'assets/player/trai/t1.png');
    this.load.image('player-trai-2', 'assets/player/trai/t2.png');
    this.load.image('player-trai-3', 'assets/player/trai/t3.png');
    this.load.image('player-trai-4', 'assets/player/trai/t4.png');

    // phai (di chuyển bên phải)
    this.load.image('player-phai-1', 'assets/player/phai/p1.png');
    this.load.image('player-phai-2', 'assets/player/phai/p2.png');
    this.load.image('player-phai-3', 'assets/player/phai/p3.png');
    this.load.image('player-phai-4', 'assets/player/phai/p4.png');

    // va-cham (animation khi va chạm)
    this.load.image('player-vc-1', 'assets/player/va-cham/v1.png');
    this.load.image('player-vc-2', 'assets/player/va-cham/v2.png');
    this.load.image('player-vc-3', 'assets/player/va-cham/v3.png');
    this.load.image('player-vc-4', 'assets/player/va-cham/v4.png');
    this.load.image('player-vc-5', 'assets/player/va-cham/v5.png');

    // ── Map textures (3 màn chơi) ──
    this.load.image('map-snow-1', 'assets/map/ver1/map.png');
    this.load.image('map-snow-2', 'assets/map/ver2/map.png');
    this.load.image('map-snow-3', 'assets/map/ver3/map.png');
  }

  create() {
    // ── Tạo animations cho Player ──
    this.anims.create({
      key: 'player-idle',
      frames: [
        { key: 'player-tren-1' },
        { key: 'player-tren-2' },
        { key: 'player-tren-3' },
        { key: 'player-tren-4' },
      ],
      frameRate: 8,
      repeat: -1, // lặp vô hạn
    });

    this.anims.create({
      key: 'player-left',
      frames: [
        { key: 'player-trai-1' },
        { key: 'player-trai-2' },
        { key: 'player-trai-3' },
        { key: 'player-trai-4' },
      ],
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-right',
      frames: [
        { key: 'player-phai-1' },
        { key: 'player-phai-2' },
        { key: 'player-phai-3' },
        { key: 'player-phai-4' },
      ],
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-collision',
      frames: [
        // Frame đầu lặp 4 lần → thấy rõ trước khi tiếp tục
        { key: 'player-vc-1' },
        { key: 'player-vc-1' },
        { key: 'player-vc-1' },
        { key: 'player-vc-1' },
        // Các frame còn lại
        { key: 'player-vc-2' },
        { key: 'player-vc-3' },
        { key: 'player-vc-4' },
        { key: 'player-vc-5' },
      ],
      frameRate: 10,
      repeat: 0, // chỉ play 1 lần
    });

    // Chuyển sang MenuScene
    this.scene.start('MenuScene');
  }
}
