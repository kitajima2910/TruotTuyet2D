/**
 * InputSystem.js — Hệ thống đọc input
 *
 * Hỗ trợ:
 *   • Bàn phím: Arrow Left / Arrow Right, A / D, Space
 *   • Pointer (mobile): giữ nửa trái / phải màn hình + nút NHẢY
 *
 * Xuất trạng thái { moveLeft, moveRight, jump }.
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
    this.jump = false;

    // ── Keyboard ──
    const kb = scene.input.keyboard;
    this._keyLeft = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this._keyRight = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this._keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this._keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this._keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── Pointer (touch / mouse drag-hold) ──
    this._pointerActive = false;
    this._pointerSide = null; // 'left' | 'right'

    scene.input.on('pointerdown', this._onPointerDown, this);
    scene.input.on('pointerup', this._onPointerUp, this);
    scene.input.on('pointermove', this._onPointerMove, this);

    // ── Mobile jump button ──
    this._jumpBtnPressed = false;
    this._createJumpButton(scene);
  }

  /**
   * Tạo nút NHẢY cho mobile — hiển thị ở cuối màn hình, chính giữa.
   * @param {Phaser.Scene} scene
   */
  _createJumpButton(scene) {
    const { width, height } = scene.scale;
    const btnW = 140;
    const btnH = 60;
    const btnX = width / 2;
    const btnY = height - 90;

    // Background
    const bg = scene.add.graphics();
    bg.fillStyle(0xffffff, 0.2);
    bg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
    bg.setDepth(190);

    // Label
    const label = scene.add.text(btnX, btnY, 'NHẢY', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(191);

    // Interactive zone
    const zone = scene.add.zone(btnX, btnY, btnW, btnH)
      .setInteractive({ useHandCursor: false })
      .setDepth(192);

    zone.on('pointerdown', () => {
      this._jumpBtnPressed = true;
      // Phản hồi visual
      bg.clear();
      bg.fillStyle(0xffffff, 0.4);
      bg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
    });

    zone.on('pointerup', () => {
      bg.clear();
      bg.fillStyle(0xffffff, 0.2);
      bg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
    });

    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0xffffff, 0.2);
      bg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
    });

    // Ẩn trên desktop, hiện trên touch device
    if (!scene.sys.game.device.input.touch) {
      bg.setAlpha(0);
      label.setAlpha(0);
      zone.disableInteractive();
    }

    this._jumpBtnBg = bg;
    this._jumpBtnLabel = label;
    this._jumpBtnZone = zone;
  }

  /**
   * Gọi mỗi frame từ PlayScene.update()
   * Cập nhật trạng thái moveLeft / moveRight / jump.
   */
  update() {
    // ── Keyboard ──
    const kbLeft = this._keyLeft.isDown || this._keyA.isDown;
    const kbRight = this._keyRight.isDown || this._keyD.isDown;

    // ── Pointer (di chuyển) ──
    let ptrLeft = false;
    let ptrRight = false;
    if (this._pointerActive && this._pointerSide) {
      ptrLeft = this._pointerSide === 'left';
      ptrRight = this._pointerSide === 'right';
    }

    // ── Merge (OR) ──
    this.moveLeft = kbLeft || ptrLeft;
    this.moveRight = kbRight || ptrRight;

    // ── Jump ──
    this.jump = Phaser.Input.Keyboard.JustDown(this._keySpace) || this._jumpBtnPressed;
    if (this._jumpBtnPressed) {
      this._jumpBtnPressed = false; // reset after one read
    }
  }

  /**
   * Trả về snapshot trạng thái hiện tại (immutable copy)
   * @returns {{ moveLeft: boolean, moveRight: boolean, jump: boolean }}
   */
  getState() {
    return {
      moveLeft: this.moveLeft,
      moveRight: this.moveRight,
      jump: this.jump,
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

    // Dọn jump button
    if (this._jumpBtnBg) this._jumpBtnBg.destroy();
    if (this._jumpBtnLabel) this._jumpBtnLabel.destroy();
    if (this._jumpBtnZone) this._jumpBtnZone.destroy();
  }
}
