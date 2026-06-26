/**
 * Coin.js — Xu thu thập (collectible)
 *
 * Object pool pattern giống Tree/Rock:
 *   • Hình tròn vàng trong Container
 *   • spawn → update (cuộn xuống) → recycle
 *   • KHÔNG dùng sprite, chỉ dùng Phaser.GameObjects.Arc
 */

export class Coin {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.active = false;

    // ── Vẽ đồng xu (hình tròn vàng) ──
    this.circle = scene.add.circle(0, 0, 15, 0xffd700);
    this.circle.setStrokeStyle(2, 0xdaa520);

    // ── Container ──
    this.container = scene.add.container(0, 0, [this.circle]);
    this.container.setSize(30, 30);
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
