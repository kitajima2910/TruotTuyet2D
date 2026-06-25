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
 *
 * Animations:
 *   - player-idle  (tren): mặc định, di chuyển lên
 *   - player-left  (trai): di chuyển bên trái
 *   - player-right (phai): di chuyển bên phải
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
    this.tiltAngle = 30;        // độ nghiêng khi di chuyển (degrees)
    this.tiltSpeed = 6;         // tốc độ lerp rotation (cao = nhanh hơn)

    // ── Collision hitbox (nhỏ hơn sprite, bỏ qua transparent padding) ──
    this._hitboxW = 42;         // px — chiều rộng vùng va chạm thực tế
    this._hitboxH = 64;         // px — chiều cao vùng va chạm thực tế

    // ── Runtime state ──
    this.velocityX = 0;
    this._currentAnim = null;   // track animation hiện tại
    this._targetRotation = 0;   // rotation mục tiêu (radians)

    // ── Sprite (dùng sprite thay vì rectangle) ──
    this.sprite = scene.add.sprite(x, y, 'player-tren-1');
    this.sprite.setOrigin(0.5);

    // ── Chạy animation mặc định (idle/tren) ──
    this.sprite.play('player-idle');
    this._currentAnim = 'player-idle';
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

    // ── Switch animation theo hướng di chuyển ──
    this._updateAnimation(inputDir);

    // ── Rotation nghiêng theo hướng di chuyển ──
    this._updateRotation(dt);
  }

  /**
   * Chuyển animation dựa trên input direction
   * @param {number} inputDir — -1 (trái), 0 (idle), 1 (phải)
   */
  _updateAnimation(inputDir) {
    let targetAnim;

    if (inputDir < 0) {
      targetAnim = 'player-left';
      this._targetRotation = Phaser.Math.DegToRad(this.tiltAngle); // nghiêng trái
    } else if (inputDir > 0) {
      targetAnim = 'player-right';
      this._targetRotation = Phaser.Math.DegToRad(-this.tiltAngle); // nghiêng phải
    } else {
      targetAnim = 'player-idle';
      this._targetRotation = 0; // về thẳng
    }

    // Chỉ play nếu khác animation hiện tại (tránh replay liên tục)
    if (targetAnim !== this._currentAnim) {
      this.sprite.play(targetAnim);
      this._currentAnim = targetAnim;
    }
  }

  /**
   * Smooth rotation — lerp về target rotation mỗi frame
   * @param {number} dt — delta seconds
   */
  _updateRotation(dt) {
    const diff = this._targetRotation - this.sprite.rotation;
    // Lerp: chỉ quay khi diff đủ lớn (tránh rung)
    if (Math.abs(diff) > 0.001) {
      this.sprite.rotation += diff * this.tiltSpeed * dt;
    } else {
      this.sprite.rotation = this._targetRotation;
    }
  }

  /** Trả về vị trí hiện tại */
  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /**
   * Trả về hitbox rectangle (nhỏ hơn sprite, bỏ qua padding dư).
   * Dùng cho AABB collision — không dùng getBounds().
   * @returns {Phaser.Geom.Rectangle}
   */
  getHitbox() {
    return new Phaser.Geom.Rectangle(
      this.sprite.x - this._hitboxW / 2,
      this.sprite.y - this._hitboxH / 2,
      this._hitboxW,
      this._hitboxH,
    );
  }

  /**销毁 khi scene stop */
  destroy() {
    this.sprite.destroy();
  }
}
