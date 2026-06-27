/**
 * Coin.js — Xu thu thập (collectible)
 *
 * Object pool pattern giống Tree/Rock:
 *   • Sprite với animation coin-spin trong Container
 *   • spawn → update (cuộn xuống) → recycle
 */

export class Coin {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.active = false;

    // ── Sprite đồng xu (animation xoay tròn) ──
    this.sprite = scene.add.sprite(0, 0, 'coin-00');
    this.sprite.setOrigin(0.5);
    this.sprite.setScale(0.25); // nhỏ hơn player

    // ── Container ──
    this.container = scene.add.container(0, 0, [this.sprite]);
    // Hitbox thu hẹp sát visual — coin chỉ mất khi chạm thật sự
    this.container.setSize(22, 22);
    this.container.setDepth(2);
    this.container.setVisible(false);
  }

  /**
   * Hiển thị tại vị trí (x, y) — phía trên màn hình
   */
  spawn(x, y) {
    this.container.setPosition(x, y);
    this.container.setVisible(true);
    this.active = true;
    this.sprite.play('coin-spin');
  }

  /**
   * Cuộn xuống theo scrollSpeed
   * @param {number} delta — ms
   * @param {number} scrollSpeed — px/s
   */
  update(delta, scrollSpeed) {
    if (!this.active) return;
    this.container.y += scrollSpeed * (delta / 1000);
  }

  /**
   * Ẩn đi, đánh dấu inactive để pool tái sử dụng
   */
  recycle() {
    this.container.setVisible(false);
    this.active = false;
  }

  /** Destroy khi scene stop */
  destroy() {
    this.container.destroy(true);
  }
}
