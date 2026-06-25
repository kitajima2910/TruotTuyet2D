/**
 * PlayScene.js — Scene gameplay chính
 *
 * Chỉ khởi tạo InputSystem + Player, gọi update mỗi frame.
 * KHÔNG chứa logic input hay gameplay bổ sung.
 */

import { InputSystem } from '../systems/InputSystem.js';
import { Player } from '../entities/Player.js';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });
  }

  create() {
    const { width, height } = this.scale;

    // ── InputSystem ──
    this._input = new InputSystem(this);

    // ── Player (giữa màn hình, ¾ chiều cao) ──
    this._player = new Player(this, width / 2, height * 0.75);
  }

  update(_time, delta) {
    // 1. Đọc input
    this._input.update();

    // 2. Cập nhật player với trạng thái input
    const inputState = this._input.getState();
    this._player.update(delta, inputState);
  }

  shutdown() {
    this._input.destroy();
    this._player.destroy();
  }
}
