/**
 * Player.js — Nhân vật trượt tuyết
 *
 * Di chuyển thuần theo trục X bằng manual physics:
 *   velocityX += input × acceleration
 *   velocityX *= friction (deceleration mỗi frame)
 *   velocityX clamp trong [-maxSpeed, maxSpeed]
 *
 * KHÔNG dùng Phaser Arcade/Matter Physics.
 * Player là sprite thuần, position cập nhật thủ công.
 */

export class Player {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x — vị trí bắt đầu X
   * @param {number} y — vị trí bắt đầu Y
   */
  constructor(scene, x, y) {
    this.scene = scene;

    // ── Tuneable params ──
    this.acceleration = 1200;   // px/s² — lực đẩy khi giữ nút
    this.friction = 0.92;       // hệ số giảm tốc mỗi frame (0-1)
    this.maxSpeed = 400;        // px/s — vận tốc cực đại

    // ── Runtime state ──
    this.velocityX = 0;

    // ── Sprite ──
    this.sprite = scene.add.rectangle(x, y, 40, 60, 0x3498db);
    this.sprite.setOrigin(0.5);
  }

  /**
   * Gọi mỗi frame từ PlayScene.update()
   * @param {number} delta — ms kể từ frame trước
   * @param {{ moveLeft: boolean, moveRight: boolean }} inputState
   */
  update(delta, inputState) {
    const dt = delta / 1000; // seconds

    // ── Tính acceleration từ input ──
    let inputDir = 0;
    if (inputState.moveLeft) inputDir -= 1;
    if (inputState.moveRight) inputDir += 1;

    this.velocityX += inputDir * this.acceleration * dt;

    // ── Friction (deceleration) ──
    this.velocityX *= this.friction;

    // ── Clamp maxSpeed ──
    if (this.velocityX > this.maxSpeed) this.velocityX = this.maxSpeed;
    if (this.velocityX < -this.maxSpeed) this.velocityX = -this.maxSpeed;

    // ── Dừng hẳn khi rất chậm (tránh drift vô hạn) ──
    if (Math.abs(this.velocityX) < 0.5) this.velocityX = 0;

    // ── Di chuyển ──
    this.sprite.x += this.velocityX * dt;

    // ── Giới hạn trong màn hình ──
    const halfW = this.sprite.displayWidth / 2;
    const gameW = this.scene.scale.width;
    if (this.sprite.x < halfW) {
      this.sprite.x = halfW;
      this.velocityX = 0;
    } else if (this.sprite.x > gameW - halfW) {
      this.sprite.x = gameW - halfW;
      this.velocityX = 0;
    }
  }

  /** Trả về vị trí hiện tại */
  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /**销毁 khi scene stop */
  destroy() {
    this.sprite.destroy();
  }
}
