/**
 * HowToPlayPanel.js — Panel hướng dẫn cách chơi và điều khiển
 *
 * Modal overlay hiển thị trên MenuScene, giải thích:
 *   • Cách chơi cơ bản
 *   • Điều khiển bàn phím / cảm ứng
 *   • Vật phẩm và điểm số
 *
 * Cách dùng:
 *   const panel = new HowToPlayPanel(this);
 *   panel.show();
 *   panel.hide();
 *   panel.toggle();
 */

const C = {
  gold: '#ffd700',
  cyan: '#88ccff',
  green: '#66ff88',
  white: '#ffffff',
  textDim: '#8899aa',
  textMuted: '#556677',
  orange: '#ff9944',
  pink: '#ff66aa',
};

export class HowToPlayPanel {
  /**
   * @param {Phaser.Scene} scene — scene chứa panel
   * @param {function(boolean): void} [onVisibilityChange]
   */
  constructor(scene, onVisibilityChange) {
    this.scene = scene;
    this._onVisibilityChange = onVisibilityChange;
    this._visible = false;
    this._tweens = [];

    // ── Container chính ──
    this._container = scene.add.container(0, 0).setDepth(350).setVisible(false);

    const { width, height } = scene.scale;

    // ── Backdrop mờ ──
    this._bg = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65);
    this._bg.setInteractive();
    this._bg.on('pointerdown', () => this.hide());
    this._container.add(this._bg);

    // ── Kích thước panel ──
    const pw = Math.min(460, width * 0.9);
    const ph = Math.min(580, height * 0.82);
    const px = width / 2;
    const py = height / 2;

    // ── Panel nền ──
    const panelBg = scene.add.graphics();
    panelBg.fillStyle(0x000000, 0.4);
    panelBg.fillRoundedRect(px - pw / 2 + 3, py - ph / 2 + 3, pw, ph, 18);
    panelBg.fillStyle(0x12122a, 0.97);
    panelBg.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 18);
    panelBg.lineStyle(1.5, 0x3a3a7a, 0.7);
    panelBg.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 18);
    panelBg.fillStyle(0x2a2a6a, 0.15);
    panelBg.fillRoundedRect(px - pw / 2, py - ph / 2, pw, 60, { tl: 18, tr: 18, bl: 0, br: 0 });
    this._container.add(panelBg);

    // ── Nút đóng (✕) ──
    const closeBtn = scene.add.text(px + pw / 2 - 14, py - ph / 2 + 12, '✕', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#778899',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    closeBtn.on('pointerover', () => closeBtn.setColor(C.gold));
    closeBtn.on('pointerout', () => closeBtn.setColor('#778899'));
    this._container.add(closeBtn);

    // ── Title ──
    const title = scene.add.text(px, py - ph / 2 + 28, '📖 HƯỚNG DẪN', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: C.cyan,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this._container.add(title);

    // ── Content ──
    const sections = [
      {
        title: '🎯 Mục tiêu',
        lines: [
          'Điều khiển người trượt tuyết né chướng ngại vật,',
          'thu thập xu và sống càng lâu càng tốt!',
        ],
      },
      {
        title: '⌨️ Bàn phím',
        lines: [
          '← / A  — Di chuyển sang trái',
          '→ / D  — Di chuyển sang phải',
          'SPACE  — Nhảy',
          'ESC    — Tạm dừng',
        ],
      },
      {
        title: '📱 Cảm ứng (Mobile)',
        lines: [
          'Chạm nửa trái màn hình → Sang trái',
          'Chạm nửa phải màn hình → Sang phải',
          'Nút NHẢY ở giữa phía dưới → Nhảy',
        ],
      },
      {
        title: '⭐ Vật phẩm',
        lines: [
          '💰 Xu   — Cộng điểm và tích luỹ',
          '🚀 Boost — Tăng tốc trong 5 giây',
        ],
      },
      {
        title: '⚠️ Vật cản',
        lines: [
          '⛰️ Đá  — Tránh hoặc nhảy qua',
          '🌲 Cây  — Tránh hoặc nhảy qua',
        ],
      },
    ];

    const scrollContent = scene.add.container(0, 0);
    this._container.add(scrollContent);

    let currentY = py - ph / 2 + 80;
    const sectionGap = 24;
    const leftMargin = px - pw / 2 + 26;

    sections.forEach((section) => {
      // Section title
      const secTitle = scene.add.text(leftMargin, currentY, section.title, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: C.gold,
      }).setOrigin(0, 0);
      scrollContent.add(secTitle);
      currentY += 22;

      // Section lines
      section.lines.forEach((line) => {
        const isEmoji = line.startsWith('←') || line.startsWith('→') || line.startsWith('SPACE') ||
                        line.startsWith('ESC') || line.startsWith('Chạm') || line.startsWith('Nút') ||
                        line.startsWith('💰') || line.startsWith('🚀') || line.startsWith('🪨') ||
                        line.startsWith('🌲');

        const txt = scene.add.text(leftMargin + 8, currentY, line, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          color: isEmoji ? C.white : C.textDim,
        }).setOrigin(0, 0);
        scrollContent.add(txt);
        currentY += 18;
      });

      currentY += sectionGap;
    });

    // ── Cuối cùng: hướng dẫn đóng ──
    const hint = scene.add.text(px, py + ph / 2 - 28, 'click nền tối hoặc ✕ để đóng', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: C.textMuted,
    }).setOrigin(0.5);
    this._container.add(hint);
  }

  /** Hiển thị panel */
  show() {
    if (this._visible) return;
    this._visible = true;
    this._container.setVisible(true);
    if (typeof this._onVisibilityChange === 'function') {
      this._onVisibilityChange(true);
    }
  }

  /** Ẩn panel */
  hide() {
    if (!this._visible) return;
    this._visible = false;
    this._container.setVisible(false);
    if (typeof this._onVisibilityChange === 'function') {
      this._onVisibilityChange(false);
    }
  }

  /** Bật/tắt */
  toggle() {
    if (this._visible) this.hide();
    else this.show();
  }

  /** @returns {boolean} */
  isVisible() {
    return this._visible;
  }

  /** Dọn dẹp */
  destroy() {
    this._container.destroy(true);
  }
}
