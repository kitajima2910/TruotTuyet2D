/**
 * InputSystem.js — Hệ thống đọc input
 *
 * Hỗ trợ:
 *   • Bàn phím: Arrow Left / Arrow Right, A / D
 *   • Pointer (mobile): giữ nửa trái / phải màn hình
 *
 * Chỉ xuất trạng thái { moveLeft, moveRight }.
 * KHÔNG điều khiển Player trực tiếp.
 */

export class InputSystem {
  /**
   * @param {Phaser.Scene} scene — scene đang chạy
   */
  constructor(scene) {
    this.scene = scene;

    // ── Trạng thái output ──
    this.moveLeft = false;
    this.moveRight = false;

    // ── Keyboard ──
    const kb = scene.input.keyboard;
    this._keyLeft = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this._keyRight = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this._keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this._keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // ── Pointer (touch / mouse drag-hold) ──
    this._pointerActive = false;
    this._pointerSide = null; // 'left' | 'right'

    scene.input.on('pointerdown', this._onPointerDown, this);
    scene.input.on('pointerup', this._onPointerUp, this);
    scene.input.on('pointermove', this._onPointerMove, this);
  }

  /**
   * Gọi mỗi frame từ PlayScene.update()
   * Cập nhật trạng thái moveLeft / moveRight.
   */
  update() {
    // ── Keyboard ──
    const kbLeft = this._keyLeft.isDown || this._keyA.isDown;
    const kbRight = this._keyRight.isDown || this._keyD.isDown;

    // ── Pointer ──
    let ptrLeft = false;
    let ptrRight = false;
    if (this._pointerActive && this._pointerSide) {
      ptrLeft = this._pointerSide === 'left';
      ptrRight = this._pointerSide === 'right';
    }

    // ── Merge (OR) ──
    this.moveLeft = kbLeft || ptrLeft;
    this.moveRight = kbRight || ptrRight;
  }

  /**
   * Trả về snapshot trạng thái hiện tại (immutable copy)
   * @returns {{ moveLeft: boolean, moveRight: boolean }}
   */
  getState() {
    return {
      moveLeft: this.moveLeft,
      moveRight: this.moveRight,
    };
  }

  // ─── Pointer handlers (private) ───

  _onPointerDown(pointer) {
    this._pointerActive = true;
    this._pointerSide = this._resolvePointerSide(pointer.x);
  }

  _onPointerMove(pointer) {
    if (this._pointerActive) {
      this._pointerSide = this._resolvePointerSide(pointer.x);
    }
  }

  _onPointerUp() {
    this._pointerActive = false;
    this._pointerSide = null;
  }

  /** Xác định bên trái / phải dựa trên vị trí pointer */
  _resolvePointerSide(px) {
    const halfW = this.scene.scale.width / 2;
    return px < halfW ? 'left' : 'right';
  }

  /** Dọn event khi scene stop */
  destroy() {
    this.scene.input.off('pointerdown', this._onPointerDown, this);
    this.scene.input.off('pointerup', this._onPointerUp, this);
    this.scene.input.off('pointermove', this._onPointerMove, this);
  }
}
