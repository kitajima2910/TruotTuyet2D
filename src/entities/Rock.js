/**
 * Rock.js — Vật cản đá
 *
 * Sử dụng sprite với 20 biến thể ngẫu nhiên từ assets/da/.
 * Hỗ trợ object pool: spawn / recycle / tái sử dụng.
 * Mỗi lần spawn chọn ngẫu nhiên 1 trong 20 texture.
 */

export class Rock {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this._currentVariant = 0;

    // ── Sprite (khởi tạo với biến thể đầu, spawn sẽ đổi) ──
    // Dùng texture thật từ assets/da/ — kiểm tra texture tồn tại
    const texKey = scene.textures.exists('rock-1') ? 'rock-1' : '__DEFAULT';
    this.sprite = scene.add.sprite(0, 0, texKey);
    this.sprite.setOrigin(0.5);

    // ── Container ──
    this.container = scene.add.container(0, 0, [this.sprite]);
    // Hitbox động theo kích thước sprite thực tế
    this.container.setSize(120, 80);
    this.container.setDepth(1);
    this.container.setVisible(false);
  }

  /**
   * Hiển thị tại vị trí (x, y) — phía trên màn hình
   * Chọn ngẫu nhiên 1 trong 20 biến thể đá.
   */
  spawn(x, y) {
    // Random biến thể đá (1-20), tránh trùng với lần trước
    const ROCK_COUNT = 20;
    let variant;
    do {
      variant = Math.floor(Math.random() * ROCK_COUNT) + 1;
    } while (variant === this._currentVariant && ROCK_COUNT > 1);
    this._currentVariant = variant;

    // Áp dụng texture — nếu chưa load được thì texture cũ được giữ nguyên
    const texKey = `rock-${variant}`;
    if (this.scene.textures.exists(texKey)) {
      this.sprite.setTexture(texKey);
    }

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
