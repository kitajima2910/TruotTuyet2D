/**
 * Rock.js — Vật cản đá
 *
 * Vẽ bằng Graphics (hình bầu dục nhiều lớp), không tạo texture mới.
 * Hỗ trợ object pool: spawn / recycle / tái sử dụng.
 */

export class Rock {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.active = false;

    // ── Vẽ đá bằng Graphics (tạo 1 lần, không thay đổi) ──
    const g = scene.add.graphics();

    // Đá nền (đậm)
    g.fillStyle(0x607d8b);
    g.fillRoundedRect(-18, -13, 36, 26, 9);

    // Đá giữa (sáng hơn)
    g.fillStyle(0x78909c);
    g.fillRoundedRect(-13, -9, 26, 18, 7);

    // Highlights
    g.fillStyle(0x90a4ae);
    g.fillRoundedRect(-7, -5, 10, 7, 3);

    // ── Container ──
    this.container = scene.add.container(0, 0, [g]);
    this.container.setSize(36, 26);
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
