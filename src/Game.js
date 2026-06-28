/**
 * Game.js — Cấu hình và khởi tạo Phaser.Game
 * Kích thước: 720×1280, Scale Mode: FIT
 * Nền: màu tuyết (snow blue)
 *
 * Khởi tạo toàn bộ hệ thống:
 *   • SaveManager — quản lý lưu/đọc/reset dữ liệu
 *   • PlayerProfile — nguồn dữ liệu duy nhất
 *   • SkinSystem — quản lý skin
 *   • ScoreSystem — gắn profile toàn cục
 */

import { BootScene } from './scenes/BootScene.js';
import { LoadingScene } from './scenes/LoadingScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { PlayScene } from './scenes/PlayScene.js';
import { UIScene } from './scenes/UIScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { SaveManager } from './managers/SaveManager.js';
import { PlayerProfile } from './profile/PlayerProfile.js';
import { SkinSystem } from './systems/SkinSystem.js';
import { ScoreSystem } from './systems/ScoreSystem.js';
import { AchievementSystem } from './systems/AchievementSystem.js';

const GAME_WIDTH = 720;
const GAME_HEIGHT = 1280;

const SNOW_BG = 0xe8f0fe; // Nền màu tuyết nhạt

/**
 * Tạo và trả về instance Phaser.Game
 * Khởi tạo SaveManager, PlayerProfile, SkinSystem sau khi game được tạo.
 * @param {string|HTMLElement} parent — selector hoặc DOM element chứa game
 * @returns {Phaser.Game}
 */
export function createGame(parentId = 'game-container') {
  const parent = typeof parentId === 'string'
    ? document.getElementById(parentId)
    : parentId;

  const config = {
    type: Phaser.AUTO,
    parent,
    backgroundColor: SNOW_BG,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    scene: [BootScene, LoadingScene, MenuScene, PlayScene, UIScene, GameOverScene],
  };

  const game = new Phaser.Game(config);

  // ── Khởi tạo SaveManager + PlayerProfile ──
  const saveManager = new SaveManager();
  const profile = saveManager.load();
  SaveManager.register(game.registry, saveManager);
  PlayerProfile.register(game.registry, profile);

  // ── Khởi tạo SkinSystem ──
  const skinSystem = new SkinSystem(profile);
  SkinSystem.register(game.registry, skinSystem);

  // ── Gán profile toàn cục cho ScoreSystem ──
  ScoreSystem.setProfile(profile);

  // ── Khởi tạo AchievementSystem ──
  const achievementSystem = new AchievementSystem();
  achievementSystem.setRegistry(game.registry);
  AchievementSystem.register(game.registry, achievementSystem);
  achievementSystem.loadAchievements();

  return game;
}
