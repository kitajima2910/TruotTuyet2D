/**
 * PlayScene.js — Scene gameplay chính
 *
 * Chỉ khởi tạo Terrain + InputSystem + Player + SpawnSystem.
 * Gọi update() mỗi frame — KHÔNG chứa logic spawn, random hay recycle.
 */

import { InputSystem } from '../systems/InputSystem.js';
import { Player } from '../entities/Player.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });
  }

  create() {
    const { width, height } = this.scale;

    // ── Biến scrollSpeed dùng chung cho terrain + obstacles ──
    this.scrollSpeed = 300;

    // ── Terrain (nền tuyết cuộn vô hạn) ──
    this._createTerrain();

    // ── InputSystem ──
    this._input = new InputSystem(this);

    // ── Player (giữa màn hình, ¾ chiều cao) ──
    this._player = new Player(this, width / 2, height * 0.75);
    this._player.sprite.setDepth(10);

    // ── SpawnSystem (object pool Tree + Rock) ──
    this._spawnSystem = new SpawnSystem(this, {
      scrollSpeed: this.scrollSpeed,
      treePoolSize: 6,
      rockPoolSize: 6,
      spawnInterval: 1200,
      minGapX: 80,
      playerSafeZone: 70,
    });
  }

  update(_time, delta) {
    // 1. Đọc input
    this._input.update();

    // 2. Cập nhật player
    const inputState = this._input.getState();
    this._player.update(delta, inputState);

    // 3. Cuộn nền tuyết
    this._updateTerrain(delta);

    // 4. Cập nhật SpawnSystem (spawn / di chuyển / recycle)
    const { x: playerX } = this._player.getPosition();
    this._spawnSystem.update(delta, playerX);
  }

  // ══════════════════════════════════════════════
  //  TERRAIN — Nền tuyết cuộn vô hạn
  // ══════════════════════════════════════════════

  _createTerrain() {
    const { width, height } = this.scale;

    // Đường kẻ dọc — vệt trượt tuyết, tạo cảm giác chuyển động
    const laneX = [width * 0.25, width * 0.5, width * 0.75];
    this._terrainLines = [];

    for (const x of laneX) {
      // Mỗi lane gồm nhiều đoạn ngắn xếp dọc, cuộn liên tục
      const segCount = 6;
      const segH = 40;
      const gap = height / segCount;

      for (let i = 0; i < segCount; i++) {
        const seg = this.add.rectangle(x, i * gap, 3, segH, 0xc8d6e5);
        seg.setOrigin(0.5, 0);
        seg.setAlpha(0.45);
        seg.setDepth(0);
        this._terrainLines.push(seg);
      }
    }
  }

  _updateTerrain(delta) {
    const { height } = this.scale;
    const dt = delta / 1000;
    const moveY = this.scrollSpeed * dt;

    for (const seg of this._terrainLines) {
      seg.y += moveY;
      // wrap khi xuống hết màn hình
      if (seg.y > height) {
        seg.y -= height + 40; // 40 = segH → quay lại phía trên
      }
    }
  }

  // ══════════════════════════════════════════════

  shutdown() {
    this._input.destroy();
    this._player.destroy();
    this._spawnSystem.destroy();
  }
}
