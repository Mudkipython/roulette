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
    interactiveBet:'交互下注台', betTable:'点击号码或外围下注', betTableHint:'发球后仍可在倒计时结束前修改下注；小球离开外轨时立即停止下注。', soundEffects:'声音效果', dragHint:'固定全景 · 发球前可拖动调整视角 · 点击号码下注', readyToLaunch:'准备发球', bettingOpen:'可下注', betsCloseIn:'下注倒计时', noMoreBets:'停止下注', descending:'停止下注 · 小球离开外轨，等待开奖', settling:'小球落袋中', wonBanner:'本局获胜', lostBanner:'本局落败', winProbability:'中奖概率', payout:'净赔率', houseEdge:'赌场优势', expectedLossBet:'每注预计损失', spin:'发球', batchRun:'批量模拟', batchSize:'批量局数',
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
    insufficient:'资金不足，无法继续下注。请降低下注额或重置。', invalidInput:'请输入有效的初始资金和下注金额。', batchDone:'批量模拟完成。', batchStopped:'资金不足，模拟提前停止。', spinning:'小球已发出，倒计时内仍可修改下注。', resetDone:'模拟已重置。'
  },
  en: {
    locale: 'en-CA', currency: '$',
    eyebrow:'Interactive probability education', title:'Roulette Lab: Why the House Wins', learnMore:'Key ideas', educationalOnly:'Educational simulation only — no real-money gambling',
    heroTitle:'You can win in the short run. The rules make the house win in the long run.', heroBody:'Spin once or simulate thousands of rounds to see random variance orbit a negative expected value.',
    coreFormulaLabel:'Long-run expected loss', coreFormula:'Total amount wagered × house edge', euLabel:'European roulette', usLabel:'American roulette', bankerLabel:'Baccarat — Banker', blackjackLabel:'Blackjack basic strategy',
    stepOne:'Step 1', configureBet:'Configure a bet', reset:'Reset', wheelType:'Wheel type', european:'European single-zero (37)', american:'American double-zero (38)', startingBankroll:'Starting bankroll', betAmount:'Bet per spin', betType:'Bet type', chooseNumber:'Choose a number',
    interactiveBet:'Interactive betting table', betTable:'Click a number or outside bet', betTableHint:'You may change the bet until the countdown ends. Betting closes when the ball leaves the outer track.', soundEffects:'Sound effects', dragHint:'Fixed wide view · Adjust the camera before launch · Click a pocket to bet', readyToLaunch:'Ready to launch', bettingOpen:'Betting open', betsCloseIn:'Bets close in', noMoreBets:'No more bets', descending:'No more bets · Ball has left the outer track', settling:'Ball entering the pockets', wonBanner:'Round won', lostBanner:'Round lost', winProbability:'Win probability', payout:'Net payout', houseEdge:'House edge', expectedLossBet:'Expected loss per bet', spin:'Launch ball', batchRun:'Run batch', batchSize:'Batch size',
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
    insufficient:'Not enough bankroll for another bet. Lower the bet or reset.', invalidInput:'Enter a valid starting bankroll and bet amount.', batchDone:'Batch simulation complete.', batchStopped:'Simulation stopped early because the bankroll was exhausted.', spinning:'Ball launched. You may change the bet until the countdown ends.', resetDone:'Simulation reset.'
  },
  fr: {
    locale: 'fr-CA', currency: '$',
    eyebrow:'Outil interactif de probabilités', title:'Laboratoire de roulette : pourquoi la maison gagne', learnMore:'Notions clés', educationalOnly:'Simulation éducative seulement — aucun jeu d’argent réel',
    heroTitle:'On peut gagner à court terme. Les règles font gagner la maison à long terme.', heroBody:'Lancez une partie ou simulez des milliers de tours pour voir la variance aléatoire autour d’une espérance négative.',
    coreFormulaLabel:'Perte prévue à long terme', coreFormula:'Mises totales × avantage de la maison', euLabel:'Roulette européenne', usLabel:'Roulette américaine', bankerLabel:'Baccara — Banque', blackjackLabel:'Blackjack stratégie de base',
    stepOne:'Étape 1', configureBet:'Configurer la mise', reset:'Réinitialiser', wheelType:'Type de roulette', european:'Européenne à un zéro (37)', american:'Américaine à deux zéros (38)', startingBankroll:'Capital initial', betAmount:'Mise par tour', betType:'Type de mise', chooseNumber:'Choisir un numéro',
    interactiveBet:'Table de mise interactive', betTable:'Cliquez un numéro ou une mise extérieure', betTableHint:'Vous pouvez modifier la mise jusqu’à la fin du compte à rebours. Les mises ferment lorsque la bille quitte la piste extérieure.', soundEffects:'Effets sonores', dragHint:'Vue générale fixe · Ajustez la caméra avant le lancement · Cliquez pour miser', readyToLaunch:'Prêt à lancer', bettingOpen:'Mises ouvertes', betsCloseIn:'Fermeture dans', noMoreBets:'Rien ne va plus', descending:'Rien ne va plus · La bille quitte la piste extérieure', settling:'La bille entre dans les cases', wonBanner:'Manche gagnée', lostBanner:'Manche perdue', winProbability:'Probabilité de gain', payout:'Gain net', houseEdge:'Avantage maison', expectedLossBet:'Perte prévue par mise', spin:'Lancer la bille', batchRun:'Simulation en lot', batchSize:'Nombre de tours',
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
    insufficient:'Capital insuffisant pour une autre mise. Réduisez la mise ou réinitialisez.', invalidInput:'Entrez un capital initial et une mise valides.', batchDone:'Simulation en lot terminée.', batchStopped:'Simulation arrêtée : capital épuisé.', spinning:'Bille lancée. Vous pouvez modifier la mise jusqu’à la fin du compte à rebours.', resetDone:'Simulation réinitialisée.'
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


const TAU = Math.PI * 2;

Object.assign(translations.zh, {
  configureBet:'自动轮盘与多注下注', betTable:'选择筹码后可连续下多注',
  betTableHint:'小球在外沿转动期间可追加、撤销或清空下注；小球开始向内滑落时停止下注。',
  dragHint:'固定全景 · 自动发球 · 外沿阶段开放下注', readyToLaunch:'即将自动发球',
  currentBets:'本局下注', multiBetTitle:'多注清单', undoBet:'撤销一步', clearBets:'清空',
  totalCurrentBet:'本局总注', availableBankroll:'可用资金', repeatLastBets:'重复上一局下注',
  noBetsYet:'尚未下注。选择筹码后点击多个号码或外围区域。', removeBet:'移除', selectedChip:'当前筹码',
  roundMode:'运行方式', autoRounds:'自动连续开局', pauseAfterRound:'本局后暂停', resumeAuto:'继续自动开局',
  paused:'自动轮盘已暂停', pausePending:'本局开奖后暂停', resultHold:'等待下一局自动发球',
  bettingNotOpen:'当前不能下注，请等待下一局外沿倒计时。', noPreviousBets:'没有可重复的上一局下注。',
  noBatchBets:'请先完成至少一局下注，再使用批量模拟。', batchRun:'按上一局下注批量模拟',
  netWin:'本局净赢', netLoss:'本局净亏', watchedOnly:'本局未下注', push:'持平',
  resetWait:'请等待本局开奖后再重置。', wheelChangePaused:'请先暂停自动轮盘再切换轮盘类型。',
  expectedLossBet:'本局预计损失', spinning:'小球已自动发出，外沿倒计时内可自由下注。'
});
Object.assign(translations.en, {
  configureBet:'Automatic table and multiple bets', betTable:'Choose a chip, then place multiple bets',
  betTableHint:'Add, undo or clear bets while the ball circles the outer track. Betting closes as it begins to descend.',
  dragHint:'Fixed camera · Automatic launch · Bet during the outer-track phase', readyToLaunch:'Automatic launch shortly',
  currentBets:'Current round', multiBetTitle:'Multiple-bet slip', undoBet:'Undo chip', clearBets:'Clear',
  totalCurrentBet:'Total bet', availableBankroll:'Available bankroll', repeatLastBets:'Repeat previous bets',
  noBetsYet:'No bets yet. Choose a chip and click several numbers or outside areas.', removeBet:'Remove', selectedChip:'Selected chip',
  roundMode:'Round mode', autoRounds:'Continuous automatic rounds', pauseAfterRound:'Pause after round', resumeAuto:'Resume auto rounds',
  paused:'Automatic table paused', pausePending:'Will pause after this result', resultHold:'Next ball launches automatically',
  bettingNotOpen:'Betting is closed. Wait for the next outer-track countdown.', noPreviousBets:'There are no previous bets to repeat.',
  noBatchBets:'Complete at least one betting round before using batch simulation.', batchRun:'Batch previous bets',
  netWin:'Round net win', netLoss:'Round net loss', watchedOnly:'No bet this round', push:'Break even',
  resetWait:'Wait for the current result before resetting.', wheelChangePaused:'Pause automatic rounds before changing wheel type.',
  expectedLossBet:'Expected loss this round', spinning:'The ball launched automatically. Betting remains open during the outer-track countdown.'
});
Object.assign(translations.fr, {
  configureBet:'Table automatique et mises multiples', betTable:'Choisissez un jeton puis placez plusieurs mises',
  betTableHint:'Ajoutez, annulez ou effacez les mises pendant que la bille tourne sur la piste extérieure. Les mises ferment à la descente.',
  dragHint:'Caméra fixe · Lancement automatique · Misez pendant la piste extérieure', readyToLaunch:'Lancement automatique imminent',
  currentBets:'Manche actuelle', multiBetTitle:'Liste de mises multiples', undoBet:'Annuler un jeton', clearBets:'Effacer',
  totalCurrentBet:'Mise totale', availableBankroll:'Capital disponible', repeatLastBets:'Répéter les mises précédentes',
  noBetsYet:'Aucune mise. Choisissez un jeton et cliquez plusieurs numéros ou zones extérieures.', removeBet:'Retirer', selectedChip:'Jeton choisi',
  roundMode:'Mode', autoRounds:'Manches automatiques continues', pauseAfterRound:'Pause après la manche', resumeAuto:'Reprendre les manches',
  paused:'Table automatique en pause', pausePending:'Pause après ce résultat', resultHold:'Prochain lancement automatique',
  bettingNotOpen:'Les mises sont fermées. Attendez le prochain compte à rebours extérieur.', noPreviousBets:'Aucune mise précédente à répéter.',
  noBatchBets:'Terminez au moins une manche avec mise avant la simulation en lot.', batchRun:'Simuler les mises précédentes',
  netWin:'Gain net de la manche', netLoss:'Perte nette de la manche', watchedOnly:'Aucune mise cette manche', push:'Équilibre',
  resetWait:'Attendez le résultat actuel avant de réinitialiser.', wheelChangePaused:'Mettez la table en pause avant de changer de roulette.',
  expectedLossBet:'Perte prévue de la manche', spinning:'La bille est lancée automatiquement. Les mises restent ouvertes pendant le compte à rebours extérieur.'
});

const els = Object.fromEntries([...document.querySelectorAll('[id]')].map(element => [element.id, element]));
const wheelCtx = els.wheelCanvas.getContext('2d');
const chartCtx = els.profitChart.getContext('2d');

let lang = localStorage.getItem('rouletteLabLanguage') || 'zh';
let selectedChip = 10;
let roundPhase = 'idle';
let roundInProgress = false;
let autoEnabled = true;
let loopActive = false;
let currentBets = new Map();
let betActionStack = [];
let lockedBets = [];
let lastBets = [];
let state = freshState();
let rouletteScene = null;
let wheelRotation = 0;

function freshState() {
  const starting = Math.max(1, Number(els.startingBankroll?.value || 1000));
  return {
    startingBankroll: starting,
    bankroll: starting,
    spins: 0,
    wagered: 0,
    returned: 0,
    history: [],
    chart: [{ x: 0, actual: 0, expected: 0 }]
  };
}

function t(key) { return translations[lang][key] ?? key; }
function currentOrder() { return els.wheelType.value === 'american' ? AMERICAN_ORDER : EUROPEAN_ORDER; }
function houseEdge() { return els.wheelType.value === 'american' ? 2 / 38 : 1 / 37; }
function colorOf(number) {
  if (number === '0' || number === '00') return 'green';
  return RED_NUMBERS.has(number) ? 'red' : 'black';
}
function betKey(type, selected = '') { return `${type}:${selected ?? ''}`; }
function cloneBets(bets) { return bets.map(bet => ({ ...bet })); }
function currentBetTotal() { return [...currentBets.values()].reduce((sum, bet) => sum + bet.amount, 0); }
function totalFor(bets) { return bets.reduce((sum, bet) => sum + bet.amount, 0); }
function sleep(ms) { return new Promise(resolve => window.setTimeout(resolve, ms)); }

function secureRandomInt(max) {
  if (!Number.isInteger(max) || max <= 0) throw new Error('Invalid max');
  const maxUint = 0x100000000;
  const limit = maxUint - (maxUint % max);
  const values = new Uint32Array(1);
  let value;
  do { crypto.getRandomValues(values); value = values[0]; } while (value >= limit);
  return value % max;
}

function randomResult() {
  const order = currentOrder();
  return order[secureRandomInt(order.length)];
}

function formatMoney(value) {
  const locale = translations[lang].locale;
  const currency = lang === 'zh' ? 'CNY' : 'CAD';
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}
function formatPercent(value, digits = 2) {
  return new Intl.NumberFormat(translations[lang].locale, { style: 'percent', maximumFractionDigits: digits }).format(value);
}
function formatNumber(value) { return new Intl.NumberFormat(translations[lang].locale).format(value); }
function signedMoney(value) { return `${value > 0 ? '+' : ''}${formatMoney(value)}`; }

function betLabel(bet) {
  if (bet.type === 'straight') return `${t('betStraight')} ${bet.selected}`;
  return t(BETS[bet.type]?.label || bet.type);
}

function setStatus(message = '') { els.statusMessage.textContent = message; }

function applyLanguage() {
  document.documentElement.lang = translations[lang].locale;
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const value = translations[lang][element.dataset.i18n];
    if (value) element.textContent = value;
  });
  buildBetBoard();
  renderBetSlip();
  updateMetrics();
  renderHistory();
  updateLastResult();
  drawWheel();
  drawChart();
  updatePauseButton();
  updateRoundPhase(roundPhase);
  localStorage.setItem('rouletteLabLanguage', lang);
}

function makeBetButton({ label, type, selected = '', className = '' }) {
  const key = betKey(type, selected);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `table-bet ${className}`.trim();
  button.dataset.betKey = key;
  button.dataset.betType = type;
  button.dataset.selected = selected;

  const text = document.createElement('span');
  text.className = 'bet-label';
  text.textContent = label;
  button.append(text);

  const existing = currentBets.get(key);
  if (existing) {
    const marker = document.createElement('span');
    marker.className = 'bet-marker';
    marker.textContent = formatNumber(existing.amount);
    button.append(marker);
    button.classList.add('has-bet');
  }

  button.addEventListener('click', () => placeBet(type, selected));
  return button;
}

function buildBetBoard() {
  if (!els.betBoard) return;
  els.betBoard.innerHTML = '';

  const zeroRail = document.createElement('div');
  zeroRail.className = 'zero-rail';
  zeroRail.append(makeBetButton({ label: '0', type: 'straight', selected: '0', className: 'number-bet number-green' }));
  if (els.wheelType.value === 'american') {
    zeroRail.append(makeBetButton({ label: '00', type: 'straight', selected: '00', className: 'number-bet number-green' }));
  }

  const numberGrid = document.createElement('div');
  numberGrid.className = 'number-bet-grid';
  for (let row = 0; row < 12; row++) {
    for (let col = 1; col <= 3; col++) {
      const number = String(row * 3 + col);
      numberGrid.append(makeBetButton({
        label: number,
        type: 'straight',
        selected: number,
        className: `number-bet number-${colorOf(number)}`
      }));
    }
  }

  const dozens = document.createElement('div');
  dozens.className = 'dozen-row';
  ['dozen1', 'dozen2', 'dozen3'].forEach(type => {
    dozens.append(makeBetButton({ label: t(BETS[type].label), type, className: 'outside-bet' }));
  });

  const outside = document.createElement('div');
  outside.className = 'outside-row';
  [
    ['low', '1–18', ''], ['even', t('betEven'), ''], ['red', t('betRed'), 'bet-red'],
    ['black', t('betBlack'), 'bet-black'], ['odd', t('betOdd'), ''], ['high', '19–36', '']
  ].forEach(([type, label, extra]) => outside.append(makeBetButton({ label, type, className: `outside-bet ${extra}` })));

  const columns = document.createElement('div');
  columns.className = 'column-row';
  ['column1', 'column2', 'column3'].forEach(type => {
    columns.append(makeBetButton({ label: t(BETS[type].label), type, className: 'outside-bet' }));
  });

  const layout = document.createElement('div');
  layout.className = 'bet-board-main';
  layout.append(zeroRail, numberGrid);
  els.betBoard.append(layout, dozens, outside, columns);
  setBettingEnabled(roundPhase === 'betting-open');
}

function placeBet(type, selected = '') {
  if (roundPhase !== 'betting-open') {
    setStatus(t('bettingNotOpen'));
    return;
  }
  if (!BETS[type]) return;
  const nextTotal = currentBetTotal() + selectedChip;
  if (nextTotal > state.bankroll) {
    setStatus(t('insufficient'));
    return;
  }

  const key = betKey(type, selected);
  const existing = currentBets.get(key);
  if (existing) existing.amount += selectedChip;
  else currentBets.set(key, { key, type, selected, amount: selectedChip, payout: BETS[type].payout });
  betActionStack.push({ key, amount: selectedChip });
  setStatus('');
  renderBetSlip();
  buildBetBoard();
}

function undoBet() {
  if (roundPhase !== 'betting-open') return setStatus(t('bettingNotOpen'));
  const action = betActionStack.pop();
  if (!action) return;
  const bet = currentBets.get(action.key);
  if (!bet) return;
  bet.amount -= action.amount;
  if (bet.amount <= 0) currentBets.delete(action.key);
  renderBetSlip();
  buildBetBoard();
}

function removeBet(key) {
  if (roundPhase !== 'betting-open') return setStatus(t('bettingNotOpen'));
  currentBets.delete(key);
  betActionStack = betActionStack.filter(action => action.key !== key);
  renderBetSlip();
  buildBetBoard();
}

function clearBets() {
  if (roundPhase !== 'betting-open') return setStatus(t('bettingNotOpen'));
  currentBets.clear();
  betActionStack = [];
  renderBetSlip();
  buildBetBoard();
}

function repeatLastBets() {
  if (roundPhase !== 'betting-open') return setStatus(t('bettingNotOpen'));
  if (!lastBets.length) return setStatus(t('noPreviousBets'));
  const total = totalFor(lastBets);
  if (total > state.bankroll) return setStatus(t('insufficient'));
  currentBets = new Map(lastBets.map(bet => [bet.key, { ...bet }]));
  betActionStack = lastBets.flatMap(bet => [{ key: bet.key, amount: bet.amount }]);
  setStatus('');
  renderBetSlip();
  buildBetBoard();
}

function renderBetSlip() {
  if (!els.betSlipList) return;
  els.betSlipList.innerHTML = '';
  const bets = [...currentBets.values()];
  if (!bets.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-bets';
    empty.textContent = t('noBetsYet');
    els.betSlipList.append(empty);
  } else {
    bets.forEach(bet => {
      const row = document.createElement('div');
      row.className = 'bet-slip-item';
      const label = document.createElement('span');
      label.textContent = betLabel(bet);
      const amount = document.createElement('strong');
      amount.textContent = formatMoney(bet.amount);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.title = t('removeBet');
      remove.setAttribute('aria-label', `${t('removeBet')} ${betLabel(bet)}`);
      remove.disabled = roundPhase !== 'betting-open';
      remove.addEventListener('click', () => removeBet(bet.key));
      row.append(label, amount, remove);
      els.betSlipList.append(row);
    });
  }

  const total = currentBetTotal();
  els.totalCurrentBet.textContent = formatMoney(total);
  els.availableBankroll.textContent = formatMoney(Math.max(0, state.bankroll - total));
  els.edgeValue.textContent = formatPercent(houseEdge(), 2);
  els.expectedLossValue.textContent = formatMoney(total * houseEdge());
  els.selectedChipValue.textContent = formatMoney(selectedChip);
  els.undoBetButton.disabled = roundPhase !== 'betting-open' || !betActionStack.length;
  els.clearBetsButton.disabled = roundPhase !== 'betting-open' || !bets.length;
  els.repeatBetsButton.disabled = roundPhase !== 'betting-open' || !lastBets.length;
}

function setBettingEnabled(enabled) {
  document.querySelectorAll('.table-bet').forEach(button => { button.disabled = !enabled; });
  els.betBoard?.classList.toggle('is-locked', !enabled);
  renderBetSlip();
}

function updateRoundPhase(phase, seconds = null) {
  roundPhase = phase;
  if (!els.roundPhase) return;
  els.roundPhase.className = `round-phase is-${phase}`;
  const labels = {
    idle: t('readyToLaunch'),
    paused: t('paused'),
    'betting-open': t('bettingOpen'),
    'bets-closed': t('noMoreBets'),
    descending: t('descending'),
    settling: t('settling'),
    resolved: t('resultHold')
  };
  els.roundPhaseLabel.textContent = labels[phase] || labels.idle;
  if (phase === 'betting-open' && Number.isFinite(seconds)) {
    els.roundPhaseLabel.textContent = t('betsCloseIn');
    els.roundCountdown.textContent = String(seconds);
  } else if (phase === 'bets-closed' || phase === 'descending') {
    els.roundCountdown.textContent = '×';
  } else {
    els.roundCountdown.textContent = '—';
  }
  setBettingEnabled(phase === 'betting-open');
}

function settleRound(result, bets) {
  const stake = totalFor(bets);
  state.spins += 1;
  state.wagered += stake;
  state.bankroll -= stake;

  let returned = 0;
  let winningBets = 0;
  for (const bet of bets) {
    const config = BETS[bet.type];
    if (config?.match(result, bet.selected)) {
      returned += bet.amount * (config.payout + 1);
      winningBets += 1;
    }
  }
  state.bankroll += returned;
  state.returned += returned;

  const net = returned - stake;
  const actual = state.bankroll - state.startingBankroll;
  const expected = -state.wagered * houseEdge();
  state.history.unshift({ result, net, stake, winningBets });
  state.history = state.history.slice(0, 14);
  state.chart.push({ x: state.spins, actual, expected });
  return { net, stake, returned, winningBets };
}

async function animateToResult(result, hooks = {}) {
  if (rouletteScene?.ready) return rouletteScene.spinTo(result, hooks);

  const order = currentOrder();
  const index = order.indexOf(result);
  const arc = TAU / order.length;
  const start = wheelRotation;
  const bettingDuration = 6500;
  const descentDuration = 2500;
  const totalDuration = bettingDuration + descentDuration;
  const startTime = performance.now();
  let closed = false;
  let lastSecond = null;
  hooks.onPhase?.({ phase: 'betting-open' });

  return new Promise(resolve => {
    function frame(now) {
      const elapsed = now - startTime;
      if (elapsed < bettingDuration) {
        const second = Math.max(0, Math.ceil((bettingDuration - elapsed) / 1000));
        if (second !== lastSecond) {
          lastSecond = second;
          hooks.onCountdown?.({ seconds: second });
        }
        wheelRotation = start + elapsed * 0.0013;
      } else {
        if (!closed) {
          closed = true;
          hooks.onBetsClosed?.({ resultPending: true });
          hooks.onPhase?.({ phase: 'descending' });
        }
        const progress = clamp01((elapsed - bettingDuration) / descentDuration);
        const target = -index * arc;
        wheelRotation += shortestAngle(wheelRotation, target) * Math.min(1, 0.03 + progress * 0.10);
      }
      drawWheel(wheelRotation);
      if (elapsed < totalDuration) requestAnimationFrame(frame);
      else {
        wheelRotation = -index * arc;
        drawWheel(wheelRotation);
        hooks.onPhase?.({ phase: 'settling' });
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

function prepareNewRound() {
  currentBets.clear();
  betActionStack = [];
  lockedBets = [];
  renderBetSlip();
  buildBetBoard();
}

async function playAutomaticRound() {
  if (roundInProgress || !autoEnabled) return;
  roundInProgress = true;
  prepareNewRound();
  els.wheelType.disabled = true;
  els.startingBankroll.disabled = true;
  els.batchButton.disabled = true;
  setStatus(t('spinning'));

  const result = randomResult();
  await animateToResult(result, {
    onCountdown: ({ seconds }) => {
      updateRoundPhase('betting-open', seconds);
      setStatus(`${t('betsCloseIn')}: ${seconds}`);
    },
    onBetsClosed: () => {
      lockedBets = cloneBets([...currentBets.values()]);
      updateRoundPhase('bets-closed');
      setStatus(t('noMoreBets'));
    },
    onPhase: ({ phase }) => {
      if (phase === 'betting-open') updateRoundPhase('betting-open', 9);
      else if (phase === 'descending') {
        updateRoundPhase('descending');
        setStatus(t('descending'));
      } else if (phase === 'settling') {
        updateRoundPhase('settling');
        setStatus(t('settling'));
      }
    }
  });

  if (!lockedBets.length && currentBets.size) lockedBets = cloneBets([...currentBets.values()]);
  const settlement = settleRound(result, lockedBets);
  if (lockedBets.length) lastBets = cloneBets(lockedBets);
  updateAll(result, settlement);
  updateRoundPhase('resolved');
  if (rouletteScene?.ready) await rouletteScene.resolveResult(settlement.net, result);

  roundInProgress = false;
  els.batchButton.disabled = false;
  if (!autoEnabled) {
    els.wheelType.disabled = false;
    els.startingBankroll.disabled = false;
    updateRoundPhase('paused');
    setStatus(t('paused'));
  } else {
    setStatus(t('resultHold'));
  }
  updatePauseButton();
}

async function ensureAutoLoop() {
  if (loopActive) return;
  loopActive = true;
  await sleep(900);
  while (true) {
    if (!autoEnabled || roundInProgress) {
      await sleep(160);
      continue;
    }
    await playAutomaticRound();
    if (autoEnabled) await sleep(2400);
  }
}

function toggleAuto() {
  autoEnabled = !autoEnabled;
  if (!autoEnabled) {
    if (roundInProgress) setStatus(t('pausePending'));
    else {
      updateRoundPhase('paused');
      els.wheelType.disabled = false;
      els.startingBankroll.disabled = false;
      setStatus(t('paused'));
    }
  } else {
    els.wheelType.disabled = true;
    els.startingBankroll.disabled = true;
    setStatus(t('readyToLaunch'));
    ensureAutoLoop();
  }
  updatePauseButton();
}

function updatePauseButton() {
  els.pauseButton.textContent = autoEnabled ? t('pauseAfterRound') : t('resumeAuto');
}

function runBatch() {
  if (roundInProgress) return;
  if (!lastBets.length) return setStatus(t('noBatchBets'));
  autoEnabled = false;
  updatePauseButton();
  updateRoundPhase('paused');

  const count = Number(els.batchSize.value);
  const bets = cloneBets(lastBets);
  const stake = totalFor(bets);
  let lastResult = null;
  let lastSettlement = null;
  let completed = 0;
  for (let index = 0; index < count; index++) {
    if (stake > state.bankroll) break;
    lastResult = randomResult();
    lastSettlement = settleRound(lastResult, bets);
    completed += 1;
  }
  if (lastResult) {
    rouletteScene?.setResult(lastResult);
    updateAll(lastResult, lastSettlement);
  }
  setStatus(completed < count ? t('batchStopped') : t('batchDone'));
  els.wheelType.disabled = false;
  els.startingBankroll.disabled = false;
}

function resetSimulation(showMessage = true) {
  if (roundInProgress) return setStatus(t('resetWait'));
  autoEnabled = false;
  state = freshState();
  currentBets.clear();
  betActionStack = [];
  lockedBets = [];
  lastBets = [];
  wheelRotation = 0;
  rouletteScene?.reset();
  els.resultBadge.textContent = '—';
  els.resultBadge.className = 'result-badge result-green';
  els.lastResultText.textContent = '—';
  els.lastOutcomeText.textContent = '—';
  els.lastOutcomeText.className = '';
  els.cinematicResult.className = 'cinematic-result';
  updateRoundPhase('paused');
  updateAll();
  buildBetBoard();
  renderBetSlip();
  updatePauseButton();
  els.wheelType.disabled = false;
  els.startingBankroll.disabled = false;
  if (showMessage) setStatus(t('resetDone'));
}

function updateAll(result = null, settlement = null) {
  if (result !== null && settlement) updateResult(result, settlement);
  renderHistory();
  updateMetrics();
  drawChart();
  renderBetSlip();
}

function updateResult(result, settlement) {
  const color = colorOf(result);
  els.resultBadge.textContent = result;
  els.resultBadge.className = `result-badge result-${color}`;
  els.lastResultText.textContent = result;

  if (settlement.stake === 0) {
    els.lastOutcomeText.textContent = t('watchedOnly');
    els.lastOutcomeText.className = '';
  } else if (settlement.net > 0) {
    els.lastOutcomeText.textContent = `${t('netWin')} ${signedMoney(settlement.net)}`;
    els.lastOutcomeText.className = 'outcome-win';
  } else if (settlement.net < 0) {
    els.lastOutcomeText.textContent = `${t('netLoss')} ${formatMoney(Math.abs(settlement.net))}`;
    els.lastOutcomeText.className = 'outcome-loss';
  } else {
    els.lastOutcomeText.textContent = t('push');
    els.lastOutcomeText.className = '';
  }

  const label = settlement.stake === 0 ? t('watchedOnly') : settlement.net > 0 ? t('wonBanner') : settlement.net < 0 ? t('lostBanner') : t('push');
  els.cinematicResultLabel.textContent = label;
  els.cinematicResultNumber.textContent = result;
  const resultClass = settlement.net > 0 ? 'is-win' : settlement.net < 0 ? 'is-loss' : 'is-push';
  els.cinematicResult.className = `cinematic-result is-visible ${resultClass}`;
  window.clearTimeout(updateResult.timer);
  updateResult.timer = window.setTimeout(() => { els.cinematicResult.className = 'cinematic-result'; }, 1900);
}

function updateLastResult() {
  const latest = state.history[0];
  if (!latest) return;
  const settlement = { net: latest.net, stake: latest.stake };
  updateResult(latest.result, settlement);
}

function renderHistory() {
  els.historyStrip.innerHTML = '';
  state.history.forEach(item => {
    const chip = document.createElement('span');
    chip.className = `history-chip result-${colorOf(item.result)}`;
    chip.textContent = item.result;
    chip.title = item.stake === 0 ? t('watchedOnly') : signedMoney(item.net);
    els.historyStrip.append(chip);
  });
}

function updateMetrics() {
  els.bankrollMetric.textContent = formatMoney(state.bankroll);
  els.spinsMetric.textContent = formatNumber(state.spins);
  els.wageredMetric.textContent = formatMoney(state.wagered);
  els.profitMetric.textContent = signedMoney(state.bankroll - state.startingBankroll);
  els.expectedMetric.textContent = formatMoney(-state.wagered * houseEdge());
  els.returnMetric.textContent = state.wagered > 0 ? formatPercent(state.returned / state.wagered, 2) : '—';
}

function drawWheel(rotation = wheelRotation) {
  const canvas = els.wheelCanvas;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssSize = Math.max(300, canvas.getBoundingClientRect().width || 610);
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  wheelCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const size = cssSize;
  const center = size / 2;
  const outer = size * 0.46;
  const inner = size * 0.30;
  const order = currentOrder();
  const arc = TAU / order.length;

  wheelCtx.clearRect(0, 0, size, size);
  wheelCtx.save();
  wheelCtx.translate(center, center);
  wheelCtx.beginPath();
  wheelCtx.arc(0, 0, outer * 1.06, 0, TAU);
  wheelCtx.fillStyle = '#8d5d24';
  wheelCtx.fill();
  wheelCtx.rotate(rotation);

  order.forEach((number, index) => {
    const start = -Math.PI / 2 + index * arc - arc / 2;
    wheelCtx.beginPath();
    wheelCtx.arc(0, 0, outer, start, start + arc);
    wheelCtx.arc(0, 0, inner, start + arc, start, true);
    wheelCtx.closePath();
    wheelCtx.fillStyle = colorOf(number) === 'red' ? '#b62635' : colorOf(number) === 'green' ? '#087a50' : '#10151d';
    wheelCtx.fill();
    wheelCtx.strokeStyle = '#d6ab53';
    wheelCtx.lineWidth = 1;
    wheelCtx.stroke();

    wheelCtx.save();
    wheelCtx.rotate(start + arc / 2);
    wheelCtx.translate((outer + inner) / 2, 0);
    wheelCtx.rotate(Math.PI / 2);
    wheelCtx.fillStyle = '#fff';
    wheelCtx.font = `800 ${Math.max(10, size * 0.022)}px Arial`;
    wheelCtx.textAlign = 'center';
    wheelCtx.textBaseline = 'middle';
    wheelCtx.fillText(number, 0, 0);
    wheelCtx.restore();
  });

  wheelCtx.beginPath();
  wheelCtx.arc(0, 0, inner * 0.88, 0, TAU);
  wheelCtx.fillStyle = '#173650';
  wheelCtx.fill();
  wheelCtx.beginPath();
  wheelCtx.arc(0, 0, size * 0.075, 0, TAU);
  wheelCtx.fillStyle = '#d7aa4f';
  wheelCtx.fill();
  wheelCtx.restore();
}

function drawChart() {
  const canvas = els.profitChart;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(600, rect.width || 1100);
  const height = 290;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  chartCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  chartCtx.clearRect(0, 0, width, height);

  const points = downsample(state.chart, 450);
  const padding = { left: 58, right: 18, top: 18, bottom: 34 };
  const values = points.flatMap(point => [point.actual, point.expected, 0]);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) { min -= 1; max += 1; }
  const xMax = Math.max(1, points.at(-1)?.x || 1);
  const x = value => padding.left + (value / xMax) * (width - padding.left - padding.right);
  const y = value => padding.top + (max - value) / (max - min) * (height - padding.top - padding.bottom);

  chartCtx.strokeStyle = 'rgba(255,255,255,.10)';
  chartCtx.lineWidth = 1;
  for (let index = 0; index <= 4; index++) {
    const yy = padding.top + index * (height - padding.top - padding.bottom) / 4;
    chartCtx.beginPath(); chartCtx.moveTo(padding.left, yy); chartCtx.lineTo(width - padding.right, yy); chartCtx.stroke();
  }
  chartCtx.beginPath(); chartCtx.moveTo(padding.left, y(0)); chartCtx.lineTo(width - padding.right, y(0));
  chartCtx.strokeStyle = 'rgba(255,255,255,.28)'; chartCtx.stroke();

  drawChartLine(points, 'actual', '#7aa7ff', [], 2.2, x, y);
  drawChartLine(points, 'expected', '#ff6b76', [6, 5], 1.8, x, y);

  chartCtx.fillStyle = 'rgba(210,222,240,.75)';
  chartCtx.font = '12px system-ui';
  chartCtx.textAlign = 'right';
  chartCtx.fillText(formatMoney(max), padding.left - 8, padding.top + 4);
  chartCtx.fillText(formatMoney(min), padding.left - 8, height - padding.bottom);
  chartCtx.textAlign = 'center';
  chartCtx.fillText(formatNumber(xMax), width - padding.right, height - 10);
}

function drawChartLine(points, key, color, dash, lineWidth, x, y) {
  chartCtx.save();
  chartCtx.beginPath();
  points.forEach((point, index) => {
    const xx = x(point.x);
    const yy = y(point[key]);
    if (index) chartCtx.lineTo(xx, yy); else chartCtx.moveTo(xx, yy);
  });
  chartCtx.strokeStyle = color;
  chartCtx.lineWidth = lineWidth;
  chartCtx.setLineDash(dash);
  chartCtx.stroke();
  chartCtx.restore();
}

function downsample(array, maxPoints) {
  if (array.length <= maxPoints) return array;
  const step = (array.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, index) => array[Math.round(index * step)]);
}

function clamp01(value) { return Math.min(1, Math.max(0, value)); }
function normalizeAngle(angle) { return ((angle % TAU) + TAU) % TAU; }
function shortestAngle(from, to) {
  let delta = normalizeAngle(to) - normalizeAngle(from);
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;
  return delta;
}

els.languageSelect.value = lang;
els.languageSelect.addEventListener('change', event => { lang = event.target.value; applyLanguage(); });

document.querySelectorAll('[data-chip]').forEach(button => {
  button.addEventListener('click', () => {
    selectedChip = Number(button.dataset.chip);
    document.querySelectorAll('[data-chip]').forEach(chip => chip.classList.toggle('is-active', chip === button));
    renderBetSlip();
  });
});

els.undoBetButton.addEventListener('click', undoBet);
els.clearBetsButton.addEventListener('click', clearBets);
els.repeatBetsButton.addEventListener('click', repeatLastBets);
els.pauseButton.addEventListener('click', toggleAuto);
els.batchButton.addEventListener('click', runBatch);
els.resetButton.addEventListener('click', () => resetSimulation(true));
els.resetButtonSecondary.addEventListener('click', () => resetSimulation(true));
els.soundToggle.addEventListener('change', () => rouletteScene?.setSound(els.soundToggle.checked));
els.startingBankroll.addEventListener('change', () => { if (!roundInProgress && state.spins === 0) resetSimulation(false); });
els.wheelType.addEventListener('change', () => {
  if (roundInProgress || autoEnabled) {
    setStatus(t('wheelChangePaused'));
    return;
  }
  currentBets.clear();
  betActionStack = [];
  lastBets = [];
  rouletteScene?.setOrder(currentOrder());
  buildBetBoard();
  renderBetSlip();
  drawWheel();
  updateMetrics();
});

window.addEventListener('resize', () => { drawWheel(); drawChart(); });

rouletteScene = new RouletteScene(els.roulette3D, {
  order: currentOrder(),
  onPocketClick: number => placeBet('straight', String(number))
});
rouletteScene.init();
rouletteScene.setSound(els.soundToggle.checked);

applyLanguage();
updateRoundPhase('idle');
updateAll();
ensureAutoLoop();

window.__rouletteLab = {
  getState: () => structuredClone(state),
  getBets: () => cloneBets([...currentBets.values()]),
  placeBet,
  undoBet,
  clearBets,
  toggleAuto,
  scene: () => rouletteScene
};
