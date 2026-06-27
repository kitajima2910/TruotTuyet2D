/**
 * LoadingScene.js — Load gameplay assets với progress bar
 *
 * Scene này load tất cả asset cần cho gameplay (player, tree, rock,
 * coin, boost, map textures, BGM) và tạo animations tương ứng.
 *
 * Hiển thị progress bar để người dùng biết tiến trình.
 * Sau khi load xong → tự chuyển sang PlayScene.
 */

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  /**
   * Nhận level từ MenuScene
   * @param {{ level?: number }} data
   */
  init(data) {
    this._level = Phaser.Math.Clamp(data?.level ?? 1, 1, 3);
  }

  preload() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // ── Progress bar ──
    const barW = 320;
    const barH = 28;
    const barX = centerX - barW / 2;
    const barY = centerY;

    // Nền progress bar
    const barBg = this.add.graphics();
    barBg.fillStyle(0x222244, 0.8);
    barBg.fillRoundedRect(barX, barY, barW, barH, 8);

    // Progress bar fill (sẽ cập nhật)
    const barFill = this.add.graphics();

    // Sprite loading animation (đứng cạnh chữ)
    // Dùng frame đầu làm static image trong lúc đợi load
    this._loadSprite = this.add.sprite(centerX - 80, barY - 36, 'ntload-01');
    this._loadSprite.setScale(0.9);

    // Text "ĐANG TẢI..."
    const loadingText = this.add
      .text(centerX + 25, barY - 36, 'ĐANG TẢI...', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#aaccff',
      })
      .setOrigin(0.5);

    // Lắng nghe tiến trình load
    this.load.on('progress', (value) => {
      barFill.clear();
      barFill.fillStyle(0x4a9eff, 1);
      barFill.fillRoundedRect(barX + 2, barY + 2, (barW - 4) * value, barH - 4, 6);
    });

    // Khi load xong, clear progress text
    this.load.on('complete', () => {
      loadingText.setText('OK!');
      loadingText.setColor('#66ff88');
    });

    // ── Load tất cả gameplay assets ──
    // Player
    this.load.image('player-tren-1', 'assets/player/tren/t1.png');
    this.load.image('player-tren-2', 'assets/player/tren/t2.png');
    this.load.image('player-tren-3', 'assets/player/tren/t3.png');
    this.load.image('player-tren-4', 'assets/player/tren/t4.png');
    this.load.image('player-trai-1', 'assets/player/trai/t1.png');
    this.load.image('player-trai-2', 'assets/player/trai/t2.png');
    this.load.image('player-trai-3', 'assets/player/trai/t3.png');
    this.load.image('player-trai-4', 'assets/player/trai/t4.png');
    this.load.image('player-phai-1', 'assets/player/phai/p1.png');
    this.load.image('player-phai-2', 'assets/player/phai/p2.png');
    this.load.image('player-phai-3', 'assets/player/phai/p3.png');
    this.load.image('player-phai-4', 'assets/player/phai/p4.png');
    this.load.image('player-vc-1', 'assets/player/va-cham/v1.png');
    this.load.image('player-vc-2', 'assets/player/va-cham/v2.png');
    this.load.image('player-vc-3', 'assets/player/va-cham/v3.png');
    this.load.image('player-vc-4', 'assets/player/va-cham/v4.png');
    this.load.image('player-vc-5', 'assets/player/va-cham/v5.png');

    // Tree — dung-yen
    this.load.image('tree-dy-1', 'assets/cay-thong/dung-yen/dy01.png');
    this.load.image('tree-dy-2', 'assets/cay-thong/dung-yen/dy02.png');
    this.load.image('tree-dy-3', 'assets/cay-thong/dung-yen/dy03.png');
    this.load.image('tree-dy-4', 'assets/cay-thong/dung-yen/dy04.png');
    this.load.image('tree-dy-5', 'assets/cay-thong/dung-yen/dy05.png');
    this.load.image('tree-dy-6', 'assets/cay-thong/dung-yen/dy06.png');

    // Tree — lung-lay
    this.load.image('tree-ll-1', 'assets/cay-thong/lung-lay/ll01.png');
    this.load.image('tree-ll-2', 'assets/cay-thong/lung-lay/ll02.png');
    this.load.image('tree-ll-3', 'assets/cay-thong/lung-lay/ll03.png');
    this.load.image('tree-ll-4', 'assets/cay-thong/lung-lay/ll04.png');
    this.load.image('tree-ll-5', 'assets/cay-thong/lung-lay/ll05.png');
    this.load.image('tree-ll-6', 'assets/cay-thong/lung-lay/ll06.png');

    // Tree — gay
    this.load.image('tree-g-1', 'assets/cay-thong/gay/g01.png');
    this.load.image('tree-g-2', 'assets/cay-thong/gay/g02.png');
    this.load.image('tree-g-3', 'assets/cay-thong/gay/g03.png');
    this.load.image('tree-g-4', 'assets/cay-thong/gay/g04.png');
    this.load.image('tree-g-5', 'assets/cay-thong/gay/g05.png');

    // Rock (20 biến thể)
    for (let i = 1; i <= 20; i++) {
      this.load.image(`rock-${i}`, `assets/da/d${i}.png`);
    }

    // Coin (16 frame)
    for (let i = 0; i <= 15; i++) {
      const idx = String(i).padStart(2, '0');
      this.load.image(`coin-${idx}`, `assets/coin/c${idx}.png`);
    }

    // Boost-pad (7 frame)
    for (let i = 1; i <= 7; i++) {
      this.load.image(`boostpad-${i}`, `assets/boost-pad/bp${i}.png`);
    }

    // Map textures
    this.load.image('map-snow-1', 'assets/map/ver1/map.png');
    this.load.image('map-snow-2', 'assets/map/ver2/map.png');
    this.load.image('map-snow-3', 'assets/map/ver3/map.png');

    // BGM audio
    this.load.audio('bgm',        'assets/audio/bgm-level1.mp3');
    this.load.audio('bgm-level2', 'assets/audio/bgm-level2.mp3');
    this.load.audio('bgm-level3', 'assets/audio/bgm-level3.mp3');
  }

  create() {
    // ── Tạo animations cho Player (nếu chưa tồn tại) ──
    if (!this.anims.exists('player-idle')) {
      this.anims.create({
        key: 'player-idle',
        frames: [
          { key: 'player-tren-1' },
          { key: 'player-tren-2' },
          { key: 'player-tren-3' },
          { key: 'player-tren-4' },
        ],
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists('player-left')) {
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
    }

    if (!this.anims.exists('player-right')) {
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
    }

    if (!this.anims.exists('player-collision')) {
      this.anims.create({
        key: 'player-collision',
        frames: [
          { key: 'player-vc-1' },
          { key: 'player-vc-1' },
          { key: 'player-vc-1' },
          { key: 'player-vc-1' },
          { key: 'player-vc-2' },
          { key: 'player-vc-3' },
          { key: 'player-vc-4' },
          { key: 'player-vc-5' },
        ],
        frameRate: 10,
        repeat: 0,
      });
    }

    // ── Coin animation ──
    if (!this.anims.exists('coin-spin')) {
      const coinFrames = [];
      for (let i = 0; i <= 15; i++) {
        const idx = String(i).padStart(2, '0');
        coinFrames.push({ key: `coin-${idx}` });
      }
      this.anims.create({
        key: 'coin-spin',
        frames: coinFrames,
        frameRate: 12,
        repeat: -1,
      });
    }

    // ── Boost-pad animation ──
    if (!this.anims.exists('boostpad-glow')) {
      this.anims.create({
        key: 'boostpad-glow',
        frames: [
          { key: 'boostpad-1' },
          { key: 'boostpad-2' },
          { key: 'boostpad-3' },
          { key: 'boostpad-4' },
          { key: 'boostpad-5' },
          { key: 'boostpad-6' },
          { key: 'boostpad-7' },
        ],
        frameRate: 10,
        repeat: 0,
      });
    }

    // ── Tree animations ──
    if (!this.anims.exists('tree-idle')) {
      this.anims.create({
        key: 'tree-idle',
        frames: [
          { key: 'tree-dy-1' },
          { key: 'tree-dy-2' },
          { key: 'tree-dy-3' },
          { key: 'tree-dy-4' },
          { key: 'tree-dy-5' },
          { key: 'tree-dy-6' },
        ],
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists('tree-wobble')) {
      this.anims.create({
        key: 'tree-wobble',
        frames: [
          { key: 'tree-ll-1' },
          { key: 'tree-ll-2' },
          { key: 'tree-ll-3' },
          { key: 'tree-ll-4' },
          { key: 'tree-ll-5' },
          { key: 'tree-ll-6' },
        ],
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.anims.exists('tree-broken')) {
      this.anims.create({
        key: 'tree-broken',
        frames: [
          { key: 'tree-g-1' },
          { key: 'tree-g-2' },
          { key: 'tree-g-3' },
          { key: 'tree-g-4' },
          { key: 'tree-g-5' },
        ],
        frameRate: 8,
        repeat: 0,
      });
    }

    // ── Loading animation ──
    if (!this.anims.exists('loading-idle')) {
      const ntframes = [];
      for (let i = 1; i <= 16; i++) {
        const idx = String(i).padStart(2, '0');
        ntframes.push({ key: `ntload-${idx}` });
      }
      this.anims.create({
        key: 'loading-idle',
        frames: ntframes,
        frameRate: 10,
        repeat: -1,
      });
    }
    this._loadSprite.play('loading-idle');

    // ── Chờ 1s để thấy animation rồi chuyển sang PlayScene ──
    this.time.delayedCall(1000, () => {
      this.scene.start('PlayScene', { level: this._level });
    });
  }
}
