/**
 * Rock.js — Vật cản đá
 *
 * Sử dụng sprite với 20 biến thể ngẫu nhiên từ assets/da/.
 * Hỗ trợ object pool: spawn / recycle / tái sử dụng.
 * Mỗi lần spawn chọn ngẫu nhiên 1 trong 20 texture.
 */

// Kích thước phần nhìn thấy được (visible content) của từng biến thể đá
// Đo từ pixel data — hitbox khớp chính xác phần đá thực tế, tránh transparent padding
const ROCK_VISIBLE = {
  1:{w:186,h:118}, 2:{w:224,h:138}, 3:{w:226,h:118}, 4:{w:184,h:156},
  5:{w:230,h:132}, 6:{w:181,h:158}, 7:{w:242,h:94},  8:{w:219,h:140},
  9:{w:226,h:112}, 10:{w:220,h:150}, 11:{w:240,h:110}, 12:{w:207,h:150},
  13:{w:212,h:126}, 14:{w:218,h:138}, 15:{w:229,h:108}, 16:{w:216,h:124},
  17:{w:227,h:140}, 18:{w:225,h:116}, 19:{w:242,h:122}, 20:{w:228,h:132},
};

export class Rock {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this._currentVariant = 0;

    // ── Sprite (khởi tạo với biến thể đầu, spawn sẽ đổi) ──
    const texKey = scene.textures.exists('rock-1') ? 'rock-1' : '__DEFAULT';
    this.sprite = scene.add.sprite(0, 0, texKey);
    this.sprite.setOrigin(0.5);

    // ── Container ──
    this.container = scene.add.container(0, 0, [this.sprite]);
    // Hitbox tạm, spawn() sẽ set đúng theo variant
    this.container.setSize(120, 80);
    this.container.setDepth(1);
    this.container.setVisible(false);
  }

  /**
   * Hiển thị tại vị trí (x, y) — phía trên màn hình
   * Chọn ngẫu nhiên 1 trong 20 biến thể đá.
   * Hitbox tự động khớp với phần nhìn thấy của biến thể đó.
   */
  spawn(x, y) {
    const ROCK_COUNT = 20;
    let variant;
    do {
      variant = Math.floor(Math.random() * ROCK_COUNT) + 1;
    } while (variant === this._currentVariant && ROCK_COUNT > 1);
    this._currentVariant = variant;

    // Áp dụng texture
    const texKey = `rock-${variant}`;
    if (this.scene.textures.exists(texKey)) {
      this.sprite.setTexture(texKey);
    }

    // Hitbox động theo kích thước visible của variant này
    const v = ROCK_VISIBLE[variant];
    this.container.setSize(v.w, v.h);

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
