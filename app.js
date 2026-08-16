/* CardWolf build v70 */
const firebaseConfig = window.FIREBASE_CONFIG || {};
if (window.CARDWOLF_BUILD_VERSION !== "v70") { window.CARDWOLF_BUILD_VERSION = "v70"; }
const versionEl = document.querySelector(".build-version");
if (versionEl) { versionEl.textContent = "v70"; versionEl.setAttribute("aria-label", "ゲームバージョン v70"); }

// Firebase is loaded lazily so a CDN/auth/database problem can never disable
// the basic game UI. The solo/setup buttons must remain usable even when the
// online service is temporarily unavailable.
let initializeApp=null, getDatabase=null, ref=null, set=null, update=null, get=null, onValue=null, off=null, remove=null, getAuth=null, signInAnonymously=null;
let firebaseApp = null, firebaseDb = null, firebaseAuth = null;
let firebaseUid = null;
let firebaseAuthPromise = null;
let firebaseServicesPromise = null;

async function ensureFirebaseServices(){
  if(firebaseDb && firebaseAuth) return;
  if(firebaseServicesPromise) return firebaseServicesPromise;
  firebaseServicesPromise = Promise.all([
    import("https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js"),
    import("https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js")
  ]).then(([appMod, dbMod, authMod])=>{
    initializeApp=appMod.initializeApp;
    ({getDatabase,ref,set,update,get,onValue,off,remove}=dbMod);
    ({getAuth,signInAnonymously}=authMod);
    firebaseApp=initializeApp(firebaseConfig);
    firebaseDb=getDatabase(firebaseApp);
    firebaseAuth=getAuth(firebaseApp);
  }).catch(err=>{
    firebaseServicesPromise=null;
    console.error("Firebase SDK load failed:",err);
    throw err;
  });
  return firebaseServicesPromise;
}

function firebaseAuthErrorText(err){
  const code = err?.code ? String(err.code) : "unknown";
  const message = err?.message ? String(err.message) : String(err || "不明なエラー");
  return `Firebase認証に失敗しました。\\n\\nエラーコード: ${code}\\n${message}\\n\\nFirebaseコンソールの「Authentication → ログイン方法 → 匿名」が有効か確認してください。`;
}

async function ensureFirebaseAuth(){
  await ensureFirebaseServices();
  if(firebaseUid) return firebaseUid;
  if(firebaseAuthPromise) return firebaseAuthPromise;
  firebaseAuthPromise = signInAnonymously(firebaseAuth)
    .then(cred => {
      firebaseUid = cred.user.uid;
      return firebaseUid;
    })
    .catch(err => {
      firebaseAuthPromise = null;
      console.error("Firebase anonymous auth failed:", err);
      throw err;
    });
  return firebaseAuthPromise;
}

const CARD_POOL = Array.isArray(window.CARD_POOL_DATA) ? window.CARD_POOL_DATA.filter(card => card && card.name) : [];
const JP_NAMES = {
"Blue-Eyes White Dragon":"青眼の白龍","Dark Magician":"ブラック・マジシャン","Red-Eyes Black Dragon":"真紅眼の黒竜","Dark Magician Girl":"ブラック・マジシャン・ガール","Summoned Skull":"デーモンの召喚","Gaia The Fierce Knight":"暗黒騎士ガイア","Curse of Dragon":"カース・オブ・ドラゴン","Celtic Guardian":"エルフの剣士","Kuriboh":"クリボー","Jinzo":"人造人間－サイコ・ショッカー","Buster Blader":"バスター・ブレイダー","Black Luster Soldier":"カオス・ソルジャー","Exodia the Forbidden One":"封印されしエクゾディア","Left Arm of the Forbidden One":"封印されし者の左腕","Right Arm of the Forbidden One":"封印されし者の右腕","Left Leg of the Forbidden One":"封印されし者の左脚","Right Leg of the Forbidden One":"封印されし者の右脚","Relinquished":"サクリファイス","Dark Magician Girl the Dragon Knight":"竜騎士ブラック・マジシャン・ガール","Toon Dark Magician Girl":"トゥーン・ブラック・マジシャン・ガール","Slifer the Sky Dragon":"オシリスの天空竜","Obelisk the Tormentor":"オベリスクの巨神兵","The Winged Dragon of Ra":"ラーの翼神竜","Dark Magician of Chaos":"混沌の黒魔術師","Sangan":"クリッター","Witch of the Black Forest":"黒き森のウィッチ","Mystical Elf":"ホーリー・エルフ","Baby Dragon":"ベビードラゴン","Time Wizard":"時の魔術師","Red-Eyes Black Metal Dragon":"レッドアイズ・ブラックメタルドラゴン","Dark Paladin":"超魔導剣士－ブラック・パラディン","Chaos Emperor Dragon - Envoy of the End":"混沌帝龍 －終焉の使者－","Black Luster Soldier - Envoy of the Beginning":"カオス・ソルジャー －開闢の使者－","Marshmallon":"マシュマロン","Magician of Faith":"聖なる魔術師","Cyber Dragon":"サイバー・ドラゴン","Elemental HERO Neos":"E・HERO ネオス","Stardust Dragon":"スターダスト・ドラゴン","Black Rose Dragon":"ブラック・ローズ・ドラゴン","Number 39: Utopia":"No.39 希望皇ホープ"
};
function jpName(card){return JP_NAMES[card.name]||card.name;}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}
function typeJa(card){const t=String(card.type||"");if(t.includes("Spell"))return "魔法カード";if(t.includes("Trap"))return "罠カード";if(t.includes("Fusion"))return "融合モンスター";if(t.includes("Synchro"))return "シンクロモンスター";if(t.includes("Xyz"))return "エクシーズモンスター";if(t.includes("Link"))return "リンクモンスター";if(t.includes("Effect"))return "効果モンスター";return "通常モンスター";}
function attributeJa(a){return ({LIGHT:"光",DARK:"闇",FIRE:"炎",WATER:"水",WIND:"風",EARTH:"地",DIVINE:"神"})[String(a||"").toUpperCase()]||"";}
function raceJa(r){return ({Dragon:"ドラゴン族",Spellcaster:"魔法使い族",Warrior:"戦士族",Fiend:"悪魔族",Beast:"獣族","Beast-Warrior":"獣戦士族",Machine:"機械族",Fairy:"天使族",Aqua:"水族",Pyro:"炎族",Plant:"植物族",Rock:"岩石族",Zombie:"アンデット族",Thunder:"雷族","Winged-Beast":"鳥獣族",Dinosaur:"恐竜族","Sea-Serpent":"海竜族",Reptile:"爬虫類族",Psychic:"サイキック族",Wyrm:"幻竜族",Cyberse:"サイバース族"})[r]||r||"";}
function cardInfo(card){const parts=[typeJa(card)],a=attributeJa(card.attribute),r=raceJa(card.race);if(a)parts.push(a+"属性");if(r)parts.push(r);if(String(card.type||"").includes("Link") && card.linkval!=null)parts.push("LINK-"+card.linkval);else if(card.level!=null && card.level!=="")parts.push("★"+card.level);return parts.join(" / ");}
function statDisplay(v){if(v===-1||v==="-1"||v===null||v===undefined||v==="")return "？";const n=Number(v);return Number.isFinite(n)?String(n):"？";}
function cardStats(card){const hasAtk=card.atk!==undefined&&card.atk!==null&&card.atk!=="";const hasDef=card.def!==undefined&&card.def!==null&&card.def!=="";const atk=hasAtk?`ATK ${statDisplay(card.atk)}`:"",def=hasDef?`DEF ${statDisplay(card.def)}`:"";return [atk,def].filter(Boolean).join(" / ");}
function cardDisplay(card){return `<div class="card-name-jp">${escapeHtml(jpName(card))}</div><div class="card-name-en">${escapeHtml(card.name)}</div><div class="card-info-ja">${escapeHtml(cardInfo(card))}</div>${cardStats(card)?`<div class="card-stats">${escapeHtml(cardStats(card))}</div>`:""}`;}
const CPU_NAMES=["ミナト","スズ","トキ","アオイ","レン","コハク","ナギ"];
const setupScreen=document.getElementById("setupScreen"),gameScreen=document.getElementById("gameScreen"),restartButton=document.getElementById("restartButton"),playersElement=document.getElementById("players"),yourCardElement=document.getElementById("yourCard"),actionPanel=document.getElementById("actionPanel"),phaseLabel=document.getElementById("phaseLabel"),phaseTitle=document.getElementById("phaseTitle"),talkLog=document.getElementById("talkLog"),logCount=document.getElementById("logCount"),rulesDialog=document.getElementById("rulesDialog"),poolDialog=document.getElementById("poolDialog"),poolGrid=document.getElementById("poolGrid");
const speechCountSelect=document.getElementById("speechCount"),liePenaltyToggle=document.getElementById("liePenalty"),showLieCountToggle=document.getElementById("showLieCount");
if(showLieCountToggle) showLieCountToggle.checked=true;
const playerNameInput=document.getElementById("playerName"),winCountElement=document.getElementById("winCount"),lossCountElement=document.getElementById("lossCount"),gameWinCountElement=document.getElementById("gameWinCount"),gameLossCountElement=document.getElementById("gameLossCount");
const settingsDialog=document.getElementById("settingsDialog"),advancedSettingsButton=document.getElementById("advancedSettingsButton"),closeSettingsButton=document.getElementById("closeSettingsButton"),closeSettingsButtonBottom=document.getElementById("closeSettingsButtonBottom"),resetScoreButton=document.getElementById("resetScoreButton"),practicePlayerCountSelect=document.getElementById("practicePlayerCount");
const soloModeButton=document.getElementById("soloModeButton"),onlineModeButton=document.getElementById("onlineModeButton");
const onlineDialog=document.getElementById("onlineDialog"),closeOnlineButton=document.getElementById("closeOnlineButton"),createRoomButton=document.getElementById("createRoomButton"),joinRoomButton=document.getElementById("joinRoomButton"),roomCodeInput=document.getElementById("roomCodeInput"),onlineLobby=document.getElementById("onlineLobby"),onlineRoomCode=document.getElementById("onlineRoomCode"),onlinePlayerList=document.getElementById("onlinePlayerList"),onlineLobbyStatus=document.getElementById("onlineLobbyStatus"),onlineCpuCount=document.getElementById("onlineCpuCount"),onlineStartButton=document.getElementById("onlineStartButton"),leaveRoomButton=document.getElementById("leaveRoomButton");

let selectedPlayerCount=4,game=null,cpuTimer=null;
let matchRecord={wins:0,losses:0};
function shuffle(items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function randomItem(items){return items[Math.floor(Math.random()*items.length)];}
function cardImage(card){return card.image||"";}
function cardShort(card){return jpName(card);}
const AMBIGUOUS_CLUES=[
{id:"vague-cool",label:"かっこいいカードです",ambiguous:true},
{id:"vague-cute",label:"かわいいカードです",ambiguous:true},
{id:"vague-smart",label:"賢そうなカードです",ambiguous:true},
{id:"vague-powerful",label:"強そうなカードです",ambiguous:true},
{id:"vague-mysterious",label:"不思議な雰囲気のカードです",ambiguous:true}
];
const MAJOR_RACES=["Spellcaster","Dragon","Warrior","Fiend","Fairy","Beast","Winged-Beast","Machine"];
const ATTRIBUTE_OPTIONS=[
  ["LIGHT","光"],["DARK","闇"],["EARTH","地"],["WIND","風"],["FIRE","炎"],["WATER","水"],["DIVINE","神"]
];
const RACE_OPTIONS=[
  ["Spellcaster","魔法使い族"],["Dragon","ドラゴン族"],["Warrior","戦士族"],["Fiend","悪魔族"],
  ["Fairy","天使族"],["Beast","獣族"],["Winged-Beast","鳥獣族"],["Machine","機械族"]
];
const LEVEL_OPTIONS=Array.from({length:14},(_,i)=>i);
const LINK_OPTIONS=Array.from({length:6},(_,i)=>i+1);
const STAT_BUCKETS=[
  {id:"unknown",label:"？（不明／守備力を持たない）",test:v=>v===-1||v===null||v===undefined||v===""},
  {id:"le500",label:"500以下",test:v=>Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=500},
  {id:"le1000",label:"1000以下",test:v=>Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=1000},
  {id:"le1500",label:"1500以下",test:v=>Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=1500},
  {id:"le2000",label:"2000以下",test:v=>Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=2000},
  {id:"le2500",label:"2500以下",test:v=>Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=2500},
  {id:"ge2501",label:"2501以上",test:v=>Number.isFinite(Number(v))&&Number(v)>=2501}
];
function initialCharOptions(){
  const chars=[...new Set(CARD_POOL.map(c=>jpName(c).trim().charAt(0)).filter(Boolean))];
  return chars.sort((a,b)=>a.localeCompare(b,"ja"));
}
function featureList(card){
  const list=[
    {id:"monster",label:"モンスターカードです",test:c=>String(c.type||"").includes("Monster")},
    {id:"spell",label:"魔法カードです",test:c=>String(c.type||"").includes("Spell")},
    {id:"trap",label:"罠カードです",test:c=>String(c.type||"").includes("Trap")},
    {id:"effect",label:"効果を持つカードです",test:c=>/Effect|Fusion|Synchro|Xyz|Link/.test(String(c.type||""))},
    {id:"normal",label:"通常モンスターです",test:c=>String(c.type||"").includes("Normal")},
    {id:"dragon",label:"ドラゴン族です",test:c=>String(c.race||"")==="Dragon"},
    {id:"spellcaster",label:"魔法使い族です",test:c=>String(c.race||"")==="Spellcaster"},
    {id:"warrior",label:"戦士族です",test:c=>String(c.race||"")==="Warrior"},
    {id:"fiend",label:"悪魔族です",test:c=>String(c.race||"")==="Fiend"},
    {id:"beast",label:"獣族です",test:c=>String(c.race||"")==="Beast"},
    {id:"winged-beast",label:"鳥獣族です",test:c=>String(c.race||"")==="Winged-Beast"},
    {id:"machine",label:"機械族です",test:c=>String(c.race||"")==="Machine"},
    {id:"fairy",label:"天使族です",test:c=>String(c.race||"")==="Fairy"},
    {id:"minor-race",label:"マイナーな種族です",test:c=>{const r=String(c.race||"");return Boolean(r)&&!MAJOR_RACES.includes(r);}},
    ...ATTRIBUTE_OPTIONS.map(([value,label])=>({id:`attribute-${value.toLowerCase()}`,label:`${label}属性です`,test:c=>String(c.attribute||"").toUpperCase()===value})),
    ...LEVEL_OPTIONS.map(level=>({id:`level-${level}`,label:`レベル／ランクが${level}です`,test:c=>!String(c.type||"").includes("Link")&&Number(c.level)===level})),
    ...LINK_OPTIONS.map(link=>({id:`link-${link}`,label:`リンク${link}です`,test:c=>String(c.type||"").includes("Link")&&Number(c.linkval)===link})),
    ...STAT_BUCKETS.flatMap(bucket=>[
      {id:`atk-${bucket.id}`,label:`攻撃力が${bucket.label}です`,test:c=>bucket.test(c.atk)},
      {id:`def-${bucket.id}`,label:`守備力が${bucket.label}です`,test:c=>bucket.test(c.def)}
    ]),
    {id:"high-atk",label:"攻撃力が2500以上です",test:c=>Number.isFinite(Number(c.atk))&&Number(c.atk)>=2500},
    {id:"low-atk",label:"攻撃力が1500以下です",test:c=>Number.isFinite(Number(c.atk))&&Number(c.atk)<=1500},
    {id:"high-def",label:"守備力が2500以上です",test:c=>Number.isFinite(Number(c.def))&&Number(c.def)>=2500},
    {id:"name-blue",label:"「青眼」に関係するカードです",test:c=>c.name.includes("Blue-Eyes")},
    {id:"name-dark",label:"「ブラック」または「ダーク」に関係する名前です",test:c=>c.name.includes("Dark")||c.name.includes("Black")},
    {id:"name-red",label:"「真紅眼」に関係するカードです",test:c=>c.name.includes("Red-Eyes")},
    {id:"toon",label:"「トゥーン」の名前を持ちます",test:c=>c.name.includes("Toon")},
    {id:"forbidden",label:"「封印されし」の名前を持ちます",test:c=>c.name.includes("Forbidden")}
  ];
  return list;
}
function statementsFor(card){return featureList(card).filter(f=>{try{return f.test(card);}catch{return false;}});}
function falseStatementsFor(card){return featureList(card).filter(f=>{try{return !f.test(card);}catch{return false;}});}
function chooseCardPair(){const cards=shuffle(CARD_POOL);for(let i=0;i<500;i++){const citizen=randomItem(cards),cf=statementsFor(citizen).map(x=>x.id),candidates=cards.filter(c=>c.name!==citizen.name&&statementsFor(c).some(f=>cf.includes(f.id)));if(candidates.length)return[citizen,randomItem(candidates)];}return cards.slice(0,2);}
function syncPracticePlayerCount(){
  const value=Number(practicePlayerCountSelect?.value||4);
  selectedPlayerCount=Math.min(8,Math.max(3,value));
  if(practicePlayerCountSelect) practicePlayerCountSelect.value=String(selectedPlayerCount);
}
function getSettings(){return{speechRounds:Number(speechCountSelect.value||2),liePenalty:Boolean(liePenaltyToggle.checked),showLieCount:Boolean(showLieCountToggle&& !showLieCountToggle.checked)};}
function randomPlayerName(){return randomItem(["ユウ","カイ","レン","アキラ","ナギ","ハヤト","ソラ","ミナ","リク","シン"]);}
function getPlayerName(){const n=(playerNameInput?.value||"").trim();return n||randomPlayerName();}
function renderRecord(){if(winCountElement)winCountElement.textContent=matchRecord.wins;if(lossCountElement)lossCountElement.textContent=matchRecord.losses;if(gameWinCountElement)gameWinCountElement.textContent=matchRecord.wins;if(gameLossCountElement)gameLossCountElement.textContent=matchRecord.losses;}
function buildOrder(round){return round===1?Array.from({length:selectedPlayerCount},(_,i)=>i):Array.from({length:selectedPlayerCount},(_,i)=>selectedPlayerCount-1-i);}
function startGame(){
  clearTimeout(cpuTimer);
  syncPracticePlayerCount();
  if(CARD_POOL.length<2){alert("カードデータがありません。先にカード準備を完了してください。");return;}
  const [citizenCard,wolfCard]=chooseCardPair(),wolfIndex=Math.floor(Math.random()*selectedPlayerCount),humanName=getPlayerName(),players=Array.from({length:selectedPlayerCount},(_,index)=>({id:index,name:index===0?humanName:CPU_NAMES[index-1],isHuman:index===0,isWolf:index===wolfIndex,card:index===wolfIndex?wolfCard:citizenCard,clues:[],lies:0,vote:null})),settings=getSettings();
  game={citizenCard,wolfCard,wolfIndex,players,settings,round:1,order:buildOrder(1),orderIndex:0,phase:"clue",logs:[],usedClueIds:[],currentOptions:[],busy:false,tallies:null,eliminatedId:null,result:null,reverseGuess:null,recorded:false,clueMenu:"root"};
  setupScreen.hidden=true;
  gameScreen.hidden=false;
  renderGame();
  const mainScroller=document.querySelector("main"); if(mainScroller) mainScroller.scrollTop=0; else window.scrollTo({top:0,behavior:"auto"});
}
function renderGame(){renderPlayers();renderYourCard();renderLog();renderActionPanel();}
function previousPlayer(){if(!game||game.orderIndex<=0)return null;return game.players[game.order[game.orderIndex-1]];}
function currentPlayer(){return game.players[game.order[game.orderIndex]];}
function renderPlayers(){playersElement.innerHTML=game.players.map(p=>{const current=game.phase==="clue"&&game.order[game.orderIndex]===p.id,reveal=game.phase==="result";const clues=p.clues||[];const clueHtml=clues.length?clues.map((c,i)=>`<p><b>${i+1}.</b> 「${escapeHtml(c.label)}」</p>`).join(""):(current?'<p class="muted thinking-text">発言を考えています…</p>':'<p class="muted">まだ発言していません</p>');return `<article class="player-seat ${p.isHuman?"is-you":""} ${current?"is-current":""} ${game.eliminatedId===p.id?"is-eliminated":""} ${reveal?"is-reveal":""}"><div class="avatar">${p.isHuman?"YOU":String(p.id).padStart(2,"0")}</div><div class="seat-copy"><div class="seat-name"><strong>${p.name}</strong>${p.isHuman?"<span>あなた</span>":"<span>CPU</span>"}</div><div class="player-clues">${clueHtml}</div></div>${game.settings&&game.settings.showLieCount&&p.lies?`<span class="lie-count">嘘 ${p.lies}</span>`:""}${reveal?`<span class="vote-badge">${game.tallies&&game.tallies[p.id]!=null?game.tallies[p.id]:0}票</span><div class="result-meta"><span class="role-reveal ${p.isWolf?"wolf":"citizen"}">${p.isWolf?"狼":"市民"} · ${cardShort(p.card)}</span></div>`:""}</article>`;}).join("");}
function renderYourCard(){const card=game.players[0].card;yourCardElement.className="playing-card ygo";yourCardElement.innerHTML=`<div class="ygo-card-face"><img src="${cardImage(card)}" alt="${escapeHtml(jpName(card))}"></div><div class="your-card-meta">${cardDisplay(card)}</div>`;}
function renderLog(){logCount.textContent=`${game.logs.length} 件`;talkLog.innerHTML=game.logs.length?game.logs.map((e,i)=>`<article class="log-entry ${e.type||""}"><span>${String(i+1).padStart(2,"0")}</span><strong>${e.name}</strong><p>${e.text}</p></article>`).join(""):`<p class="empty-log">発言が始まると、ここに記録されます。</p>`;}
function renderActionPanel(){if(game.phase==="clue")renderCluePhase();else if(game.phase==="vote")renderVotePhase();else if(game.phase==="reverse")renderReversePhase();else renderResultPhase();}
const CLUE_MENU_CATEGORIES=[
  {id:"basic",label:"基本の特徴"},
  {id:"level",label:"レベル／ランク／リンク"},
  {id:"attribute",label:"属性"},
  {id:"race",label:"種族"},
  {id:"atk",label:"攻撃力"},
  {id:"def",label:"守備力"}
];
function availableClues(player){
 const used=new Set(game.usedClueIds||[]);
 let truthful=shuffle(statementsFor(player.card)).filter(s=>!used.has(s.id));
 let falsehoods=shuffle(falseStatementsFor(player.card)).filter(s=>!used.has(s.id));
 let options=[...truthful.slice(0,4),...falsehoods.slice(0,2)];
 if(game.settings.speechRounds>=2 && !(player.clues||[]).some(c=>c.ambiguous)){
   const vague=shuffle(AMBIGUOUS_CLUES).filter(v=>!used.has(v.id));
   if(vague.length) options.push(vague[0]);
 }
 if(options.length<4){const extra=shuffle(featureList(player.card)).filter(s=>!used.has(s.id)&&!options.some(o=>o.id===s.id));options.push(...extra.slice(0,4-options.length));}
 return shuffle(options).slice(0,6);
}
function clueCategoryOptions(category){
 if(category==="basic") return [
   {id:"monster",label:"モンスターカードです"},
   {id:"spell",label:"魔法カードです"},
   {id:"trap",label:"罠カードです"}
 ];
 if(category==="level") return [...LEVEL_OPTIONS.map(v=>({id:`level-${v}`,label:`レベル／ランクが${v}です`})), ...LINK_OPTIONS.map(v=>({id:`link-${v}`,label:`リンク${v}です`}))];
 if(category==="attribute") return ATTRIBUTE_OPTIONS.map(([v,l])=>({id:`attribute-${v.toLowerCase()}`,label:`${l}属性です`}));
 if(category==="race") { const raceIds={Spellcaster:"spellcaster",Dragon:"dragon",Warrior:"warrior",Fiend:"fiend",Fairy:"fairy",Beast:"beast","Winged-Beast":"winged-beast",Machine:"machine"}; return [...RACE_OPTIONS.map(([v,l])=>({id:raceIds[v],label:`${l}です`})),{id:"minor-race",label:"マイナーな種族です"}]; }
 if(category==="atk") return STAT_BUCKETS.map(b=>({id:`atk-${b.id}`,label:`攻撃力が${b.label}です`}));
 if(category==="def") return STAT_BUCKETS.map(b=>({id:`def-${b.id}`,label:`守備力が${b.label}です`}));
 return [];
}
function findClueById(id){return [...featureList(game.players[game.order[game.orderIndex]].card),...AMBIGUOUS_CLUES].find(s=>s.id===id);}
function renderCluePhase(){
 const current=currentPlayer(),roundLabel=game.round===1?"第1ラウンド":"第2ラウンド（逆順）";
 phaseLabel.textContent=`PHASE ${game.round} / ${roundLabel}・特徴を話す`;
 phaseTitle.textContent=current.isHuman?"あなたの特徴を話そう":`${current.name}の発言を聞こう`;
 if(!current.isHuman){
   actionPanel.innerHTML=`<div class="thinking-state"><span class="thinking-card" aria-hidden="true">?</span><div><p>CPU TURN</p><h2>${current.name}が考えています</h2><span>前の発言とは違う特徴を選んでいます…</span></div></div>`;return;
 }
 const root=game.clueMenu||"root";
 if(root==="root"){
   const base=availableClues(current);
   game.currentOptions=base;
   actionPanel.innerHTML=`<div class="action-heading"><p>${roundLabel}</p><h2>何と発言しますか？</h2><span>カテゴリから詳しい条件を選べます。${game.settings.liePenalty?"狼が2回以上嘘をつくと逆転チャンスを失います。":"嘘の回数によるペナルティはありません。"}</span></div><div class="clue-category-grid">${CLUE_MENU_CATEGORIES.map(c=>`<button class="choice-button clue-category-button" type="button" data-clue-category="${c.id}"><span>${c.label}</span><span>→</span></button>`).join("")}</div><div class="choice-list basic-clue-list"><p class="clue-list-label">すぐに選べる特徴</p>${base.map(s=>`<button class="choice-button ${s.ambiguous?"ambiguous-choice":""}" type="button" data-clue-id="${s.id}"><span>${s.label}</span><span>${s.ambiguous?"曖昧":"→"}</span></button>`).join("")}</div>`;
   actionPanel.querySelectorAll("[data-clue-category]").forEach(b=>b.addEventListener("click",()=>{game.clueMenu=b.dataset.clueCategory;renderCluePhase();}));
 }else{
   const options=clueCategoryOptions(root);
   game.currentOptions=options.map(o=>findClueById(o.id)).filter(Boolean);
   const usedIds=new Set(game.usedClueIds||[]);
   actionPanel.innerHTML=`<div class="action-heading"><p>${roundLabel}</p><h2>${CLUE_MENU_CATEGORIES.find(c=>c.id===root)?.label||"特徴を選択"}</h2><span>一覧から選択してください。ほかのプレイヤーが発言済みの内容は選択できません。</span></div><div class="choice-list submenu-choice-list">${options.map(o=>{const used=usedIds.has(o.id);return `<button class="choice-button ${used?"choice-used":""}" type="button" data-clue-id="${o.id}" ${used?"disabled aria-disabled=\"true\"":""}><span>${o.label}</span><span>${used?"発言済み":"→"}</span></button>`;}).join("")}</div><button class="secondary-button compact clue-back-button" id="clueBackButton" type="button">← 戻る</button>`;
   actionPanel.querySelector("#clueBackButton").addEventListener("click",()=>{game.clueMenu="root";renderCluePhase();});
 }
 actionPanel.querySelectorAll("[data-clue-id]").forEach(b=>b.addEventListener("click",()=>submitHumanClue(b.dataset.clueId)));
}
function submitHumanClue(id){
 if(game.busy||game.phase!=="clue")return;
 game.busy=true;
 const current=currentPlayer(),statement=findClueById(id)||game.currentOptions.find(s=>s?.id===id);
 if(!statement||game.usedClueIds.includes(statement.id)){game.busy=false;renderCluePhase();return;}
 const buttons=actionPanel.querySelectorAll("[data-clue-id]");buttons.forEach(b=>b.disabled=true);
 if(submitClue(current,statement))advanceClueTurn();else game.busy=false;
}
function submitClue(player,statement){if(!statement||game.usedClueIds.includes(statement.id))return false;const truthful=statement.ambiguous ? true : statement.test(player.card);player.clues.push(statement);game.usedClueIds.push(statement.id);if(!truthful)player.lies+=1;game.logs.push({name:player.name,text:`「${statement.label}」と発言しました。`});return true;}
function submitHumanClue(id){if(game.busy||game.phase!=="clue")return;game.busy=true;const current=currentPlayer(),statement=game.currentOptions.find(s=>s.id===id);if(!statement||game.usedClueIds.includes(statement.id)){game.busy=false;renderCluePhase();return;}const buttons=actionPanel.querySelectorAll("[data-clue-id]");buttons.forEach(b=>b.disabled=true);if(submitClue(current,statement))advanceClueTurn();else game.busy=false;}
function safeTest(statement, card){
  if(!statement || statement.ambiguous || typeof statement.test!=="function") return false;
  try{return Boolean(statement.test(card));}catch{return false;}
}
function availableCpuClues(player){
  const used=new Set(game.usedClueIds||[]);
  // CPU never uses ambiguous statements. They are reserved for the human player.
  let options=shuffle(featureList(player.card)).filter(s=>!used.has(s.id));
  if(!options.length){
    options=shuffle(featureList(player.card));
  }
  return options.slice(0,8);
}
function cpuFallbackStatement(player,used){
 const candidates=featureList(player.card).filter(s=>!used.has(s.id));
 if(candidates.length)return randomItem(candidates);
 // This should be practically unreachable with the expanded feature pool,
 // but guarantees that a CPU turn can never silently disappear.
 return {id:`cpu-fallback-${player.id}-${game.round}-${game.orderIndex}`,label:"カードの特徴を持つカードです",test:()=>true};
}
function playNextCpuTurn(){
 if(!game||game.phase!=="clue"||game.busy)return;
 const turnRound=game.round,turnIndex=game.orderIndex,player=currentPlayer();
 game.busy=true;
 const used=new Set(game.usedClueIds||[]);
 let truthful=shuffle(statementsFor(player.card)).filter(s=>!used.has(s.id));
 let falsehoods=shuffle(falseStatementsFor(player.card)).filter(s=>!used.has(s.id));
 let statement=null;
 if(!player.isWolf){statement=truthful[0]||cpuFallbackStatement(player,used);}
 else{
   const citizen=game.citizenCard;
   const shared=truthful.filter(st=>safeTest(st,citizen));
   statement=shared[0]||truthful[0]||falsehoods[0]||cpuFallbackStatement(player,used);
 }
 setTimeout(()=>{
   if(!game||game.phase!=="clue"||game.round!==turnRound||game.orderIndex!==turnIndex){if(game)game.busy=false;return;}
   try{
     if(submitClue(player,statement)){advanceClueTurn();}
     else{game.busy=false;advanceClueTurn();}
   }catch(e){console.error("CPU clue failed",e);game.busy=false;advanceClueTurn();}
 },450);
}
function advanceClueTurn(){
 if(!game||game.phase!=="clue")return;
 game.busy=false;game.currentOptions=[];game.clueMenu="root";
 game.orderIndex+=1;
 if(game.orderIndex>=game.order.length){
   if(game.round<game.settings.speechRounds){
     game.round+=1;game.order=buildOrder(game.round);game.orderIndex=0;
     game.logs.push({type:"system",name:"ラウンド切替",text:`第${game.round}ラウンド。発言順を逆にします。`});
     renderGame();
     if(!currentPlayer().isHuman)cpuTimer=setTimeout(playNextCpuTurn,650);
     return;
   }
   game.phase="vote";renderGame();return;
 }
 renderGame();
 if(!currentPlayer().isHuman)cpuTimer=setTimeout(playNextCpuTurn,650);
}
function renderVotePhase(){phaseLabel.textContent="PHASE / 狼に投票する";phaseTitle.textContent="違うカードの人は誰？";const candidates=game.players.filter(p=>!p.isHuman);actionPanel.innerHTML=`<div class="action-heading"><p>VOTING TIME</p><h2>狼だと思う人を選ぶ</h2><span>2ラウンドの発言を振り返って、ひとりに投票してください。</span></div><div class="vote-grid">${candidates.map(p=>`<button class="vote-button" type="button" data-vote-id="${p.id}"><span class="mini-avatar">${String(p.id).padStart(2,"0")}</span><span><strong>${p.name}</strong><small>${p.clues.map(c=>`「${c.label}」`).join(" / ")}</small></span></button>`).join("")}</div>`;actionPanel.querySelectorAll("[data-vote-id]").forEach(b=>b.addEventListener("click",()=>submitVotes(Number(b.dataset.voteId))));}
function chooseCpuVote(voter){const candidates=game.players.filter(p=>p.id!==voter.id);return candidates.map(candidate=>{const contradictions=candidate.clues.filter(clue=>!clue.ambiguous && !safeTest(clue,voter.card)).length;const lies=candidate.lies;return{id:candidate.id,score:contradictions*2.2+lies*1.1+Math.random()*1.4};}).sort((a,b)=>b.score-a.score)[0].id;}
function submitVotes(humanVoteId){game.players[0].vote=humanVoteId;game.players.slice(1).forEach(p=>p.vote=chooseCpuVote(p));const tallies=Object.fromEntries(game.players.map(p=>[p.id,0]));game.players.forEach(p=>{if(tallies[p.vote]!=null)tallies[p.vote]++;});game.tallies=tallies;const high=Math.max(...Object.values(tallies)),tied=game.players.filter(p=>tallies[p.id]===high),eliminated=randomItem(tied);game.eliminatedId=eliminated.id;game.logs.push({type:"system",name:"投票結果",text:tied.length>1?`${high}票で同票。抽選により${eliminated.name}が選ばれました。`:`${eliminated.name}が${high}票で選ばれました。`});if(eliminated.isWolf){if(game.settings.liePenalty&&game.players[game.wolfIndex].lies>=2){game.result="citizen";game.logs.push({type:"system",name:"ペナルティ",text:"狼は2回以上の嘘をついたため、逆転チャンスを失いました。"});game.phase="result";}else game.phase="reverse";}else{game.result="wolf";game.phase="result";}renderGame();}
function voteSummaryHtml(){
  if(!game||!game.tallies) return "";
  const rows=game.players.map(p=>`<div class="vote-row"><span>${escapeHtml(p.name)}</span><strong>${game.tallies[p.id]||0}票</strong></div>`).join("");
  return `<section class="vote-summary-panel"><h3>投票結果</h3><p>誰が何票集めたかを確認できます。</p>${rows}</section>`;
}
function renderReversePhase(){phaseLabel.textContent="FINAL PHASE / 狼の逆転チャンス";const wolf=game.players[game.wolfIndex];phaseTitle.textContent=`${wolf.name}は狼だった！`;if(wolf.isHuman){actionPanel.innerHTML=`<div class="action-heading danger"><p>あなたは狼です</p><h2>市民カードを当てよう</h2><span>市民カードと同じカードを選べば逆転勝利です。</span></div><div class="guess-card-grid">${CARD_POOL.filter(c=>c.name!==wolf.card.name).map(c=>`<button class="guess-card-button" data-guess="${escapeHtml(c.name)}"><img src="${cardImage(c)}" alt="${escapeHtml(jpName(c))}"><span>${escapeHtml(jpName(c))}</span><small>${escapeHtml(cardInfo(c))}</small><small>${escapeHtml(cardStats(c))}</small></button>`).join("")}</div>`;actionPanel.querySelectorAll("[data-guess]").forEach(b=>b.addEventListener("click",()=>finishReverseGuess(CARD_POOL.find(c=>c.name===b.dataset.guess))));return;}actionPanel.innerHTML=`<div class="wolf-reveal"><span class="wolf-eye" aria-hidden="true">W</span><div><p>最終チャンス</p><h2>${wolf.name}が市民カードを推理します</h2><span>当てられたら、狼の逆転勝利です。</span></div></div><button class="primary-button compact" id="cpuGuessButton" type="button"><span>逆転宣言を見る</span><span>→</span></button>`;document.getElementById("cpuGuessButton").addEventListener("click",submitCpuGuess);}
function submitCpuGuess(){
  if(!game || game.phase!=="reverse") return;
  const wolf=game.players[game.wolfIndex];
  const clues=game.players.filter(p=>!p.isWolf).flatMap(p=>p.clues||[]);
  const candidates=CARD_POOL
    .filter(c=>c.name!==wolf.card.name)
    .map(card=>{
      const score=clues.reduce((s,clue)=>{
        // Ambiguous statements are not objective card features, so they
        // must not be evaluated as clue.test().
        if(!clue || clue.ambiguous || typeof clue.test!=="function") return s;
        try { return s + (clue.test(card)?1:0); } catch(e) { return s; }
      },0) + Math.random()*0.35;
      return {card,score};
    })
    .sort((a,b)=>b.score-a.score);
  finishReverseGuess(candidates[0]?.card||game.citizenCard);
}
function finishReverseGuess(guess){game.reverseGuess=guess;const correct=guess&&guess.name===game.citizenCard.name;game.result=correct?"wolf-reversal":"citizen";game.logs.push({type:"system",name:"逆転宣言",text:`狼は「${guess?jpName(guess):"不明"}」と宣言しました。`});game.phase="result";renderGame();}
function recordFinishedGame(){if(!game||game.recorded)return;const wolfWon=game.result==="wolf"||game.result==="wolf-reversal";if(game.players[0].isWolf===wolfWon)matchRecord.wins++;else matchRecord.losses++;game.recorded=true;renderRecord();}
function renderResultPhase(){recordFinishedGame();phaseLabel.textContent="GAME OVER / 答え合わせ";const wolfWon=game.result==="wolf"||game.result==="wolf-reversal";phaseTitle.textContent=wolfWon?"狼チームの勝利":"市民チームの勝利";const msg={wolf:"選ばれたプレイヤーは市民でした。狼は正体を隠し切りました。","wolf-reversal":`狼が市民カード「${jpName(game.citizenCard)}」を見事に当て、逆転しました。`,citizen:`狼の宣言は「${game.reverseGuess?jpName(game.reverseGuess):"不明"}」。正解は「${jpName(game.citizenCard)}」でした。`}[game.result];actionPanel.innerHTML=`<div class="result-banner ${wolfWon?"wolf-win":"citizen-win"}"><p>${wolfWon?"狼チームの勝利":"市民チームの勝利"}</p><h2>${wolfWon?"狼の勝利":"市民の勝利"}</h2><span>${msg}</span></div><div class="answer-cards"><div><small>市民カード</small><img class="ygo-thumb" src="${cardImage(game.citizenCard)}"><strong>${jpName(game.citizenCard)}</strong><em>${cardInfo(game.citizenCard)}${cardStats(game.citizenCard)?" · "+cardStats(game.citizenCard):""}</em></div><div><small>狼カード</small><img class="ygo-thumb" src="${cardImage(game.wolfCard)}"><strong>${jpName(game.wolfCard)}</strong><em>${cardInfo(game.wolfCard)}${cardStats(game.wolfCard)?" · "+cardStats(game.wolfCard):""}</em></div></div><button class="primary-button compact" id="playAgainButton" type="button"><span>もう一度遊ぶ</span><span>↻</span></button>`;document.getElementById("playAgainButton").addEventListener("click",startGame);}
function returnToSetup(){
  clearTimeout(cpuTimer);
  clearTimeout(onlineCpuTimer);
  // Detach Firebase listeners immediately; cleanup is best-effort and never
  // blocks the UI from returning to the setup screen.
  if(onlineRoomUnsubscribe){try{onlineRoomUnsubscribe();}catch{}}
  if(onlineActionUnsubscribe){try{onlineActionUnsubscribe();}catch{}}
  onlineRoomUnsubscribe=null;
  onlineActionUnsubscribe=null;
  const oldRoom=onlineRoomCodeValue;
  onlineRoomCodeValue="";
  onlineHost=false;
  onlineHostSecrets=null;
  onlineGame=null;
  onlineMyCard=null;
  onlineLastActionId="";
  onlineScoreRecorded=false;
  try{onlineDialog.close();}catch{}
  onlineDialog.removeAttribute("open");
  if(oldRoom){
    // Best-effort removal of this user's membership. Never await it here.
    firebaseAuthPromise.then(()=>remove(ref(firebaseDb,`rooms/${oldRoom}/players/${firebaseUid}`))).catch(()=>{});
  }
  onlineMode=false;
  window.cardWolfOnlineMode=false;
  soloModeButton.classList.remove("is-selected");
  onlineModeButton.classList.remove("is-selected");
  soloModeButton.setAttribute("aria-pressed","false");
  onlineModeButton.setAttribute("aria-pressed","false");
  game=null;
  setupScreen.hidden=false;
  gameScreen.hidden=true;
  actionPanel.innerHTML="";
  talkLog.innerHTML="";
  logCount.textContent="0 messages";
  const mainScroller=document.querySelector("main"); if(mainScroller) mainScroller.scrollTop=0; else window.scrollTo({top:0,behavior:"auto"});
}
function openPool(){poolGrid.innerHTML=CARD_POOL.map(c=>`<div class="pool-card"><img src="${cardImage(c)}" alt="${escapeHtml(jpName(c))}">${cardDisplay(c)}</div>`).join("");poolDialog.showModal();}
practicePlayerCountSelect?.addEventListener("change",syncPracticePlayerCount);
restartButton.addEventListener("click",returnToSetup);document.getElementById("rulesButton").addEventListener("click",()=>rulesDialog.showModal());document.getElementById("closeRulesButton").addEventListener("click",()=>rulesDialog.close());document.getElementById("poolButton").addEventListener("click",openPool);document.getElementById("closePoolButton").addEventListener("click",()=>poolDialog.close());advancedSettingsButton.addEventListener("click",()=>settingsDialog.showModal());closeSettingsButton.addEventListener("click",()=>settingsDialog.close());closeSettingsButtonBottom.addEventListener("click",()=>settingsDialog.close());resetScoreButton.addEventListener("click",()=>{matchRecord={wins:0,losses:0};renderRecord();});rulesDialog.addEventListener("click",e=>{if(e.target===rulesDialog)rulesDialog.close();});poolDialog.addEventListener("click",e=>{if(e.target===poolDialog)poolDialog.close();});settingsDialog.addEventListener("click",e=>{if(e.target===settingsDialog)settingsDialog.close();});syncPracticePlayerCount();renderRecord();if(CARD_POOL.length===0)soloModeButton.disabled=true;







/* v26 ONLINE MODE
   Host-authoritative prototype using Firebase Realtime Database.
   Secrets (cards/roles) are kept locally by the host and each player's own
   card is also written to a per-user private node protected by Firebase rules.
*/
let onlineMode=false;
let onlineRoomCodeValue="";
let onlineRoomUnsubscribe=null;
let onlineActionUnsubscribe=null;
let onlineGame=null;
let onlineMyCard=null;
let onlineHost=false;
let onlineHostSecrets=null;
let onlineCpuTimer=null;
let onlineLastActionId="";
const onlineProcessedActionIds=new Set();
const onlineActionPromises=new Map();
let onlineScoreRecorded=false;
let onlinePendingAction=null;
let onlineDiscussionTimer=null;
let onlineDiscussionDeadlineAt=0;
let onlineHostActionQueue=Promise.resolve();
let onlineHostProcessing=false;
let onlineMatchId="";

function setMode(isOnline){
  onlineMode=Boolean(isOnline);
  window.cardWolfOnlineMode=onlineMode;
  soloModeButton.classList.remove("is-selected");
  onlineModeButton.classList.remove("is-selected");
  soloModeButton.setAttribute("aria-pressed","false");
  onlineModeButton.setAttribute("aria-pressed","false");
  if(onlineMode){
    // Open the lobby immediately. Use a non-modal fallback as a safety net
    // so the button never appears to do nothing on a browser/runtime issue.
    try{
      if(!onlineDialog.open) onlineDialog.showModal();
    }catch(e){
      console.warn("showModal failed; using open fallback",e);
      onlineDialog.setAttribute("open","");
    }
  } else {
    try{onlineDialog.close();}catch{}
    onlineDialog.removeAttribute("open");
  }
}

// Keep the mode buttons wired near their definition so a later optional UI
// failure cannot prevent the online button from receiving its click handler.
// The data attributes also make the controls usable with keyboard/touch input.
soloModeButton.addEventListener("click",()=>{ setMode(false); startGame(); });
onlineModeButton.addEventListener("click",()=>setMode(true));
function onlineRoomRef(){return ref(firebaseDb,`rooms/${onlineRoomCodeValue}`);}
function makeRoomCode(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<4;i++)s+=chars[Math.floor(Math.random()*chars.length)];return s;}
function onlineSettings(){return {...getSettings(),voiceMode:false,discussionSeconds:120};}
function getOnlineLobbySettings(){
  const voice=Boolean(document.getElementById("onlineVoiceMode")?.checked);
  const seconds=Math.max(60,Number(document.getElementById("onlineDiscussionMinutes")?.value||120));
  return {...onlineSettings(),voiceMode:voice,discussionSeconds:seconds};
}
function syncOnlineLobbySettings(data){
  const s=data?.settings||onlineSettings();
  const voiceEl=document.getElementById("onlineVoiceMode"), timeEl=document.getElementById("onlineDiscussionMinutes"), maxEl=document.getElementById("onlineMaxPlayers");
  if(voiceEl) voiceEl.checked=Boolean(s.voiceMode);
  if(timeEl) timeEl.value=String(Number(s.discussionSeconds||120));
  if(maxEl) maxEl.value=String(Math.min(8,Math.max(3,Number(data?.maxPlayers||4))));
  if(onlineHost){
    const row=document.getElementById("onlineVoiceSettingRow"); if(row) row.hidden=false;
    const cpu=document.getElementById("onlineCpuSettingRow"); if(cpu) cpu.hidden=false;
    if(maxEl) maxEl.disabled=false;
  } else {
    const row=document.getElementById("onlineVoiceSettingRow"); if(row) row.hidden=true;
    const cpu=document.getElementById("onlineCpuSettingRow"); if(cpu) cpu.hidden=true;
    if(maxEl) maxEl.disabled=true;
  }
}
function onlinePublicPlayers(){
  return (onlineGame?.players||[]).map(p=>({id:p.id,name:p.name,isHuman:Boolean(p.isHuman),clues:(p.clues||[]).map(c=>({id:c.id,label:c.label,ambiguous:Boolean(c.ambiguous)})),vote:p.vote??null}));
}
function onlineSnapshot(extra={}){
  // Firebase rejects undefined values. Replay can receive an older snapshot
  // where reverseGuess is a card object or a string, so normalize both forms.
  const rg=onlineGame?.reverseGuess;
  const reverseGuessName=typeof rg==="string"?rg:(rg?.name||null);
  const revealSource=extra.reveal!==undefined?extra.reveal:(onlineGame?.reveal||null);
  const reveal=revealSource?{
    ...revealSource,
    reverseGuess:(typeof revealSource.reverseGuess==="string"?revealSource.reverseGuess:(revealSource.reverseGuess?.name||null))
  }:null;
  return {
    matchId:onlineGame.matchId||onlineMatchId||"",
    phase:onlineGame.phase, round:onlineGame.round, order:Array.isArray(onlineGame.order)?onlineGame.order:[],
    orderIndex:Number.isFinite(Number(onlineGame.orderIndex))?Number(onlineGame.orderIndex):0,
    discussionStartedAt:onlineGame.discussionStartedAt||null, discussionDeadlineAt:onlineGame.discussionDeadlineAt||null,
    usedClueIds:Array.isArray(onlineGame.usedClueIds)?onlineGame.usedClueIds:[],
    logs:Array.isArray(onlineGame.logs)?onlineGame.logs:[], settings:onlineGame.settings||onlineSettings(),
    players:onlinePublicPlayers(), tallies:onlineGame.tallies||null,
    eliminatedId:onlineGame.eliminatedId??null, result:onlineGame.result??null,
    reverseGuess:reverseGuessName, reveal, updatedAt:Date.now()
  };
}
async function hostWriteGame(){
  if(!onlineHost||!onlineRoomCodeValue||!onlineGame)return;
  await update(onlineRoomRef(),{game:onlineSnapshot({reveal:onlineGame.reveal||null})});
}
async function ensureFirebase(){
  try{
    return await ensureFirebaseAuth();
  }catch(e){
    alert(firebaseAuthErrorText(e));
    throw e;
  }
}
function lobbyPlayersFromValue(v){return Object.values(v?.players||{});}
function renderOnlineLobby(data){
  const players=lobbyPlayersFromValue(data);
  onlineRoomCode.textContent=onlineRoomCodeValue||"----";
  onlinePlayerList.innerHTML=players.map(p=>`<div class="online-player-row"><span class="mini-avatar">${p.host?"H":"P"}</span><strong>${escapeHtml(p.name)}</strong><small>${p.host?"ホスト":"参加中"}</small></div>`).join("");
  const max=Math.min(8,Math.max(3,Number(data?.maxPlayers||4)));
  const humanCount=players.length;
  const minCpu=Math.max(0,3-humanCount);
  const selected=Math.max(minCpu,Math.min(Number(onlineCpuCount.value||0),8-humanCount));
  onlineCpuCount.value=String(selected);
  onlineCpuCount.disabled=!onlineHost;
  syncOnlineLobbySettings(data);
  onlineStartButton.hidden=!onlineHost;
  onlineStartButton.disabled=!onlineHost||humanCount<1;
  onlineLobbyStatus.textContent=`${humanCount}/${max}人・${data?.status==="playing"?"ゲーム中":"待機中"}`;
}
async function createOnlineRoom(){
  await ensureFirebase();
  let code=null;
  for(let i=0;i<12;i++){const c=makeRoomCode();const snap=await get(ref(firebaseDb,`rooms/${c}`));if(!snap.exists()){code=c;break;}}
  if(!code){alert("ルームコードを作成できませんでした。もう一度お試しください。");return;}
  onlineRoomCodeValue=code;onlineHost=true;
  const name=getPlayerName();
  const maxPlayers=Math.min(8,Math.max(3,Number(document.getElementById("onlineMaxPlayers")?.value||4)));
  const room={hostUid:firebaseUid,status:"lobby",maxPlayers,createdAt:Date.now(),settings:getOnlineLobbySettings(),players:{[firebaseUid]:{uid:firebaseUid,name,host:true}}};
  await set(ref(firebaseDb,`rooms/${code}`),room);
  await set(ref(firebaseDb,`rooms/${code}/privateCards/${firebaseUid}`),{cardName:null});
  openOnlineLobby();
}
async function joinOnlineRoom(){
  await ensureFirebase();
  const code=(roomCodeInput.value||"").trim().toUpperCase();
  if(!/^[A-Z0-9]{4}$/.test(code)){alert("4文字のルームコードを入力してください。");return;}
  const snap=await get(ref(firebaseDb,`rooms/${code}`));
  if(!snap.exists()){alert("そのルームは見つかりません。");return;}
  const data=snap.val(), players=lobbyPlayersFromValue(data);
  if(data.status!=="lobby"){alert("そのルームはすでにゲーム中です。");return;}
  if(players.length>=Math.min(8,Math.max(3,Number(data.maxPlayers||4)))){alert("このルームは満員です。");return;}
  onlineRoomCodeValue=code;onlineHost=false;
  const name=getPlayerName();
  await update(ref(firebaseDb,`rooms/${code}/players/${firebaseUid}`),{uid:firebaseUid,name,host:false});
  await set(ref(firebaseDb,`rooms/${code}/privateCards/${firebaseUid}`),{cardName:null});
  openOnlineLobby();
}
function openOnlineLobby(){
  onlineLobby.hidden=false;onlineRoomCode.textContent=onlineRoomCodeValue;createRoomButton.hidden=true;joinRoomButton.hidden=true;roomCodeInput.hidden=true;
  if(onlineRoomUnsubscribe)onlineRoomUnsubscribe();
  onlineRoomUnsubscribe=onValue(onlineRoomRef(),snap=>{
    const data=snap.val();
    if(!data){onlineLobbyStatus.textContent="ルームが終了しました";return;}
    renderOnlineLobby(data);
    if(data.status==="playing" && data.game){
      // A replay creates a new matchId. Firebase listeners can still deliver a
      // previously queued snapshot after the host has already started the new
      // match. Never let that stale result screen overwrite the fresh game.
      const incomingMatchId=String(data.game.matchId||"");
      if(onlineMatchId && incomingMatchId && incomingMatchId!==onlineMatchId){
        const incomingStarted=Number(data.game.matchStartedAt||0);
        const currentStarted=Number(onlineGame?.matchStartedAt||0);
        if(currentStarted && incomingStarted && incomingStarted<currentStarted)return;
      }
      if(onlineHost && onlineHostProcessing)return;
      onlineMatchId=incomingMatchId||onlineMatchId;
      onlineGame={...data.game, usedClueIds:Array.isArray(data.game.usedClueIds)?data.game.usedClueIds:[], logs:Array.isArray(data.game.logs)?data.game.logs:[], players:Array.isArray(data.game.players)?data.game.players:[], settings:data.game.settings||onlineSettings(), order:Array.isArray(data.game.order)?data.game.order:[], orderIndex:Number.isFinite(data.game.orderIndex)?data.game.orderIndex:0};
      if(onlineGame.reverseGuess && typeof onlineGame.reverseGuess!=="string") onlineGame.reverseGuess=onlineGame.reverseGuess.name||null;
      if(onlineGame.reveal?.reverseGuess && typeof onlineGame.reveal.reverseGuess!=="string") onlineGame.reveal.reverseGuess=onlineGame.reveal.reverseGuess.name||null;
      loadOnlineOwnCard(data).then(()=>renderOnlineGame());
      onlineDialog.close();
      setupScreen.hidden=true;gameScreen.hidden=false;
      if(onlineHost && !onlineActionUnsubscribe) attachOnlineHostActionListener();
      if(onlineHost && onlineGame.phase==="discussion") hostStartVoiceDiscussionTimer();
    }
  });
}
async function loadOnlineOwnCard(data){
  if(!firebaseUid||!onlineRoomCodeValue)return;
  const snap=await get(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/privateCards/${firebaseUid}`));
  const cardName=snap.val()?.cardName;
  onlineMyCard=CARD_POOL.find(c=>c.name===cardName)||null;
}
async function leaveOnlineRoom(options={}){
  if(!onlineRoomCodeValue)return;
  const roomCode=onlineRoomCodeValue, wasHost=onlineHost;
  if(onlineRoomUnsubscribe)onlineRoomUnsubscribe();
  if(onlineActionUnsubscribe)onlineActionUnsubscribe();
  clearTimeout(onlineCpuTimer);
  onlineRoomUnsubscribe=null;onlineActionUnsubscribe=null;
  try{
    const roomRef=ref(firebaseDb,`rooms/${roomCode}`);
    const snap=await get(roomRef);
    const data=snap.val();
    if(data){
      if(wasHost){
        // A host leaving must not leave an orphaned playing room behind.
        await remove(roomRef);
      }else if(firebaseUid){
        await remove(ref(firebaseDb,`rooms/${roomCode}/players/${firebaseUid}`));
        await remove(ref(firebaseDb,`rooms/${roomCode}/privateCards/${firebaseUid}`)).catch(()=>{});
      }
    }
  }catch(e){console.warn("online leave failed",e);}
  onlineRoomCodeValue="";onlineHost=false;onlineGame=null;onlineMyCard=null;onlineHostSecrets=null;onlineLastActionId=null;onlinePendingAction=null;
  onlineLobby.hidden=true;createRoomButton.hidden=false;joinRoomButton.hidden=false;roomCodeInput.hidden=false;
  try{onlineDialog.close();}catch{};onlineDialog.removeAttribute("open");
  if(options.returnToSetup) returnToSetup();
}
function onlineFeatureOptions(card,used,playerClues){
  const usedSet=new Set(Array.isArray(used)?used:[]);
  let truthful=shuffle(statementsFor(card)).filter(s=>!usedSet.has(s.id));
  let falsehoods=shuffle(falseStatementsFor(card)).filter(s=>!usedSet.has(s.id));
  let options=[...truthful.slice(0,4),...falsehoods.slice(0,2)];
  if((onlineGame?.settings?.speechRounds||2)>=2 && !(playerClues||[]).some(c=>c.ambiguous)){
    const vague=shuffle(AMBIGUOUS_CLUES).filter(v=>!usedSet.has(v.id));
    if(vague.length)options.push(vague[0]);
  }
  if(options.length<4){
    const extra=shuffle(featureList(card)).filter(s=>!usedSet.has(s.id)&&!options.some(o=>o.id===s.id));
    options.push(...extra.slice(0,4-options.length));
  }
  return shuffle(options).slice(0,6);
}
function onlinePlayerById(id){return (onlineGame?.players||[]).find(p=>String(p.id)===String(id));}
function onlineCurrentId(){return onlineGame?.order?.[onlineGame.orderIndex];}
function onlineRoleMap(){return onlineGame?.reveal?.roles||{};}
function renderOnlinePlayers(){
  const reveal=onlineGame.phase==="result";
  const roles=onlineRoleMap(), cards=onlineGame.reveal?.cards||{};
  playersElement.innerHTML=(onlineGame.players||[]).map(p=>{
    const current=onlineGame.phase==="clue"&&String(onlineCurrentId())===String(p.id);
    const clues=p.clues||[];
    const voiceMode=Boolean(onlineGame.settings?.voiceMode);
    const clueHtml=clues.length?clues.map((c,i)=>`<p><b>${i+1}.</b> 「${escapeHtml(c.label)}」</p>`).join(""):(voiceMode?"":(current?'<p class="muted thinking-text">発言を考えています…</p>':'<p class="muted">まだ発言していません</p>'));
    const votes=reveal&&onlineGame.tallies?onlineGame.tallies[p.id]||0:0;
    const revealMeta=reveal?`<span class="role-reveal ${roles[p.id]==="wolf"?"wolf":"citizen"}">${roles[p.id]==="wolf"?"狼":"市民"} · ${escapeHtml(cards[p.id]?jpName(cards[p.id]):"")}</span>`:"";
    return `<article class="player-seat ${String(p.id)===String(firebaseUid)?"is-you":""} ${current?"is-current":""}">
      <div class="avatar">${String(p.id)===String(firebaseUid)?"YOU":"P"}</div>
      <div class="seat-copy"><div class="seat-name"><strong>${escapeHtml(p.name)}</strong><span>${String(p.id)===String(firebaseUid)?"あなた":(p.isHuman?"プレイヤー":"CPU")}</span></div><div class="player-clues">${clueHtml}</div></div>
      ${reveal?`<span class="vote-badge">${votes}票</span><div class="result-meta">${revealMeta}</div>`:""}
    </article>`;
  }).join("");
}
function renderOnlineCard(){
  yourCardElement.className="playing-card ygo";
  yourCardElement.innerHTML=onlineMyCard?`<div class="ygo-card-face"><img src="${cardImage(onlineMyCard)}" alt="${escapeHtml(jpName(onlineMyCard))}"></div><div class="your-card-meta">${cardDisplay(onlineMyCard)}</div>`:`<div class="online-card-wait">カードを準備しています…</div>`;
}
function renderOnlineLog(){
  logCount.textContent=`${(onlineGame.logs||[]).length} 件`;
  talkLog.innerHTML=(onlineGame.logs||[]).length?(onlineGame.logs||[]).map((e,i)=>`<article class="log-entry ${e.type||""}"><span>${String(i+1).padStart(2,"0")}</span><strong>${escapeHtml(e.name||"")}</strong><p>${escapeHtml(e.text||"")}</p></article>`).join(""):`<p class="empty-log">発言が始まると、ここに記録されます。</p>`;
}
async function onlineSubmitClue(id){
  if(onlineGame.phase!=="clue"||String(onlineCurrentId())!==String(firebaseUid))return;
  const card=onlineMyCard;if(!card)return;
  if(onlinePendingAction)return;
  const me=onlinePlayerById(firebaseUid), opts=onlineFeatureOptions(card,onlineGame.usedClueIds,me?.clues);
  const usedIds=Array.isArray(onlineGame.usedClueIds)?onlineGame.usedClueIds:[];
  onlineGame.usedClueIds=usedIds;
  const st=opts.find(s=>String(s.id)===String(id));if(!st||usedIds.includes(st.id))return;
  const turnRound=Number(onlineGame.round),turnIndex=Number(onlineGame.orderIndex);
  onlinePendingAction={type:"clue",clueId:String(id),round:turnRound,orderIndex:turnIndex};
  actionPanel.querySelectorAll("[data-online-clue]").forEach(b=>{b.disabled=true;b.classList.add("is-sending");});
  const ok=await submitOnlineAction({type:"clue",clueId:st.id,round:turnRound,orderIndex:turnIndex,at:Date.now()});
  if(!ok){onlinePendingAction=null;renderOnlineClue();}
}
function renderOnlineDiscussion(){
  phaseLabel.textContent="VOICE CHAT / DISCUSSION";
  phaseTitle.textContent="カードを見て、みんなで議論しよう";
  const seconds=Math.max(60,Number(onlineGame.settings?.discussionSeconds||120));
  // The host creates this deadline once when a match starts. Every client
  // displays the same absolute deadline using its own clock; the UI timer is
  // independent from Firebase re-renders.
  let deadline=Number(onlineGame.discussionDeadlineAt);
  if(!Number.isFinite(deadline)||deadline<=Date.now()-1000){
    deadline=Number(onlineGame.discussionStartedAt||Date.now())+seconds*1000;
    onlineGame.discussionDeadlineAt=deadline;
  }
  onlineDiscussionDeadlineAt=deadline;
  const existing=document.getElementById("voiceDiscussionTimer");
  if(!existing){
    actionPanel.innerHTML=`<div class="voice-discussion-state"><div class="voice-timer" id="voiceDiscussionTimer">--:--</div><p>ボイスチャットで自由に議論してください。</p><span>時間になると自動的に投票へ進みます。</span>${onlineHost?'<button class="secondary-button compact discussion-force-end" id="discussionForceEndButton" type="button">議論を強制終了</button>':''}</div>`;
    const force=document.getElementById("discussionForceEndButton");
    if(force) force.addEventListener("click",()=>hostForceEndDiscussion());
  }
  if(onlineDiscussionTimer){clearInterval(onlineDiscussionTimer);onlineDiscussionTimer=null;}
  const updateTimer=()=>{
    if(!onlineGame||onlineGame.phase!=="discussion"){
      if(onlineDiscussionTimer){clearInterval(onlineDiscussionTimer);onlineDiscussionTimer=null;}
      return;
    }
    const target=Number(onlineDiscussionDeadlineAt||onlineGame.discussionDeadlineAt);
    const left=Math.max(0,Math.ceil((target-Date.now())/1000));
    const timerEl=document.getElementById("voiceDiscussionTimer");
    if(timerEl){
      const m=Math.floor(left/60),sec=String(left%60).padStart(2,"0");
      timerEl.textContent=`${m}:${sec}`;
    }
    if(left<=0){
      if(onlineDiscussionTimer){clearInterval(onlineDiscussionTimer);onlineDiscussionTimer=null;}
      if(onlineHost) hostEndDiscussion();
    }
  };
  updateTimer();
  if(onlineGame.phase==="discussion"){
    onlineDiscussionTimer=setInterval(updateTimer,250);
  }
}
async function hostEndDiscussion(){
  if(!onlineHost||!onlineGame||onlineGame.phase!=="discussion")return;
  clearInterval(onlineDiscussionTimer);onlineDiscussionTimer=null;
  clearTimeout(onlineCpuTimer);onlineCpuTimer=null;
  onlineGame.phase="vote";onlineGame.orderIndex=0;onlineGame.discussionStartedAt=null;onlineGame.discussionDeadlineAt=null;
  await hostAssignCpuVotes();
  await hostWriteGame();
  renderOnlineGame();
}
async function hostForceEndDiscussion(){
  if(!onlineHost||!onlineGame||onlineGame.phase!=="discussion")return;
  if(!confirm("議論を終了して投票へ進みますか？"))return;
  await hostEndDiscussion();
}

function hostStartVoiceDiscussionTimer(){
  clearTimeout(onlineCpuTimer);onlineCpuTimer=null;
  if(!onlineHost||!onlineGame||onlineGame.phase!=="discussion")return;
  const seconds=Math.max(60,Number(onlineGame.settings?.discussionSeconds||120));
  let deadline=Number(onlineGame.discussionDeadlineAt);
  if(!Number.isFinite(deadline)||deadline<=Date.now()-1000){
    deadline=Date.now()+seconds*1000;
    onlineGame.discussionStartedAt=Date.now();
    onlineGame.discussionDeadlineAt=deadline;
    onlineDiscussionDeadlineAt=deadline;
  }else{
    onlineDiscussionDeadlineAt=deadline;
  }
  // Rendering owns the visible countdown. This timeout is only an
  // authoritative host fallback in case the UI timer is throttled.
  const delay=Math.max(0,deadline-Date.now());
  onlineCpuTimer=setTimeout(async()=>{
    if(!onlineHost||!onlineGame||onlineGame.phase!=="discussion")return;
    await hostEndDiscussion();
  },delay+100);
}
function renderOnlineClue(){
  if(onlinePendingAction?.type==="clue" && String(onlineCurrentId())!==String(firebaseUid)) onlinePendingAction=null;
  const current=onlinePlayerById(onlineCurrentId()), roundLabel=onlineGame.round===1?"第1ラウンド":"第2ラウンド（逆順）";
  phaseLabel.textContent=`PHASE ${onlineGame.round} / ${roundLabel}・特徴を話す`;
  phaseTitle.textContent=String(onlineCurrentId())===String(firebaseUid)?"あなたの特徴を話そう":`${current?.name||"プレイヤー"}の発言を聞こう`;
  if(String(onlineCurrentId())!==String(firebaseUid)){
    actionPanel.innerHTML=`<div class="thinking-state"><span class="thinking-card" aria-hidden="true">?</span><div><p>ONLINE TURN</p><h2>${escapeHtml(current?.name||"プレイヤー")}が発言中</h2><span>前の発言とは違う特徴を選んでいます…</span></div></div>`;return;
  }
  const opts=onlineFeatureOptions(onlineMyCard,onlineGame.usedClueIds,current?.clues);
  actionPanel.innerHTML=`<div class="action-heading"><p>${roundLabel}</p><h2>何と発言しますか？</h2><span>前の人と同じ特徴は選べません。${onlineGame.settings.liePenalty?"狼が2回以上嘘をつくと逆転チャンスを失います。":"嘘の回数によるペナルティはありません。"}</span></div><div class="choice-list">${opts.map(s=>`<button class="choice-button ${s.ambiguous?"ambiguous-choice":""}" type="button" data-online-clue="${s.id}"><span>${s.label}</span><span>${s.ambiguous?"曖昧":"→"}</span></button>`).join("")}</div>`;
  actionPanel.querySelectorAll("[data-online-clue]").forEach(b=>b.addEventListener("click",()=>onlineSubmitClue(b.dataset.onlineClue)));
}
function renderOnlineVote(){
  phaseLabel.textContent="PHASE / 狼に投票する";phaseTitle.textContent="違うカードの人は誰？";
  const me=onlinePlayerById(firebaseUid);
  const hasVote=me?.vote!==null&&me?.vote!==undefined&&String(me.vote)!=="";
  if(hasVote || onlinePendingAction?.type==="vote"){
    actionPanel.innerHTML=`<div class="thinking-state online-action-wait"><span class="thinking-card" aria-hidden="true">✓</span><div><p>VOTE SENT</p><h2>投票しました</h2><span>${hasVote?"他のプレイヤーの投票を待っています…":"投票を送信しています…"}</span></div></div>`;
    if(hasVote) onlinePendingAction=null;
    return;
  }
  const candidates=onlineGame.players.filter(p=>String(p.id)!==String(firebaseUid));
  actionPanel.innerHTML=`<div class="action-heading"><p>VOTING TIME</p><h2>狼だと思う人を選ぶ</h2><span>全員の発言を振り返って、ひとりに投票してください。</span></div><div class="vote-grid">${candidates.map(p=>`<button class="vote-button" type="button" data-online-vote="${escapeHtml(String(p.id))}"><span class="mini-avatar">P</span><span><strong>${escapeHtml(p.name)}</strong><small>${(p.clues||[]).map(c=>`「${escapeHtml(c.label)}」`).join(" / ")}</small></span></button>`).join("")}</div>`;
  actionPanel.querySelectorAll("[data-online-vote]").forEach(b=>b.addEventListener("click",async()=>{
    if(onlinePendingAction)return;
    const voteId=String(b.dataset.onlineVote);
    actionPanel.querySelectorAll("[data-online-vote]").forEach(x=>x.disabled=true);
    onlinePendingAction={type:"vote",voteId};
    renderOnlineVote();
    const ok=await submitOnlineAction({type:"vote",voteId,round:onlineGame.round,at:Date.now()});
    if(!ok){onlinePendingAction=null;renderOnlineVote();}
  }));
}
function renderOnlineReverse(){
  const wolfId=onlineGame.reveal?.wolfId||onlineGame.wolfUid||onlineGame.eliminatedId;
  const wolf=onlinePlayerById(wolfId);
  phaseLabel.textContent="FINAL PHASE / 狼の逆転チャンス";phaseTitle.textContent=`${wolf?.name||"狼"}は狼だった！`;
  if(String(wolfId)!==String(firebaseUid)){
    actionPanel.innerHTML=`<div class="wolf-reveal"><span class="wolf-eye" aria-hidden="true">W</span><div><p>最終チャンス</p><h2>${escapeHtml(wolf?.name||"狼")}の逆転宣言を待っています</h2><span>狼が市民カードを推理します。</span></div></div>`;return;
  }
  actionPanel.innerHTML=`<div class="action-heading danger"><p>あなたは狼です</p><h2>市民カードを当てよう</h2><span>市民カードと同じカードを選べば逆転勝利です。</span></div><div class="guess-card-grid">${CARD_POOL.filter(c=>!onlineMyCard||c.name!==onlineMyCard.name).map(c=>`<button class="guess-card-button" data-online-guess="${escapeHtml(c.name)}"><img src="${cardImage(c)}" alt="${escapeHtml(jpName(c))}"><span>${escapeHtml(jpName(c))}</span><small>${escapeHtml(cardInfo(c))}</small><small>${escapeHtml(cardStats(c))}</small></button>`).join("")}</div>`;
  actionPanel.querySelectorAll("[data-online-guess]").forEach(b=>b.addEventListener("click",()=>submitOnlineAction({type:"reverse",guess:b.dataset.onlineGuess,at:Date.now()})));
}
function renderOnlineResult(){
  const wolfWon=onlineGame.result==="wolf"||onlineGame.result==="wolf-reversal";
  phaseLabel.textContent="GAME OVER / 答え合わせ";phaseTitle.textContent=wolfWon?"狼チームの勝利":"市民チームの勝利";
  const revName=typeof onlineGame.reveal?.reverseGuess==="string"?onlineGame.reveal.reverseGuess:(onlineGame.reveal?.reverseGuess?.name||null);
  const rev=revName?CARD_POOL.find(c=>c.name===revName)||null:null;
  const citizen=onlineGame.reveal?.citizenCard,wolfCard=onlineGame.reveal?.wolfCard;
  const msg=onlineGame.result==="wolf"? "選ばれたプレイヤーは市民でした。狼は正体を隠し切りました。":onlineGame.result==="wolf-reversal"?`狼が市民カード「${jpName(citizen)}」を見事に当て、逆転しました。`:`狼の宣言は「${jpName(rev||{})}」。正解は「${jpName(citizen||{})}」でした。`;
  const replayButton=onlineHost?`<button class="primary-button compact" id="onlineReplayButton" type="button"><span>同じ部屋でもう一度遊ぶ</span><span>↻</span></button>`:`<div class="online-replay-wait">ホストがもう一度ゲームを開始するのを待っています。</div>`;
  actionPanel.innerHTML=`<div class="result-banner ${wolfWon?"wolf-win":"citizen-win"}"><p>${wolfWon?"狼チームの勝利":"市民チームの勝利"}</p><h2>${wolfWon?"狼の勝利":"市民の勝利"}</h2><span>${msg}</span></div><div class="answer-cards">${citizen?`<div><small>市民カード</small><img class="ygo-thumb" src="${cardImage(citizen)}"><strong>${jpName(citizen)}</strong><em>${cardInfo(citizen)}${cardStats(citizen)?" · "+cardStats(citizen):""}</em></div>`:""}${wolfCard?`<div><small>狼カード</small><img class="ygo-thumb" src="${cardImage(wolfCard)}"><strong>${jpName(wolfCard)}</strong><em>${cardInfo(wolfCard)}${cardStats(wolfCard)?" · "+cardStats(wolfCard):""}</em></div>`:""}</div>${replayButton}<button class="secondary-button compact" id="onlineBackButton" type="button"><span>ロビーへ戻る</span><span>↩</span></button>`;
  if(onlineHost){document.getElementById("onlineReplayButton").addEventListener("click",async()=>{if(confirm("同じ部屋のメンバーでもう一度ゲームを開始しますか？")){await startOnlineHostGame();}});}
  document.getElementById("onlineBackButton").addEventListener("click",async()=>{if(confirm("オンライン対戦を終了して部屋から退出しますか？")){await leaveOnlineRoom({returnToSetup:true});}});
  if(!onlineScoreRecorded){const myRole=onlineGame.reveal?.roles?.[firebaseUid];const won=(myRole==="wolf"&&wolfWon)||(myRole==="citizen"&&!wolfWon);if(won)matchRecord.wins++;else matchRecord.losses++;onlineScoreRecorded=true;renderRecord();}
}
function renderOnlineGame(){
  if(!onlineGame)return;
  renderOnlinePlayers();renderOnlineCard();renderOnlineLog();
  if(onlineGame.phase==="discussion")renderOnlineDiscussion();else if(onlineGame.phase==="clue")renderOnlineClue();else if(onlineGame.phase==="vote")renderOnlineVote();else if(onlineGame.phase==="reverse")renderOnlineReverse();else renderOnlineResult();
}
async function submitOnlineAction(action){
  if(!onlineRoomCodeValue||!firebaseUid){console.warn("online action ignored: room/auth not ready");return false;}
  if(!onlineGame){console.warn("online action ignored: game state not ready");return false;}
  const roomCode=onlineRoomCodeValue;
  const actionId=`${firebaseUid}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const actionRef=ref(firebaseDb,`rooms/${roomCode}/actions/${firebaseUid}/${actionId}`);
  const resultRef=ref(firebaseDb,`rooms/${roomCode}/actionResults/${firebaseUid}/${actionId}`);
  try{
    // Each client gets its own immutable action entry. The host acknowledges
    // acceptance/rejection separately so a client never remains stuck in a
    // fake "waiting" state when the host rejects a stale action.
    await set(actionRef,{...action,matchId:onlineGame.matchId||onlineMatchId||"",uid:firebaseUid,actionId,clientVersion:"v70",createdAt:Date.now()});
    return await new Promise((resolve)=>{
      let settled=false;
      const finish=(ok)=>{if(settled)return;settled=true;off(resultRef,"value",listener);onlineActionPromises.delete(actionId);resolve(Boolean(ok));};
      const listener=(snap)=>{
        const result=snap.val();
        if(!result)return;
        finish(result.accepted===true);
      };
      onlineActionPromises.set(actionId,finish);
      onValue(resultRef,listener);
      setTimeout(()=>finish(false),7000);
    }).then(ok=>{
      if(!ok)alert("操作を受け付けられませんでした。画面を更新して、もう一度お試しください。");
      return ok;
    });
  }catch(e){
    console.error("online action failed",e);
    alert(`操作を送信できませんでした。\n\n${e?.message||e}`);
    return false;
  }
}
function hostChooseCpuVote(voter){
  const candidates=onlineGame.players.filter(p=>String(p.id)!==String(voter.id));
  const voterCard=onlineHostSecrets.cards[voter.id];
  return candidates.map(c=>{
    const contradictions=(c.clues||[]).filter(cl=>!cl.ambiguous && (()=>{const st=featureList(voterCard).find(x=>x.id===cl.id);return st&&!st.test(voterCard);})()).length;
    return {id:c.id,score:contradictions*2.2+Math.random()*1.2};
  }).sort((a,b)=>b.score-a.score)[0]?.id;
}
function hostCpuClue(player){
  const card=onlineHostSecrets.cards[player.id],used=new Set(onlineGame.usedClueIds||[]);
  let truthful=shuffle(statementsFor(card)).filter(s=>!used.has(s.id));
  let falsehoods=shuffle(falseStatementsFor(card)).filter(s=>!used.has(s.id));
  let st=null;
  if(!onlineHostSecrets.wolves[player.id]){
    st=truthful[0]||null; // citizens strongly prefer truth
  }else{
    const shared=truthful.filter(s=>s.test(onlineHostSecrets.citizenCard));
    st=shared[0]||truthful[0]||falsehoods[0]||null;
  }
  return st;
}
async function hostApplyClue(uid,clueId,action={}){
  if(!onlineHost||!onlineGame||onlineGame.phase!=="clue")return false;
  if(String(uid)!==String(onlineCurrentId()))return false;
  // Reject stale clicks from a previous render/turn. This is especially important
  // around the final clue of round 2, where Firebase can deliver an older snapshot.
  if(Number.isFinite(Number(action.round)) && Number(action.round)!==Number(onlineGame.round))return false;
  if(Number.isFinite(Number(action.orderIndex)) && Number(action.orderIndex)!==Number(onlineGame.orderIndex))return false;
  const player=onlinePlayerById(uid),card=onlineHostSecrets.cards[uid];if(!player||!card)return;
  onlineGame.usedClueIds=Array.isArray(onlineGame.usedClueIds)?onlineGame.usedClueIds:[];
  onlineGame.logs=Array.isArray(onlineGame.logs)?onlineGame.logs:[];
  let st=[...featureList(card),...AMBIGUOUS_CLUES].find(s=>s.id===clueId);
  if(!st||onlineGame.usedClueIds.includes(st.id))return false;
  if(st.ambiguous && (player.clues||[]).some(c=>c.ambiguous))return false;
  const truthful=st.ambiguous?true:Boolean(st.test(card));
  player.clues=[...(player.clues||[]),{id:st.id,label:st.label,ambiguous:Boolean(st.ambiguous)}];
  onlineGame.usedClueIds.push(st.id);onlineGame.logs.push({name:player.name,text:`「${st.label}」と発言しました。`});
  if(!truthful)onlineHostSecrets.lies[uid]=(onlineHostSecrets.lies[uid]||0)+1;
  await advanceOnlineClueHost();
  return true;
}
async function advanceOnlineClueHost(){
  const lastTurn = onlineGame.orderIndex >= onlineGame.order.length - 1;
  if(!lastTurn){
    onlineGame.orderIndex += 1;
    await hostWriteGame();
    hostMaybeCpuTurn();
    return;
  }

  // The final speaker of a round needs an explicit, atomic-looking transition.
  // Do not briefly leave the old clue turn in Firebase, otherwise another client
  // can render the same speaker's buttons again.
  if(onlineGame.round < onlineGame.settings.speechRounds){
    onlineGame.round += 1;
    onlineGame.order = [...onlineGame.order].reverse();
    onlineGame.orderIndex = 0;
    onlineGame.logs.push({type:"system",name:"ラウンド切替",text:`第${onlineGame.round}ラウンド。発言順を逆にします。`});
    await hostWriteGame();
    hostMaybeCpuTurn();
    return;
  }

  onlineGame.phase="vote";
  onlineGame.orderIndex=0;
  await hostAssignCpuVotes();
  await hostWriteGame();
}
async function hostAssignCpuVotes(){
  if(onlineGame.phase!=="vote")return;
  for(const p of onlineGame.players.filter(x=>!x.isHuman)){
    p.vote=hostChooseCpuVote(p);
  }
}
async function hostMaybeCpuTurn(){
  clearTimeout(onlineCpuTimer);
  if(!onlineHost||!onlineGame||onlineGame.phase!=="clue")return;
  const expectedId=String(onlineCurrentId());
  const p=onlinePlayerById(expectedId);
  if(!p||p.isHuman)return;
  onlineCpuTimer=setTimeout(async()=>{
    try{
      // Re-check the state immediately before acting. Firebase listeners can
      // redraw onlineGame while this timer is waiting.
      if(!onlineHost||!onlineGame||onlineGame.phase!=="clue"||String(onlineCurrentId())!==expectedId)return;
      const current=onlinePlayerById(expectedId);
      const st=hostCpuClue(current);
      if(st){
        await hostApplyClue(expectedId,st.id);
      }else{
        await advanceOnlineClueHost();
      }
    }catch(e){
      console.error("online CPU turn failed",e);
      // Never leave the online game on a permanent "CPU thinking" state.
      if(onlineHost&&onlineGame&&onlineGame.phase==="clue"&&String(onlineCurrentId())===expectedId){
        const current=onlinePlayerById(expectedId);
        if(current){
          current.clues=current.clues||[];
          current.clues.push({id:`cpu-fallback-${Date.now()}`,label:"慎重に考えています",ambiguous:true});
          onlineGame.logs.push({type:"system",name:current.name,text:"CPUの発言処理を再試行します。"});
        }
        await advanceOnlineClueHost();
      }
    }
  },700);
}
async function hostEvaluateVotes(){
  if(!onlineHost||!onlineGame||onlineGame.phase!=="vote")return;
  const humanCount=onlineGame.players.filter(p=>p.isHuman).length;
  const voted=onlineGame.players.filter(p=>p.isHuman&&p.vote!==null&&p.vote!==undefined&&String(p.vote)!=="").length;
  if(voted<humanCount){
    await hostWriteGame();
    return;
  }
  const tallies=Object.fromEntries(onlineGame.players.map(p=>[p.id,0]));
  onlineGame.players.forEach(p=>{if(p.vote&&tallies[p.vote]!=null)tallies[p.vote]++;});
  onlineGame.tallies=tallies;
  const high=Math.max(...Object.values(tallies)),tied=onlineGame.players.filter(p=>tallies[p.id]===high);
  const eliminated=randomItem(tied);onlineGame.eliminatedId=eliminated.id;
  onlineGame.logs.push({type:"system",name:"投票結果",text:tied.length>1?`${high}票で同票。抽選により${eliminated.name}が選ばれました。`:`${eliminated.name}が${high}票で選ばれました。`});
  const wolfId=onlineHostSecrets.wolfUid;
  if(String(eliminated.id)===String(wolfId)){
    if(onlineGame.settings.liePenalty&&(onlineHostSecrets.lies[wolfId]||0)>=2){onlineGame.result="citizen";onlineGame.phase="result";onlineGame.logs.push({type:"system",name:"ペナルティ",text:"狼は2回以上の嘘をついたため、逆転チャンスを失いました。"});await hostFinishResult(null);}
    else {
      onlineGame.phase="reverse";
      await hostWriteGame();
      renderOnlineGame();
      if((onlinePlayerById(onlineHostSecrets.wolfUid)?.isHuman)===false){
        const wolf=onlinePlayerById(onlineHostSecrets.wolfUid);
        onlineCpuTimer=setTimeout(async()=>{
          const clues=onlineGame.players.filter(p=>String(p.id)!==String(onlineHostSecrets.wolfUid)).flatMap(p=>p.clues||[]);
          const candidates=CARD_POOL.filter(c=>c.name!==onlineHostSecrets.wolfCard.name).map(card=>{
            const score=clues.reduce((s,cl)=>{
              if(cl.ambiguous)return s;
              const st=featureList(card).find(x=>x.id===cl.id);
              return s+(st&&st.test(card)?1:0);
            },0)+Math.random()*0.35;
            return {card,score};
          }).sort((a,b)=>b.score-a.score);
          await hostFinishResult(candidates[0]?.card?.name||onlineHostSecrets.citizenCard.name);
        },1200);
      }
    }
  }else{onlineGame.result="wolf";await hostFinishResult(null);}
}
async function hostFinishResult(reverseGuess){
  onlineGame.reverseGuess=reverseGuess?CARD_POOL.find(c=>c.name===reverseGuess)||null:null;
  const citizen=onlineHostSecrets.citizenCard,wolfCard=onlineHostSecrets.wolfCard;
  const reveal={citizenCard:citizen,wolfCard,reverseGuess:onlineGame.reverseGuess?.name||onlineGame.reverseGuess||null,roles:{},cards:{},wolfId:onlineHostSecrets.wolfUid};
  onlineGame.players.forEach(p=>{reveal.roles[p.id]=onlineHostSecrets.wolves[p.id]?"wolf":"citizen";reveal.cards[p.id]=onlineHostSecrets.cards[p.id];});
  onlineGame.reveal=reveal;onlineGame.phase="result";
  await hostWriteGame();
  renderOnlineGame();
}
async function hostProcessAction(action){
  if(!onlineHost||!onlineGame||!action)return false;
  // Actions from the previous match must never be applied to a replayed game.
  if(!action.matchId || String(action.matchId)!==String(onlineGame.matchId))return false;
  let accepted=false;
  if(action.type==="clue"){
    accepted=await hostApplyClue(action.uid,action.clueId,action);
  }else if(action.type==="vote"&&onlineGame.phase==="vote"){
    const p=onlinePlayerById(action.uid);
    if(!p||!p.isHuman)return false;
    if(Number.isFinite(Number(action.round)) && Number(action.round)!==Number(onlineGame.round))return false;
    if(p.vote!==null&&p.vote!==undefined&&String(p.vote)!=="")return false;
    const voteId=String(action.voteId??"");
    const validTarget=onlineGame.players.some(x=>String(x.id)===voteId);
    if(validTarget&&voteId!==String(action.uid)){
      p.vote=voteId;
      accepted=true;
      await hostEvaluateVotes();
      if(onlineGame.phase==="vote") await hostWriteGame();
    }
  }else if(action.type==="reverse"&&onlineGame.phase==="reverse"&&String(action.uid)===String(onlineHostSecrets.wolfUid)){
    const guess=CARD_POOL.find(c=>c.name===action.guess);
    if(guess){accepted=true;await hostFinishResult(guess.name);}
  }
  if(action.actionId&&action.uid){
    try{
      await set(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/actionResults/${action.uid}/${action.actionId}`),{accepted,processedAt:Date.now()});
    }catch(e){console.warn("online action acknowledgement failed",e);}
  }
  return accepted;
}

function attachOnlineHostActionListener(){
  if(onlineActionUnsubscribe||!onlineRoomCodeValue)return;
  onlineActionUnsubscribe=onValue(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/actions`),snap=>{
    const data=snap.val()||{};
    const pending=[];
    for(const [uid,queue] of Object.entries(data)){
      if(!queue||typeof queue!=='object')continue;
      for(const [actionId,action] of Object.entries(queue)){
        if(!action||action.actionId!==actionId)continue;
        if(actionId===onlineLastActionId || onlineProcessedActionIds.has(actionId))continue;
        onlineLastActionId=actionId;
        onlineProcessedActionIds.add(actionId);
        pending.push({uid,actionId,action});
      }
    }
    if(!pending.length)return;
    // Serialize host actions. Firebase can deliver a new snapshot while the
    // previous action is still awaiting a write; processing both concurrently
    // can make the second human's clue look like a stale/out-of-turn action.
    for(const item of pending){
      onlineHostActionQueue=onlineHostActionQueue.then(async()=>{
        onlineHostProcessing=true;
        try{
          await hostProcessAction(item.action);
        }catch(e){
          console.error("online host action failed",e);
        }finally{
          // The host is now allowed to clean up processed actions. Keep the
          // acknowledgement briefly so the client can confirm the result.
          try{await remove(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/actions/${item.uid}/${item.actionId}`));}catch(e){
            console.warn("online action cleanup failed",e);
          }
          onlineHostProcessing=false;
          if(onlineHost&&onlineGame) renderOnlineGame();
        }
      });
    }
  });
}
async function startOnlineHostGame(){
  if(!onlineHost||!onlineRoomCodeValue)return;
  // Freeze the host listener while the new match is built. This prevents the
  // previous result snapshot from overwriting the fresh local replay state.
  onlineHostProcessing=true;
  const snap=await get(onlineRoomRef()),room=snap.val();if(!room){onlineHostProcessing=false;return;}
  const humans=lobbyPlayersFromValue(room);
  const wantedCpu=Math.max(0,Math.min(Number(onlineCpuCount.value||0),8-humans.length));
  const cpuNeeded=Math.max(wantedCpu,3-humans.length);
  const total=humans.length+cpuNeeded;
  const maxPlayers=Math.min(8,Math.max(3,Number(room.maxPlayers||4)));
  if(total<3||total>maxPlayers){alert(`オンラインは合計3〜${maxPlayers}人で開始します。`);onlineHostProcessing=false;return;}

  const [citizenCard,wolfCard]=chooseCardPair();
  const ids=humans.map(p=>p.uid);
  for(let i=0;i<cpuNeeded;i++)ids.push(`cpu-${i}`);
  const wolfUid=randomItem(ids);
  const publicPlayers=humans.map(p=>({id:p.uid,name:p.name,isHuman:true,clues:[],vote:null}));
  for(let i=0;i<cpuNeeded;i++)publicPlayers.push({id:`cpu-${i}`,name:CPU_NAMES[i]||`CPU${i+1}`,isHuman:false,clues:[],vote:null});
  const order=shuffle(ids);
  const cards={},wolves={},lies={};
  ids.forEach(id=>{cards[id]=String(id)===String(wolfUid)?wolfCard:citizenCard;wolves[id]=String(id)===String(wolfUid);lies[id]=0;});

  // A replay is a completely new match inside the same room. Do this reset
  // locally BEFORE any Firebase awaits so the host cannot remain on the old
  // result screen while the new cards are being written.
  clearTimeout(onlineCpuTimer);onlineCpuTimer=null;
  clearInterval(onlineDiscussionTimer);onlineDiscussionTimer=null;
  onlinePendingAction=null;
  onlineLastActionId="";
  onlineProcessedActionIds.clear();
  onlineActionPromises.clear();
  onlineHostActionQueue=Promise.resolve();
  // Keep the host listener frozen until the new Firebase game snapshot has
  // been published. Do not clear this flag during local replay initialization.
  onlineScoreRecorded=false;

  const matchStartedAt=Date.now();
  const matchId=`${matchStartedAt}-${Math.random().toString(36).slice(2,10)}`;
  const settings=room.settings||onlineSettings();
  const discussionSeconds=Math.max(60,Number(settings.discussionSeconds||120));
  const isVoice=Boolean(settings.voiceMode);
  const phase=isVoice?"discussion":"clue";
  const discussionStartedAt=isVoice?matchStartedAt:null;
  const discussionDeadlineAt=isVoice?matchStartedAt+discussionSeconds*1000:null;

  onlineMatchId=matchId;
  onlineHostSecrets={cards,wolves,lies,wolfUid,citizenCard,wolfCard};
  onlineMyCard=cards[firebaseUid]||null;
  onlineGame={
    matchId,matchStartedAt,phase,round:1,order,orderIndex:0,
    discussionStartedAt,discussionDeadlineAt,
    usedClueIds:[],logs:[],settings,players:publicPlayers,
    tallies:null,eliminatedId:null,result:null,reveal:null,reverseGuess:null
  };
  onlineDiscussionDeadlineAt=discussionDeadlineAt||0;

  // Clear the old result/action UI immediately. This is intentionally before
  // the network writes so the host sees the new timer/phase without waiting
  // for Firebase to echo its own update.
  setupScreen.hidden=true;
  gameScreen.hidden=false;
  onlineDialog.close();
  renderOnlineGame();
  if(isVoice) hostStartVoiceDiscussionTimer(); else hostMaybeCpuTurn();

  // Publish the NEW public game state before doing any cleanup.
  // The old implementation removed action queues first; if Firebase rejected
  // either removal, execution stopped after private cards had already changed.
  // That produced the exact bug where the card changed but the old result
  // screen and missing timer remained. The new match is now written first, and
  // cleanup is best-effort afterwards.
  try{
    await Promise.all(humans.map(p=>set(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/privateCards/${p.uid}`),{cardName:cards[p.uid].name})));
    await update(onlineRoomRef(),{status:"playing",game:onlineSnapshot()});
  }catch(e){
    console.error("online replay publish failed",e);
    alert("新しいゲームを開始できませんでした。Firebaseとの通信を確認して、もう一度お試しください。\n\n"+(e?.message||e));
    onlineHostProcessing=false;
    return;
  }

  // Old actions/results are no longer needed. Never let cleanup failure block
  // the new game because every action also carries matchId and is rejected if
  // it belongs to an earlier match.
  await remove(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/actions`)).catch(e=>console.warn("old action cleanup skipped",e));
  await remove(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/actionResults`)).catch(e=>console.warn("old action result cleanup skipped",e));

  // Echo/render once more after the room write. This also repairs any visual
  // state that a slow browser may have retained from the previous result.
  renderOnlineGame();
  if(isVoice) hostStartVoiceDiscussionTimer(); else hostMaybeCpuTurn();
  // New match is authoritative now; resume Firebase listener processing.
  onlineHostProcessing=false;
}
async function syncOnlinePrivateAndGame(data){
  await loadOnlineOwnCard(data);
  if(data.game){onlineGame=data.game;renderOnlineGame();}
}
closeOnlineButton.addEventListener("click",()=>{
  try{onlineDialog.close();}catch{}
  if(onlineRoomCodeValue) leaveOnlineRoom().catch(e=>console.warn("online leave failed",e));
  setMode(false);
});
document.getElementById("onlineMaxPlayers")?.addEventListener("change",async()=>{
  if(!onlineHost||!onlineRoomCodeValue)return;
  const maxPlayers=Math.min(8,Math.max(3,Number(document.getElementById("onlineMaxPlayers").value||4)));
  const snap=await get(onlineRoomRef()); const room=snap.val();
  const humanCount=lobbyPlayersFromValue(room).length;
  if(humanCount>maxPlayers){alert(`現在${humanCount}人参加しているため、${maxPlayers}人には変更できません。`);syncOnlineLobbySettings(room);return;}
  const currentCpu=Math.min(Number(onlineCpuCount.value||0),maxPlayers-humanCount);
  onlineCpuCount.value=String(Math.max(0,Math.min(currentCpu,maxPlayers-humanCount)));
  await update(onlineRoomRef(),{maxPlayers});
});
createRoomButton.addEventListener("click",()=>{
  createOnlineRoom().catch(e=>console.error("create room failed:",e));
});
joinRoomButton.addEventListener("click",()=>{
  joinOnlineRoom().catch(e=>console.error("join room failed:",e));
});
leaveRoomButton.addEventListener("click",async(e)=>{
  e.preventDefault(); e.stopPropagation();
  if(!onlineRoomCodeValue)return;
  if(!confirm("このオンライン対戦の部屋から退出しますか？"))return;
  await leaveOnlineRoom({returnToSetup:true});
});
// Do not leave an online room when the user clicks the dialog backdrop or
// presses Escape. Those are easy accidental interactions, especially on
// mobile. Leaving the room is an explicit action via the close/leave buttons.
onlineDialog.addEventListener("click",e=>{
  if(e.target===onlineDialog) e.preventDefault();
});
onlineDialog.addEventListener("cancel",e=>{
  if(onlineRoomCodeValue) e.preventDefault();
});
onlineStartButton.addEventListener("click",startOnlineHostGame);
onlineCpuCount.addEventListener("change",()=>{if(onlineHost&&onlineRoomCodeValue){update(ref(firebaseDb,`rooms/${onlineRoomCodeValue}`),{cpuWanted:Number(onlineCpuCount.value||0)});}});
for(const id of ["onlineVoiceMode","onlineDiscussionMinutes"]){document.getElementById(id)?.addEventListener("change",async()=>{if(onlineHost&&onlineRoomCodeValue){const settings=getOnlineLobbySettings();await update(ref(firebaseDb,`rooms/${onlineRoomCodeValue}`),{settings});}});}


// Initialize the mode only after the online state variables and listeners exist.
// Calling setMode() earlier hit the temporal-dead-zone of let onlineMode, which
// stopped the rest of the script and made Online appear unresponsive.
setMode(false);


/* v20 reverse safety */

window.addEventListener("error", function(e){
  if(game && game.phase==="reverse" && !game.players[game.wolfIndex].isHuman){
    const b=document.getElementById("cpuGuessButton");
    if(b){ b.disabled=false; b.classList.remove("loading"); }
  }
});

/* v42: acknowledge every online action and prevent stale vote/clue requests from hanging clients. */
