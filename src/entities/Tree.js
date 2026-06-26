/**
 * Tree.js — Vật cản cây thông (sprite + animation + 3 lives)
 *
 * Trạng thái:
 *   3 lives → tree-idle  (dung-yen: đứng yên)
 *   1-2 lives → tree-wobble (lung-lay: rung lắc sau va chạm)
 *   0 lives → tree-broken (gay: gãy đổ, play 1 lần rồi recycle)
 *
 * Hỗ trợ object pool: spawn / onHit / recycle.
 */

export class Tree {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this._lives = 3;

    // ── Sprite (thay Graphics) ──
    this.sprite = scene.add.sprite(0, 0, 'tree-dy-1');
    this.sprite.setOrigin(0.5);

    // ── Container ──
    this.container = scene.add.container(0, 0, [this.sprite]);
    // sprite 171×113 → hitbox gọn 120×80 cho collision công bằng
    this.container.setSize(120, 80);
    this.container.setDepth(1);
    this.container.setVisible(false);
  }

  /**
   * Hiển thị tại vị trí (x, y) — phía trên màn hình
   */
  spawn(x, y) {
    this._lives = 3;
    this.container.setPosition(x, y);
    this.container.setVisible(true);
    this.active = true;
    this.sprite.play('tree-idle');
  }

  /**
   * Gọi khi Player va chạm vào cây này.
   * Giảm 1 mạng, chuyển animation phù hợp.
   * @returns {{ destroyed: boolean }} — true nếu cây bị phá huỷ (lives ≤ 0)
   */
  onHit() {
    this._lives--;

    if (this._lives <= 0) {
      // Lần cuối → gãy đổ, KHÔNG tự recycle (scene sẽ dọn khi chuyển)
      this.sprite.play('tree-broken');
      return { destroyed: true };
    }

    // Còn sống → rung lắc
    this.sprite.play('tree-wobble');
    return { destroyed: false };
  }

  /**
   * Force cây thành trạng thái gãy đổ ngay — gọi khi player chết vì cây này.
   * Bất kể _lives còn bao nhiêu, cây sẽ play tree-broken.
   */
  forceBroken() {
    this.sprite.play('tree-broken');
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
