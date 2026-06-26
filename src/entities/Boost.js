/**
 * Boost.js — Vật phẩm tăng tốc (collectible)
 *
 * Object pool pattern giống Tree/Rock:
 *   • Hình vuông xanh trong Container
 *   • Khi thu thập → kích hoạt trạng thái tăng tốc có thời lượng
 *   • Nhặt thêm → refresh thời gian
 */

export class Boost {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.active = false;

    // ── Vẽ vật phẩm tăng tốc (hình vuông xanh lá) ──
    this.rect = scene.add.rectangle(0, 0, 26, 26, 0x00ff88);
    this.rect.setStrokeStyle(2, 0x00cc66);

    // ── Container ──
    this.container = scene.add.container(0, 0, [this.rect]);
    this.container.setSize(26, 26);
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
