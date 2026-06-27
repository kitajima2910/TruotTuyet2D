# ❄️ Trượt Tuyết 2D

**Trượt Tuyết 2D** — Game HTML5 trượt tuyết tốc độ cao, xây dựng bằng **Phaser 3** (v3.80.1). Người chơi điều khiển vận động viên trượt tuyết né vật cản, thu thập xu và boost-pad để đạt điểm cao nhất.

> 🎮 **Chơi ngay tại:** [Error404-Labs.Info.Vn](https://Error404-Labs.Info.Vn)

---

## 🎯 Mục lục

- [Tính năng](#-tính-năng)
- [Cách chơi](#-cách-chơi)
- [Hướng dẫn điều khiển](#-hướng-dẫn-điều-khiển)
- [Cơ chế game](#-cơ-chế-game)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Phát triển](#-phát-triển)
- [Giấy phép](#-giấy-phép)

---

## ✨ Tính năng

- **3 màn chơi** với độ khó tăng dần: Tuyết Trắng (dễ), Cỏ Tuyết (trung bình), Sa Mạc Tuyết (khó)
- **Hệ thống độ khó động** — tốc độ, mật độ vật cản và tần suất spawn thay đổi theo quãng đường
- **Vật cản đa dạng**: Cây thông (3 máu, có thể gãy đổ) và Đá (20 biến thể ngẫu nhiên)
- **Boost tăng tốc** — nhặt boost-pad để tăng 50% tốc độ trong 5 giây
- **Xu thu thập** — nhặt xu để tăng điểm
- **Hiệu ứng va chạm** — loạng choạng (stagger), giảm tốc, bất tử sau va chạm
- **Hệ thống tính điểm** — điểm theo quãng đường, lưu best score vào localStorage
- **Điều khiển đa nền tảng** — Bàn phím + Touch/Mouse
- **Hiệu ứng hình ảnh** — tuyết rơi, trail, glow, sparkle, camera shake, hit flash
- **Âm thanh procedural** — BGM + SFX tạo bằng Web Audio API, không cần file âm thanh
- **Hỗ trợ PWA** — responsive, fullscreen mobile

---

## 🎮 Cách chơi

Điều khiển vận động viên trượt tuyết né cây và đá trên đường đua. Càng đi xa, tốc độ càng tăng và vật cản càng dày đặc.

- **Nhặt xu** để tăng điểm
- **Nhặt boost-pad** 🚀 để tăng tốc 1.5× trong 5 giây
- Va chạm với vật cản → **mất 1 mạng**, rơi vào trạng thái loạng choạng
- Hết mạng → **Game Over**
- **Boost sẽ bị mất** nếu va chạm khi đang tăng tốc

### Màn chơi

| Màn | Tên | Độ khó | Tốc độ nền |
|-----|-----|--------|------------|
| 1 | ❄️ Tuyết Trắng | Dễ | 280 px/s |
| 2 | 🌿 Cỏ Tuyết | Trung bình | 350 px/s |
| 3 | 🏜️ Sa Mạc Tuyết | Khó | 420 px/s |

---

## 🎮 Hướng dẫn điều khiển

| Thao tác | Bàn phím | Mobile / Touch |
|----------|----------|----------------|
| Sang trái | `←` / `A` | Chạm nửa trái màn hình |
| Sang phải | `→` / `D` | Chạm nửa phải màn hình |
| Tạm dừng | `ESC` | Nút ⏸ góc phải dưới |
| Tắt âm thanh | — | Nút 🔊 góc trái dưới |

---

## ⚙️ Cơ chế game

### ⚡ Boost
- Thời gian: **5 giây**
- Hệ số: **1.5×** tốc độ
- Làm mới thời gian khi nhặt boost-pad mới
- **Mất boost khi va chạm** — nếu đang tăng tốc mà trúng vật cản, boost biến mất sau khi đứng dậy

### 🌲 Vật cản
- **Cây thông**: 3 máu, qua 3 trạng thái: đứng yên → rung lắc → gãy đổ
- **Đá**: 1 máu, 20 biến thể ngẫu nhiên, hitbox chính xác theo từng biến thể

### 💥 Va chạm
1. Mất 1 mạng → hiệu ứng flash đỏ + camera shake
2. Vào trạng thái **loạng choạng (stagger)** — 1.2 giây, tốc độ giảm còn 8%
3. Hết stagger → **bất tử (invincible)** — 2 giây, nhấp nháy

### 📈 Độ khó động
Cứ mỗi **400 điểm**:
- Tốc độ +6 px/s (tối đa 520 px/s)
- Khoảng cách spawn -10 ms (tối thiểu 550 ms)
- Mật độ vật cản +0.015 (tối đa 2.5)

---

## 📁 Cấu trúc dự án

```
TruotTuyet2D/
├── index.html                   # Entry point
├── favicon.svg
├── assets/                      # Tài nguyên game
│   ├── player/                  # Sprite người chơi
│   │   ├── tren/                #   Idle (4 frame)
│   │   ├── trai/                #   Trái (4 frame)
│   │   ├── phai/                #   Phải (4 frame)
│   │   └── va-cham/             #   Va chạm (5 frame)
│   ├── cay-thong/               # Sprite cây thông
│   │   ├── dung-yen/            #   Đứng yên (6 frame)
│   │   ├── lung-lay/            #   Rung lắc (6 frame)
│   │   └── gay/                 #   Gãy đổ (5 frame)
│   ├── da/                      # 20 biến thể đá
│   ├── coin/                    # 16 frame coin xoay
│   ├── boost-pad/               # 7 frame boost glow
│   └── map/                     # 3 map nền
│       ├── ver1/
│       ├── ver2/
│       └── ver3/
├── src/                         # Mã nguồn game
│   ├── main.js                  # Entry point
│   ├── Game.js                  # Cấu hình Phaser
│   ├── scenes/                  # Các scene
│   │   ├── BootScene.js         #   Load assets + animations
│   │   ├── MenuScene.js         #   Menu chọn màn
│   │   ├── PlayScene.js         #   Gameplay chính
│   │   ├── UIScene.js           #   HUD overlay
│   │   └── GameOverScene.js     #   Kết thúc
│   ├── entities/                # Các thực thể game
│   │   ├── Player.js            #   Người chơi
│   │   ├── Tree.js              #   Cây thông
│   │   ├── Rock.js              #   Đá
│   │   ├── Coin.js              #   Xu
│   │   └── Boost.js             #   Boost-pad
│   ├── systems/                 # Hệ thống game
│   │   ├── InputSystem.js       #   Điều khiển
│   │   ├── CollisionSystem.js   #   Va chạm AABB
│   │   ├── SpawnSystem.js       #   Object pool
│   │   ├── ScoreSystem.js       #   Tính điểm
│   │   └── DifficultySystem.js  #   Độ khó động
│   └── managers/                # Quản lý
│       ├── AudioManager.js      #   Âm thanh procedural
│       └── AssetManager.js      #   Tài nguyên + particles
└── README.md
```

### Kiến trúc

- **Không physics engine** — toàn bộ vật lý và va chạm được tính thủ công (AABB)
- **Object pool** — Tree, Rock, Coin, Boost được pre-allocate, tái sử dụng (không malloc/frame)
- **Manual game loop** — fixed-timestep không dùng Arcade/Matter Physics
- **Singleton AudioManager** — procedural audio qua Web Audio API, lưu cài đặt localStorage
- **Event-driven UI** — UIScene lắng nghe events từ PlayScene, không tight coupling

---

## 🛠️ Công nghệ sử dụng

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| [Phaser 3](https://phaser.io/) | 3.80.1 | Game framework (WebGL + Canvas) |
| JavaScript (ES Modules) | — | Ngôn ngữ chính |
| Web Audio API | — | Âm thanh procedural |
| Phaser Scale Manager | FIT | Responsive trên mọi màn hình |
| localStorage | — | Lưu best score + cài đặt âm thanh |

---

## 🧑‍💻 Phát triển

### Yêu cầu
- Trình duyệt hiện đại (Chrome, Firefox, Safari, Edge)
- Web server tĩnh (do CORS module) — ví dụ:

```bash
# Python
python -m http.server 8080

# Node.js (npx)
npx serve .
```

### Mở rộng

Dự án được thiết kế modular — mỗi entity/system/scene là một file riêng:

- **Thêm vật cản mới**: Tạo class mới trong `src/entities/`, đăng ký pool trong `SpawnSystem.js`
- **Thêm collectible mới**: Tương tự, thêm vào CollisionSystem
- **Thêm màn chơi**: Thêm config vào `LEVEL_CONFIG` trong `PlayScene.js`, thêm map asset
- **Hiệu ứng mới**: Dùng Phaser particle system hoặc tween

---

## 📄 Giấy phép

**MIT License** — Phạm Xuân Hoài © 2026

Phát hành bởi [Error404-Labs.Info.Vn](https://Error404-Labs.Info.Vn)

Xem file [LICENSE](./LICENSE) để biết thêm chi tiết.

---

> 💡 **Error404-Labs.Info.Vn** — Nơi những dòng code gặp nhau và tạo nên điều kỳ diệu.
