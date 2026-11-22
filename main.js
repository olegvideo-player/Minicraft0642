var isPlaying = false;
var sensitivity = 0.006;
var renderDist = 22;
var currentWorldId = 'world_1';
var worldName = 'Мой Мир';
var selectedGenType = 'hills';
var selectedGenSize = 12;
var gameMode = 'survival';
var selectedGameMode = 'survival';
var playerHP = 20;
var playerFood = 20;
var foodTick = 0;
var hurtCooldown = 0;
var spawnPoint = { x: 0.5, y: 5.5, z: 0.5 };
var chestInv = {};
var invCounts = {
  sword: 1, stone_sword: 0, apple: 5, grass: 0, dirt: 0, stone: 0,
  sand: 0, wood: 0, planks: 16, leaves: 0, brick: 0, tnt: 0, glass: 0,
  craft: 0, gold: 0, diamond: 0, door_wood: 0, door_iron: 0,
  bed: 0, chest: 0, furnace: 0
};
var worldTime = 0.25;
var swingAnim = 0;
var walkAnim = 0;
var cameraMode = 1;
var currentLang = 'ru';
var audioCtx = null;

function showToast(msg) {
  var el = document.getElementById('toast-msg');
  if (!el) return;
  el.innerText = msg;
  el.classList.remove('hidden');
  clearTimeout(el._t);
  el._t = setTimeout(function() { el.classList.add('hidden'); }, 2200);
}

function playSound(type) {
  try {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    var now = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    var cfg = {
      click: ['square', 520, 300, 0.05, 0.06],
      step: ['triangle', 120, 55, 0.06, 0.04],
      place: ['triangle', 220, 140, 0.08, 0.12],
      break: ['sawtooth', 160, 60, 0.11, 0.12],
      mine: ['triangle', 140, 90, 0.04, 0.05],
      hit: ['sawtooth', 340, 120, 0.14, 0.14],
      tnt: ['sawtooth', 120, 24, 0.55, 0.28],
      craft: ['triangle', 440, 660, 0.12, 0.12],
      door: ['square', 260, 190, 0.09, 0.1]
    }[type];
    if (!cfg) return;
    osc.type = cfg.at(0);
    osc.frequency.setValueAtTime(cfg.at(1), now);
    osc.frequency.exponentialRampToValueAtTime(cfg.at(2), now + cfg.at(3));
    gain.gain.setValueAtTime(cfg.at(4), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + cfg.at(3));
    osc.start(now);
    osc.stop(now + cfg.at(3));
  } catch (e) {}
}

var LANG = {
  ru: {
    cont: 'Играть (Миры)', create: 'Создать новый мир', skin: 'Редактор скина', settings: 'Настройки',
    skinTitle: 'Редактор Скина', hair: 'Волосы:', skinC: 'Кожа:', shirt: 'Майка:', pants: 'Штаны:',
    impSkin: 'Импорт скина (.png)', saveExit: 'Сохранить и выйти', createTitle: 'Создание мира',
    wName: 'Название мира:', gMode: 'Режим игры:', surv: 'Выживание', crea: 'Креатив',
    genType: 'Тип генерации:', hills: 'Холмы', flat: 'Плоский', island: 'Остров',
    wSize: 'Размер мира:', small: 'Малый', med: 'Средний', big: 'Большой',
    cancel: 'Отмена', doCreate: 'Создать мир', setTitle: 'Настройки', cam: 'Вид камеры:',
    c1: '1-е лицо', c3: '3-е лицо', c2: '2-е лицо', sens: 'Чувствительность', dist: 'Дальность обзора',
    pcCtrl: 'Управление ПК', support: 'Помощь и поддержка', done: 'Готово',
    timeBtn: 'День / Ночь', jump: 'ПРЫЖОК<br>(x2 полёт)', brk: 'ЛОМАТЬ', plc: 'СТАВИТЬ',
    up: 'ВВЕРХ', down: 'ВНИЗ', modeC: 'Креатив', modeF: 'Креатив (Полёт)'
  },
  en: {
    cont: 'Play (Worlds)', create: 'Create New World', skin: 'Skin Editor', settings: 'Settings',
    skinTitle: 'Skin Editor', hair: 'Hair:', skinC: 'Skin:', shirt: 'Shirt:', pants: 'Pants:',
    impSkin: 'Import Skin (.png)', saveExit: 'Save & Exit', createTitle: 'Create World',
    wName: 'World Name:', gMode: 'Game Mode:', surv: 'Survival', crea: 'Creative',
    genType: 'World Type:', hills: 'Hills', flat: 'Flat', island: 'Island',
    wSize: 'World Size:', small: 'Small', med: 'Medium', big: 'Large',
    cancel: 'Cancel', doCreate: 'Create World', setTitle: 'Settings', cam: 'Camera View:',
    c1: '1st Person', c3: '3rd Person', c2: '2nd Person', sens: 'Sensitivity', dist: 'Render Distance',
    pcCtrl: 'PC Controls', support: 'Help & Support', done: 'Done',
    timeBtn: 'Day / Night', jump: 'JUMP<br>(x2 fly)', brk: 'BREAK', plc: 'PLACE',
    up: 'UP', down: 'DOWN', modeC: 'Creative', modeF: 'Creative (Fly)'
  }
};

function setLanguage(btn, lang) {
  playSound('click');
  currentLang = lang;
  document.querySelectorAll('#lang-group .mc-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
  var t = LANG[lang];
  var mBtns = document.querySelectorAll('#menu .mc-btn');
  if (mBtns.length >= 3) { mBtns.item(0).innerText = t.cont; mBtns.item(1).innerText = t.skin; mBtns.item(2).innerText = t.settings; }
  document.getElementById('lbl-settings-title').innerText = t.setTitle;
  document.getElementById('lbl-cam').innerText = t.cam;
  document.getElementById('btn-cam-1').innerText = t.c1;
  document.getElementById('btn-cam-3').innerText = t.c3;
  document.getElementById('btn-cam-2').innerText = t.c2;
  document.getElementById('lbl-sens').innerText = t.sens;
  document.getElementById('lbl-dist').innerText = t.dist;
  document.getElementById('time-btn').innerText = t.timeBtn;
  document.getElementById('btn-jump').innerHTML = t.jump;
  document.getElementById('btn-break').innerText = t.brk;
  document.getElementById('btn-place').innerText = t.plc;
  document.getElementById('btn-fly-up').innerText = t.up;
  document.getElementById('btn-fly-down').innerText = t.down;
  updateFlyUI();
}

function setCameraMode(btn, mode) {
  playSound('click');
  document.querySelectorAll('#cam-mode-group .mc-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
  cameraMode = mode;
}

var playerSkin = { hair: '#4E342E', skin: '#FFCC99', shirt: '#00ACC1', pants: '#3949AB' };
try { var savedSkin = JSON.parse(localStorage.getItem('mc0642_skin')); if (savedSkin) playerSkin = savedSkin; } catch (e) {}
function saveSkin() { try { localStorage.setItem('mc0642_skin', JSON.stringify(playerSkin)); } catch (e) {} }

function samplePngPixel(ctx, x, y, fallback) {
  var d = ctx.getImageData(x, y, 1, 1).data;
  return d.at(3) < 10 ? fallback : 'rgb(' + d.at(0) + ',' + d.at(1) + ',' + d.at(2) + ')';
}

function importMinecraftSkin(input) {
  if (!input.files || !input.files.length) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    var img = new Image();
    img.onload = function() {
      var c = document.createElement('canvas');
      c.width = 64; c.height = img.height >= 64 ? 64 : 32;
      var sctx = c.getContext('2d');
      sctx.drawImage(img, 0, 0, c.width, c.height);
      playerSkin.skin = samplePngPixel(sctx, 10, 12, playerSkin.skin);
      playerSkin.hair = samplePngPixel(sctx, 10, 8, playerSkin.hair);
      playerSkin.shirt = samplePngPixel(sctx, 22, 22, playerSkin.shirt);
      playerSkin.pants = samplePngPixel(sctx, 6, 22, playerSkin.pants);
      var hat = sctx.getImageData(42, 9, 1, 1).data;
      if (hat.at(3) > 120) playerSkin.hair = 'rgb(' + hat.at(0) + ',' + hat.at(1) + ',' + hat.at(2) + ')';
      saveSkin(); drawSkinPreview(); updateHotbarUI();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(input.files.item(0));
}

function drawSkinPreview() {
  var sc = document.getElementById('skin-preview');
  if (!sc) return;
  var sctx = sc.getContext('2d');
  sctx.clearRect(0, 0, 90, 150);
  sctx.fillStyle = playerSkin.skin; sctx.fillRect(29, 14, 32, 32);
  sctx.fillStyle = playerSkin.hair; sctx.fillRect(29, 14, 32, 10);
  sctx.fillStyle = '#fff'; sctx.fillRect(34, 28, 6, 4); sctx.fillRect(50, 28, 6, 4);
  sctx.fillStyle = '#222'; sctx.fillRect(36, 28, 3, 4); sctx.fillRect(50, 28, 3, 4);
  sctx.fillStyle = playerSkin.shirt; sctx.fillRect(27, 46, 36, 46); sctx.fillRect(13, 46, 14, 16); sctx.fillRect(63, 46, 14, 16);
  sctx.fillStyle = playerSkin.skin; sctx.fillRect(13, 62, 14, 28); sctx.fillRect(63, 62, 14, 28);
  sctx.fillStyle = playerSkin.pants; sctx.fillRect(27, 92, 17, 42); sctx.fillRect(46, 92, 17, 42);
  sctx.fillStyle = '#333'; sctx.fillRect(27, 134, 17, 8); sctx.fillRect(46, 134, 17, 8);
}

(function initSkinEditor() {
  var palettes = {
    hair: ['#4E342E', '#FDD835', '#212121', '#D84315', '#8E24AA'],
    skin: ['#FFCC99', '#F1C27D', '#C68642', '#8D5524', '#A5D6A7'],
    shirt: ['#00ACC1', '#E53935', '#43A047', '#FB8C00', '#3949AB'],
    pants: ['#3949AB', '#212121', '#5D4037', '#546E7A', '#00897B']
  };
  Object.keys(palettes).forEach(function(part) {
    var box = document.getElementById(part + '-colors');
    if (!box) return;
    palettes[part].forEach(function(col) {
      var d = document.createElement('div');
      d.className = 'swatch'; d.style.background = col;
      d.onclick = function() { playSound('click'); playerSkin[part] = col; drawSkinPreview(); };
      box.appendChild(d);
    });
  });
  drawSkinPreview();
})();

function showScreen(name) {
  playSound('click');
  ['menu', 'create-menu', 'settings-menu', 'pc-controls-menu', 'support-menu', 'skin-menu', 'worlds-modal', 'craft-modal', 'hud'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.classList.add('hidden');
  });
  if (name === 'menu') document.getElementById('menu').classList.remove('hidden');
  if (name === 'create') document.getElementById('create-menu').classList.remove('hidden');
  if (name === 'settings') document.getElementById('settings-menu').classList.remove('hidden');
  if (name === 'pc-controls') { document.getElementById('pc-controls-menu').classList.remove('hidden'); renderPcBindsUI(); }
  if (name === 'support') document.getElementById('support-menu').classList.remove('hidden');
  if (name === 'skin') { document.getElementById('skin-menu').classList.remove('hidden'); drawSkinPreview(); }
  if (name === 'hud') document.getElementById('hud').classList.remove('hidden');
  isPlaying = (name === 'hud');
}

function copySupportMail() {
  playSound('click');var email = '807stro47kasup272portminicraft1@mail.ru';
if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(email);
else alert('Почта: ' + email);
}
function updateSurvUI() {
var bars = document.getElementById('surv-bars');
if (!bars) return;
bars.classList.toggle('hidden', gameMode !== 'survival');
if (gameMode === 'survival') {
var hStr = '', fStr = '';
for (var i = 0; i < 10; i++) {
hStr += (playerHP >= (i + 1) * 2) ? '♥' : '♡';
fStr += (playerFood >= (i + 1) * 2) ? '🍗' : '🦴';
}
document.getElementById('hp-bar').innerText = hStr;
document.getElementById('food-bar').innerText = fStr;
}
}
function pauseGame() { saveWorld(); showScreen('menu'); }
function toggleDayNight() { playSound('click'); worldTime = (worldTime > 0.1 && worldTime < 0.5) ? 0.75 : 0.25; }
function selectGameMode(btn, val) { playSound('click'); document.querySelectorAll('#game-mode-group .mc-btn').forEach(function(b) { b.classList.remove('selected'); }); btn.classList.add('selected'); selectedGameMode = val; }
function selectType(btn, val) { playSound('click'); document.querySelectorAll('#gen-type-group .mc-btn').forEach(function(b) { b.classList.remove('selected'); }); btn.classList.add('selected'); selectedGenType = val; }
function selectSize(btn, val) { playSound('click'); document.querySelectorAll('#gen-size-group .mc-btn').forEach(function(b) { b.classList.remove('selected'); }); btn.classList.add('selected'); selectedGenSize = val; }
function updateSens(val) { document.getElementById('sens-val').innerText = val; sensitivity = val * 0.001; }
function updateDist(val) { document.getElementById('dist-val').innerText = val; renderDist = parseInt(val, 10); } var canvas = document.createElement('canvas');
document.body.appendChild(canvas);
var ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

var BLOCKS = {
  hand:        { name: 'Рука',      top: '#FFCC99', side: '#E0AC69', bottom: '#C68642', isItem: true },
  sword:       { name: 'Алм.Меч',   top: '#4DD0E1', side: '#00ACC1', bottom: '#8D6E63', isItem: true },
  stone_sword: { name: 'Кам.Меч',   top: '#B0BEC5', side: '#78909C', bottom: '#5D4037', isItem: true },
  apple:       { name: 'Яблоко',    top: '#E53935', side: '#C62828', bottom: '#B71C1C', isItem: true },
  grass:       { name: 'Трава',     top: '#56C45A', side: '#43A047', bottom: '#5D4037', solid: true, hard: 24, tex: ['#66BB6A', '#388E3C'] },
  dirt:        { name: 'Земля',     top: '#8D6E63', side: '#795548', bottom: '#5D4037', solid: true, hard: 22, tex: ['#6D4C41', '#A1887F'] },
  stone:       { name: 'Камень',    top: '#BDBDBD', side: '#9E9E9E', bottom: '#757575', solid: true, hard: 55, tex: ['#757575', '#E0E0E0'] },
  sand:        { name: 'Песок',     top: '#F0D090', side: '#E6C280', bottom: '#C8A464', solid: true, hard: 20, tex: ['#FFF59D', '#D4B475'] },
  wood:        { name: 'Дуб',       top: '#B57B45', side: '#8D5524', bottom: '#6D4018', solid: true, hard: 40, tex: ['#5D4037', '#A1887F'] },
  planks:      { name: 'Доски',     top: '#D7A86E', side: '#C19258', bottom: '#A87B44', solid: true, hard: 35, tex: ['#8D6E63', '#E6C280'] },
  craft:       { name: 'Верстак',   top: '#D84315', side: '#A1887F', bottom: '#6D4018', solid: true, hard: 35, tex: ['#3E2723', '#FFD54F'] },
  leaves:      { name: 'Листва',    top: '#388E3C', side: '#2E7D32', bottom: '#1B5E20', solid: true, hard: 14, tex: ['#1B5E20', '#66BB6A'] },
  brick:       { name: 'Кирпич',    top: '#C64B3C', side: '#B03A2E', bottom: '#8E2A20', solid: true, hard: 60, tex: ['#EEEEEE', '#8E2A20'] },
  tnt:         { name: 'TNT',       top: '#E53935', side: '#D32F2F', bottom: '#B71C1C', solid: true, hard: 15, tex: ['#FFFFFF', '#212121'] },
  glass:       { name: 'Стекло',    top: 'rgba(224,247,250,0.45)', side: 'rgba(178,235,242,0.45)', bottom: 'rgba(178,235,242,0.45)', solid: true, hard: 16 },
  gold:        { name: 'Золото',    top: '#FFD54F', side: '#FFB300', bottom: '#FF8F00', solid: true, hard: 70, tex: ['#FFF9C4', '#FF6F00'] },
  diamond:     { name: 'Алмаз',     top: '#4DD0E1', side: '#00BCD4', bottom: '#00838F', solid: true, hard: 85, tex: ['#E0F7FA', '#006064'] },
  door_wood:   { name: 'Дер.Дверь', top: '#A1887F', side: '#795548', bottom: '#5D4037', solid: true, hard: 35, isDoor: true, tex: ['#4E342E', '#D7CCC8'] },
  door_iron:   { name: 'Жел.Дверь', top: '#ECEFF1', side: '#B0BEC5', bottom: '#78909C', solid: true, hard: 75, isDoor: true, tex: ['#FFFFFF', '#546E7A'] },
  bed:         { name: 'Кровать',   top: '#E53935', side: '#ECEFF1', bottom: '#6D4C41', solid: true, hard: 25, tex: ['#FFFFFF', '#B71C1C'] },
  chest:       { name: 'Сундук',    top: '#CA8A04', side: '#A16207', bottom: '#713F12', solid: true, hard: 40, tex: ['#FEF08A', '#1F2937'] },
  furnace:     { name: 'Печка',     top: '#757575', side: '#616161', bottom: '#424242', solid: true, hard: 55, tex: ['#FF7043', '#212121'] }
};

var hotbarTypes = ['sword', 'apple', 'planks', 'grass', 'stone'], activeSlot = 0;

function updateHotbarUI() {
  var slots = document.querySelectorAll('#hotbar .slot');
  for (var i = 0; i < 5; i++) {
    var type = hotbarTypes[i], sl = slots.item(i);
    sl.style.background = type === 'hand' ? playerSkin.skin : BLOCKS[type].top;
    var shortNames = { craft: 'Верст', door_wood: 'ДверьД', door_iron: 'ДверьЖ', bed: 'Кров.', chest: 'Сундук', furnace: 'Печка', gold: 'Золото', diamond: 'Алмаз' };
    var label = BLOCKS[type].isItem ? BLOCKS[type].name : (shortNames[type] || (type === 'tnt' ? 'TNT' : ''));
    if (gameMode === 'survival' && type !== 'hand' && type !== 'sword' && type !== 'stone_sword') label += (label ? '\n' : '') + (invCounts[type] || 0);
    sl.innerText = label; sl.classList.toggle('active', i === activeSlot);
  }
}
updateHotbarUI();

function pickSlot(idx) { playSound('click'); activeSlot = idx; updateHotbarUI(); }
function toggleInv(show) { playSound('click'); document.getElementById('inv-modal').classList.toggle('hidden', !show); }

var invGrid = document.getElementById('inv-grid');
var invGrid = document.getElementById('inv-grid');
Object.keys(BLOCKS).forEach(function(type) {
  var item = document.createElement('div'); item.className = 'inv-item';
  item.style.background = BLOCKS[type].top; item.innerText = BLOCKS[type].name;
  item.onclick = function() { playSound('click'); hotbarTypes[activeSlot] = type; updateHotbarUI(); toggleInv(false); };
  invGrid.appendChild(item);
});

var RECIPES = [
  { name: '4x Доски', req: { wood: 1 }, out: { planks: 4 } },
  { name: '1x Верстак', req: { planks: 4 }, out: { craft: 1 } },
  { name: 'Кам. Меч', req: { planks: 1, stone: 2 }, out: { stone_sword: 1 } },
  { name: '1x Печка', req: { stone: 6 }, out: { furnace: 1 } },
  { name: '1x Сундук', req: { planks: 6 }, out: { chest: 1 } },
  { name: '1x Кровать', req: { planks: 3, leaves: 2 }, out: { bed: 1 } },
  { name: 'Дер. Дверь', req: { planks: 4 }, out: { door_wood: 1 } },
  { name: 'Жел. Дверь', req: { stone: 4, gold: 1 }, out: { door_iron: 1 } },
  { name: 'Золотой блок', req: { stone: 4, sand: 4 }, out: { gold: 1 } },
  { name: 'Алмазный блок', req: { gold: 2, stone: 4 }, out: { diamond: 1 } },
  { name: '2x Кирпич', req: { dirt: 2, stone: 2 }, out: { brick: 2 } },
  { name: '1x TNT', req: { sand: 3, dirt: 2 }, out: { tnt: 1 } }
];

var SMELT_RECIPES = [
  { name: '2x Стекло (из Песка)', req: { sand: 2 }, out: { glass: 2 } },
  { name: '2x Кирпич (из Земли)', req: { dirt: 2 }, out: { brick: 2 } },
  { name: '1x Золото (из Камня)', req: { stone: 4 }, out: { gold: 1 } },
  { name: '1x Алмаз (из Золота)', req: { gold: 2 }, out: { diamond: 1 } }
];

function toggleCraft(show, stationType) {
  playSound('click');
  var modal = document.getElementById('craft-modal'); if (!modal) return;
  modal.classList.toggle('hidden', !show); if (!show) return;
  var title = document.getElementById('station-title');
  if (stationType === 'furnace') { title.innerText = 'Печка / Плавка'; renderStationList(SMELT_RECIPES); }
  else if (stationType === 'chest') { title.innerText = 'Сундук (Хранилище)'; renderChestUI(); }
  else { title.innerText = 'Верстак / Крафт'; renderStationList(RECIPES); }
}

function renderStationList(recList) {
  var list = document.getElementById('craft-list'); list.innerHTML = '';
  recList.forEach(function(r) {
    var can = gameMode === 'creative';
    if (!can) { can = true; Object.keys(r.req).forEach(function(k) { if ((invCounts[k] || 0) < r.req[k]) can = false; }); }
    var reqStr = Object.keys(r.req).map(function(k) { return BLOCKS[k].name + ':' + r.req[k]; }).join(', ');
    var row = document.createElement('div'); row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:6px;';
    var info = document.createElement('span'); info.innerText = r.name + ' (' + reqStr + ')';
    var btn = document.createElement('div'); btn.className = 'mc-btn small' + (can ? ' selected' : ''); btn.style.width = '76px'; btn.innerText = 'Создать';
    btn.onclick = function() {
      if (!can) return; playSound('craft');
      if (gameMode === 'survival') Object.keys(r.req).forEach(function(k) { invCounts[k] -= r.req[k]; });
      Object.keys(r.out).forEach(function(k) { invCounts[k] = (invCounts[k] || 0) + r.out[k]; if (hotbarTypes.indexOf(k) === -1) hotbarTypes[activeSlot] = k; });
      updateHotbarUI(); renderStationList(recList);
    };
    row.appendChild(info); row.appendChild(btn); list.appendChild(row);
  });
}

function renderChestUI() {
  var list = document.getElementById('craft-list'); list.innerHTML = '';
  Object.keys(BLOCKS).forEach(function(k) {
    if (BLOCKS[k].isItem && k !== 'apple') return;
    var myCnt = invCounts[k] || 0, chCnt = chestInv[k] || 0;
    if (myCnt === 0 && chCnt === 0) return;
    var row = document.createElement('div'); row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:4px;';
    var lbl = document.createElement('span'); lbl.innerText = BLOCKS[k].name + ' [Ты:' + myCnt + ' | Сун:' + chCnt + ']';
    var bBox = document.createElement('div'); bBox.style.cssText = 'display:flex;gap:4px;';
    var putB = document.createElement('div'); putB.className = 'mc-btn small'; putB.style.width = '36px'; putB.innerText = '+1';
    putB.onclick = function() { if ((invCounts[k] || 0) > 0) { invCounts[k]--; chestInv[k] = (chestInv[k] || 0) + 1; playSound('click'); updateHotbarUI(); renderChestUI(); } };
    var getB = document.createElement('div'); getB.className = 'mc-btn small selected'; getB.style.width = '36px'; getB.innerText = '-1';
    getB.onclick = function() { if ((chestInv[k] || 0) > 0) { chestInv[k]--; invCounts[k] = (invCounts[k] || 0) + 1; playSound('click'); updateHotbarUI(); renderChestUI(); } };
    bBox.appendChild(putB); bBox.appendChild(getB); row.appendChild(lbl); row.appendChild(bBox); list.appendChild(row);
  });
  if (!list.children.length) list.innerHTML = '<div style="text-align:center;">Сундук пуст. Добывай блоки и складывай сюда!</div>';
}

var world = new Map(), mobs = [];
function key(x, y, z) { return x + ',' + y + ',' + z; }
function setBlock(x, y, z, type, open) { world.set(key(x, y, z), { x: x, y: y, z: z, type: type, open: !!open }); }
function delBlock(x, y, z) { world.delete(key(x, y, z)); }
function getBlock(x, y, z) { return world.get(key(x, y, z)); }
function hasBlock(x, y, z) { return world.has(key(x, y, z)); }

function getSavedWorldsMap() { try { return JSON.parse(localStorage.getItem('mc0642_worlds_v6')) || JSON.parse(localStorage.getItem('mc0642_worlds_v5')) || {}; } catch (e) { return {}; } }
function saveWorld() { try { var all = getSavedWorldsMap(); all[currentWorldId] = { id: currentWorldId, name: worldName, mode: gameMode, hp: playerHP, food: playerFood, inv: invCounts, chest: chestInv, spawn: spawnPoint, blocks: Array.from(world.values()) }; localStorage.setItem('mc0642_worlds_v6', JSON.stringify(all)); } catch (e) {} }
function loadWorldById(id) {
  var data = getSavedWorldsMap()[id]; if (!data) return false;
  currentWorldId = id; worldName = data.name || 'Мой Мир'; gameMode = data.mode || 'survival';
  playerHP = data.hp || 20; playerFood = data.food || 20;
  if (data.inv) invCounts = Object.assign(invCounts, data.inv);
  if (data.chest) chestInv = data.chest;
  if (data.spawn) spawnPoint = data.spawn;
  world.clear(); data.blocks.forEach(function(b) { setBlock(b.x, b.y, b.z, b.type, b.open); });
  document.getElementById('hud-world-name').innerText = worldName; spawnMobs(14); return true;
}

function startContinue() {
  var modal = document.getElementById('worlds-modal'); if (!modal) { showScreen('hud'); return; }
  playSound('click'); modal.classList.remove('hidden');
  var list = document.getElementById('worlds-list'); list.innerHTML = '';
  var all = getSavedWorldsMap(), ids = Object.keys(all);
  if (ids.length === 0) {
    var empty = document.createElement('div'); empty.style.textAlign = 'center'; empty.innerText = 'Нет сохранённых миров. Создай новый!'; list.appendChild(empty);
  } else {
    ids.forEach(function(id) {
      var w = all[id], row = document.createElement('div'); row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:4px;';
      var lbl = document.createElement('span'); lbl.innerText = w.name + ' (' + (w.mode === 'survival' ? 'Выж' : 'Креа') + ')';
      var btns = document.createElement('div'); btns.style.cssText = 'display:flex;gap:4px;';
      var pBtn = document.createElement('div'); pBtn.className = 'mc-btn small selected'; pBtn.style.width = '64px'; pBtn.innerText = 'Играть';
      pBtn.onclick = function() { loadWorldById(id); updateSurvUI(); updateHotbarUI(); showScreen('hud'); };
      var dBtn = document.createElement('div'); dBtn.className = 'mc-btn small'; dBtn.style.width = '40px'; dBtn.style.background = '#c62828'; dBtn.innerText = 'X';
      dBtn.onclick = function() { var upd = getSavedWorldsMap(); delete upd[id]; localStorage.setItem('mc0642_worlds_v6', JSON.stringify(upd)); startContinue(); };
      btns.appendChild(pBtn); btns.appendChild(dBtn); row.appendChild(lbl); row.appendChild(btns); list.appendChild(row);
    });
  }
  var newBtn = document.createElement('div'); newBtn.className = 'mc-btn small'; newBtn.style.cssText = 'background:#4CAF50;width:100%;margin-top:8px;';
  newBtn.innerText = '+ Создать новый мир'; newBtn.onclick = function() { showScreen('create'); }; list.appendChild(newBtn);
}

function createNewWorld() {
  currentWorldId = 'world_' + Date.now(); worldName = document.getElementById('world-name-input').value.trim() || 'Новый мир';
  gameMode = selectedGameMode; playerHP = 20; playerFood = 20; chestInv = {}; spawnPoint = { x: 0.5, y: 5.5, z: 0.5 };
  if (gameMode === 'survival') {
    invCounts = { sword: 1, stone_sword: 0, apple: 5, grass: 0, dirt: 0, stone: 0, sand: 0, wood: 0, planks: 16, leaves: 0, brick: 0, tnt: 0, glass: 0, craft: 0, gold: 0, diamond: 0, door_wood: 0, door_iron: 0, bed: 0, chest: 0, furnace: 0 };
    hotbarTypes = ['sword', 'apple', 'planks', 'grass', 'stone'];
  }
  document.getElementById('hud-world-name').innerText = worldName; generateWorld(selectedGenType, selectedGenSize); updateSurvUI(); updateHotbarUI(); showScreen('hud');
}

var player = { x: 0.5, y: 4.6, z: 0.5, vy: 0, yaw: 0, pitch: -0.25, onGround: false, flying: false, height: 1.6 };
function updateFlyUI() { document.getElementById('fly-controls').classList.toggle('hidden', !player.flying); var t = LANG[currentLang]; document.getElementById('hud-mode').innerText = gameMode === 'survival' ? t.surv : (player.flying ? t.modeF : t.modeC); }
function spawnMobs(radius) {
  mobs = []; var types = ['chicken', 'pig', 'sheep'], count = Math.max(6, Math.floor(radius / 2));
  for (var i = 0; i < count; i++) mobs.push({ type: types[i % 3], x: Math.floor((Math.random() - 0.5) * radius) + 0.5, y: 6, z: Math.floor((Math.random() - 0.5) * radius) + 0.5, vy: 0, yaw: Math.random() * 6.28, timer: Math.random() * 100, walkPhase: Math.random() * 6, hurt: 0, hp: 3 });
}function placeTree(tx, ty, tz) {
for (var h = 1; h <= 3; h++) setBlock(tx, ty + h, tz, 'wood');
for (var lx = tx - 1; lx <= tx + 1; lx++) for (var lz = tz - 1; lz <= tz + 1; lz++) setBlock(lx, ty + 4, lz, 'leaves');
setBlock(tx, ty + 5, tz, 'leaves');
}
function generateWorld(type, radius) {
radius = Math.round(radius * 1.7); world.clear(); var seed = Math.random() * 100;
for (var x = -radius; x <= radius; x++) {
for (var z = -radius; z <= radius; z++) {
if (type === 'island' && Math.hypot(x, z) > radius * 0.85) continue;
var h = type === 'hills' ? Math.round(Math.sin((x + seed) * 0.35) * 1.5 + Math.cos((z + seed) * 0.35) * 1.5) : (type === 'island' ? Math.round(2 - Math.hypot(x, z) * 0.25) : 0);
setBlock(x, h, z, (type === 'island' && h <= 0) ? 'sand' : 'grass'); setBlock(x, h - 1, z, 'dirt'); setBlock(x, h - 2, z, 'stone');
if (type !== 'flat' && Math.abs(x) > 2 && Math.abs(z) > 2 && Math.random() < 0.025) placeTree(x, h, z);
}
}
if (type === 'flat') placeTree(-4, 0, 4);
spawnMobs(radius); player.x = 0.5; player.y = 5.5; player.z = 0.5; player.vy = 0; player.flying = false; updateFlyUI(); saveWorld();
}
var existingIds = Object.keys(getSavedWorldsMap());
if (existingIds.length > 0) loadWorldById(existingIds.at(0)); else generateWorld('hills', 10);
function explodeTNT(tx, ty, tz) {
playSound('tnt');
for (var dx = -2; dx <= 2; dx++) for (var dy = -2; dy <= 2; dy++) for (var dz = -2; dz <= 2; dz++) if (Math.hypot(dx, dy, dz) <= 2.3) delBlock(tx + dx, ty + dy, tz + dz);
}
var joyMove = { x: 0, y: 0 }, dpadEl = document.getElementById('dpad'), dpadTouchId = null;
var dpUp = document.getElementById('dp-up'), dpDown = document.getElementById('dp-down'), dpLeft = document.getElementById('dp-left'), dpRight = document.getElementById('dp-right'), dpUl = document.getElementById('dp-ul'), dpUr = document.getElementById('dp-ur'), dpMid = document.getElementById('dp-mid'), diagVisible = false;
function setDiagVisible(show) { diagVisible = show; dpUl.classList.toggle('hidden-diag', !show); dpUr.classList.toggle('hidden-diag', !show); }
function updateDpadFromTouch(pt) {
var rect = dpadEl.getBoundingClientRect(), rx = (pt.clientX - rect.left) / rect.width, ry = (pt.clientY - rect.top) / rect.height, fwd = 0, str = 0, activeIds = {};
if (ry < 0.36) { fwd = 1; activeIds['dp-up'] = true; if (rx < 0.34) { str = 0.75; activeIds['dp-ul'] = true; } else if (rx > 0.66) { str = -0.75; activeIds['dp-ur'] = true; } }
else if (ry > 0.66) { fwd = -1; activeIds['dp-down'] = true; }
else { if (rx < 0.36) { str = 1; activeIds['dp-left'] = true; } else if (rx > 0.64) { str = -1; activeIds['dp-right'] = true; } else activeIds['dp-mid'] = true; }
[dpUp, dpDown, dpLeft, dpRight, dpUl, dpUr, dpMid].forEach(function(b) { if (b) b.classList.toggle('active', !!activeIds[b.id]); });
setDiagVisible(fwd > 0); joyMove.y = -fwd; joyMove.x = str;
}
function clearDpad() { dpadTouchId = null; [dpUp, dpDown, dpLeft, dpRight, dpUl, dpUr, dpMid].forEach(function(b) { if (b) b.classList.remove('active'); }); setDiagVisible(false); joyMove.x = 0; joyMove.y = 0; }
dpadEl.addEventListener('touchstart', function(e) { e.preventDefault(); e.stopPropagation(); if (dpadTouchId === null && e.changedTouches.length > 0) { var t = e.changedTouches.item(0); dpadTouchId = t.identifier; updateDpadFromTouch(t); } }, { passive: false });
dpadEl.addEventListener('touchmove', function(e) { e.preventDefault(); e.stopPropagation(); for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches.item(i); if (t.identifier === dpadTouchId) updateDpadFromTouch(t); } }, { passive: false });
dpadEl.addEventListener('touchend', function(e) { e.preventDefault(); e.stopPropagation(); for (var i = 0; i < e.changedTouches.length; i++) { if (e.changedTouches.item(i).identifier === dpadTouchId) clearDpad(); } }, { passive: false });
dpadEl.addEventListener('touchcancel', clearDpad);
window.addEventListener('blur', function() { clearDpad(); camTouchId = null; isBreaking = false; });
var camTouchId = null, lastCam = { x: 0, y: 0 };
canvas.addEventListener('touchstart', function(e) { if (!isPlaying) return; if (camTouchId === null) { var t = e.changedTouches.item(0); camTouchId = t.identifier; lastCam = { x: t.clientX, y: t.clientY }; } });
canvas.addEventListener('touchmove', function(e) {
if (!isPlaying) return;
for (var i = 0; i < e.changedTouches.length; i++) {
var t = e.changedTouches.item(i);
if (t.identifier === camTouchId) { player.yaw += (t.clientX - lastCam.x) * sensitivity; player.pitch -= (t.clientY - lastCam.y) * sensitivity; player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch)); lastCam = { x: t.clientX, y: t.clientY }; }
}
});
function resetCam(e) { for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches.item(i).identifier === camTouchId) camTouchId = null; }
canvas.addEventListener('touchend', resetCam); canvas.addEventListener('touchcancel', resetCam);
function raycast() {
var cosP = Math.cos(player.pitch), dx = Math.sin(player.yaw) * cosP, dy = Math.sin(player.pitch), dz = Math.cos(player.yaw) * cosP, prev = null;
for (var step = 0.0; step <= 7.5; step += 0.025) {
var px = player.x + dx * step, py = player.y + dy * step, pz = player.z + dz * step;
for (var mi = 0; mi < mobs.length; mi++) {
var m = mobs[mi], mH = m.type === 'zombie' ? 1.7 : 1.0;
if (Math.hypot(px - m.x, pz - m.z) < 0.95 && py >= m.y - 0.1 && py <= m.y + mH) return { mob: m };
}
var rx = Math.floor(px), ry = Math.floor(py), rz = Math.floor(pz);
if (hasBlock(rx, ry, rz)) return { hit: { x: rx, y: ry, z: rz }, prev: prev };
prev = { x: rx, y: ry, z: rz };
}
return null;
}
function getWeaponDmg() { var h = hotbarTypes[activeSlot]; return h === 'sword' ? 3 : (h === 'stone_sword' ? 2 : 1); }
var isBreaking = false, breakKey = '', breakProg = 0, breakMax = 30, btnBreak = document.getElementById('btn-break');
function triggerHitOrStartBreak() {
swingAnim = 1; var res = raycast(); if (!res) return;
if (res.mob) {
res.mob.hurt = 15; res.mob.vy = 0.14; res.mob.yaw = player.yaw; res.mob.hp = (res.mob.hp || 3) - getWeaponDmg(); playSound('hit');
if (res.mob.hp <= 0) { mobs.splice(mobs.indexOf(res.mob), 1); invCounts.apple = (invCounts.apple || 0) + 1; updateHotbarUI(); }
return;
}
if (res.hit) {
var b = getBlock(res.hit.x, res.hit.y, res.hit.z); if (!b) return;
if (gameMode === 'creative') {
if (b.type === 'tnt') explodeTNT(res.hit.x, res.hit.y, res.hit.z);
else { delBlock(res.hit.x, res.hit.y, res.hit.z); playSound('break'); }
} else { isBreaking = true; btnBreak.classList.add('holding'); }
}
}
function stopBreaking() { isBreaking = false; breakKey = ''; breakProg = 0; btnBreak.classList.remove('holding'); }
btnBreak.addEventListener('touchstart', function(e) { e.preventDefault(); e.stopPropagation(); triggerHitOrStartBreak(); }, { passive: false });
btnBreak.addEventListener('touchend', function(e) { e.preventDefault(); e.stopPropagation(); stopBreaking(); }, { passive: false });
btnBreak.addEventListener('touchcancel', stopBreaking);
document.getElementById('btn-place').addEventListener('touchstart', function(e) {
e.preventDefault(); e.stopPropagation(); swingAnim = 1; var res = raycast();
if (res && res.hit) {
var tb = getBlock(res.hit.x, res.hit.y, res.hit.z);
if (tb) {
if (tb.type === 'craft') { toggleCraft(true, 'craft'); return; }
if (tb.type === 'furnace') { toggleCraft(true, 'furnace'); return; }
if (tb.type === 'chest') { toggleCraft(true, 'chest'); return; }
if (tb.type === 'door_wood' || tb.type === 'door_iron') { tb.open = !tb.open; playSound('door'); showToast(tb.open ? 'Дверь открыта' : 'Дверь закрыта'); return; }
if (tb.type === 'bed') {
spawnPoint = { x: tb.x + 0.5, y: tb.y + 2.6, z: tb.z + 0.5 };
if (getSkyColor(worldTime).night) { worldTime = 0.25; showToast('Вы поспали до утра!'); }
else showToast('Точка возрождения задана!');
playSound('place'); return;
}
}
}
var held = hotbarTypes[activeSlot];
if (held === 'apple' && gameMode === 'survival' && invCounts.apple > 0 && playerFood < 20) { invCounts.apple--; playerFood = Math.min(20, playerFood + 6); playSound('place'); updateSurvUI(); updateHotbarUI(); return; }
if (BLOCKS[held].isItem || (gameMode === 'survival' && (invCounts[held] || 0) <= 0)) return;
if (res && res.prev) {
var p = res.prev;
if (Math.hypot(p.x + 0.5 - player.x, p.z + 0.5 - player.z) >= 0.55 || Math.abs(p.y + 0.5 - (player.y - 0.8)) >= 0.95) {
setBlock(p.x, p.y, p.z, held, false); if (gameMode === 'survival') { invCounts[held]--; updateHotbarUI(); } playSound('place');
}
}
}, { passive: false });
var lastJumpTap = 0, flyDir = 0;
document.getElementById('btn-jump').addEventListener('touchstart', function(e) {
e.preventDefault(); e.stopPropagation(); var now = Date.now();
if (now - lastJumpTap < 300 && gameMode === 'creative') { player.flying = !player.flying; player.vy = 0; updateFlyUI(); }
else if (!player.flying && player.onGround) { player.vy = 0.18; player.onGround = false; }
lastJumpTap = now;
}, { passive: false });
var btnFlyUp = document.getElementById('btn-fly-up'), btnFlyDown = document.getElementById('btn-fly-down');
btnFlyUp.addEventListener('touchstart', function(e) { e.preventDefault(); e.stopPropagation(); flyDir = 1; }); btnFlyUp.addEventListener('touchend', function(e) { e.stopPropagation(); flyDir = 0; });
btnFlyDown.addEventListener('touchstart', function(e) { e.preventDefault(); e.stopPropagation(); flyDir = -1; }); btnFlyDown.addEventListener('touchend', function(e) { e.stopPropagation(); flyDir = 0; });
function isSolidAt(x, y, z) { var b = getBlock(Math.floor(x), Math.floor(y), Math.floor(z)); if (!b || !BLOCKS[b.type].solid) return false; if (BLOCKS[b.type].isDoor && b.open) return false; return true; }
function canStandAt(nx, ny, nz) { var r = 0.22, offsets = [{x:-r,z:-r},{x:r,z:-r},{x:-r,z:r},{x:r,z:r}]; for (var i = 0; i < 4; i++) { var cx = nx + offsets[i].x, cz = nz + offsets[i].z; if (isSolidAt(cx, ny - 1.45, cz) || isSolidAt(cx, ny - 0.25, cz)) return false; } return true; }
function project(x, y, z, camX, camY, camZ, yaw, pitch) { var dx = x - camX, dy = y - camY, dz = z - camZ, cosY = Math.cos(-yaw), sinY = Math.sin(-yaw), x1 = dx * cosY - dz * sinY, z1 = dx * sinY + dz * cosY, cosP = Math.cos(-pitch), sinP = Math.sin(-pitch), y2 = dy * cosP - z1 * sinP, z2 = dy * sinP + z1 * cosP; if (z2 <= 0.1) return null; var fov = Math.max(canvas.width, canvas.height) * 0.55; return { x: canvas.width / 2 + (x1 / z2) * fov, y: canvas.height / 2 - (y2 / z2) * fov, z: z2 }; }
function v(x, y, z) { return { x: x, y: y, z: z }; }
var FACES = [{ dir: v(0, 1, 0), shade: 'top', verts: [v(0,1,0), v(1,1,0), v(1,1,1), v(0,1,1)] }, { dir: v(0, -1, 0), shade: 'bottom', verts: [v(0,0,1), v(1,0,1), v(1,0,0), v(0,0,0)] }, { dir: v(0, 0, 1), shade: 'side', verts: [v(0,0,1), v(0,1,1), v(1,1,1), v(1,0,1)] }, { dir: v(0, 0, -1), shade: 'side', verts: [v(1,0,0), v(1,1,0), v(0,1,0), v(0,0,0)] }, { dir: v(1, 0, 0), shade: 'side', verts: [v(1,0,1), v(1,1,1), v(1,1,0), v(1,0,0)] }, { dir: v(-1, 0, 0), shade: 'side', verts: [v(0,0,0), v(0,1,0), v(0,1,1), v(0,0,1)] }];
function getSkyColor(t) { var sh = Math.sin(t * Math.PI * 2); return sh > 0.2 ? { sky: '#87CEEB', night: false } : (sh > -0.2 ? { sky: '#E57373', night: false } : { sky: '#0D1B2A', night: true }); }
function drawQuadTexture(pts, texCols) { if (!texCols) return; var p0 = pts.at(0), p1 = pts.at(1), p2 = pts.at(2), p3 = pts.at(3), grid = [0.22, 0.5, 0.78]; for (var gx = 0; gx < 3; gx++) for (var gy = 0; gy < 3; gy++) { if ((gx + gy) % 2 === 0) continue; var u = grid[gx], vv = grid[gy], tx = (1 - u) * (1 - vv) * p0.x + u * (1 - vv) * p1.x + u * vv * p2.x + (1 - u) * vv * p3.x, ty = (1 - u) * (1 - vv) * p0.y + u * (1 - vv) * p1.y + u * vv * p2.y + (1 - u) * vv * p3.y, sz = Math.max(2, Math.hypot(p1.x - p0.x, p1.y - p0.y) * 0.16); ctx.fillStyle = texCols[(gx + gy) % 2]; ctx.fillRect(tx - sz * 0.5, ty - sz * 0.5, sz, sz); } }
function drawQuadCracks(pts, stage) { if (stage <= 0) return; var p0 = pts.at(0), p1 = pts.at(1), p2 = pts.at(2), p3 = pts.at(3), cx = (p0.x + p1.x + p2.x + p3.x) * 0.25, cy = (p0.y + p1.y + p2.y + p3.y) * 0.25; ctx.strokeStyle = 'rgba(15, 15, 15, 0.85)'; ctx.lineWidth = 2; for (var i = 0; i < stage && i < 4; i++) { var corner = pts[i]; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + (corner.x - cx) * 0.75, cy + (corner.y - cy) * 0.75); ctx.stroke(); } }
function drawHeldItem() {
if (!isPlaying || cameraMode !== 1) return;
var held = hotbarTypes[activeSlot], bobX = Math.sin(walkAnim) * 8, bobY = Math.abs(Math.cos(walkAnim)) * 8, swingX = swingAnim * -35, swingY = swingAnim * 25;
if (swingAnim > 0) swingAnim = Math.max(0, swingAnim - 0.12);
var baseX = canvas.width - 135 + bobX + swingX, baseY = canvas.height - 95 + bobY + swingY; ctx.save();
if (held === 'hand') { ctx.fillStyle = playerSkin.shirt; ctx.fillRect(baseX+20,baseY+35,36,40); ctx.fillStyle = playerSkin.skin; ctx.fillRect(baseX+20,baseY-10,36,45); ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.strokeRect(baseX+20,baseY-10,36,85); }
else if (held === 'sword' || held === 'stone_sword') { ctx.translate(baseX+35,baseY+30); ctx.rotate(-0.4 - swingAnim*0.8); ctx.fillStyle='#6D4C41'; ctx.fillRect(-5,10,10,26); ctx.fillStyle='#5D4037'; ctx.fillRect(-16,4,32,8); ctx.fillStyle = held === 'sword' ? '#4DD0E1' : '#B0BEC5'; ctx.fillRect(-7,-52,14,56); ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.strokeRect(-7,-52,14,56); }
else if (held === 'apple') { ctx.fillStyle='#E53935'; ctx.beginPath(); ctx.arc(baseX+35,baseY+25,22,0,6.28); ctx.fill(); ctx.stroke(); ctx.fillStyle='#6D4C41'; ctx.fillRect(baseX+33,baseY-4,4,10); ctx.fillStyle='#43A047'; ctx.fillRect(baseX+37,baseY-2,10,6); }
else { var b = BLOCKS[held]; ctx.fillStyle = b.top; ctx.beginPath(); ctx.moveTo(baseX+30,baseY-10); ctx.lineTo(baseX+65,baseY+5); ctx.lineTo(baseX+30,baseY+20); ctx.lineTo(baseX-5,baseY+5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = b.side; ctx.beginPath(); ctx.moveTo(baseX-5,baseY+5); ctx.lineTo(baseX+30,baseY+20); ctx.lineTo(baseX+30,baseY+58); ctx.lineTo(baseX-5,baseY+42); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = b.bottom; ctx.beginPath(); ctx.moveTo(baseX+30,baseY+20); ctx.lineTo(baseX+65,baseY+5); ctx.lineTo(baseX+65,baseY+42); ctx.lineTo(baseX+30,baseY+58); ctx.closePath(); ctx.fill(); ctx.stroke(); }
ctx.restore();
}
function addRotatedPart(renderList, m, lx, ly, lz, sx, sy, sz, topCol, sideCol, camX, camY, camZ, camYaw, camPitch) {
var sinY = Math.sin(m.yaw), cosY = Math.cos(m.yaw);
for (var fi = 0; fi < FACES.length; fi++) {
var f = FACES[fi], rnx = f.dir.x * cosY + f.dir.z * sinY, rny = f.dir.y, rnz = f.dir.z * cosY - f.dir.x * sinY;
var clx = lx + f.dir.x * sx * 0.5, cly = ly + sy * 0.5 + f.dir.y * sy * 0.5, clz = lz + f.dir.z * sz * 0.5;
var wx = m.x + clx * cosY + clz * sinY - camX, wy = m.y + cly - camY, wz = m.z + clz * cosY - clx * sinY - camZ;
if (wx * rnx + wy * rny + wz * rnz >= 0) continue;
var pts = [], avgZ = 0, vis = true;
for (var vi = 0; vi < 4; vi++) { var vert = f.verts[vi], px = lx + (vert.x - 0.5) * sx, py = ly + vert.y * sy, pz = lz + (vert.z - 0.5) * sz, rx = m.x + px * cosY + pz * sinY, rz = m.z + pz * cosY - px * sinY, p = project(rx, m.y + py, rz, camX, camY, camZ, camYaw, camPitch); if (!p) { vis = false; break; } pts.push(p); avgZ += p.z; }
if (vis) renderList.push({ pts: pts, z: avgZ / 4, color: f.shade === 'top' ? topCol : (f.shade === 'bottom' ? '#333' : sideCol), highlight: false, thinLine: true });
}
}
function renderPlayerModel(renderList, camX, camY, camZ, camYaw, camPitch) {
if (cameraMode === 1) return;
var pObj = { x: player.x, y: player.y - player.height, z: player.z, yaw: player.yaw }, limbSwing = Math.sin(walkAnim) * 0.14, armSwing = swingAnim > 0 ? -swingAnim * 0.4 : -limbSwing;
addRotatedPart(renderList, pObj, -0.11, 0, limbSwing, 0.20, 0.65, 0.20, playerSkin.pants, playerSkin.pants, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, pObj,  0.11, 0, -limbSwing, 0.20, 0.65, 0.20, playerSkin.pants, playerSkin.pants, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, pObj, 0, 0.65, 0, 0.44, 0.62, 0.24, playerSkin.shirt, playerSkin.shirt, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, pObj, -0.32, 0.68, armSwing, 0.18, 0.58, 0.18, playerSkin.shirt, playerSkin.skin, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, pObj,  0.32, 0.68, -armSwing, 0.18, 0.58, 0.18, playerSkin.shirt, playerSkin.skin, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, pObj, 0, 1.27, 0, 0.42, 0.42, 0.42, playerSkin.hair, playerSkin.skin, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, pObj, -0.10, 1.46, 0.21, 0.06, 0.05, 0.03, '#111', '#111', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, pObj,  0.10, 1.46, 0.21, 0.06, 0.05, 0.03, '#111', '#111', camX, camY, camZ, camYaw, camPitch);
}
function renderMob(renderList, m, camX, camY, camZ, camYaw, camPitch) {
var legSwing = Math.sin(m.walkPhase) * 0.12, hurt = m.hurt > 0;
if (m.type === 'zombie') {
var zSkin = hurt ? '#EF5350' : '#4CAF50';
addRotatedPart(renderList, m, -0.11, 0, legSwing, 0.20, 0.65, 0.20, '#3949AB', '#303F9F', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m,  0.11, 0, -legSwing, 0.20, 0.65, 0.20, '#3949AB', '#303F9F', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, 0, 0.65, 0, 0.44, 0.62, 0.24, '#00ACC1', '#00838F', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, -0.31, 0.98, 0.25, 0.16, 0.16, 0.52, zSkin, zSkin, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m,  0.31, 0.98, 0.25, 0.16, 0.16, 0.52, zSkin, zSkin, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, 0, 1.27, 0, 0.42, 0.42, 0.42, zSkin, '#388E3C', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, -0.10, 1.46, 0.21, 0.06, 0.05, 0.03, '#111', '#111', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m,  0.10, 1.46, 0.21, 0.06, 0.05, 0.03, '#111', '#111', camX, camY, camZ, camYaw, camPitch);
} else if (m.type === 'chicken') {
var bodyC = hurt ? '#EF5350' : '#FFFFFF', wingC = hurt ? '#E53935' : '#E0E0E0';
addRotatedPart(renderList, m, -0.09, 0, legSwing, 0.06, 0.24, 0.06, '#FFB300', '#FFB300', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m,  0.09, 0, -legSwing, 0.06, 0.24, 0.06, '#FFB300', '#FFB300', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, 0, 0.24, 0, 0.34, 0.32, 0.44, bodyC, wingC, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, -0.20, 0.28, 0, 0.06, 0.22, 0.32, wingC, wingC, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m,  0.20, 0.28, 0, 0.06, 0.22, 0.32, wingC, wingC, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, 0, 0.50, 0.22, 0.24, 0.28, 0.22, bodyC, wingC, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, 0, 0.54, 0.38, 0.14, 0.08, 0.14, '#FF9800', '#F57C00', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, 0, 0.44, 0.34, 0.08, 0.09, 0.08, '#D32F2F', '#B71C1C', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, -0.08, 0.62, 0.33, 0.04, 0.04, 0.03, '#111', '#111', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m,  0.08, 0.62, 0.33, 0.04, 0.04, 0.03, '#111', '#111', camX, camY, camZ, camYaw, camPitch);
} else if (m.type === 'pig') {
var topC = hurt ? '#EF5350' : '#F8BBD0', sideC = hurt ? '#E53935' : '#F48FB1', legPC = hurt ? '#C62828' : '#EC407A';
addRotatedPart(renderList, m, -0.18, 0, 0.24 + legSwing, 0.16, 0.28, 0.16, sideC, legPC, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m,  0.18, 0, 0.24 - legSwing, 0.16, 0.28, 0.16, sideC, legPC, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, -0.18, 0, -0.24 - legSwing, 0.16, 0.28, 0.16, sideC, legPC, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m,  0.18, 0, -0.24 + legSwing, 0.16, 0.28, 0.16, sideC, legPC, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, 0, 0.28, 0, 0.54, 0.44, 0.78, topC, sideC, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, 0, 0.42, 0.48, 0.44, 0.42, 0.42, topC, sideC, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, 0, 0.46, 0.72, 0.22, 0.15, 0.08, '#F06292', '#EC407A', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, -0.15, 0.62, 0.69, 0.06, 0.06, 0.03, '#111', '#111', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m,  0.15, 0.62, 0.69, 0.06, 0.06, 0.03, '#111', '#111', camX, camY, camZ, camYaw, camPitch);
} else {
var woolT = hurt ? '#EF5350' : '#FFFFFF', woolS = hurt ? '#E53935' : '#E0E0E0', faceC = hurt ? '#FFCDD2' : '#FFE0B2';
addRotatedPart(renderList, m, -0.18, 0, 0.24 + legSwing, 0.15, 0.34, 0.15, faceC, '#D7CCC8', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m,  0.18, 0, 0.24 - legSwing, 0.15, 0.34, 0.15, faceC, '#D7CCC8', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, -0.18, 0, -0.24 - legSwing, 0.15, 0.34, 0.15, faceC, '#D7CCC8', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m,  0.18, 0, -0.24 + legSwing, 0.15, 0.34, 0.15, faceC, '#D7CCC8', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, 0, 0.34, 0, 0.62, 0.52, 0.82, woolT, woolS, camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, 0, 0.54, 0.48, 0.38, 0.38, 0.38, faceC, '#FFCC80', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m, -0.12, 0.72, 0.67, 0.06, 0.06, 0.03, '#111', '#111', camX, camY, camZ, camYaw, camPitch);
addRotatedPart(renderList, m,  0.12, 0.72, 0.67, 0.06, 0.06, 0.03, '#111', '#111', camX, camY, camZ, camYaw, camPitch);
}
} var menuAngle = 0.6;
function loop() {
  worldTime = (worldTime + 0.00015) % 1;
  var skyInfo = getSkyColor(worldTime), camX = player.x, camY = player.y, camZ = player.z, camYaw = player.yaw, camPitch = player.pitch;
  var target = isPlaying ? raycast() : null;

  if (isPlaying) {
    if (hurtCooldown > 0) hurtCooldown--;
    if (isBreaking && target && target.hit && gameMode === 'survival') {
      var curK = key(target.hit.x, target.hit.y, target.hit.z);
      var tb = getBlock(target.hit.x, target.hit.y, target.hit.z);
      if (tb) {
        if (curK !== breakKey) { breakKey = curK; breakProg = 0; breakMax = BLOCKS[tb.type].hard || 30; }
        breakProg++;
        if (breakProg % 8 === 1) { swingAnim = 0.7; playSound('mine'); }
        if (breakProg >= breakMax) {
          if (tb.type === 'tnt') explodeTNT(target.hit.x, target.hit.y, target.hit.z);
          else { invCounts[tb.type] = (invCounts[tb.type] || 0) + 1; updateHotbarUI(); delBlock(target.hit.x, target.hit.y, target.hit.z); playSound('break'); }
          breakProg = 0; breakKey = '';
        }
      }
    } else if (!isBreaking || !target || !target.hit) {
      breakProg = 0; breakKey = '';
    }

    var sin = Math.sin(player.yaw), cos = Math.cos(player.yaw), speed = player.flying ? 0.13 : 0.085;
    var forward = -joyMove.y, strafe = -joyMove.x;
    var moveX = (sin * forward + cos * strafe) * speed, moveZ = (cos * forward - sin * strafe) * speed;
    if (Math.hypot(moveX, moveZ) > 0.005) {
      var prevStep = Math.floor(walkAnim / Math.PI); walkAnim += 0.22;
      if (!player.flying && player.onGround && Math.floor(walkAnim / Math.PI) !== prevStep) playSound('step');
      if (gameMode === 'survival' && ++foodTick > 600) { foodTick = 0; if (playerFood > 0) { playerFood--; updateSurvUI(); } }
    }
    if (player.flying) { player.x += moveX; player.z += moveZ; player.y += flyDir * 0.11; }
    else {
      var moved = false;
      if (canStandAt(player.x + moveX, player.y, player.z)) { player.x += moveX; moved = true; }
      if (canStandAt(player.x, player.y, player.z + moveZ)) { player.z += moveZ; moved = true; }
      if (!moved && player.onGround && Math.hypot(moveX, moveZ) > 0.02 && canStandAt(player.x + moveX * 1.5, player.y + 1.05, player.z + moveZ * 1.5)) { player.vy = 0.18; player.onGround = false; }
      player.vy -= 0.009; player.y += player.vy;
      var footY = Math.floor(player.y - player.height);
      if (isSolidAt(player.x, footY, player.z) && player.vy <= 0) {
        if (gameMode === 'survival' && player.vy < -0.28) { playerHP = Math.max(0, playerHP - Math.round((-player.vy - 0.25) * 25)); playSound('hit'); updateSurvUI(); }
        player.y = footY + 1 + player.height; player.vy = 0; player.onGround = true;
      } else player.onGround = false;
    }
    if (gameMode === 'survival') {
      if (playerFood >= 18 && playerHP < 20 && Math.random() < 0.01) { playerHP++; updateSurvUI(); }
      if (playerHP <= 0) { playerHP = 20; playerFood = 20; player.x = spawnPoint.x; player.y = spawnPoint.y; player.z = spawnPoint.z; updateSurvUI(); showToast('Вы возродились!'); }
      if (skyInfo.night && mobs.length < 10 && Math.random() < 0.008) {
        var ang = Math.random() * 6.28;
        mobs.push({ type: 'zombie', x: player.x + Math.cos(ang) * 12, y: player.y + 2, z: player.z + Math.sin(ang) * 12, vy: 0, yaw: 0, timer: 50, walkPhase: 0, hurt: 0, hp: 5 });
      }
    }
    if (player.y < -15) { player.x = spawnPoint.x; player.y = spawnPoint.y; player.z = spawnPoint.z; player.vy = 0; }
    camX = player.x; camY = player.y; camZ = player.z; camYaw = player.yaw; camPitch = player.pitch;
    if (cameraMode === 3) { camX = player.x - Math.sin(player.yaw) * 3.4; camZ = player.z - Math.cos(player.yaw) * 3.4; camY = player.y + 0.5; }
    else if (cameraMode === 2) { camX = player.x + Math.sin(player.yaw) * 3.4; camZ = player.z + Math.cos(player.yaw) * 3.4; camY = player.y + 0.3; camYaw = player.yaw + Math.PI; camPitch = -player.pitch * 0.5; }
  } else { menuAngle += 0.004; camX = Math.sin(menuAngle) * 11; camZ = Math.cos(menuAngle) * 11; camY = 7.5; camYaw = menuAngle + Math.PI; camPitch = -0.45; }

  ctx.fillStyle = skyInfo.sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (skyInfo.night) { ctx.fillStyle = '#FFFFFF'; for (var s = 0; s < 35; s++) ctx.fillRect((s * 197) % canvas.width, (s * 89) % (canvas.height * 0.5), 2, 2); }
  var sunPos = project(camX + Math.cos(worldTime * 6.28) * 30, camY + Math.sin(worldTime * 6.28) * 30, camZ + 10, camX, camY, camZ, camYaw, camPitch);
  if (sunPos) { ctx.fillStyle = '#FFF59D'; ctx.fillRect(sunPos.x - 14, sunPos.y - 14, 28, 28); }
  var moonPos = project(camX - Math.cos(worldTime * 6.28) * 30, camY - Math.sin(worldTime * 6.28) * 30, camZ + 10, camX, camY, camZ, camYaw, camPitch);
  if (moonPos) { ctx.fillStyle = '#ECEFF1'; ctx.fillRect(moonPos.x - 11, moonPos.y - 11, 22, 22); }

  var renderList = [];
  var crackStage = breakMax > 0 ? Math.floor((breakProg / breakMax) * 4) : 0;

  world.forEach(function(b) {
    if (Math.hypot(b.x - camX, b.z - camZ) > renderDist) return;
    var colors = BLOCKS[b.type], isTarget = target && target.hit && target.hit.x === b.x && target.hit.y === b.y && target.hit.z === b.z;
    var isOpenDoor = colors.isDoor && b.open;
    for (var fi = 0; fi < FACES.length; fi++) {
      var f = FACES[fi], neighbor = getBlock(b.x + f.dir.x, b.y + f.dir.y, b.z + f.dir.z);
      if (neighbor && neighbor.type !== 'glass' && !BLOCKS[neighbor.type].isDoor && !isOpenDoor) continue;
      var cx = b.x + 0.5 + f.dir.x * 0.5 - camX, cy = b.y + 0.5 + f.dir.y * 0.5 - camY, cz = b.z + 0.5 + f.dir.z * 0.5 - camZ;
      if (cx * f.dir.x + cy * f.dir.y + cz * f.dir.z >= 0) continue;
      var pts = [], avgZ = 0, visible = true;
      for (var vi = 0; vi < 4; vi++) {
        var vert = f.verts[vi];
        var vz = isOpenDoor ? vert.z * 0.2 : vert.z;
        var p = project(b.x + vert.x, b.y + vert.y, b.z + vz, camX, camY, camZ, camYaw, camPitch);
        if (!p) { visible = false; break; } pts.push(p); avgZ += p.z;
      }
      if (visible) renderList.push({ pts: pts, z: avgZ / 4, color: colors[f.shade], tex: colors.tex, highlight: isTarget, cracks: isTarget ? crackStage : 0, thinLine: false });
    }
  });

  for (var mi = 0; mi < mobs.length; mi++) {
    var m = mobs[mi]; m.timer--; if (m.hurt > 0) m.hurt--;
    var distToPlayer = Math.hypot(player.x - m.x, player.z - m.z);
    if (m.type === 'zombie' && isPlaying && gameMode === 'survival') {
      m.yaw = Math.atan2(player.x - m.x, player.z - m.z);
      if (distToPlayer < 1.5 && hurtCooldown === 0) { playerHP = Math.max(0, playerHP - 2); hurtCooldown = 45; playSound('hit'); updateSurvUI(); }
    } else if (m.timer <= 0) { m.yaw = Math.random() * 6.28; m.timer = 60 + Math.random() * 120; }
    var mSpeed = m.hurt > 0 ? 0.065 : (m.type === 'zombie' ? 0.032 : 0.018); m.walkPhase += mSpeed * 8;
    var stopNear = (m.type === 'zombie' && isPlaying && distToPlayer < 1.35 && m.hurt === 0);
    var nx = m.x + Math.sin(m.yaw) * mSpeed, nz = m.z + Math.cos(m.yaw) * mSpeed;
    if (!stopNear && !isSolidAt(nx, m.y + 0.25, nz)) { m.x = nx; m.z = nz; } else if (!stopNear && m.vy === 0) m.vy = 0.15;
    m.vy -= 0.009; m.y += m.vy;
    var mFoot = Math.floor(m.y); if (isSolidAt(m.x, mFoot, m.z) && m.vy <= 0) { m.y = mFoot + 1; m.vy = 0; }
    if (m.y < -15) { m.x = 0.5; m.y = 6; m.z = 0.5; }
    if (Math.hypot(m.x - camX, m.z - camZ) <= renderDist) renderMob(renderList, m, camX, camY, camZ, camYaw, camPitch);
  }

  renderPlayerModel(renderList, camX, camY, camZ, camYaw, camPitch);
  renderList.sort(function(a, b) { return b.z - a.z; });

  for (var ri = 0; ri < renderList.length; ri++) {
    var item = renderList[ri], first = item.pts.at(0);
    ctx.beginPath(); ctx.moveTo(first.x, first.y);
    for (var i = 1; i < 4; i++) ctx.lineTo(item.pts[i].x, item.pts[i].y);
    ctx.closePath(); ctx.fillStyle = item.color; ctx.fill();
    if (item.tex && item.z < 14) drawQuadTexture(item.pts, item.tex);
    if (item.cracks > 0) drawQuadCracks(item.pts, item.cracks);
    ctx.strokeStyle = item.highlight ? '#FFFFFF' : 'rgba(0,0,0,0.2)';
    ctx.lineWidth = item.highlight ? 2.8 : (item.thinLine ? 0.6 : 1);
    ctx.stroke();
  }

  if (skyInfo.night) { ctx.fillStyle = 'rgba(10, 15, 35, 0.38)'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  drawHeldItem(); requestAnimationFrame(loop);
}

var DEFAULT_BINDS = { forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', jump: 'Space', down: 'ShiftLeft', inv: 'KeyE', cam: 'F5' };
var pcBinds = Object.assign({}, DEFAULT_BINDS);
try { var savedBinds = JSON.parse(localStorage.getItem('mc0642_pc_binds')); if (savedBinds) pcBinds = Object.assign(pcBinds, savedBinds); } catch (e) {}
var waitingBindAction = null;
function formatKeyName(code) { return code.replace('Key', '').replace('Digit', '').replace('Arrow', '↑↓←→ ').replace('Left', '').replace('Right', ''); }
function renderPcBindsUI() {
  var list = document.getElementById('pc-binds-list'); if (!list) return;
  list.innerHTML = '';
  var names = { forward: 'Вперёд', back: 'Назад', left: 'Влево', right: 'Вправо', jump: 'Прыжок / Вверх', down: 'Вниз (Полёт)', inv: 'Инвентарь', cam: 'Вид камеры' };
  Object.keys(DEFAULT_BINDS).forEach(function(act) {
    var row = document.createElement('div'); row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';
    var lbl = document.createElement('span'); lbl.innerText = names[act] + ':';
    var btn = document.createElement('div'); btn.className = 'mc-btn small' + (waitingBindAction === act ? ' selected' : ''); btn.style.width = '115px';
    btn.innerText = waitingBindAction === act ? 'Жми клавишу...' : formatKeyName(pcBinds[act]);
    btn.onclick = function() { playSound('click'); waitingBindAction = act; renderPcBindsUI(); };
    row.appendChild(lbl); row.appendChild(btn); list.appendChild(row);
  });
}
function resetPcBinds() { playSound('click'); pcBinds = Object.assign({}, DEFAULT_BINDS); waitingBindAction = null; try { localStorage.setItem('mc0642_pc_binds', JSON.stringify(pcBinds)); } catch (e) {} renderPcBindsUI(); }
var pcKeys = {};
function updatePcMove() {
var fwd = (pcKeys[pcBinds.forward] || pcKeys['ArrowUp'] ? 1 : 0) - (pcKeys[pcBinds.back] || pcKeys['ArrowDown'] ? 1 : 0);
var str = (pcKeys[pcBinds.left] || pcKeys['ArrowLeft'] ? 1 : 0) - (pcKeys[pcBinds.right] || pcKeys['ArrowRight'] ? 1 : 0);
joyMove.y = -fwd; joyMove.x = str;
if (player.flying) flyDir = (pcKeys[pcBinds.jump] ? 1 : 0) - (pcKeys[pcBinds.down] ? 1 : 0);
}
window.addEventListener('keydown', function(e) {
if (waitingBindAction) { e.preventDefault(); pcBinds[waitingBindAction] = e.code; waitingBindAction = null; try { localStorage.setItem('mc0642_pc_binds', JSON.stringify(pcBinds)); } catch (err) {} renderPcBindsUI(); return; }
if (!isPlaying) return;
if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
document.getElementById('dpad').style.display = 'none'; document.getElementById('actions').style.display = 'none';
pcKeys[e.code] = true;
if (e.code === pcBinds.jump && !e.repeat) {
var now = Date.now();
if (now - lastJumpTap < 300 && gameMode === 'creative') { player.flying = !player.flying; player.vy = 0; updateFlyUI(); }
else if (!player.flying && player.onGround) { player.vy = 0.18; player.onGround = false; }
lastJumpTap = now;
}
if (e.code >= 'Digit1' && e.code <= 'Digit5') pickSlot(parseInt(e.code.replace('Digit', ''), 10) - 1);
if (e.code === pcBinds.inv) { var invEl = document.getElementById('inv-modal'), willOpen = invEl.classList.contains('hidden'); toggleInv(willOpen); if (willOpen && document.exitPointerLock) document.exitPointerLock(); }
if (e.code === pcBinds.cam) { e.preventDefault(); var nextCam = cameraMode === 1 ? 3 : (cameraMode === 3 ? 2 : 1); setCameraMode(document.getElementById({ 1: 'btn-cam-1', 3: 'btn-cam-3', 2: 'btn-cam-2' }[nextCam]), nextCam); }
updatePcMove();
});
window.addEventListener('keyup', function(e) { pcKeys[e.code] = false; updatePcMove(); });
window.addEventListener('wheel', function(e) { if (isPlaying) pickSlot((activeSlot + (e.deltaY > 0 ? 1 : 4)) % 5); });
canvas.addEventListener('mousedown', function(e) {
if (!isPlaying) return;
if (document.pointerLockElement !== canvas && canvas.requestPointerLock) { canvas.requestPointerLock(); return; }
if (e.button === 0) triggerHitOrStartBreak();
if (e.button === 2) document.getElementById('btn-place').dispatchEvent(new Event('touchstart'));
});
window.addEventListener('mouseup', function(e) { if (e.button === 0) stopBreaking(); });
window.addEventListener('contextmenu', function(e) { if (isPlaying) e.preventDefault(); });
document.addEventListener('mousemove', function(e) {
if (!isPlaying || document.pointerLockElement !== canvas) return;
player.yaw += e.movementX * sensitivity * 0.45; player.pitch -= e.movementY * sensitivity * 0.45;
player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch));
});
var tapStartPos = { x: 0, y: 0, time: 0 };
canvas.addEventListener('touchstart', function(e) { if (!isPlaying || e.changedTouches.length === 0) return; var t = e.changedTouches.item(0); tapStartPos = { x: t.clientX, y: t.clientY, time: Date.now() }; });
canvas.addEventListener('touchend', function(e) {
if (!isPlaying || e.changedTouches.length === 0) return;
var t = e.changedTouches.item(0);
if (Math.hypot(t.clientX - tapStartPos.x, t.clientY - tapStartPos.y) < 25 && Date.now() - tapStartPos.time < 400) {
var hitMob = null, bestZ = 999;
for (var i = 0; i < mobs.length; i++) {
var m = mobs[i], d3d = Math.hypot(m.x - player.x, m.z - player.z);
if (d3d > 7.5) continue;
var p = project(m.x, m.y + 0.55, m.z, player.x, player.y, player.z, player.yaw, player.pitch);
if (d3d < 1.8 || (p && p.z < bestZ && Math.hypot(t.clientX - p.x, t.clientY - p.y) < 95)) { bestZ = p ? p.z : 0.5; hitMob = m; }
}
if (hitMob) {
swingAnim = 1; hitMob.hurt = 15; hitMob.vy = 0.14; hitMob.yaw = player.yaw;
hitMob.hp = (hitMob.hp || 3) - getWeaponDmg(); playSound('hit');
if (hitMob.hp <= 0) { mobs.splice(mobs.indexOf(hitMob), 1); invCounts.apple = (invCounts.apple || 0) + 1; updateHotbarUI(); }
}
}
});
loop();