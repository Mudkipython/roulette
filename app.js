import { RouletteScene } from './src/roulette3d.js';

'use strict';

const EUROPEAN_ORDER = ['0','32','15','19','4','21','2','25','17','34','6','27','13','36','11','30','8','23','10','5','24','16','33','1','20','14','31','9','22','18','29','7','28','12','35','3','26'];
const AMERICAN_ORDER = ['0','28','9','26','30','11','7','20','32','17','5','22','34','15','3','24','36','13','1','00','27','10','25','29','12','8','19','31','18','6','21','33','16','4','23','35','14','2'];
const RED_NUMBERS = new Set(['1','3','5','7','9','12','14','16','18','19','21','23','25','27','30','32','34','36']);

const translations = {
  zh: {
    locale: 'zh-CN', currency: '¥',
    eyebrow:'交互式概率教育工具', title:'轮盘实验室：为什么赌场长期占优', learnMore:'知识点', educationalOnly:'仅供概率教育，不提供真钱赌博',
    heroTitle:'你可能短期赢钱，但规则保证赌场长期盈利。', heroBody:'亲自旋转轮盘或批量模拟数千局，观察随机波动如何围绕负数学期望展开。',
    coreFormulaLabel:'长期预计损失', coreFormula:'总投注流水 × 赌场优势', euLabel:'欧式轮盘', usLabel:'美式轮盘', bankerLabel:'百家庄押庄', blackjackLabel:'21点基本策略',
    stepOne:'步骤 1', configureBet:'设置下注', reset:'重置', wheelType:'轮盘类型', european:'欧式单零（37格）', american:'美式双零（38格）', startingBankroll:'初始资金', betAmount:'每局下注', betType:'下注类型', chooseNumber:'选择号码',
    interactiveBet:'交互下注台', betTable:'点击号码或外围下注', betTableHint:'也可以直接点击3D轮盘上的号码选择单号下注。', cinematicCamera:'追随镜头', soundEffects:'声音效果', dragHint:'拖动旋转视角 · 滚轮缩放 · 点击号码下注', wonBanner:'本局获胜', lostBanner:'本局落败', winProbability:'中奖概率', payout:'净赔率', houseEdge:'赌场优势', expectedLossBet:'每注预计损失', spin:'发球', batchRun:'批量模拟', batchSize:'批量局数',
    stepTwo:'步骤 2', observeResult:'观察结果', lastResult:'最近结果', win:'赢', loss:'输', push:'和局', noResult:'尚无结果',
    stepThree:'步骤 3', compareReality:'比较实际波动与理论损失', varianceNote:'短期结果可能偏离理论值；局数越多，赌场优势越容易显现。',
    bankroll:'当前资金', spins:'完成局数', totalWagered:'累计流水', actualProfit:'实际盈亏', expectedProfit:'理论期望盈亏', observedReturn:'实际返还率', actualLine:'实际累计盈亏', expectedLine:'理论期望盈亏',
    knowledgeKicker:'关键知识点', knowledgeTitle:'为什么策略无法消除赌场优势', turnoverTitle:'真正决定损失的是流水', turnoverBody:'带着100元并不代表最多只下注100元。同一笔钱赢回后再次下注，会形成数倍甚至数十倍流水。', example:'例',
    fallacyTitle:'连续出红，不会让黑“该出了”', fallacyBody:'独立轮盘的下一局概率不会被之前结果改变。寻找“冷热号”只是把随机波动误认为规律。',
    martingaleTitle:'翻倍下注不能改变数学期望', martingaleBody:'马丁格尔策略把许多小赢换成一次巨大亏损。连续6次失利后，10元起注累计需要630元。',
    varianceTitle:'短期赢钱不证明系统有效', varianceBody:'负期望游戏仍会产生赢家；问题在于重复足够多次后，平均结果会向负期望靠拢。',
    comparisonKicker:'典型比较', comparisonTitle:'每下注100元的长期平均损失', game:'项目', conditions:'条件', typicalEdge:'典型赌场优势', lossPerHundred:'每100元预计损失', blackjack:'21点', blackjackCondition:'良好规则＋严格基本策略', baccarat:'百家庄', baccaratCondition:'只押庄，标准5%佣金', frenchRoulette:'法式轮盘', europeanRoulette:'欧式轮盘', americanRoulette:'美式轮盘', singleZero:'单零', doubleZero:'双零', comparisonNote:'这些是常见规则下的近似值；具体桌面规则、下注速度和错误决策会改变实际损失。',
    responsibleKicker:'负责任娱乐', responsibleTitle:'最有效的“策略”是限制金额和时间。', responsibleOne:'只使用可以完全损失的娱乐预算。', responsibleTwo:'不要追损，不借钱，不把赌博当作收入来源。', responsibleThree:'预先设定停止时间和损失上限。', footerText:'Roulette Lab 是开源教育演示。所有模拟均在本地浏览器中运行，不收集数据。', rngNote:'随机数来源：',
    betRed:'红色', betBlack:'黑色', betOdd:'奇数', betEven:'偶数', betLow:'小（1–18）', betHigh:'大（19–36）', betDozen1:'第一打（1–12）', betDozen2:'第二打（13–24）', betDozen3:'第三打（25–36）', betColumn1:'第一列', betColumn2:'第二列', betColumn3:'第三列', betStraight:'单个号码',
    insufficient:'资金不足，无法继续下注。请降低下注额或重置。', invalidInput:'请输入有效的初始资金和下注金额。', batchDone:'批量模拟完成。', batchStopped:'资金不足，模拟提前停止。', spinning:'轮盘旋转中…', resetDone:'模拟已重置。'
  },
  en: {
    locale: 'en-CA', currency: '$',
    eyebrow:'Interactive probability education', title:'Roulette Lab: Why the House Wins', learnMore:'Key ideas', educationalOnly:'Educational simulation only — no real-money gambling',
    heroTitle:'You can win in the short run. The rules make the house win in the long run.', heroBody:'Spin once or simulate thousands of rounds to see random variance orbit a negative expected value.',
    coreFormulaLabel:'Long-run expected loss', coreFormula:'Total amount wagered × house edge', euLabel:'European roulette', usLabel:'American roulette', bankerLabel:'Baccarat — Banker', blackjackLabel:'Blackjack basic strategy',
    stepOne:'Step 1', configureBet:'Configure a bet', reset:'Reset', wheelType:'Wheel type', european:'European single-zero (37)', american:'American double-zero (38)', startingBankroll:'Starting bankroll', betAmount:'Bet per spin', betType:'Bet type', chooseNumber:'Choose a number',
    interactiveBet:'Interactive betting table', betTable:'Click a number or outside bet', betTableHint:'You can also click a number directly on the 3D wheel.', cinematicCamera:'Cinematic follow camera', soundEffects:'Sound effects', dragHint:'Drag to orbit · Scroll to zoom · Click a pocket to bet', wonBanner:'Round won', lostBanner:'Round lost', winProbability:'Win probability', payout:'Net payout', houseEdge:'House edge', expectedLossBet:'Expected loss per bet', spin:'Launch ball', batchRun:'Run batch', batchSize:'Batch size',
    stepTwo:'Step 2', observeResult:'Observe the result', lastResult:'Latest result', win:'Win', loss:'Loss', push:'Push', noResult:'No result yet',
    stepThree:'Step 3', compareReality:'Compare variance with expected loss', varianceNote:'Short-run results can deviate sharply; the house edge becomes clearer as wagers accumulate.',
    bankroll:'Current bankroll', spins:'Spins completed', totalWagered:'Total wagered', actualProfit:'Actual profit/loss', expectedProfit:'Expected profit/loss', observedReturn:'Observed return', actualLine:'Actual cumulative P/L', expectedLine:'Expected cumulative P/L',
    knowledgeKicker:'Key concepts', knowledgeTitle:'Why betting systems cannot remove the house edge', turnoverTitle:'Turnover drives expected loss', turnoverBody:'Bringing 100 does not mean you only wager 100. Re-betting returned money can create many times your starting bankroll in turnover.', example:'Example',
    fallacyTitle:'A red streak does not make black “due”', fallacyBody:'On an independent wheel, previous outcomes do not change the next spin. Hot and cold numbers are random variation dressed as a pattern.',
    martingaleTitle:'Doubling does not change expected value', martingaleBody:'Martingale converts many small wins into one very large loss. After six losses, a 10-unit base bet requires 630 units in total.',
    varianceTitle:'A short-term win proves nothing', varianceBody:'Negative-expectation games still produce winners. With repetition, average results tend to move toward the negative expectation.',
    comparisonKicker:'Typical comparison', comparisonTitle:'Long-run average loss per 100 wagered', game:'Game', conditions:'Conditions', typicalEdge:'Typical house edge', lossPerHundred:'Expected loss per 100', blackjack:'Blackjack', blackjackCondition:'Good rules + strict basic strategy', baccarat:'Baccarat', baccaratCondition:'Banker only, standard 5% commission', frenchRoulette:'French roulette', europeanRoulette:'European roulette', americanRoulette:'American roulette', singleZero:'Single zero', doubleZero:'Double zero', comparisonNote:'Approximate values under common rules. Table rules, betting speed, and decision errors change actual losses.',
    responsibleKicker:'Responsible play', responsibleTitle:'The most effective “strategy” is limiting money and time.', responsibleOne:'Use only an entertainment budget you can lose completely.', responsibleTwo:'Do not chase losses, borrow, or treat gambling as income.', responsibleThree:'Set a stop time and loss limit before starting.', footerText:'Roulette Lab is an open educational demo. Simulations run locally in your browser and collect no data.', rngNote:'Randomness source:',
    betRed:'Red', betBlack:'Black', betOdd:'Odd', betEven:'Even', betLow:'Low (1–18)', betHigh:'High (19–36)', betDozen1:'1st dozen (1–12)', betDozen2:'2nd dozen (13–24)', betDozen3:'3rd dozen (25–36)', betColumn1:'1st column', betColumn2:'2nd column', betColumn3:'3rd column', betStraight:'Straight-up number',
    insufficient:'Not enough bankroll for another bet. Lower the bet or reset.', invalidInput:'Enter a valid starting bankroll and bet amount.', batchDone:'Batch simulation complete.', batchStopped:'Simulation stopped early because the bankroll was exhausted.', spinning:'Wheel spinning…', resetDone:'Simulation reset.'
  },
  fr: {
    locale: 'fr-CA', currency: '$',
    eyebrow:'Outil interactif de probabilités', title:'Laboratoire de roulette : pourquoi la maison gagne', learnMore:'Notions clés', educationalOnly:'Simulation éducative seulement — aucun jeu d’argent réel',
    heroTitle:'On peut gagner à court terme. Les règles font gagner la maison à long terme.', heroBody:'Lancez une partie ou simulez des milliers de tours pour voir la variance aléatoire autour d’une espérance négative.',
    coreFormulaLabel:'Perte prévue à long terme', coreFormula:'Mises totales × avantage de la maison', euLabel:'Roulette européenne', usLabel:'Roulette américaine', bankerLabel:'Baccara — Banque', blackjackLabel:'Blackjack stratégie de base',
    stepOne:'Étape 1', configureBet:'Configurer la mise', reset:'Réinitialiser', wheelType:'Type de roulette', european:'Européenne à un zéro (37)', american:'Américaine à deux zéros (38)', startingBankroll:'Capital initial', betAmount:'Mise par tour', betType:'Type de mise', chooseNumber:'Choisir un numéro',
    interactiveBet:'Table de mise interactive', betTable:'Cliquez un numéro ou une mise extérieure', betTableHint:'Vous pouvez aussi cliquer directement sur un numéro de la roulette 3D.', cinematicCamera:'Caméra de suivi', soundEffects:'Effets sonores', dragHint:'Glisser pour tourner · Molette pour zoomer · Cliquer pour miser', wonBanner:'Manche gagnée', lostBanner:'Manche perdue', winProbability:'Probabilité de gain', payout:'Gain net', houseEdge:'Avantage maison', expectedLossBet:'Perte prévue par mise', spin:'Lancer la bille', batchRun:'Simulation en lot', batchSize:'Nombre de tours',
    stepTwo:'Étape 2', observeResult:'Observer le résultat', lastResult:'Dernier résultat', win:'Gagné', loss:'Perdu', push:'Égalité', noResult:'Aucun résultat',
    stepThree:'Étape 3', compareReality:'Comparer la variance à la perte prévue', varianceNote:'Les résultats à court terme peuvent s’écarter fortement; l’avantage maison devient plus visible avec le volume de mises.',
    bankroll:'Capital actuel', spins:'Tours effectués', totalWagered:'Total misé', actualProfit:'Gain/perte réel', expectedProfit:'Gain/perte prévu', observedReturn:'Taux de retour observé', actualLine:'Gain/perte cumulé réel', expectedLine:'Gain/perte cumulé prévu',
    knowledgeKicker:'Notions clés', knowledgeTitle:'Pourquoi les systèmes de mise n’annulent pas l’avantage maison', turnoverTitle:'Le volume de mises détermine la perte', turnoverBody:'Arriver avec 100 ne signifie pas miser seulement 100. Rejouer les gains peut créer un volume plusieurs fois supérieur au capital initial.', example:'Exemple',
    fallacyTitle:'Une série rouge ne rend pas le noir « dû »', fallacyBody:'Sur une roulette indépendante, les résultats précédents ne changent pas le prochain tour. Les numéros chauds ou froids sont de la variance prise pour un motif.',
    martingaleTitle:'Doubler ne change pas l’espérance', martingaleBody:'La martingale transforme beaucoup de petits gains en une très grosse perte. Après six pertes, une mise de base de 10 exige 630 au total.',
    varianceTitle:'Un gain à court terme ne prouve rien', varianceBody:'Un jeu à espérance négative produit quand même des gagnants. Avec la répétition, la moyenne tend vers l’espérance négative.',
    comparisonKicker:'Comparaison typique', comparisonTitle:'Perte moyenne à long terme par 100 misés', game:'Jeu', conditions:'Conditions', typicalEdge:'Avantage maison typique', lossPerHundred:'Perte prévue par 100', blackjack:'Blackjack', blackjackCondition:'Bonnes règles + stratégie de base stricte', baccarat:'Baccara', baccaratCondition:'Banque seulement, commission standard de 5 %', frenchRoulette:'Roulette française', europeanRoulette:'Roulette européenne', americanRoulette:'Roulette américaine', singleZero:'Un zéro', doubleZero:'Deux zéros', comparisonNote:'Valeurs approximatives selon des règles courantes. Les règles, la vitesse de jeu et les erreurs modifient la perte réelle.',
    responsibleKicker:'Jeu responsable', responsibleTitle:'La meilleure « stratégie » est de limiter l’argent et le temps.', responsibleOne:'N’utilisez qu’un budget de loisir que vous pouvez perdre entièrement.', responsibleTwo:'Ne poursuivez pas les pertes, n’empruntez pas et ne traitez pas le jeu comme un revenu.', responsibleThree:'Fixez une heure d’arrêt et une limite de perte avant de commencer.', footerText:'Roulette Lab est une démonstration éducative ouverte. Les simulations s’exécutent localement et ne collectent aucune donnée.', rngNote:'Source aléatoire :',
    betRed:'Rouge', betBlack:'Noir', betOdd:'Impair', betEven:'Pair', betLow:'Manque (1–18)', betHigh:'Passe (19–36)', betDozen1:'1re douzaine (1–12)', betDozen2:'2e douzaine (13–24)', betDozen3:'3e douzaine (25–36)', betColumn1:'1re colonne', betColumn2:'2e colonne', betColumn3:'3e colonne', betStraight:'Plein (un numéro)',
    insufficient:'Capital insuffisant pour une autre mise. Réduisez la mise ou réinitialisez.', invalidInput:'Entrez un capital initial et une mise valides.', batchDone:'Simulation en lot terminée.', batchStopped:'Simulation arrêtée : capital épuisé.', spinning:'La roulette tourne…', resetDone:'Simulation réinitialisée.'
  }
};

const BETS = {
  red: { label:'betRed', payout:1, match:n => RED_NUMBERS.has(n) },
  black: { label:'betBlack', payout:1, match:n => n !== '0' && n !== '00' && !RED_NUMBERS.has(n) },
  odd: { label:'betOdd', payout:1, match:n => Number(n) >= 1 && Number(n) % 2 === 1 },
  even: { label:'betEven', payout:1, match:n => Number(n) >= 1 && Number(n) % 2 === 0 },
  low: { label:'betLow', payout:1, match:n => Number(n) >= 1 && Number(n) <= 18 },
  high: { label:'betHigh', payout:1, match:n => Number(n) >= 19 && Number(n) <= 36 },
  dozen1: { label:'betDozen1', payout:2, match:n => Number(n) >= 1 && Number(n) <= 12 },
  dozen2: { label:'betDozen2', payout:2, match:n => Number(n) >= 13 && Number(n) <= 24 },
  dozen3: { label:'betDozen3', payout:2, match:n => Number(n) >= 25 && Number(n) <= 36 },
  column1: { label:'betColumn1', payout:2, match:n => Number(n) >= 1 && (Number(n)-1) % 3 === 0 },
  column2: { label:'betColumn2', payout:2, match:n => Number(n) >= 1 && (Number(n)-2) % 3 === 0 },
  column3: { label:'betColumn3', payout:2, match:n => Number(n) >= 1 && Number(n) % 3 === 0 },
  straight: { label:'betStraight', payout:35, match:(n, selected) => n === selected }
};

const els = Object.fromEntries([...document.querySelectorAll('[id]')].map(el => [el.id, el]));
const wheelCtx = els.wheelCanvas.getContext('2d');
const chartCtx = els.profitChart.getContext('2d');
let lang = localStorage.getItem('rouletteLabLanguage') || 'zh';
let wheelRotation = 0;
let spinning = false;
let state = freshState();
let rouletteScene = null;

function freshState() {
  const starting = Number(els.startingBankroll?.value || 1000);
  return { startingBankroll: starting, bankroll: starting, spins:0, wagered:0, returned:0, history:[], chart:[{x:0, actual:0, expected:0}] };
}

function t(key) { return translations[lang][key] ?? key; }
function currentOrder() { return els.wheelType.value === 'american' ? AMERICAN_ORDER : EUROPEAN_ORDER; }
function pockets() { return currentOrder().length; }
function houseEdge() { return els.wheelType.value === 'american' ? 2/38 : 1/37; }
function colorOf(n) { return (n === '0' || n === '00') ? 'green' : (RED_NUMBERS.has(n) ? 'red' : 'black'); }
function betInfo() { return BETS[els.betType.value] || BETS.red; }

function secureRandomInt(max) {
  if (!Number.isInteger(max) || max <= 0) throw new Error('Invalid max');
  const maxUint = 0x100000000;
  const limit = maxUint - (maxUint % max);
  const arr = new Uint32Array(1);
  let x;
  do { crypto.getRandomValues(arr); x = arr[0]; } while (x >= limit);
  return x % max;
}

function formatMoney(value) {
  const locale = translations[lang].locale;
  const currency = lang === 'zh' ? 'CNY' : 'CAD';
  return new Intl.NumberFormat(locale, { style:'currency', currency, maximumFractionDigits:2 }).format(value);
}
function formatPercent(value, digits=2) { return new Intl.NumberFormat(translations[lang].locale, { style:'percent', maximumFractionDigits:digits }).format(value); }
function formatNumber(value) { return new Intl.NumberFormat(translations[lang].locale).format(value); }

function applyLanguage() {
  document.documentElement.lang = translations[lang].locale;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (translations[lang][key]) el.textContent = translations[lang][key];
  });
  buildBetOptions();
  updateNumberOptions();
  buildBetBoard();
  updateBetSummary();
  updateMetrics();
  renderHistory();
  updateLastResult();
  drawWheel();
  drawChart();
  localStorage.setItem('rouletteLabLanguage', lang);
}

function buildBetOptions() {
  const selected = els.betType.value || 'red';
  els.betType.innerHTML = '';
  Object.entries(BETS).forEach(([value, cfg]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = t(cfg.label);
    els.betType.append(option);
  });
  els.betType.value = BETS[selected] ? selected : 'red';
}

function setBetSelection(type, number = null) {
  if (!BETS[type]) return;
  els.betType.value = type;
  if (type === 'straight' && number !== null) {
    els.straightNumber.value = String(number);
  }
  updateNumberOptions();
  updateBetSummary();
  buildBetBoard();
}

function makeBetButton({ label, type, number = null, className = '' }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `table-bet ${className}`.trim();
  button.textContent = label;
  button.dataset.betType = type;
  if (number !== null) button.dataset.number = String(number);
  const isSelected = type === els.betType.value && (type !== 'straight' || String(number) === els.straightNumber.value);
  button.classList.toggle('is-selected', isSelected);
  button.addEventListener('click', () => setBetSelection(type, number));
  return button;
}

function buildBetBoard() {
  if (!els.betBoard) return;
  els.betBoard.innerHTML = '';
  const zeroRail = document.createElement('div');
  zeroRail.className = 'zero-rail';
  zeroRail.append(makeBetButton({ label:'0', type:'straight', number:'0', className:'number-bet number-green' }));
  if (els.wheelType.value === 'american') zeroRail.append(makeBetButton({ label:'00', type:'straight', number:'00', className:'number-bet number-green' }));

  const numberGrid = document.createElement('div');
  numberGrid.className = 'number-bet-grid';
  for (let row = 0; row < 12; row++) {
    for (let col = 1; col <= 3; col++) {
      const number = String(row * 3 + col);
      numberGrid.append(makeBetButton({
        label:number,
        type:'straight',
        number,
        className:`number-bet number-${colorOf(number)}`
      }));
    }
  }

  const dozens = document.createElement('div');
  dozens.className = 'dozen-row';
  ['dozen1','dozen2','dozen3'].forEach(type => dozens.append(makeBetButton({ label:t(BETS[type].label), type, className:'outside-bet' })));

  const outside = document.createElement('div');
  outside.className = 'outside-row';
  [
    ['low','1–18',''], ['even',t('betEven'),''], ['red',t('betRed'),'bet-red'],
    ['black',t('betBlack'),'bet-black'], ['odd',t('betOdd'),''], ['high','19–36','']
  ].forEach(([type,label,cls]) => outside.append(makeBetButton({ label, type, className:`outside-bet ${cls}` })));

  const columns = document.createElement('div');
  columns.className = 'column-row';
  ['column1','column2','column3'].forEach(type => columns.append(makeBetButton({ label:t(BETS[type].label), type, className:'outside-bet' })));

  const layout = document.createElement('div');
  layout.className = 'bet-board-main';
  layout.append(zeroRail, numberGrid);
  els.betBoard.append(layout, dozens, outside, columns);
}

function updateNumberOptions() {
  const previous = els.straightNumber.value || '17';
  els.straightNumber.innerHTML = '';
  const nums = els.wheelType.value === 'american' ? ['0','00', ...Array.from({length:36},(_,i)=>String(i+1))] : ['0', ...Array.from({length:36},(_,i)=>String(i+1))];
  nums.forEach(n => {
    const option = document.createElement('option');
    option.value = n;
    option.textContent = n;
    els.straightNumber.append(option);
  });
  els.straightNumber.value = nums.includes(previous) ? previous : '17';
  els.numberField.classList.toggle('is-hidden', els.betType.value !== 'straight');
}

function coveredCount() {
  const bet = betInfo();
  const selected = els.straightNumber.value;
  return currentOrder().filter(n => bet.match(n, selected)).length;
}

function updateBetSummary() {
  const bet = betInfo();
  const count = coveredCount();
  const probability = count / pockets();
  const wager = Math.max(0, Number(els.betAmount.value) || 0);
  els.probabilityValue.textContent = `${formatPercent(probability, 3)} (${count}/${pockets()})`;
  els.payoutValue.textContent = `${bet.payout}:1`;
  els.edgeValue.textContent = formatPercent(houseEdge(), 2);
  els.expectedLossValue.textContent = formatMoney(wager * houseEdge());
}

function drawWheel(rotation = wheelRotation) {
  const canvas = els.wheelCanvas;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssSize = Math.max(300, canvas.getBoundingClientRect().width || 610);
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  wheelCtx.setTransform(dpr,0,0,dpr,0,0);
  const size = cssSize;
  const cx = size/2, cy = size/2;
  const outer = size*.46;
  const inner = size*.29;
  const hub = size*.09;
  const order = currentOrder();
  const arc = Math.PI*2/order.length;

  wheelCtx.clearRect(0,0,size,size);
  wheelCtx.save();
  wheelCtx.translate(cx,cy);

  const outerGrad = wheelCtx.createRadialGradient(0,0,inner,0,0,outer*1.08);
  outerGrad.addColorStop(0,'#173154');
  outerGrad.addColorStop(.7,'#0a1526');
  outerGrad.addColorStop(1,'#050a12');
  wheelCtx.beginPath(); wheelCtx.arc(0,0,outer*1.08,0,Math.PI*2); wheelCtx.fillStyle=outerGrad; wheelCtx.fill();
  wheelCtx.lineWidth = size*.018; wheelCtx.strokeStyle='#d9aa4f'; wheelCtx.stroke();

  for (let i=0;i<order.length;i++) {
    const start = -Math.PI/2 - arc/2 + i*arc + rotation;
    const end = start + arc;
    const n = order[i];
    const c = colorOf(n);
    wheelCtx.beginPath();
    wheelCtx.arc(0,0,outer,start,end);
    wheelCtx.arc(0,0,inner,end,start,true);
    wheelCtx.closePath();
    wheelCtx.fillStyle = c==='red' ? '#c93643' : c==='black' ? '#151e2a' : '#159a68';
    wheelCtx.fill();
    wheelCtx.strokeStyle='rgba(255,255,255,.24)'; wheelCtx.lineWidth=1; wheelCtx.stroke();

    wheelCtx.save();
    wheelCtx.rotate(start + arc/2);
    wheelCtx.translate((outer+inner)/2,0);
    wheelCtx.rotate(Math.PI/2);
    wheelCtx.fillStyle='#fff';
    wheelCtx.font=`800 ${Math.max(9,size*.018)}px system-ui`;
    wheelCtx.textAlign='center'; wheelCtx.textBaseline='middle';
    wheelCtx.fillText(n,0,0);
    wheelCtx.restore();
  }

  wheelCtx.beginPath(); wheelCtx.arc(0,0,inner*.98,0,Math.PI*2); wheelCtx.fillStyle='#11243e'; wheelCtx.fill();
  wheelCtx.strokeStyle='#d9aa4f'; wheelCtx.lineWidth=size*.012; wheelCtx.stroke();

  for (let i=0;i<12;i++) {
    const a=i*Math.PI/6+rotation*.22;
    wheelCtx.beginPath(); wheelCtx.moveTo(Math.cos(a)*hub,Math.sin(a)*hub); wheelCtx.lineTo(Math.cos(a)*inner*.91,Math.sin(a)*inner*.91);
    wheelCtx.strokeStyle='rgba(122,167,255,.18)'; wheelCtx.lineWidth=2; wheelCtx.stroke();
  }
  const hubGrad = wheelCtx.createRadialGradient(-hub*.25,-hub*.25,hub*.1,0,0,hub);
  hubGrad.addColorStop(0,'#fff2bd'); hubGrad.addColorStop(.35,'#e2b85f'); hubGrad.addColorStop(1,'#8e5a18');
  wheelCtx.beginPath(); wheelCtx.arc(0,0,hub,0,Math.PI*2); wheelCtx.fillStyle=hubGrad; wheelCtx.fill();
  wheelCtx.lineWidth=3; wheelCtx.strokeStyle='#ffd983'; wheelCtx.stroke();
  wheelCtx.fillStyle='#07101d'; wheelCtx.font=`900 ${size*.045}px system-ui`; wheelCtx.textAlign='center'; wheelCtx.textBaseline='middle'; wheelCtx.fillText('R',0,2);
  wheelCtx.restore();
}

function drawChart() {
  const canvas = els.profitChart;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(320, canvas.getBoundingClientRect().width || 1000);
  const height = Math.max(220, canvas.getBoundingClientRect().height || 290);
  canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
  chartCtx.setTransform(dpr,0,0,dpr,0,0);
  chartCtx.clearRect(0,0,width,height);
  const pad={l:58,r:18,t:16,b:34};
  const points = downsample(state.chart, 700);
  const values = points.flatMap(p=>[p.actual,p.expected,0]);
  let min=Math.min(...values), max=Math.max(...values);
  if (min===max) { min-=1; max+=1; }
  const margin=(max-min)*.12 || 1; min-=margin; max+=margin;
  const maxX=Math.max(1,points.at(-1)?.x || 1);
  const x=v=>pad.l+(v/maxX)*(width-pad.l-pad.r);
  const y=v=>pad.t+(max-v)/(max-min)*(height-pad.t-pad.b);

  chartCtx.strokeStyle='rgba(255,255,255,.09)'; chartCtx.lineWidth=1;
  chartCtx.fillStyle='rgba(159,176,200,.75)'; chartCtx.font='12px system-ui'; chartCtx.textAlign='right'; chartCtx.textBaseline='middle';
  for(let i=0;i<=4;i++){
    const val=min+(max-min)*i/4; const yy=y(val);
    chartCtx.beginPath(); chartCtx.moveTo(pad.l,yy); chartCtx.lineTo(width-pad.r,yy); chartCtx.stroke();
    chartCtx.fillText(formatMoney(val),pad.l-8,yy);
  }
  chartCtx.textAlign='center'; chartCtx.textBaseline='top';
  for(let i=0;i<=4;i++){
    const val=Math.round(maxX*i/4); const xx=x(val);
    chartCtx.fillText(formatNumber(val),xx,height-pad.b+9);
  }
  const css = getComputedStyle(document.documentElement);
  drawSeries(points,'actual',css.getPropertyValue('--accent-2').trim(),2.6,x,y);
  drawSeries(points,'expected',css.getPropertyValue('--danger').trim(),2,x,y,[7,6]);
}
function drawSeries(points,key,color,lineWidth,x,y,dash=[]) {
  chartCtx.save(); chartCtx.beginPath();
  points.forEach((p,i)=>{ const xx=x(p.x), yy=y(p[key]); i?chartCtx.lineTo(xx,yy):chartCtx.moveTo(xx,yy); });
  chartCtx.strokeStyle=color; chartCtx.lineWidth=lineWidth; chartCtx.setLineDash(dash); chartCtx.stroke(); chartCtx.restore();
}
function downsample(arr,maxPoints){ if(arr.length<=maxPoints) return arr; const step=(arr.length-1)/(maxPoints-1); return Array.from({length:maxPoints},(_,i)=>arr[Math.round(i*step)]); }

function validateInputs() {
  const start = Number(els.startingBankroll.value);
  const bet = Number(els.betAmount.value);
  if (!Number.isFinite(start) || start <= 0 || !Number.isFinite(bet) || bet <= 0) {
    setStatus(t('invalidInput')); return false;
  }
  return true;
}

function settle(result) {
  const wager = Number(els.betAmount.value);
  const bet = betInfo();
  const selected = els.straightNumber.value;
  const won = bet.match(result, selected);
  state.spins += 1;
  state.wagered += wager;
  state.bankroll -= wager;
  let returned = 0;
  if (won) { returned = wager * (bet.payout + 1); state.bankroll += returned; }
  state.returned += returned;
  const actual = state.bankroll - state.startingBankroll;
  const expected = -state.wagered * houseEdge();
  state.history.unshift({result,won});
  state.history = state.history.slice(0,12);
  state.chart.push({x:state.spins,actual,expected});
  return won;
}

function randomResult() { const order=currentOrder(); return order[secureRandomInt(order.length)]; }

function animateToResult(result) {
  if (rouletteScene?.ready) return rouletteScene.spinTo(result);
  const order=currentOrder();
  const idx=order.indexOf(result);
  const arc=Math.PI*2/order.length;
  const currentNorm=((wheelRotation%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
  const desired=(((-idx*arc)%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
  let delta=desired-currentNorm;
  if(delta<0) delta+=Math.PI*2;
  const total=delta+Math.PI*2*6;
  const start=wheelRotation;
  const duration=2200;
  const startTime=performance.now();
  return new Promise(resolve=>{
    function frame(now){
      const p=Math.min(1,(now-startTime)/duration);
      const eased=1-Math.pow(1-p,4);
      wheelRotation=start+total*eased;
      drawWheel(wheelRotation);
      if(p<1) requestAnimationFrame(frame); else { wheelRotation=desired; drawWheel(); resolve(); }
    }
    requestAnimationFrame(frame);
  });
}

async function spinOnce() {
  if (spinning || !validateInputs()) return;
  if (state.spins===0 && state.startingBankroll !== Number(els.startingBankroll.value)) resetSimulation(false);
  const bet=Number(els.betAmount.value);
  if(state.bankroll<bet){ setStatus(t('insufficient')); return; }
  spinning=true; toggleButtons(true); setStatus(t('spinning'));
  const result=randomResult();
  await animateToResult(result);
  const won=settle(result);
  updateAll(result,won);
  if (rouletteScene?.ready) await rouletteScene.resolveResult(won, result);
  setStatus('');
  spinning=false; toggleButtons(false);
}

function runBatch() {
  if (spinning || !validateInputs()) return;
  if (state.spins===0 && state.startingBankroll !== Number(els.startingBankroll.value)) resetSimulation(false);
  const count=Number(els.batchSize.value);
  const bet=Number(els.betAmount.value);
  let last=null, won=false, completed=0;
  spinning=true; toggleButtons(true); setStatus(t('spinning'));
  requestAnimationFrame(()=>{
    for(let i=0;i<count;i++){
      if(state.bankroll<bet) break;
      last=randomResult(); won=settle(last); completed++;
    }
    if(last){
      const idx=currentOrder().indexOf(last); wheelRotation=-idx*(Math.PI*2/currentOrder().length); drawWheel();
      rouletteScene?.setResult(last);
      updateAll(last,won);
    }
    setStatus(completed<count ? t('batchStopped') : t('batchDone'));
    spinning=false; toggleButtons(false);
  });
}

function updateAll(result, won) {
  updateResult(result,won); renderHistory(); updateMetrics(); drawChart();
}
function updateResult(result,won) {
  const c=colorOf(result);
  els.resultBadge.textContent=result;
  els.resultBadge.className=`result-badge result-${c}`;
  els.lastResultText.textContent=result;
  els.lastOutcomeText.textContent=won?t('win'):t('loss');
  els.lastOutcomeText.className=won?'outcome-win':'outcome-loss';
  if (els.cinematicResult) {
    els.cinematicResultLabel.textContent = won ? t('wonBanner') : t('lostBanner');
    els.cinematicResultNumber.textContent = result;
    els.cinematicResult.className = `cinematic-result is-visible ${won ? 'is-win' : 'is-loss'}`;
    window.clearTimeout(updateResult.overlayTimer);
    updateResult.overlayTimer = window.setTimeout(() => { els.cinematicResult.className = 'cinematic-result'; }, 1900);
  }
}
function updateLastResult() {
  if(!state.history.length){ els.lastResultText.textContent='—'; els.lastOutcomeText.textContent=t('noResult'); els.lastOutcomeText.className=''; return; }
  const h=state.history[0]; updateResult(h.result,h.won);
}
function renderHistory() {
  els.historyStrip.innerHTML='';
  state.history.forEach(h=>{
    const span=document.createElement('span'); span.className=`history-chip result-${colorOf(h.result)}`; span.textContent=h.result; span.title=h.won?t('win'):t('loss'); els.historyStrip.append(span);
  });
}
function updateMetrics() {
  const profit=state.bankroll-state.startingBankroll;
  const expected=-state.wagered*houseEdge();
  const rtp=state.wagered?state.returned/state.wagered:null;
  els.bankrollMetric.textContent=formatMoney(state.bankroll);
  els.spinsMetric.textContent=formatNumber(state.spins);
  els.wageredMetric.textContent=formatMoney(state.wagered);
  els.profitMetric.textContent=formatMoney(profit);
  els.profitMetric.className=profit>0?'outcome-win':profit<0?'outcome-loss':'';
  els.expectedMetric.textContent=formatMoney(expected);
  els.expectedMetric.className='outcome-loss';
  els.returnMetric.textContent=rtp===null?'—':formatPercent(rtp,2);
}
function resetSimulation(showMessage=true) {
  if(!validateInputs()) return;
  const starting=Number(els.startingBankroll.value);
  state={startingBankroll:starting,bankroll:starting,spins:0,wagered:0,returned:0,history:[],chart:[{x:0,actual:0,expected:0}]};
  wheelRotation=0;
  rouletteScene?.reset();
  if (els.cinematicResult) els.cinematicResult.className = 'cinematic-result';
  els.resultBadge.textContent='—'; els.resultBadge.className='result-badge result-green';
  renderHistory(); updateLastResult(); updateMetrics(); drawWheel(); drawChart();
  if(showMessage)setStatus(t('resetDone'));
}
function setStatus(msg){ els.statusMessage.textContent=msg; }
function toggleButtons(disabled){ els.spinButton.disabled=disabled; els.batchButton.disabled=disabled; els.resetButton.disabled=disabled; }

function initialize3D() {
  if (!els.roulette3D) return;
  rouletteScene = new RouletteScene(els.roulette3D, {
    order: currentOrder(),
    cinematic: els.cinematicToggle?.checked !== false
  });
  rouletteScene.init();
  rouletteScene.setSound(els.soundToggle?.checked !== false);
  els.roulette3D.addEventListener('roulette-pocket-select', event => {
    setBetSelection('straight', event.detail.number);
    els.betAmount.focus({ preventScroll: true });
  });
}

function setQuickChip(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return;
  els.betAmount.value = String(amount);
  document.querySelectorAll('[data-chip]').forEach(button => button.classList.toggle('is-active', Number(button.dataset.chip) === amount));
  updateBetSummary();
}

els.languageSelect.value=lang;
els.languageSelect.addEventListener('change',()=>{lang=els.languageSelect.value;applyLanguage();});
els.wheelType.addEventListener('change',()=>{
  updateNumberOptions();
  buildBetBoard();
  updateBetSummary();
  rouletteScene?.setOrder(currentOrder());
  resetSimulation(false);
});
els.betType.addEventListener('change',()=>{updateNumberOptions();updateBetSummary();buildBetBoard();});
els.straightNumber.addEventListener('change',()=>{updateBetSummary();buildBetBoard();});
els.betAmount.addEventListener('input',()=>{
  updateBetSummary();
  document.querySelectorAll('[data-chip]').forEach(button => button.classList.toggle('is-active', Number(button.dataset.chip) === Number(els.betAmount.value)));
});
els.startingBankroll.addEventListener('change',()=>{if(state.spins===0)resetSimulation(false);});
els.spinButton.addEventListener('click',spinOnce);
els.batchButton.addEventListener('click',runBatch);
els.resetButton.addEventListener('click',()=>resetSimulation(true));
els.cinematicToggle?.addEventListener('change',()=>rouletteScene?.setCinematic(els.cinematicToggle.checked));
els.soundToggle?.addEventListener('change',()=>rouletteScene?.setSound(els.soundToggle.checked));
document.querySelectorAll('[data-chip]').forEach(button => button.addEventListener('click',()=>setQuickChip(button.dataset.chip)));
window.addEventListener('resize',()=>{drawWheel();drawChart();rouletteScene?.resize();});
window.addEventListener('beforeunload',()=>rouletteScene?.dispose());

initialize3D();
applyLanguage();
resetSimulation(false);
window.__rouletteLab = { spinOnce, runBatch, resetSimulation, getState:()=>structuredClone(state), scene:()=>rouletteScene };
