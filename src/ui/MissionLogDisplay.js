/**
 * MissionLogDisplay.js — Log nhiệm vụ dạng live-stream
 *
 * Giống log ở các buổi live stream: panel cố định bên phải,
 * dòng mới xuất hiện ở dưới cùng, các dòng cũ trượt lên trên.
 * Dùng pool text objects, không tạo/huỷ đối tượng mỗi lần.
 *
 * Cách dùng:
 *   this._missionLog = new MissionLogDisplay(this);
 *   this._missionLog.showProgress('Đi 500m', 150, 500);
 *   this._missionLog.showComplete('Đi 500m', 50);
 */

const MAX_VISIBLE = 5;         // số dòng hiển thị tối đa
const LINE_H = 22;             // chiều cao mỗi dòng
const LOG_W = 230;             // chiều rộng
const LOG_PAD = 8;             // padding trái/phải
const THROTTLE_MS = 600;       // khoảng cách tối thiểu giữa các log

export class MissionLogDisplay {
  /**
   * @param {Phaser.Scene} scene — UIScene
   */
  constructor(scene) {
    this.scene = scene;
    this._lastTime = 0;
    /** @type {Array<{text: Phaser.GameObjects.Text}>} */
    this._entries = [];
    this._pool = [];

    const { width } = scene.scale;

    // ── Container cố định, depth trên HUD ──
    this._container = scene.add.container(width - LOG_PAD, 165).setDepth(230);

    // ── Background panel ──
    this._bg = scene.add.graphics();
    this._bg.fillStyle(0x000000, 0.65);
    this._bg.fillRoundedRect(-LOG_W, -LINE_H, LOG_W, MAX_VISIBLE * LINE_H + LINE_H, 8);
    this._container.add(this._bg);

    // ── Pool text objects (tạo 1 lần) ──
    for (let i = 0; i < MAX_VISIBLE; i++) {
      const t = scene.add.text(-LOG_W + 6, (i + 0.5) * LINE_H, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0, 0.5);
      this._container.add(t);
      this._pool.push(t);
    }

    this._container.setVisible(false);
  }

  /**
   * @param {string} name
   * @param {number} progress
   * @param {number} target
   */
  showProgress(name, progress, target) {
    this._push(`${name}: ${progress}/${target}`, '#aaccff', '📈');
  }

  /**
   * @param {string} name
   * @param {number} reward
   */
  showComplete(name, reward) {
    this._push(`${name}: ✅ +${reward} Xu`, '#66ff88', '🏆');
  }

  /**
   * Thêm dòng log mới, đẩy các dòng cũ lên trên.
   * @param {string} text
   * @param {string} color
   * @param {string} icon
   */
  _push(text, color, icon) {
    const now = performance.now();
    if (now - this._lastTime < THROTTLE_MS) return;
    this._lastTime = now;

    // Lấy text object: pool nếu còn slot, hoặc tái sử dụng từ entry cũ nhất
    let t;
    if (this._entries.length < MAX_VISIBLE) {
      // Tìm text object không đang dùng trong entries
      t = this._pool.find(pt => !this._entries.some(e => e.text === pt));
    } else {
      // Đầy rồi — đẩy entry cũ nhất ra ngoài
      const oldest = this._entries.shift();
      t = oldest.text;
    }

    t.setText(`${icon} ${text}`);
    t.setColor(color);
    t.setAlpha(1);
    t.setVisible(true);

    this._container.setVisible(true);
    this._entries.push({ text: t });

    // Reposition: dòng mới nhất ở dưới cùng
    this._reposition();
  }

  /** Sắp xếp các dòng từ trên xuống dưới (cũ → mới) */
  _reposition() {
    const startY = 0;
    for (let i = 0; i < this._entries.length; i++) {
      this._entries[i].text.y = startY + i * LINE_H;
    }
    // Ẩn các pool text không dùng
    for (const t of this._pool) {
      if (!this._entries.find(e => e.text === t)) {
        t.setVisible(false);
      }
    }
  }

  /** Dọn dẹp */
  destroy() {
    this._entries = [];
    this.scene.tweens.killTweensOf(this._container);
    this._container.destroy(true);
  }
}
