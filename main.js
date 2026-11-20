var isPlaying = false, sensitivity = 0.006, renderDist = 22;
var worldName = 'Мой Мир', selectedGenType = 'hills', selectedGenSize = 12;
var gameMode = 'survival', selectedGameMode = 'survival';
var playerHP = 20, playerFood = 20, foodTick = 0, hurtCooldown = 0;
var invCounts = { sword: 1, apple: 5, grass: 0, dirt: 0, stone: 0, sand: 0, wood: 0, planks: 16, leaves: 0, brick: 0, tnt: 0, glass: 0 };
var worldTime = 0.25, swingAnim = 0, walkAnim = 0, cameraMode = 1, currentLang = 'ru', audioCtx = null;

function playSound(type) {
  try {
    if (!audioCtx) { var AC = window.AudioContext || window.webkitAudioContext; if (AC) audioCtx = new AC(); }
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    var now = audioCtx.currentTime, osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    if (type === 'click') { osc.type = 'square'; osc.frequency.setValueAtTime(520, now); gain.gain.setValueAtTime(0.06, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05); osc.start(now); osc.stop(now + 0.05); }
    else if (type === 'step') { osc.type = 'triangle'; osc.frequency.setValueAtTime(110 + Math.random() * 25, now); osc.frequency.exponentialRampToValueAtTime(55, now + 0.06); gain.gain.setValueAtTime(0.04, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06); osc.start(now); osc.stop(now + 0.06); }
    else if (type === 'place') { osc.type = 'triangle'; osc.frequency.setValueAtTime(220, now); osc.frequency.exponentialRampToValueAtTime(140, now + 0.08); gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08); osc.start(now); osc.stop(now + 0.08); }
    else if (type === 'break') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(160, now); osc.frequency.exponentialRampToValueAtTime(60, now + 0.11); gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11); osc.start(now); osc.stop(now + 0.11); }
    else if (type === 'hit') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(340, now); osc.frequency.exponentialRampToValueAtTime(120, now + 0.14); gain.gain.setValueAtTime(0.14, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14); osc.start(now); osc.stop(now + 0.14); }
    else if (type === 'tnt') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(120, now); osc.frequency.exponentialRampToValueAtTime(24, now + 0.55); gain.gain.setValueAtTime(0.28, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55); osc.start(now); osc.stop(now + 0.55); }
  } catch (e) {}
}

var LANG = {
  ru: { cont: 'Продолжить мир', create: 'Создать новый мир', skin: 'Редактор скина', settings: 'Настройки', skinTitle: 'Редактор Скина', hair: 'Волосы:', skinC: 'Кожа:', shirt: 'Майка:', pants: 'Штаны:', impSkin: 'Импорт скина (.png)', saveExit: 'Сохранить и выйти', createTitle: 'Создание мира', wName: 'Название мира:', gMode: 'Режим игры:', surv: 'Выживание', crea: 'Креатив', genType: 'Тип генерации:', hills: 'Холмы', flat: 'Плоский', island: 'Остров', wSize: 'Размер мира:', small: 'Малый', med: 'Средний', big: 'Большой', cancel: 'Отмена', doCreate: 'Создать мир', setTitle: 'Настройки', cam: 'Вид камеры:', c1: '1-е лицо', c3: '3-е лицо', c2: '2-е лицо', sens: 'Чувствительность', dist: 'Дальность обзора', support: 'Помощь и поддержка', done: 'Готово', supTitle: 'Помощь и поддержка', sup1: 'Напишите на', sup2: 'и опишите проблему или предложите идею для обновления.', copyMail: 'Скопировать почту', back: 'Назад', invTitle: 'Предметы и Блоки', close: 'Закрыть', timeBtn: 'День / Ночь', jump: 'ПРЫЖОК<br>(x2 полёт)', brk: 'ЛОМАТЬ', plc: 'СТАВИТЬ', up: 'ВВЕРХ', down: 'ВНИЗ', modeC: 'Креатив', modeF: 'Креатив (Полёт)' },
  en: { cont: 'Continue World', create: 'Create New World', skin: 'Skin Editor', settings: 'Settings', skinTitle: 'Skin Editor', hair: 'Hair:', skinC: 'Skin:', shirt: 'Shirt:', pants: 'Pants:', impSkin: 'Import Skin (.png)', saveExit: 'Save & Exit', createTitle: 'Create World', wName: 'World Name:', gMode: 'Game Mode:', surv: 'Survival', crea: 'Creative', genType: 'World Type:', hills: 'Hills', flat: 'Flat', island: 'Island', wSize: 'World Size:', small: 'Small', med: 'Medium', big: 'Large', cancel: 'Cancel', doCreate: 'Create World', setTitle: 'Settings', cam: 'Camera View:', c1: '1st Person', c3: '3rd Person', c2: '2nd Person', sens: 'Sensitivity', dist: 'Render Distance', support: 'Help & Support', done: 'Done', supTitle: 'Help & Support', sup1: 'Write to', sup2: 'and describe the issue or suggest an update idea.', copyMail: 'Copy Email', back: 'Back', invTitle: 'Items & Blocks', close: 'Close', timeBtn: 'Day / Night', jump: 'JUMP<br>(x2 fly)', brk: 'BREAK', plc: 'PLACE', up: 'UP', down: 'DOWN', modeC: 'Creative', modeF: 'Creative (Fly)' }
};

function setLanguage(btn, lang) {
  playSound('click'); currentLang = lang;
  document.querySelectorAll('#lang-group .mc-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected'); var t = LANG[lang];
  var mBtns = document.querySelectorAll('#menu .mc-btn');
  if (mBtns.length >= 4) { mBtns.item(0).innerText = t.cont; mBtns.item(1).innerText = t.create; mBtns.item(2).innerText = t.skin; mBtns.item(3).innerText = t.settings; }
  document.querySelector('#skin-menu .mc-logo').innerText = t.skinTitle;
  var sRows = document.querySelectorAll('#skin-menu .color-row span');
  if (sRows.length >= 4) { sRows.item(0).innerText = t.hair; sRows.item(1).innerText = t.skinC; sRows.item(2).innerText = t.shirt; sRows.item(3).innerText = t.pants; }
  document.querySelector('#skin-menu .form-box .mc-btn').innerText = t.impSkin;
  document.querySelectorAll('#skin-menu > .mc-btn').item(0).innerText = t.saveExit;
  document.querySelector('#create-menu .mc-logo').innerText = t.createTitle;
  var cSpans = document.querySelectorAll('#create-menu .form-box > span');
  if (cSpans.length >= 4) { cSpans.item(0).innerText = t.wName; cSpans.item(1).innerText = t.gMode; cSpans.item(2).innerText = t.genType; cSpans.item(3).innerText = t.wSize; }
  var gMode = document.querySelectorAll('#game-mode-group .mc-btn');
  if (gMode.length >= 2) { gMode.item(0).innerText = t.surv; gMode.item(1).innerText = t.crea; }
  var gType = document.querySelectorAll('#gen-type-group .mc-btn');
  if (gType.length >= 3) { gType.item(0).innerText = t.hills; gType.item(1).innerText = t.flat; gType.item(2).innerText = t.island; }
  var gSize = document.querySelectorAll('#gen-size-group .mc-btn');
  if (gSize.length >= 3) { gSize.item(0).innerText = t.small; gSize.item(1).innerText = t.med; gSize.item(2).innerText = t.big; }
  var cAct = document.querySelectorAll('#create-menu > div:last-child .mc-btn');
  if (cAct.length >= 2) { cAct.item(0).innerText = t.cancel; cAct.item(1).innerText = t.doCreate; }
  document.getElementById('lbl-settings-title').innerText = t.setTitle;
  document.getElementById('lbl-cam').innerText = t.cam;
  document.getElementById('btn-cam-1').innerText = t.c1; document.getElementById('btn-cam-3').innerText = t.c3; document.getElementById('btn-cam-2').innerText = t.c2;
  document.getElementById('lbl-sens').innerText = t.sens; document.getElementById('lbl-dist').innerText = t.dist;
  document.getElementById('btn-support').innerText = t.support; document.getElementById('btn-settings-done').innerText = t.done;
  document.querySelector('#support-menu .mc-logo').innerText = t.supTitle;
  var supP = document.querySelectorAll('#support-menu .form-box p');
  if (supP.length >= 3) { supP.item(0).innerText = t.sup1; supP.item(2).innerText = t.sup2; }
  document.getElementById('btn-copy-mail').innerText = t.copyMail;
  document.querySelectorAll('#support-menu > .mc-btn').item(1).innerText = t.back;
  document.querySelector('#inv-modal .inv-window > div').innerText = t.invTitle;
  document.querySelector('#inv-modal .mc-btn').innerText = t.close;
  document.getElementById('time-btn').innerText = t.timeBtn; document.getElementById('btn-jump').innerHTML = t.jump;
  document.getElementById('btn-break').innerText = t.brk; document.getElementById('btn-place').innerText = t.plc;
  document.getElementById('btn-fly-up').innerText = t.up; document.getElementById('btn-fly-down').innerText = t.down;
  updateFlyUI();
}

function setCameraMode(btn, mode) {
  playSound('click');
  document.querySelectorAll('#cam-mode-group .mc-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected'); cameraMode = mode;
}

var playerSkin = { hair: '#4E342E', skin: '#FFCC99', shirt: '#00ACC1', pants: '#3949AB' };
try { var savedSkin = JSON.parse(localStorage.getItem('mc0642_skin')); if (savedSkin) playerSkin = savedSkin; } catch (e) {}
function saveSkin() { try { localStorage.setItem('mc0642_skin', JSON.stringify(playerSkin)); } catch (e) {} }

function samplePngPixel(ctx, x, y, fallback) {
  var d = Array.from(ctx.getImageData(x, y, 1, 1).data);
  return d.at(3) < 10 ? fallback : 'rgb(' + d.at(0) + ',' + d.at(1) + ',' + d.at(2) + ')';
}

function importMinecraftSkin(input) {
  if (!input.files || !input.files.length) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    var img = new Image();
    img.onload = function() {
      var c = document.createElement('canvas'); c.width = 64; c.height = img.height >= 64 ? 64 : 32;
      var sctx = c.getContext('2d'); sctx.drawImage(img, 0, 0, c.width, c.height);
      playerSkin.skin = samplePngPixel(sctx, 10, 12, playerSkin.skin);
      playerSkin.hair = samplePngPixel(sctx, 10, 8, playerSkin.hair);
      playerSkin.shirt = samplePngPixel(sctx, 22, 22, playerSkin.shirt);
      playerSkin.pants = samplePngPixel(sctx, 6, 22, playerSkin.pants);
      var hat = Array.from(sctx.getImageData(42, 9, 1, 1).data);
if (hat.at(3) > 120) playerSkin.hair = 'rgb(' + hat.at(0) + ',' + hat.at(1) + ',' + hat.at(2) + ')';
saveSkin(); drawSkinPreview(); updateHotbarUI();
};
img.src = ev.target.result;
};
reader.readAsDataURL(input.files.item(0));
}
function drawSkinPreview() {
var sc = document.getElementById('skin-preview'); if (!sc) return;
var sctx = sc.getContext('2d'); sctx.clearRect(0, 0, 90, 150);
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
var palettes = { hair: ['#4E342E','#FDD835','#212121','#D84315','#8E24AA'], skin: ['#FFCC99','#F1C27D','#C68642','#8D5524','#A5D6A7'], shirt: ['#00ACC1','#E53935','#43A047','#FB8C00','#3949AB'], pants: ['#3949AB','#212121','#5D4037','#546E7A','#00897B'] };
Object.keys(palettes).forEach(function(part) {
var box = document.getElementById(part + '-colors'); if (!box) return;
palettes[part].forEach(function(col) {
var d = document.createElement('div'); d.className = 'swatch'; d.style.background = col;
d.onclick = function() { playSound('click'); playerSkin[part] = col; drawSkinPreview(); }; box.appendChild(d);
});
});
drawSkinPreview();
})();
function showScreen(name) {
playSound('click');
['menu', 'create-menu', 'settings-menu', 'support-menu', 'skin-menu', 'hud'].forEach(function(id) { document.getElementById(id).classList.add('hidden'); });
if (name === 'menu') document.getElementById('menu').classList.remove('hidden');
if (name === 'create') document.getElementById('create-menu').classList.remove('hidden');
if (name === 'settings') document.getElementById('settings-menu').classList.remove('hidden');
if (name === 'support') document.getElementById('support-menu').classList.remove('hidden');
if (name === 'skin') { document.getElementById('skin-menu').classList.remove('hidden'); drawSkinPreview(); }
if (name === 'hud') document.getElementById('hud').classList.remove('hidden');
isPlaying = (name === 'hud');
}
function copySupportMail() {
playSound('click');
var email = '807stro47kasup272portminicraft1@mail.ru', btn = document.getElementById('btn-copy-mail');
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(email).then(function() { btn.innerText = 'Скопировано!'; setTimeout(function() { btn.innerText = LANG[currentLang].copyMail; }, 2000); });
} else alert('Почта: ' + email);
}
function updateSurvUI() {
var bars = document.getElementById('surv-bars'); if (!bars) return;
bars.classList.toggle('hidden', gameMode !== 'survival');
if (gameMode === 'survival') {
var hStr = '', fStr = '';
for (var i = 0; i < 10; i++) { hStr += (playerHP >= (i + 1) * 2) ? '♥' : '♡'; fStr += (playerFood >= (i + 1) * 2) ? '🍗' : '🦴'; }
document.getElementById('hp-bar').innerText = hStr; document.getElementById('food-bar').innerText = fStr;
}
}
function startContinue() { document.getElementById('hud-world-name').innerText = worldName; updateSurvUI(); updateHotbarUI(); showScreen('hud'); }
function pauseGame() { saveWorld(); showScreen('menu'); }
function toggleDayNight() { playSound('click'); worldTime = (worldTime > 0.1 && worldTime < 0.5) ? 0.75 : 0.25; }
function selectGameMode(btn, val) { playSound('click'); document.querySelectorAll('#game-mode-group .mc-btn').forEach(function(b) { b.classList.remove('selected'); }); btn.classList.add('selected'); selectedGameMode = val; }
function selectType(btn, val) { playSound('click'); document.querySelectorAll('#gen-type-group .mc-btn').forEach(function(b) { b.classList.remove('selected'); }); btn.classList.add('selected'); selectedGenType = val; }
function selectSize(btn, val) { playSound('click'); document.querySelectorAll('#gen-size-group .mc-btn').forEach(function(b) { b.classList.remove('selected'); }); btn.classList.add('selected'); selectedGenSize = val; }
function createNewWorld() {
worldName = document.getElementById('world-name-input').value.trim() || 'Новый мир';
gameMode = selectedGameMode; playerHP = 20; playerFood = 20;
if (gameMode === 'survival') {
invCounts = { sword: 1, apple: 5, grass: 0, dirt: 0, stone: 0, sand: 0, wood: 0, planks: 16, leaves: 0, brick: 0, tnt: 0, glass: 0 };
hotbarTypes = ['sword', 'apple', 'planks', 'grass', 'stone'];
}
document.getElementById('hud-world-name').innerText = worldName;
generateWorld(selectedGenType, selectedGenSize); updateSurvUI(); updateHotbarUI(); showScreen('hud');
}
function updateSens(val) { document.getElementById('sens-val').innerText = val; sensitivity = val * 0.001; }
function updateDist(val) { document.getElementById('dist-val').innerText = val; renderDist = parseInt(val, 10); }
var canvas = document.createElement('canvas'); document.body.appendChild(canvas);
var ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();
var BLOCKS = {
hand:   { name: 'Рука',   top: '#FFCC99', side: '#E0AC69', bottom: '#C68642', isItem: true },
sword:  { name: 'Меч',    top: '#4DD0E1', side: '#00ACC1', bottom: '#8D6E63', isItem: true },
apple:  { name: 'Яблоко', top: '#E53935', side: '#C62828', bottom: '#B71C1C', isItem: true },
grass:  { name: 'Трава',  top: '#56C45A', side: '#43A047', bottom: '#5D4037', solid: true },
dirt:   { name: 'Земля',  top: '#8D6E63', side: '#795548', bottom: '#5D4037', solid: true },
stone:  { name: 'Камень', top: '#BDBDBD', side: '#9E9E9E', bottom: '#757575', solid: true },
sand:   { name: 'Песок',  top: '#F0D090', side: '#E6C280', bottom: '#C8A464', solid: true },
wood:   { name: 'Дуб',    top: '#B57B45', side: '#8D5524', bottom: '#6D4018', solid: true },
planks: { name: 'Доски',  top: '#D7A86E', side: '#C19258', bottom: '#A87B44', solid: true },
leaves: { name: 'Листва', top: '#388E3C', side: '#2E7D32', bottom: '#1B5E20', solid: true },
brick:  { name: 'Кирпич', top: '#C64B3C', side: '#B03A2E', bottom: '#8E2A20', solid: true },
tnt:    { name: 'TNT',    top: '#E53935', side: '#D32F2F', bottom: '#B71C1C', solid: true },
glass:  { name: 'Стекло', top: 'rgba(224,247,250,0.45)', side: 'rgba(178,235,242,0.45)', bottom: 'rgba(178,235,242,0.45)', solid: true }
};
var hotbarTypes = ['sword', 'apple', 'planks', 'grass', 'stone'], activeSlot = 0;
function updateHotbarUI() {
var slots = document.querySelectorAll('#hotbar .slot');
for (var i = 0; i < 5; i++) {
var type = hotbarTypes[i], sl = slots.item(i);
sl.style.background = type === 'hand' ? playerSkin.skin : BLOCKS[type].top;
var label = BLOCKS[type].isItem ? BLOCKS[type].name : (type === 'tnt' ? 'TNT' : '');
if (gameMode === 'survival' && type !== 'hand' && type !== 'sword') label += (label ? '\n' : '') + (invCounts[type] || 0);
sl.innerText = label; sl.classList.toggle('active', i === activeSlot);
}
}
updateHotbarUI();
function pickSlot(idx) { playSound('click'); activeSlot = idx; updateHotbarUI(); }
function toggleInv(show) { playSound('click'); document.getElementById('inv-modal').classList.toggle('hidden', !show); }
var invGrid = document.getElementById('inv-grid');
Object.keys(BLOCKS).forEach(function(type) {
var item = document.createElement('div'); item.className = 'inv-item';
item.style.background = BLOCKS[type].top; item.innerText = BLOCKS[type].name;
item.onclick = function() { playSound('click'); hotbarTypes[activeSlot] = type; updateHotbarUI(); toggleInv(false); };
invGrid.appendChild(item);
});
var world = new Map(), mobs = [];
function key(x, y, z) { return x + ',' + y + ',' + z; }
function setBlock(x, y, z, type) { world.set(key(x, y, z), { x: x, y: y, z: z, type: type }); }
function delBlock(x, y, z) { world.delete(key(x, y, z)); }
function getBlock(x, y, z) { return world.get(key(x, y, z)); }
function hasBlock(x, y, z) { return world.has(key(x, y, z)); }
var player = { x: 0.5, y: 4.6, z: 0.5, vy: 0, yaw: 0, pitch: -0.25, onGround: false, flying: false, height: 1.6 };
function updateFlyUI() {
document.getElementById('fly-controls').classList.toggle('hidden', !player.flying);
var t = LANG[currentLang];
if (gameMode === 'survival') document.getElementById('hud-mode').innerText = t.surv;
else document.getElementById('hud-mode').innerText = player.flying ? t.modeF : t.modeC;
}
function spawnMobs(radius) {
mobs = []; var types = ['chicken', 'pig', 'sheep'], count = Math.max(6, Math.floor(radius / 2));
for (var i = 0; i < count; i++) {
var mx = Math.floor((Math.random() - 0.5) * radius) + 0.5, mz = Math.floor((Math.random() - 0.5) * radius) + 0.5;
mobs.push({ type: types[i % 3], x: mx, y: 6, z: mz, vy: 0, yaw: Math.random() * 6.28, timer: Math.random() * 100, walkPhase: Math.random() * 6, hurt: 0, hp: 3 });
}
}
function placeTree(tx, ty, tz) {
for (var h = 1; h <= 3; h++) setBlock(tx, ty + h, tz, 'wood');
for (var lx = tx - 1; lx <= tx + 1; lx++) for (var lz = tz - 1; lz <= tz + 1; lz++) setBlock(lx, ty + 4, lz, 'leaves');
setBlock(tx, ty + 5, tz, 'leaves');
}
function saveWorld() {
try { localStorage.setItem('minicraft0642_save', JSON.stringify({ name: worldName, mode: gameMode, blocks: Array.from(world.values()) })); } catch (e) {}
}
function loadWorld() {
try {
var raw = localStorage.getItem('minicraft0642_save'); if (!raw) return false;
var data = JSON.parse(raw); worldName = data.name || 'Мой Мир'; gameMode = data.mode || 'survival';
world.clear(); data.blocks.forEach(function(b) { setBlock(b.x, b.y, b.z, b.type); });
document.getElementById('hud-world-name').innerText = worldName; spawnMobs(14); return true;
} catch (e) { return false; }
}
function generateWorld(type, radius) {
radius = Math.round(radius * 1.7); world.clear(); var seed = Math.random() * 100;
for (var x = -radius; x <= radius; x++) {
for (var z = -radius; z <= radius; z++) {
if (type === 'island' && Math.hypot(x, z) > radius * 0.85) continue;
var h = 0;
if (type === 'hills') h = Math.round(Math.sin((x + seed) * 0.35) * 1.5 + Math.cos((z + seed) * 0.35) * 1.5);
else if (type === 'island') h = Math.round(2 - Math.hypot(x, z) * 0.25);
setBlock(x, h, z, (type === 'island' && h <= 0) ? 'sand' : 'grass');
setBlock(x, h - 1, z, 'dirt'); setBlock(x, h - 2, z, 'stone');
if (type !== 'flat' && Math.abs(x) > 2 && Math.abs(z) > 2 && Math.random() < 0.025) placeTree(x, h, z);
}
}
if (type === 'flat') placeTree(-4, 0, 4);
spawnMobs(radius); player.x = 0.5; player.y = 5.5; player.z = 0.5; player.vy = 0; player.flying = false;
updateFlyUI(); saveWorld();
}
if (!loadWorld()) generateWorld('hills', 10);
function explodeTNT(tx, ty, tz) {
playSound('tnt');
for (var dx = -2; dx <= 2; dx++) for (var dy = -2; dy <= 2; dy++) for (var dz = -2; dz <= 2; dz++) if (Math.hypot(dx, dy, dz) <= 2.3) delBlock(tx + dx, ty + dy, tz + dz);
}
var joyMove = { x: 0, y: 0 }, dpadEl = document.getElementById('dpad');
var dpUp = document.getElementById('dp-up'), dpDown = document.getElementById('dp-down'), dpLeft = document.getElementById('dp-left'), dpRight = document.getElementById('dp-right'), dpUl = document.getElementById('dp-ul'), dpUr = document.getElementById('dp-ur'), dpMid = document.getElementById('dp-mid'), diagVisible = false;
function setDiagVisible(show) { diagVisible = show; dpUl.classList.toggle('hidden-diag', !show); dpUr.classList.toggle('hidden-diag', !show); }
function updateDpadFromPoints(points) {
var fwd = 0, str = 0, activeIds = {};
for (var i = 0; i < points.length; i++) {
var pt = points[i], el = document.elementFromPoint(pt.clientX, pt.clientY); if (!el) continue;
var btn = el.closest ? el.closest('.dpad-btn') : el; if (!btn || !btn.id) continue;
if (btn.id === 'dp-up') { fwd = 1; activeIds['dp-up'] = true; }
if (btn.id === 'dp-down') { fwd = -1; activeIds['dp-down'] = true; }
if (btn.id === 'dp-left') { str = 1; activeIds['dp-left'] = true; }
if (btn.id === 'dp-right') { str = -1; activeIds['dp-right'] = true; }
if (btn.id === 'dp-ul' && diagVisible) { fwd = 1; str = 0.75; activeIds['dp-ul'] = true; activeIds['dp-up'] = true; }
if (btn.id === 'dp-ur' && diagVisible) { fwd = 1; str = -0.75; activeIds['dp-ur'] = true; activeIds['dp-up'] = true; }
if (btn.id === 'dp-mid') activeIds['dp-mid'] = true;
}
[dpUp, dpDown, dpLeft, dpRight, dpUl, dpUr, dpMid].forEach(function(b) { if (b) b.classList.toggle('active', !!activeIds[b.id]); });
setDiagVisible(fwd > 0); joyMove.y = -fwd; joyMove.x = str;
}
function clearDpad() { [dpUp, dpDown, dpLeft, dpRight, dpUl, dpUr, dpMid].forEach(function(b) { if (b) b.classList.remove('active'); }); setDiagVisible(false); joyMove.x = 0; joyMove.y = 0; }
dpadEl.addEventListener('touchstart', function(e) { e.preventDefault(); e.stopPropagation(); updateDpadFromPoints(e.touches); }, { passive: false });
dpadEl.addEventListener('touchmove', function(e) { e.preventDefault(); e.stopPropagation(); updateDpadFromPoints(e.touches); }, { passive: false });
dpadEl.addEventListener('touchend', function(e) { e.preventDefault(); e.stopPropagation(); if (e.touches.length === 0) clearDpad(); else updateDpadFromPoints(e.touches); }, { passive: false });
dpadEl.addEventListener('touchcancel', clearDpad);
window.addEventListener('blur', function() { clearDpad(); camTouchId = null; });
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
for (var step = 0.2; step <= 7.5; step += 0.025) {
var px = player.x + dx * step, py = player.y + dy * step, pz = player.z + dz * step;
for (var mi = 0; mi < mobs.length; mi++) { var m = mobs[mi]; if (Math.hypot(px - m.x, pz - m.z) < 0.6 && py >= m.y && py <= m.y + 1.1) return { mob: m }; }
var rx = Math.floor(px), ry = Math.floor(py), rz = Math.floor(pz);
if (hasBlock(rx, ry, rz)) return { hit: { x: rx, y: ry, z: rz }, prev: prev };
prev = { x: rx, y: ry, z: rz };
}
return null;
}
document.getElementById('btn-break').addEventListener('touchstart', function(e) {
e.preventDefault(); e.stopPropagation(); swingAnim = 1; var res = raycast(); if (!res) return;
if (res.mob) {
res.mob.hurt = 15; res.mob.vy = 0.14; res.mob.yaw = player.yaw; res.mob.hp = (res.mob.hp || 3) - (hotbarTypes[activeSlot] === 'sword' ? 2 : 1); playSound('hit');
if (res.mob.hp <= 0) { mobs.splice(mobs.indexOf(res.mob), 1); invCounts.apple = (invCounts.apple || 0) + 1; updateHotbarUI(); }
} else if (res.hit) {
var b = getBlock(res.hit.x, res.hit.y, res.hit.z);
if (b && b.type === 'tnt') explodeTNT(res.hit.x, res.hit.y, res.hit.z);
else if (b) { if (gameMode === 'survival') { invCounts[b.type] = (invCounts[b.type] || 0) + 1; updateHotbarUI(); } delBlock(res.hit.x, res.hit.y, res.hit.z); playSound('break'); }
}
});
document.getElementById('btn-place').addEventListener('touchstart', function(e) {
e.preventDefault(); e.stopPropagation(); swingAnim = 1; var held = hotbarTypes[activeSlot];
if (held === 'apple' && gameMode === 'survival' && invCounts.apple > 0 && playerFood < 20) { invCounts.apple--; playerFood = Math.min(20, playerFood + 6); playSound('place'); updateSurvUI(); updateHotbarUI(); return; }
if (BLOCKS[held].isItem) return;
if (gameMode === 'survival' && (invCounts[held] || 0) <= 0) return;
var res = raycast();
if (res && res.prev) {
var p = res.prev, tooClose = Math.hypot(p.x + 0.5 - player.x, p.z + 0.5 - player.z) < 0.55 && Math.abs(p.y + 0.5 - (player.y - 0.8)) < 0.95;
if (!tooClose) { setBlock(p.x, p.y, p.z, held); if (gameMode === 'survival') { invCounts[held]--; updateHotbarUI(); } playSound('place'); }
}
});
var lastJumpTap = 0, flyDir = 0;
document.getElementById('btn-jump').addEventListener('touchstart', function(e) {
e.preventDefault(); e.stopPropagation(); var now = Date.now();
if (now - lastJumpTap < 300 && gameMode === 'creative') { player.flying = !player.flying; player.vy = 0; updateFlyUI(); }
else if (!player.flying && player.onGround) { player.vy = 0.18; player.onGround = false; }
lastJumpTap = now;
});
var btnFlyUp = document.getElementById('btn-fly-up'), btnFlyDown = document.getElementById('btn-fly-down');
btnFlyUp.addEventListener('touchstart', function(e) { e.preventDefault(); e.stopPropagation(); flyDir = 1; }); btnFlyUp.addEventListener('touchend', function(e) { e.stopPropagation(); flyDir = 0; });
btnFlyDown.addEventListener('touchstart', function(e) { e.preventDefault(); e.stopPropagation(); flyDir = -1; }); btnFlyDown.addEventListener('touchend', function(e) { e.stopPropagation(); flyDir = 0; });
function isSolidAt(x, y, z) { var b = getBlock(Math.floor(x), Math.floor(y), Math.floor(z)); return b && BLOCKS[b.type].solid; }
function canStandAt(nx, ny, nz) {
var r = 0.22, offsets = [{x:-r,z:-r},{x:r,z:-r},{x:-r,z:r},{x:r,z:r}];
for (var i = 0; i < 4; i++) { var cx = nx + offsets[i].x, cz = nz + offsets[i].z; if (isSolidAt(cx, ny - 1.45, cz) || isSolidAt(cx, ny - 0.25, cz)) return false; }
return true;
}
function project(x, y, z, camX, camY, camZ, yaw, pitch) {
var dx = x - camX, dy = y - camY, dz = z - camZ, cosY = Math.cos(-yaw), sinY = Math.sin(-yaw);
var x1 = dx * cosY - dz * sinY, z1 = dx * sinY + dz * cosY, cosP = Math.cos(-pitch), sinP = Math.sin(-pitch);
var y2 = dy * cosP - z1 * sinP, z2 = dy * sinP + z1 * cosP;
if (z2 <= 0.1) return null;
var fov = Math.max(canvas.width, canvas.height) * 0.55;
return { x: canvas.width / 2 + (x1 / z2) * fov, y: canvas.height / 2 - (y2 / z2) * fov, z: z2 };
}
function v(x, y, z) { return { x: x, y: y, z: z }; }
var FACES = [
{ dir: v(0, 1, 0), shade: 'top', verts: [v(0,1,0), v(1,1,0), v(1,1,1), v(0,1,1)] },
{ dir: v(0, -1, 0), shade: 'bottom', verts: [v(0,0,1), v(1,0,1), v(1,0,0), v(0,0,0)] },
{ dir: v(0, 0, 1), shade: 'side', verts: [v(0,0,1), v(0,1,1), v(1,1,1), v(1,0,1)] },
{ dir: v(0, 0, -1), shade: 'side', verts: [v(1,0,0), v(1,1,0), v(0,1,0), v(0,0,0)] },
{ dir: v(1, 0, 0), shade: 'side', verts: [v(1,0,1), v(1,1,1), v(1,1,0), v(1,0,0)] },
{ dir: v(-1, 0, 0), shade: 'side', verts: [v(0,0,0), v(0,1,0), v(0,1,1), v(0,0,1)] }
];
function getSkyColor(t) { var sh = Math.sin(t * Math.PI * 2); return sh > 0.2 ? { sky: '#87CEEB', night: false } : (sh > -0.2 ? { sky: '#E57373', night: false } : { sky: '#0D1B2A', night: true }); }
function drawHeldItem() {
if (!isPlaying || cameraMode !== 1) return;
var held = hotbarTypes[activeSlot], bobX = Math.sin(walkAnim) * 8, bobY = Math.abs(Math.cos(walkAnim)) * 8, swingX = swingAnim * -35, swingY = swingAnim * 25;
if (swingAnim > 0) swingAnim = Math.max(0, swingAnim - 0.12);
var baseX = canvas.width - 135 + bobX + swingX, baseY = canvas.height - 95 + bobY + swingY;
ctx.save();
if (held === 'hand') { ctx.fillStyle = playerSkin.shirt; ctx.fillRect(baseX+20,baseY+35,36,40); ctx.fillStyle = playerSkin.skin; ctx.fillRect(baseX+20,baseY-10,36,45); ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.strokeRect(baseX+20,baseY-10,36,85); }
else if (held === 'sword') { ctx.translate(baseX+35,baseY+30); ctx.rotate(-0.4 - swingAnim*0.8); ctx.fillStyle='#6D4C41'; ctx.fillRect(-5,10,10,26); ctx.fillStyle='#00838F'; ctx.fillRect(-16,4,32,8); ctx.fillStyle='#4DD0E1'; ctx.fillRect(-7,-52,14,56); ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.strokeRect(-7,-52,14,56); }
else if (held === 'apple') { ctx.fillStyle='#E53935'; ctx.beginPath(); ctx.arc(baseX+35,baseY+25,22,0,6.28); ctx.fill(); ctx.stroke(); ctx.fillStyle='#6D4C41'; ctx.fillRect(baseX+33,baseY-4,4,10); ctx.fillStyle='#43A047'; ctx.fillRect(baseX+37,baseY-2,10,6); }
else {
var b = BLOCKS[held];
ctx.fillStyle = b.top; ctx.beginPath(); ctx.moveTo(baseX+30,baseY-10); ctx.lineTo(baseX+65,baseY+5); ctx.lineTo(baseX+30,baseY+20); ctx.lineTo(baseX-5,baseY+5); ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.fillStyle = b.side; ctx.beginPath(); ctx.moveTo(baseX-5,baseY+5); ctx.lineTo(baseX+30,baseY+20); ctx.lineTo(baseX+30,baseY+58); ctx.lineTo(baseX-5,baseY+42); ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.fillStyle = b.bottom; ctx.beginPath(); ctx.moveTo(baseX+30,baseY+20); ctx.lineTo(baseX+65,baseY+5); ctx.lineTo(baseX+65,baseY+42); ctx.lineTo(baseX+30,baseY+58); ctx.closePath(); ctx.fill(); ctx.stroke();
}
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
for (var vi = 0; vi < 4; vi++) {
var vert = f.verts[vi], px = lx + (vert.x - 0.5) * sx, py = ly + vert.y * sy, pz = lz + (vert.z - 0.5) * sz;
var rx = m.x + px * cosY + pz * sinY, rz = m.z + pz * cosY - px * sinY;
var p = project(rx, m.y + py, rz, camX, camY, camZ, camYaw, camPitch);
if (!p) { vis = false; break; } pts.push(p); avgZ += p.z;
}
if (vis) renderList.push({ pts: pts, z: avgZ / 4, color: f.shade === 'top' ? topCol : (f.shade === 'bottom' ? '#333' : sideCol), highlight: false, thinLine: true });
}
}
function renderPlayerModel(renderList, camX, camY, camZ, camYaw, camPitch) {
if (cameraMode === 1) return;
var pObj = { x: player.x, y: player.y - player.height, z: player.z, yaw: player.yaw };
var limbSwing = Math.sin(walkAnim) * 0.14, armSwing = swingAnim > 0 ? -swingAnim * 0.4 : -limbSwing;
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
}
var menuAngle = 0.6;
function loop() {
worldTime = (worldTime + 0.00015) % 1;
var skyInfo = getSkyColor(worldTime), camX = player.x, camY = player.y, camZ = player.z, camYaw = player.yaw, camPitch = player.pitch;
if (isPlaying) {
if (hurtCooldown > 0) hurtCooldown--;
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
if (playerHP <= 0) { playerHP = 20; playerFood = 20; player.x = 0.5; player.y = 6; player.z = 0.5; updateSurvUI(); }
if (skyInfo.night && mobs.length < 10 && Math.random() < 0.008) {
var ang = Math.random() * 6.28;
mobs.push({ type: 'zombie', x: player.x + Math.cos(ang) * 12, y: player.y + 2, z: player.z + Math.sin(ang) * 12, vy: 0, yaw: 0, timer: 50, walkPhase: 0, hurt: 0, hp: 5 });
}
}
if (player.y < -15) { player.x = 0.5; player.y = 6; player.z = 0.5; player.vy = 0; }
camX = player.x; camY = player.y; camZ = player.z; camYaw = player.yaw; camPitch = player.pitch;
if (cameraMode === 3) { camX = player.x - Math.sin(player.yaw) * 3.4; camZ = player.z - Math.cos(player.yaw) * 3.4; camY = player.y + 0.5; }
else if (cameraMode === 2) { camX = player.x + Math.sin(player.yaw) * 3.4; camZ = player.z + Math.cos(player.yaw) * 3.4; camY = player.y + 0.3; camYaw = player.yaw + Math.PI; camPitch = -player.pitch * 0.5; }
} else {
menuAngle += 0.004; camX = Math.sin(menuAngle) * 11; camZ = Math.cos(menuAngle) * 11; camY = 7.5; camYaw = menuAngle + Math.PI; camPitch = -0.45;
}
ctx.fillStyle = skyInfo.sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
if (skyInfo.night) { ctx.fillStyle = '#FFFFFF'; for (var s = 0; s < 35; s++) ctx.fillRect((s * 197) % canvas.width, (s * 89) % (canvas.height * 0.5), 2, 2); }
var sunPos = project(camX + Math.cos(worldTime * 6.28) * 30, camY + Math.sin(worldTime * 6.28) * 30, camZ + 10, camX, camY, camZ, camYaw, camPitch);
if (sunPos) { ctx.fillStyle = '#FFF59D'; ctx.fillRect(sunPos.x - 14, sunPos.y - 14, 28, 28); }
var moonPos = project(camX - Math.cos(worldTime * 6.28) * 30, camY - Math.sin(worldTime * 6.28) * 30, camZ + 10, camX, camY, camZ, camYaw, camPitch);
if (moonPos) { ctx.fillStyle = '#ECEFF1'; ctx.fillRect(moonPos.x - 11, moonPos.y - 11, 22, 22); }
var target = isPlaying ? raycast() : null, renderList = [];
world.forEach(function(b) {
if (Math.hypot(b.x - camX, b.z - camZ) > renderDist) return;
var colors = BLOCKS[b.type], isTarget = target && target.hit && target.hit.x === b.x && target.hit.y === b.y && target.hit.z === b.z;
for (var fi = 0; fi < FACES.length; fi++) {
var f = FACES[fi], neighbor = getBlock(b.x + f.dir.x, b.y + f.dir.y, b.z + f.dir.z);
if (neighbor && neighbor.type !== 'glass') continue;
var cx = b.x + 0.5 + f.dir.x * 0.5 - camX, cy = b.y + 0.5 + f.dir.y * 0.5 - camY, cz = b.z + 0.5 + f.dir.z * 0.5 - camZ;
if (cx * f.dir.x + cy * f.dir.y + cz * f.dir.z >= 0) continue;
var pts = [], avgZ = 0, visible = true;
for (var vi = 0; vi < 4; vi++) {
var vert = f.verts[vi], p = project(b.x + vert.x, b.y + vert.y, b.z + vert.z, camX, camY, camZ, camYaw, camPitch);
if (!p) { visible = false; break; } pts.push(p); avgZ += p.z;
}
if (visible) renderList.push({ pts: pts, z: avgZ / 4, color: colors[f.shade], highlight: isTarget, thinLine: false });
}
});
for (var mi = 0; mi < mobs.length; mi++) {
var m = mobs[mi]; m.timer--; if (m.hurt > 0) m.hurt--;
if (m.type === 'zombie' && isPlaying && gameMode === 'survival') {
m.yaw = Math.atan2(player.x - m.x, player.z - m.z);
if (Math.hypot(player.x - m.x, player.z - m.z) < 1.1 && hurtCooldown === 0) {
playerHP = Math.max(0, playerHP - 2); hurtCooldown = 45; playSound('hit'); updateSurvUI();
}
} else if (m.timer <= 0) { m.yaw = Math.random() * 6.28; m.timer = 60 + Math.random() * 120; }
var mSpeed = m.hurt > 0 ? 0.065 : (m.type === 'zombie' ? 0.032 : 0.018); m.walkPhase += mSpeed * 8;
var nx = m.x + Math.sin(m.yaw) * mSpeed, nz = m.z + Math.cos(m.yaw) * mSpeed;
if (!isSolidAt(nx, m.y + 0.25, nz)) { m.x = nx; m.z = nz; } else if (m.vy === 0) m.vy = 0.15;
m.vy -= 0.009; m.y += m.vy;
var mFoot = Math.floor(m.y); if (isSolidAt(m.x, mFoot, m.z) && m.vy <= 0) { m.y = mFoot + 1; m.vy = 0; }
if (m.y < -15) { m.x = 0.5; m.y = 6; m.z = 0.5; }
if (Math.hypot(m.x - camX, m.z - camZ) <= renderDist) renderMob(renderList, m, camX, camY, camZ, camYaw, camPitch);
}
renderPlayerModel(renderList, camX, camY, camZ, camYaw, camPitch);
renderList.sort(function(a, b) { return b.z - a.z; });
for (var ri = 0; ri < renderList.length; ri++) {
var item = renderList[ri], first = item.pts.slice(0, 1).pop();
ctx.beginPath(); ctx.moveTo(first.x, first.y);
for (var i = 1; i < 4; i++) ctx.lineTo(item.pts[i].x, item.pts[i].y);
ctx.closePath(); ctx.fillStyle = item.color; ctx.fill();
ctx.strokeStyle = item.highlight ? '#FFFFFF' : 'rgba(0,0,0,0.2)'; ctx.lineWidth = item.highlight ? 2.5 : (item.thinLine ? 0.6 : 1); ctx.stroke();
}
if (skyInfo.night) { ctx.fillStyle = 'rgba(10, 15, 35, 0.38)'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
drawHeldItem();
requestAnimationFrame(loop);
}
loop();