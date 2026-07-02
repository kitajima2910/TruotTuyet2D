/**
 * ShopPanel.js — Giao diện cửa hàng mua skin
 *
 * Là một UI component do MenuScene hoặc UIScene khởi tạo và quản lý.
 *   • Hiển thị danh sách skin (tên, giá, trạng thái sở hữu/trang bị)
 *   • Nút Mua cho skin chưa sở hữu (nếu đủ xu)
 *   • Nút Trang bị cho skin đã sở hữu nhưng chưa được trang bị
 *   • Badge "Đang sử dụng" cho skin đang được trang bị
 *   • Gửi yêu cầu Mua/Trang bị qua ShopSystem API
 *   • KHÔNG thao tác trực tiếp với PlayerProfile
 *
 * Cách dùng (trong MenuScene/UIScene):
 *   const panel = new ShopPanel(this);
 *   panel.hide(); // ẩn mặc định
 *   panel.toggle(); // bật/tắt
 */

// Màu sắc
const C = {
  gold: '#ffd700',
  green: '#66ff88',
  cyan: '#88ccff',
  white: '#ffffff',
  red: '#ff6666',
  textDim: '#8899aa',
  textMuted: '#556677',
};

export class ShopPanel {
  /**
   * @param {Phaser.Scene} scene — scene chứa panel
   * @param {function(boolean): void} [onVisibilityChange] — callback khi show/hide
   */
  constructor(scene, onVisibilityChange) {
    this.scene = scene;
    this._onVisibilityChange = onVisibilityChange;
    this._visible = false;
    this._shopSystem = scene.game.registry.get('shopSystem');
    this._skinSystem = scene.game.registry.get('skinSystem');
    this._items = [];
    this._tweens = [];

    // ── Container chính ──
    this._container = scene.add.container(0, 0).setDepth(360).setVisible(false);

    const { width, height } = scene.scale;

    // ── Backdrop mờ ──
    this._bg = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    this._bg.setInteractive();
    this._bg.on('pointerdown', () => this.hide());
    this._container.add(this._bg);

    // ── Panel nền ──
    const pw = Math.min(420, width * 0.88);
    const ph = Math.min(600, height * 0.85);
    const px = width / 2;
    const py = height / 2;

    const panelBg = scene.add.graphics();
    panelBg.fillStyle(0x000000, 0.4);
    panelBg.fillRoundedRect(px - pw / 2 + 3, py - ph / 2 + 3, pw, ph, 18);
    panelBg.fillStyle(0x0f0f2a, 0.97);
    panelBg.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 18);
    panelBg.lineStyle(1.5, 0x3a3a7a, 0.7);
    panelBg.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 18);
    panelBg.fillStyle(0x2a2a6a, 0.12);
    panelBg.fillRoundedRect(px - pw / 2, py - ph / 2, pw, 60, { tl: 18, tr: 18, bl: 0, br: 0 });
    this._container.add(panelBg);

    // ── Nút đóng ──
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
    const title = scene.add.text(px, py - ph / 2 + 30, '🛒 CỬA HÀNG', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: C.gold,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this._container.add(title);

    // ── Coins display ──
    this._coinText = scene.add.text(px, py - ph / 2 + 62, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: C.gold,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this._container.add(this._coinText);

    // ── Separator ──
    const sepY = py - ph / 2 + 82;
    const sep = scene.add.graphics();
    sep.lineStyle(1, 0x3a3a6a, 0.5);
    sep.lineBetween(px - pw / 2 + 30, sepY, px + pw / 2 - 30, sepY);
    this._container.add(sep);

    // ── List container ──
    this._listContainer = scene.add.container(0, 0);
    this._container.add(this._listContainer);

    // ── Layout constants ──
    this._layout = { px, py, pw, ph };
    this._listStartY = py - ph / 2 + 100;
    this._itemH = 92;

    // ── Close hint ──
    const hint = scene.add.text(px, py + ph / 2 - 20, 'click nền tối hoặc ✕ để đóng', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: C.textMuted,
    }).setOrigin(0.5);
    this._container.add(hint);
  }

  /** Hiển thị panel + refresh dữ liệu */
  show() {
    if (this._visible) return;
    this._visible = true;
    this._container.setVisible(true);
    this._refresh();
    if (typeof this._onVisibilityChange === 'function') {
      this._onVisibilityChange(true);
    }
  }

  /** Ẩn panel + kill tweens */
  hide() {
    if (!this._visible) return;
    this._visible = false;
    this._killTweens();
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

  _killTweens() {
    this._tweens.forEach(t => { if (t && typeof t.stop === 'function') t.stop(); });
    this._tweens = [];
  }

  /**
   * Xây dựng lại giao diện từ ShopSystem API.
   */
  _refresh() {
    this._killTweens();
    this._items.forEach(item => this._destroyItem(item));
    this._items = [];
    this._listContainer.removeAll(true);

    if (!this._shopSystem) return;

    const catalog = this._shopSystem.getCatalog();
    const profile = this._getProfile();
    const coins = profile ? profile.coins : 0;
    const selectedSkin = profile ? profile.selectedSkin : 'default';

    // Cập nhật coins display
    this._coinText.setText(`💰 Xu: ${coins}`);

    catalog.forEach((item, i) => {
      const y = this._listStartY + this._itemH * i;
      const elements = this._createShopItem(item, y, coins, selectedSkin);
      this._items.push(elements);
    });

    // Nếu có skin special (gold) không mua được, hiển thị note cuối
    const special = catalog.find(c => c.special);
    if (special) {
      const y = this._listStartY + this._itemH * catalog.length;
      const note = this.scene.add.text(
        this._layout.px, y + 10,
        `🌟 "${special.name}" chỉ mở khóa qua Thành tựu hoặc Phần thưởng hằng ngày`,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: C.textDim,
          wordWrap: { width: this._layout.pw - 40 },
          align: 'center',
        }
      ).setOrigin(0.5);
      this._listContainer.add(note);
      this._items.push([note]);
    }
  }

  /**
   * Tạo UI cho một item trong shop.
   * @param {{id:string, name:string, price:number, special:boolean, owned:boolean}} item
   * @param {number} y
   * @param {number} coins
   * @param {string} selectedSkin
   * @returns {object[]}
   */
  _createShopItem(item, y, coins, selectedSkin) {
    const scene = this.scene;
    const { px, pw } = this._layout;
    const elements = [];

    const isOwned = item.owned;
    const isEquipped = item.id === selectedSkin;
    const canBuy = !isOwned && !item.special && coins >= item.price;
    const cannotAfford = !isOwned && !item.special && coins < item.price;

    // ── Item background ──
    const bg = scene.add.graphics();
    const bgColor = isEquipped ? 0x1a3a1a : (isOwned ? 0x1a1a3a : 0x1e1e30);
    bg.fillStyle(bgColor, 0.7);
    bg.fillRoundedRect(px - pw / 2 + 10, y, pw - 20, this._itemH - 6, 10);
    this._listContainer.add(bg);
    elements.push(bg);

    // ── Color preview (ô vuông nhỏ) ──
    const tint = this._getSkinTint(item.id);
    const previewX = px - pw / 2 + 32;
    const previewY = y + (this._itemH - 6) / 2;
    const preview = scene.add.graphics();
    if (tint) {
      preview.fillStyle(tint, 1);
    } else {
      preview.lineStyle(2, 0xffffff, 0.4);
      preview.strokeCircle(previewX, previewY, 12);
      preview.fillStyle(0xffffff, 0.15);
    }
    preview.fillCircle(previewX, previewY, 12);
    this._listContainer.add(preview);
    elements.push(preview);

    // ── Tên skin ──
    const nameX = px - pw / 2 + 58;
    const nameColor = isEquipped ? C.green : C.white;
    const nameText = scene.add.text(nameX, y + 14, item.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: nameColor,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0.5);
    this._listContainer.add(nameText);
    elements.push(nameText);

    // ── Price / Status ──
    const priceX = nameX;
    const priceY = y + 42;

    if (isEquipped) {
      // Đang trang bị
      const badge = scene.add.text(priceX, priceY, '✅ Đang sử dụng', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: C.green,
      }).setOrigin(0, 0.5);
      this._listContainer.add(badge);
      elements.push(badge);
    } else if (isOwned) {
      // Đã sở hữu — nút Trang bị
      const btnEl = this._createActionButton(
        px + pw / 2 - 68, previewY, 90, 30,
        '📌 Trang bị', 0x2d6a9f, 0x3d8adf,
        () => this._handleEquip(item.id),
      );
      elements.push(...btnEl);
    } else if (item.special) {
      // Special — không thể mua
      const badge = scene.add.text(priceX, priceY, '🔒 Chỉ mở khóa qua thành tựu', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: C.textDim,
      }).setOrigin(0, 0.5);
      this._listContainer.add(badge);
      elements.push(badge);
    } else {
      // Chưa sở hữu — hiện giá
      const priceColor = canBuy ? C.gold : C.red;
      const priceText = scene.add.text(priceX, priceY, `💰 ${item.price} xu`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: priceColor,
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0, 0.5);
      this._listContainer.add(priceText);
      elements.push(priceText);

      // Nút Mua (nếu đủ xu)
      if (canBuy) {
        const btnEl = this._createActionButton(
          px + pw / 2 - 68, previewY, 90, 30,
          '🛒 Mua', 0x8e6f00, 0xc89f00,
          () => this._handlePurchase(item.id),
        );
        elements.push(...btnEl);
      } else if (cannotAfford) {
        const badge = scene.add.text(priceX + 80, priceY, '⚡ Thiếu xu', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: C.red,
        }).setOrigin(0, 0.5);
        this._listContainer.add(badge);
        elements.push(badge);
      }
    }

    return elements;
  }

  /**
   * Tạo nút hành động (Mua / Trang bị).
   * @param {number} cx
   * @param {number} cy
   * @param {number} w
   * @param {number} h
   * @param {string} label
   * @param {number} color
   * @param {number} hoverColor
   * @param {function} onClick
   * @returns {object[]}
   */
  _createActionButton(cx, cy, w, h, label, color, hoverColor, onClick) {
    const scene = this.scene;
    const elements = [];

    const bg = scene.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    this._listContainer.add(bg);
    elements.push(bg);

    const txt = scene.add.text(cx, cy, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);
    this._listContainer.add(txt);
    elements.push(txt);

    const zone = scene.add.zone(cx, cy, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(hoverColor, 1);
      bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    });
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    });
    zone.on('pointerdown', onClick);
    this._listContainer.add(zone);
    elements.push(zone);

    return elements;
  }

  /**
   * Xử lý mua skin — gọi ShopSystem.purchaseSkin().
   * @param {string} skinId
   */
  _handlePurchase(skinId) {
    if (!this._shopSystem) return;
    const result = this._shopSystem.purchaseSkin(skinId);
    this._showToast(result.message, result.success);
    if (result.success) {
      this._refresh();
      // Thông báo cho PlayScene cập nhật skin ngay lập tức
      this.scene.game.events.emit('skinChanged', skinId);
    }
  }

  /**
   * Xử lý trang bị skin — gọi ShopSystem.equipSkin().
   * @param {string} skinId
   */
  _handleEquip(skinId) {
    if (!this._shopSystem) return;
    const result = this._shopSystem.equipSkin(skinId);
    this._showToast(result.message, result.success);
    if (result.success) {
      this._refresh();
      // Thông báo cho PlayScene cập nhật skin ngay lập tức
      this.scene.game.events.emit('skinChanged', skinId);
    }
  }

  /**
   * Hiển thị toast notification ngắn.
   * @param {string} msg
   * @param {boolean} success
   */
  _showToast(msg, success) {
    const scene = this.scene;
    const toast = scene.add.text(
      scene.scale.width / 2,
      scene.scale.height * 0.78,
      msg,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: success ? '#66ff88' : '#ff6666',
        stroke: '#000000',
        strokeThickness: 4,
        shadow: {
          offsetX: 0, offsetY: 2, color: '#00000088', blur: 8, fill: true,
        },
      }
    ).setOrigin(0.5).setDepth(400);

    scene.tweens.add({
      targets: toast,
      alpha: { from: 1, to: 0 },
      y: toast.y - 40,
      duration: 1800,
      ease: 'Cubic.easeOut',
      onComplete: () => toast.destroy(),
    });
  }

  /**
   * Lấy màu tint cho skin từ SkinSystem.
   * @param {string} skinId
   * @returns {number|null}
   */
  _getSkinTint(skinId) {
    if (this._skinSystem && typeof this._skinSystem.getSkinTint === 'function') {
      return this._skinSystem.getSkinTint(skinId);
    }
    return null;
  }

  /** @returns {import('../profile/PlayerProfile.js').PlayerProfile|null} */
  _getProfile() {
    return this.scene.game.registry.get('playerProfile');
  }

  /**
   * Destroy một item (khi refresh).
   * @param {object[]} elements
   */
  _destroyItem(elements) {
    elements.forEach(el => {
      if (el && typeof el.destroy === 'function') {
        this.scene.tweens.killTweensOf(el);
        el.destroy();
      }
    });
  }

  /** Dọn dẹp khi scene shutdown */
  destroy() {
    this._killTweens();
    this._items.forEach(item => this._destroyItem(item));
    this._items = [];
    this._container.destroy(true);
  }
}
