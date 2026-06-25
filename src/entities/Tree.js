/**
 * Tree.js — Vật cản cây thông
 *
 * Vẽ bằng Graphics (thân + tán lá), không tạo texture mới.
 * Hỗ trợ object pool: spawn / recycle / tái sử dụng.
 */

export class Tree {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.active = false;

    // ── Vẽ cây bằng Graphics (tạo 1 lần, không thay đổi) ──
    const g = scene.add.graphics();

    // Thân gỗ
    g.fillStyle(0x6d4c2e);
    g.fillRect(-5, 0, 10, 28);

    // Tán lá dưới (rộng)
    g.fillStyle(0x2e7d32);
    g.fillTriangle(0, -8, -20, 8, 20, 8);

    // Tán lá trên (nhọn)
    g.fillStyle(0x388e3c);
    g.fillTriangle(0, -32, -15, -2, 15, -2);

    // ── Container ──
    this.container = scene.add.container(0, 0, [g]);
    this.container.setSize(40, 60);
    this.container.setDepth(1);
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
   * Ẩn đi, đánh dấu inactive để pool tái sử dụng
   */
  recycle() {
    this.container.setVisible(false);
    this.active = false;
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
   * Lấy bounds trùng khung (dùng cho debug / collision sau)
   */
  getBounds() {
    return this.container.getBounds();
  }

  /** Destroy khi scene stop */
  destroy() {
    this.container.destroy(true);
  }
}
