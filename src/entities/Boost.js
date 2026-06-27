/**
 * Boost.js — Boost-pad trên đường đua
 *
 * Object pool pattern:
 *   • Sprite boost-pad (bp1.png) — hiển thị ở chế độ chờ
 *   • Khi player chạm → play animation boostpad-glow (bp1→bp7)
 *   • KHÔNG biến mất khi chạm — chỉ recycle khi scroll ra khỏi màn hình
 *   • Triggered flag ngăn kích hoạt lại
 */

export class Boost {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this._triggered = false;

    // ── Sprite boost-pad (mặc định hiển thị frame 1) ──
    this.sprite = scene.add.sprite(0, 0, 'boostpad-1');
    this.sprite.setOrigin(0.5);
    this.sprite.setScale(0.38); // 179×427 → ~68×162, nhỉnh hơn player

    // ── Container ──
    this.container = scene.add.container(0, 0, [this.sprite]);
    this.container.setSize(68, 160);
    this.container.setDepth(0); // nằm dưới cùng khi overlay
    this.container.setVisible(false);
  }

  /**
   * Hiển thị tại vị trí (x, y) — phía trên màn hình
   */
  spawn(x, y) {
    this.container.setPosition(x, y);
    this.container.setVisible(true);
    this.sprite.setTexture('boostpad-1');
    this.active = true;
    this._triggered = false;
  }

  /**
   * Kích hoạt animation glow khi player chạm vào
   */
  trigger() {
    if (this._triggered) return;
    this._triggered = true;
    this.sprite.play('boostpad-glow');
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
    this.sprite.stop();
    this.active = false;
    this._triggered = false;
  }

  /** Destroy khi scene stop */
  destroy() {
    this.container.destroy(true);
  }
}
