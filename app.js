import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getDatabase, ref, set, update, get, onValue, remove } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const firebaseApp = initializeApp(firebaseConfig);
const firebaseDb = getDatabase(firebaseApp);
const firebaseAuth = getAuth(firebaseApp);
let firebaseUid = null;
let firebaseAuthPromise = null;

function firebaseAuthErrorText(err){
  const code = err?.code ? String(err.code) : "unknown";
  const message = err?.message ? String(err.message) : String(err || "不明なエラー");
  return `Firebase認証に失敗しました。\\n\\nエラーコード: ${code}\\n${message}\\n\\nFirebaseコンソールの「Authentication → ログイン方法 → 匿名」が有効か確認してください。`;
}

function ensureFirebaseAuth(){
  if(firebaseUid) return Promise.resolve(firebaseUid);
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
function cardInfo(card){const parts=[typeJa(card)],a=attributeJa(card.attribute),r=raceJa(card.race);if(a)parts.push(a+"属性");if(r)parts.push(r);if(card.level)parts.push("★"+card.level);return parts.join(" / ");}
function cardStats(card){const atk=Number.isFinite(Number(card.atk))?`ATK ${card.atk}`:"",def=Number.isFinite(Number(card.def))?`DEF ${card.def}`:"";return [atk,def].filter(Boolean).join(" / ");}
function cardDisplay(card){return `<div class="card-name-jp">${escapeHtml(jpName(card))}</div><div class="card-name-en">${escapeHtml(card.name)}</div><div class="card-info-ja">${escapeHtml(cardInfo(card))}</div>${cardStats(card)?`<div class="card-stats">${escapeHtml(cardStats(card))}</div>`:""}`;}
const CPU_NAMES=["ミナト","スズ","トキ","アオイ","レン","コハク","ナギ"];
const setupScreen=document.getElementById("setupScreen"),gameScreen=document.getElementById("gameScreen"),playerCountOutput=document.getElementById("playerCount"),decreasePlayersButton=document.getElementById("decreasePlayers"),increasePlayersButton=document.getElementById("increasePlayers"),startButton=document.getElementById("startButton"),restartButton=document.getElementById("restartButton"),playersElement=document.getElementById("players"),yourCardElement=document.getElementById("yourCard"),actionPanel=document.getElementById("actionPanel"),phaseLabel=document.getElementById("phaseLabel"),phaseTitle=document.getElementById("phaseTitle"),talkLog=document.getElementById("talkLog"),logCount=document.getElementById("logCount"),rulesDialog=document.getElementById("rulesDialog"),poolDialog=document.getElementById("poolDialog"),poolGrid=document.getElementById("poolGrid");
const speechCountSelect=document.getElementById("speechCount"),liePenaltyToggle=document.getElementById("liePenalty"),showLieCountToggle=document.getElementById("showLieCount");
const playerNameInput=document.getElementById("playerName"),winCountElement=document.getElementById("winCount"),lossCountElement=document.getElementById("lossCount");
const settingsDialog=document.getElementById("settingsDialog"),advancedSettingsButton=document.getElementById("advancedSettingsButton"),closeSettingsButton=document.getElementById("closeSettingsButton"),closeSettingsButtonBottom=document.getElementById("closeSettingsButtonBottom"),resetScoreButton=document.getElementById("resetScoreButton");
const soloModeButton=document.getElementById("soloModeButton"),onlineModeButton=document.getElementById("onlineModeButton"),playerCountNote=document.getElementById("playerCountNote");
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
function featureList(card){return [
{id:"monster",label:"モンスターカードです",test:c=>String(c.type||"").includes("Monster")},{id:"spell",label:"魔法カードです",test:c=>String(c.type||"").includes("Spell")},{id:"trap",label:"罠カードです",test:c=>String(c.type||"").includes("Trap")},{id:"effect",label:"効果を持つカードです",test:c=>/Effect|Fusion|Synchro|Xyz|Link/.test(String(c.type||""))},{id:"normal",label:"通常モンスターです",test:c=>String(c.type||"").includes("Normal")},{id:"dragon",label:"ドラゴン族です",test:c=>String(c.race||"").toLowerCase()==="dragon"},{id:"spellcaster",label:"魔法使い族です",test:c=>String(c.race||"").toLowerCase()==="spellcaster"},{id:"warrior",label:"戦士族です",test:c=>String(c.race||"").toLowerCase()==="warrior"},{id:"fiend",label:"悪魔族です",test:c=>String(c.race||"").toLowerCase()==="fiend"},{id:"beast",label:"獣族・獣戦士族です",test:c=>["beast","beast-warrior"].includes(String(c.race||"").toLowerCase())},{id:"light",label:"光属性です",test:c=>String(c.attribute||"").toLowerCase()==="light"},{id:"dark",label:"闇属性です",test:c=>String(c.attribute||"").toLowerCase()==="dark"},{id:"fire",label:"炎属性です",test:c=>String(c.attribute||"").toLowerCase()==="fire"},{id:"water",label:"水属性です",test:c=>String(c.attribute||"").toLowerCase()==="water"},{id:"wind",label:"風属性です",test:c=>String(c.attribute||"").toLowerCase()==="wind"},{id:"earth",label:"地属性です",test:c=>String(c.attribute||"").toLowerCase()==="earth"},{id:"high-atk",label:"攻撃力が2500以上です",test:c=>Number(c.atk)>=2500},{id:"low-atk",label:"攻撃力が1500以下です",test:c=>Number.isFinite(Number(c.atk))&&Number(c.atk)<=1500},{id:"high-def",label:"守備力が2500以上です",test:c=>Number(c.def)>=2500},{id:"level-high",label:"レベル・ランクが7以上です",test:c=>Number(c.level)>=7},{id:"level-low",label:"レベルが4以下です",test:c=>Number.isFinite(Number(c.level))&&Number(c.level)<=4},{id:"name-blue",label:"「青眼」に関係するカードです",test:c=>c.name.includes("Blue-Eyes")},{id:"name-dark",label:"「ブラック」または「ダーク」に関係する名前です",test:c=>c.name.includes("Dark")||c.name.includes("Black")},{id:"name-red",label:"「真紅眼」に関係するカードです",test:c=>c.name.includes("Red-Eyes")},{id:"toon",label:"「トゥーン」の名前を持ちます",test:c=>c.name.includes("Toon")},{id:"forbidden",label:"「封印されし」の名前を持ちます",test:c=>c.name.includes("Forbidden")}];}
function statementsFor(card){return featureList(card).filter(f=>{try{return f.test(card);}catch{return false;}});}
function falseStatementsFor(card){return featureList(card).filter(f=>{try{return !f.test(card);}catch{return false;}});}
function chooseCardPair(){const cards=shuffle(CARD_POOL);for(let i=0;i<500;i++){const citizen=randomItem(cards),cf=statementsFor(citizen).map(x=>x.id),candidates=cards.filter(c=>c.name!==citizen.name&&statementsFor(c).some(f=>cf.includes(f.id)));if(candidates.length)return[citizen,randomItem(candidates)];}return cards.slice(0,2);}
function updatePlayerCount(change){selectedPlayerCount=Math.min(8,Math.max(3,selectedPlayerCount+change));playerCountOutput.value=selectedPlayerCount;playerCountOutput.textContent=selectedPlayerCount;decreasePlayersButton.disabled=selectedPlayerCount===3;increasePlayersButton.disabled=selectedPlayerCount===8;}
function getSettings(){return{speechRounds:Number(speechCountSelect.value||2),liePenalty:Boolean(liePenaltyToggle.checked),showLieCount:Boolean(showLieCountToggle&& !showLieCountToggle.checked)};}
function randomPlayerName(){return randomItem(["ユウ","カイ","レン","アキラ","ナギ","ハヤト","ソラ","ミナ","リク","シン"]);}
function getPlayerName(){const n=(playerNameInput?.value||"").trim();return n||randomPlayerName();}
function renderRecord(){if(winCountElement)winCountElement.textContent=matchRecord.wins;if(lossCountElement)lossCountElement.textContent=matchRecord.losses;}
function buildOrder(round){return round===1?Array.from({length:selectedPlayerCount},(_,i)=>i):Array.from({length:selectedPlayerCount},(_,i)=>selectedPlayerCount-1-i);}
function startGame(){clearTimeout(cpuTimer);if(CARD_POOL.length<2){alert("カードデータがありません。先にカード準備を完了してください。");return;}const [citizenCard,wolfCard]=chooseCardPair(),wolfIndex=Math.floor(Math.random()*selectedPlayerCount),humanName=getPlayerName(),players=Array.from({length:selectedPlayerCount},(_,index)=>({id:index,name:index===0?humanName:CPU_NAMES[index-1],isHuman:index===0,isWolf:index===wolfIndex,card:index===wolfIndex?wolfCard:citizenCard,clues:[],lies:0,vote:null})),settings=getSettings();game={citizenCard,wolfCard,wolfIndex,players,settings,round:1,order:buildOrder(1),orderIndex:0,phase:"clue",logs:[],usedClueIds:[],currentOptions:[],busy:false,tallies:null,eliminatedId:null,result:null,reverseGuess:null,recorded:false};setupScreen.hidden=true;gameScreen.hidden=false;renderGame();window.scrollTo({top:0,behavior:"smooth"});}
function renderGame(){renderPlayers();renderYourCard();renderLog();renderActionPanel();}
function previousPlayer(){if(!game||game.orderIndex<=0)return null;return game.players[game.order[game.orderIndex-1]];}
function currentPlayer(){return game.players[game.order[game.orderIndex]];}
function renderPlayers(){playersElement.innerHTML=game.players.map(p=>{const current=game.phase==="clue"&&game.order[game.orderIndex]===p.id,reveal=game.phase==="result";const clues=p.clues||[];const clueHtml=clues.length?clues.map((c,i)=>`<p><b>${i+1}.</b> 「${escapeHtml(c.label)}」</p>`).join(""):(current?'<p class="muted thinking-text">発言を考えています…</p>':'<p class="muted">まだ発言していません</p>');return `<article class="player-seat ${p.isHuman?"is-you":""} ${current?"is-current":""} ${game.eliminatedId===p.id?"is-eliminated":""} ${reveal?"is-reveal":""}"><div class="avatar">${p.isHuman?"YOU":String(p.id).padStart(2,"0")}</div><div class="seat-copy"><div class="seat-name"><strong>${p.name}</strong>${p.isHuman?"<span>あなた</span>":"<span>CPU</span>"}</div><div class="player-clues">${clueHtml}</div></div>${game.settings&&game.settings.showLieCount&&p.lies?`<span class="lie-count">嘘 ${p.lies}</span>`:""}${reveal?`<span class="vote-badge">${game.tallies&&game.tallies[p.id]!=null?game.tallies[p.id]:0}票</span><div class="result-meta"><span class="role-reveal ${p.isWolf?"wolf":"citizen"}">${p.isWolf?"狼":"市民"} · ${cardShort(p.card)}</span></div>`:""}</article>`;}).join("");}
function renderYourCard(){const card=game.players[0].card;yourCardElement.className="playing-card ygo";yourCardElement.innerHTML=`<div class="ygo-card-face"><img src="${cardImage(card)}" alt="${escapeHtml(jpName(card))}"></div><div class="your-card-meta">${cardDisplay(card)}</div>`;}
function renderLog(){logCount.textContent=`${game.logs.length} 件`;talkLog.innerHTML=game.logs.length?game.logs.map((e,i)=>`<article class="log-entry ${e.type||""}"><span>${String(i+1).padStart(2,"0")}</span><strong>${e.name}</strong><p>${e.text}</p></article>`).join(""):`<p class="empty-log">発言が始まると、ここに記録されます。</p>`;}
function renderActionPanel(){if(game.phase==="clue")renderCluePhase();else if(game.phase==="vote")renderVotePhase();else if(game.phase==="reverse")renderReversePhase();else renderResultPhase();}
function availableClues(player){
 const used=new Set(game.usedClueIds||[]);
 let truthful=shuffle(statementsFor(player.card)).filter(s=>!used.has(s.id));
 let falsehoods=shuffle(falseStatementsFor(player.card)).filter(s=>!used.has(s.id));
 let options=[...truthful.slice(0,4),...falsehoods.slice(0,2)];
 // Ambiguous statements are available only when there are multiple rounds, and at most once per player.
 if(game.settings.speechRounds>=2 && !(player.clues||[]).some(c=>c.ambiguous)){
   const vague=shuffle(AMBIGUOUS_CLUES).filter(v=>!used.has(v.id));
   if(vague.length) options.push(vague[0]);
 }
 if(options.length<4){const extra=shuffle(featureList(player.card)).filter(s=>!used.has(s.id)&&!options.some(o=>o.id===s.id));options.push(...extra.slice(0,4-options.length));}
 return shuffle(options).slice(0,6);
}
function renderCluePhase(){const current=currentPlayer(),roundLabel=game.round===1?"第1ラウンド":"第2ラウンド（逆順）";phaseLabel.textContent=`PHASE ${game.round} / ${roundLabel}・特徴を話す`;phaseTitle.textContent=current.isHuman?"あなたの特徴を話そう":`${current.name}の発言を聞こう`;if(current.isHuman){const options=availableClues(current);game.currentOptions=options;actionPanel.innerHTML=`<div class="action-heading"><p>${roundLabel}</p><h2>何と発言しますか？</h2><span>前の人と同じ特徴は選べません。${game.settings.liePenalty?"狼が2回以上嘘をつくと逆転チャンスを失います。":"嘘の回数によるペナルティはありません。"}</span></div><div class="choice-list">${options.map(s=>`<button class="choice-button ${s.ambiguous?"ambiguous-choice":""}" type="button" data-clue-id="${s.id}"><span>${s.label}</span><span>${s.ambiguous?"曖昧":"→"}</span></button>`).join("")}</div>`;actionPanel.querySelectorAll("[data-clue-id]").forEach(b=>b.addEventListener("click",()=>submitHumanClue(b.dataset.clueId)));return;}actionPanel.innerHTML=`<div class="thinking-state"><span class="thinking-card" aria-hidden="true">?</span><div><p>CPU TURN</p><h2>${current.name}が考えています</h2><span>前の発言とは違う特徴を選んでいます…</span></div></div>`;}
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
function playNextCpuTurn(){if(!game||game.phase!=="clue"||game.busy)return;game.busy=true;const player=currentPlayer();const used=new Set(game.usedClueIds||[]);let truthful=shuffle(statementsFor(player.card)).filter(s=>!used.has(s.id));let falsehoods=shuffle(falseStatementsFor(player.card)).filter(s=>!used.has(s.id));let statement=null;if(!player.isWolf){statement=truthful[0]||shuffle(statementsFor(player.card))[0]||null;}else{const citizen=game.citizenCard;const shared=truthful.filter(st=>safeTest(st,citizen));statement=shared[0]||truthful[0]||falsehoods[0]||null;}if(!statement){game.busy=false;advanceClueTurn();return;}if(submitClue(player,statement))advanceClueTurn();else{game.busy=false;advanceClueTurn();}}
function advanceClueTurn(){game.busy=false;game.currentOptions=[];game.orderIndex+=1;if(game.orderIndex>=game.order.length){if(game.round<game.settings.speechRounds){game.round+=1;game.order=buildOrder(game.round);game.orderIndex=0;game.logs.push({type:"system",name:"ラウンド切替",text:`第${game.round}ラウンド。発言順を逆にします。`});renderGame();if(currentPlayer().isHuman)return;cpuTimer=setTimeout(playNextCpuTurn,700);return;}game.phase="vote";renderGame();return;}renderGame();if(!currentPlayer().isHuman)cpuTimer=setTimeout(playNextCpuTurn,700);}
function renderVotePhase(){phaseLabel.textContent="PHASE / 狼に投票する";phaseTitle.textContent="違うカードの人は誰？";const candidates=game.players.filter(p=>!p.isHuman);actionPanel.innerHTML=`<div class="action-heading"><p>VOTING TIME</p><h2>狼だと思う人を選ぶ</h2><span>2ラウンドの発言を振り返って、ひとりに投票してください。</span></div><div class="vote-grid">${candidates.map(p=>`<button class="vote-button" type="button" data-vote-id="${p.id}"><span class="mini-avatar">${String(p.id).padStart(2,"0")}</span><span><strong>${p.name}</strong><small>${p.clues.map(c=>`「${c.label}」`).join(" / ")}</small></span></button>`).join("")}</div>`;actionPanel.querySelectorAll("[data-vote-id]").forEach(b=>b.addEventListener("click",()=>submitVotes(Number(b.dataset.voteId))));}
function chooseCpuVote(voter){const candidates=game.players.filter(p=>p.id!==voter.id);return candidates.map(candidate=>{const contradictions=candidate.clues.filter(clue=>!clue.ambiguous && !safeTest(clue,voter.card)).length;const lies=candidate.lies;return{id:candidate.id,score:contradictions*2.2+lies*1.1+Math.random()*1.4};}).sort((a,b)=>b.score-a.score)[0].id;}
function submitVotes(humanVoteId){game.players[0].vote=humanVoteId;game.players.slice(1).forEach(p=>p.vote=chooseCpuVote(p));const tallies=Object.fromEntries(game.players.map(p=>[p.id,0]));game.players.forEach(p=>{if(tallies[p.vote]!=null)tallies[p.vote]++;});game.tallies=tallies;const high=Math.max(...Object.values(tallies)),tied=game.players.filter(p=>tallies[p.id]===high),eliminated=randomItem(tied);game.eliminatedId=eliminated.id;game.logs.push({type:"system",name:"投票結果",text:tied.length>1?`${high}票で同票。抽選により${eliminated.name}が選ばれました。`:`${eliminated.name}が${high}票で選ばれました。`});if(eliminated.isWolf){if(game.settings.liePenalty&&game.players[game.wolfIndex].lies>=2){game.result="citizen";game.logs.push({type:"system",name:"ペナルティ",text:"狼は2回以上の嘘をついたため、逆転チャンスを失いました。"});game.phase="result";}else game.phase="reverse";}else{game.result="wolf";game.phase="result";}renderGame();}
function voteSummaryHtml(){
  if(!game||!game.tallies) return "";
  const rows=game.players.map(p=>`<div class="vote-row"><span>${escapeHtml(p.name)}</span><strong>${game.tallies[p.id]||0}票</strong></div>`).join("");
  return `<section class="vote-summary-panel"><h3>投票結果</h3><p>誰が何票集めたかを確認できます。</p>${rows}</section>`;
}
function renderReversePhase(){phaseLabel.textContent="FINAL PHASE / 狼の逆転チャンス";const wolf=game.players[game.wolfIndex];phaseTitle.textContent=`${wolf.name}は狼だった！`;if(wolf.isHuman){actionPanel.innerHTML=`<div class="action-heading danger"><p>あなたは狼です</p><h2>市民カードを当てよう</h2><span>市民カードと同じカードを選べば逆転勝利です。</span></div><div class="guess-card-grid">${CARD_POOL.filter(c=>c.name!==wolf.card.name).map(c=>`<button class="guess-card-button" data-guess="${escapeHtml(c.name)}"><img src="${cardImage(c)}" alt="${escapeHtml(jpName(c))}"><span>${escapeHtml(jpName(c))}</span></button>`).join("")}</div>`;actionPanel.querySelectorAll("[data-guess]").forEach(b=>b.addEventListener("click",()=>finishReverseGuess(CARD_POOL.find(c=>c.name===b.dataset.guess))));return;}actionPanel.innerHTML=`<div class="wolf-reveal"><span class="wolf-eye" aria-hidden="true">W</span><div><p>最終チャンス</p><h2>${wolf.name}が市民カードを推理します</h2><span>当てられたら、狼の逆転勝利です。</span></div></div><button class="primary-button compact" id="cpuGuessButton" type="button"><span>逆転宣言を見る</span><span>→</span></button>`;document.getElementById("cpuGuessButton").addEventListener("click",submitCpuGuess);}
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
  soloModeButton.classList.add("is-selected");
  onlineModeButton.classList.remove("is-selected");
  soloModeButton.setAttribute("aria-pressed","true");
  onlineModeButton.setAttribute("aria-pressed","false");
  playerCountNote.textContent="3〜8人でプレイできます";
  game=null;
  setupScreen.hidden=false;
  gameScreen.hidden=true;
  actionPanel.innerHTML="";
  talkLog.innerHTML="";
  logCount.textContent="0 messages";
  window.scrollTo({top:0,behavior:"auto"});
}
function openPool(){poolGrid.innerHTML=CARD_POOL.map(c=>`<div class="pool-card"><img src="${cardImage(c)}" alt="${escapeHtml(jpName(c))}">${cardDisplay(c)}</div>`).join("");poolDialog.showModal();}
decreasePlayersButton.addEventListener("click",()=>updatePlayerCount(-1));increasePlayersButton.addEventListener("click",()=>updatePlayerCount(1));
startButton.addEventListener("click",()=>{ if(window.cardWolfOnlineMode){ if(!onlineDialog.open) setMode(true); return; } startGame(); });
restartButton.addEventListener("click",returnToSetup);document.getElementById("rulesButton").addEventListener("click",()=>rulesDialog.showModal());document.getElementById("closeRulesButton").addEventListener("click",()=>rulesDialog.close());document.getElementById("poolButton").addEventListener("click",openPool);document.getElementById("closePoolButton").addEventListener("click",()=>poolDialog.close());advancedSettingsButton.addEventListener("click",()=>settingsDialog.showModal());closeSettingsButton.addEventListener("click",()=>settingsDialog.close());closeSettingsButtonBottom.addEventListener("click",()=>settingsDialog.close());resetScoreButton.addEventListener("click",()=>{matchRecord={wins:0,losses:0};renderRecord();});rulesDialog.addEventListener("click",e=>{if(e.target===rulesDialog)rulesDialog.close();});poolDialog.addEventListener("click",e=>{if(e.target===poolDialog)poolDialog.close();});settingsDialog.addEventListener("click",e=>{if(e.target===settingsDialog)settingsDialog.close();});updatePlayerCount(0);renderRecord();if(CARD_POOL.length===0)startButton.disabled=true;







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
let onlineScoreRecorded=false;

function setMode(isOnline){
  onlineMode=Boolean(isOnline);
  window.cardWolfOnlineMode=onlineMode;
  soloModeButton.classList.toggle("is-selected",!onlineMode);
  onlineModeButton.classList.toggle("is-selected",onlineMode);
  soloModeButton.setAttribute("aria-pressed",String(!onlineMode));
  onlineModeButton.setAttribute("aria-pressed",String(onlineMode));
  playerCountNote.textContent=onlineMode?"オンラインは最大4人。3人未満ならCPUを自動追加します。":"3〜8人でプレイできます";
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
function onlineRoomRef(){return ref(firebaseDb,`rooms/${onlineRoomCodeValue}`);}
function makeRoomCode(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<4;i++)s+=chars[Math.floor(Math.random()*chars.length)];return s;}
function onlineSettings(){return getSettings();}
function onlinePublicPlayers(){
  return (onlineGame?.players||[]).map(p=>({id:p.id,name:p.name,isHuman:Boolean(p.isHuman),clues:(p.clues||[]).map(c=>({id:c.id,label:c.label,ambiguous:Boolean(c.ambiguous)})),vote:p.vote??null}));
}
function onlineSnapshot(extra={}){
  return {
    phase:onlineGame.phase, round:onlineGame.round, order:onlineGame.order,
    orderIndex:onlineGame.orderIndex, usedClueIds:onlineGame.usedClueIds||[],
    logs:onlineGame.logs||[], settings:onlineGame.settings,
    players:onlinePublicPlayers(), tallies:onlineGame.tallies||null,
    eliminatedId:onlineGame.eliminatedId??null, result:onlineGame.result??null,
    reverseGuess:onlineGame.reverseGuess?onlineGame.reverseGuess.name:null,
    reveal:extra.reveal||onlineGame.reveal||null,
    updatedAt:Date.now()
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
  const max=Math.min(4,Number(data?.maxPlayers||4));
  const humanCount=players.length;
  const minCpu=Math.max(0,3-humanCount);
  const selected=Math.max(minCpu,Math.min(Number(onlineCpuCount.value||0),4-humanCount));
  onlineCpuCount.value=String(selected);
  onlineCpuCount.disabled=!onlineHost;
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
  const room={hostUid:firebaseUid,status:"lobby",maxPlayers:Math.min(4,Math.max(3,selectedPlayerCount)),createdAt:Date.now(),settings:onlineSettings(),players:{[firebaseUid]:{uid:firebaseUid,name,host:true}}};
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
  if(players.length>=Math.min(4,Number(data.maxPlayers||4))){alert("このルームは満員です。");return;}
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
      onlineGame={...data.game, usedClueIds:Array.isArray(data.game.usedClueIds)?data.game.usedClueIds:[], logs:Array.isArray(data.game.logs)?data.game.logs:[], players:Array.isArray(data.game.players)?data.game.players:[], settings:data.game.settings||onlineSettings(), order:Array.isArray(data.game.order)?data.game.order:[], orderIndex:Number.isFinite(data.game.orderIndex)?data.game.orderIndex:0};
      loadOnlineOwnCard(data).then(()=>renderOnlineGame());
      onlineDialog.close();
      setupScreen.hidden=true;gameScreen.hidden=false;
      if(onlineHost && !onlineActionUnsubscribe) attachOnlineHostActionListener();
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
  onlineRoomCodeValue="";onlineHost=false;onlineGame=null;onlineMyCard=null;onlineHostSecrets=null;onlineLastActionId=null;
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
    const clueHtml=clues.length?clues.map((c,i)=>`<p><b>${i+1}.</b> 「${escapeHtml(c.label)}」</p>`).join(""):(current?'<p class="muted thinking-text">発言を考えています…</p>':'<p class="muted">まだ発言していません</p>');
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
function onlineSubmitClue(id){
  if(onlineGame.phase!=="clue"||String(onlineCurrentId())!==String(firebaseUid))return;
  const card=onlineMyCard;if(!card)return;
  const me=onlinePlayerById(firebaseUid), opts=onlineFeatureOptions(card,onlineGame.usedClueIds,me?.clues);
  const usedIds=Array.isArray(onlineGame.usedClueIds)?onlineGame.usedClueIds:[];
  onlineGame.usedClueIds=usedIds;
  const st=opts.find(s=>s.id===id);if(!st||usedIds.includes(st.id))return;
  submitOnlineAction({type:"clue",clueId:id,at:Date.now()});
}
function renderOnlineClue(){
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
  if(me?.vote){
    actionPanel.innerHTML=`<div class="thinking-state"><span class="thinking-card" aria-hidden="true">✓</span><div><p>VOTE SENT</p><h2>投票しました</h2><span>他のプレイヤーの投票を待っています…</span></div></div>`;return;
  }
  const candidates=onlineGame.players.filter(p=>String(p.id)!==String(firebaseUid));
  actionPanel.innerHTML=`<div class="action-heading"><p>VOTING TIME</p><h2>狼だと思う人を選ぶ</h2><span>全員の発言を振り返って、ひとりに投票してください。</span></div><div class="vote-grid">${candidates.map(p=>`<button class="vote-button" type="button" data-online-vote="${escapeHtml(String(p.id))}"><span class="mini-avatar">P</span><span><strong>${escapeHtml(p.name)}</strong><small>${(p.clues||[]).map(c=>`「${escapeHtml(c.label)}」`).join(" / ")}</small></span></button>`).join("")}</div>`;
  actionPanel.querySelectorAll("[data-online-vote]").forEach(b=>b.addEventListener("click",()=>submitOnlineAction({type:"vote",voteId:b.dataset.onlineVote,at:Date.now()})));
}
function renderOnlineReverse(){
  const wolfId=onlineGame.reveal?.wolfId||onlineGame.wolfUid||onlineGame.eliminatedId;
  const wolf=onlinePlayerById(wolfId);
  phaseLabel.textContent="FINAL PHASE / 狼の逆転チャンス";phaseTitle.textContent=`${wolf?.name||"狼"}は狼だった！`;
  if(String(wolfId)!==String(firebaseUid)){
    actionPanel.innerHTML=`<div class="wolf-reveal"><span class="wolf-eye" aria-hidden="true">W</span><div><p>最終チャンス</p><h2>${escapeHtml(wolf?.name||"狼")}の逆転宣言を待っています</h2><span>狼が市民カードを推理します。</span></div></div>`;return;
  }
  actionPanel.innerHTML=`<div class="action-heading danger"><p>あなたは狼です</p><h2>市民カードを当てよう</h2><span>市民カードと同じカードを選べば逆転勝利です。</span></div><div class="guess-card-grid">${CARD_POOL.filter(c=>!onlineMyCard||c.name!==onlineMyCard.name).map(c=>`<button class="guess-card-button" data-online-guess="${escapeHtml(c.name)}"><img src="${cardImage(c)}" alt="${escapeHtml(jpName(c))}"><span>${escapeHtml(jpName(c))}</span></button>`).join("")}</div>`;
  actionPanel.querySelectorAll("[data-online-guess]").forEach(b=>b.addEventListener("click",()=>submitOnlineAction({type:"reverse",guess:b.dataset.onlineGuess,at:Date.now()})));
}
function renderOnlineResult(){
  const wolfWon=onlineGame.result==="wolf"||onlineGame.result==="wolf-reversal";
  phaseLabel.textContent="GAME OVER / 答え合わせ";phaseTitle.textContent=wolfWon?"狼チームの勝利":"市民チームの勝利";
  const rev=onlineGame.reveal?.reverseGuess;
  const citizen=onlineGame.reveal?.citizenCard,wolfCard=onlineGame.reveal?.wolfCard;
  const msg=onlineGame.result==="wolf"? "選ばれたプレイヤーは市民でした。狼は正体を隠し切りました。":onlineGame.result==="wolf-reversal"?`狼が市民カード「${jpName(citizen)}」を見事に当て、逆転しました。`:`狼の宣言は「${jpName(rev||{})}」。正解は「${jpName(citizen||{})}」でした。`;
  actionPanel.innerHTML=`<div class="result-banner ${wolfWon?"wolf-win":"citizen-win"}"><p>${wolfWon?"狼チームの勝利":"市民チームの勝利"}</p><h2>${wolfWon?"狼の勝利":"市民の勝利"}</h2><span>${msg}</span></div><div class="answer-cards">${citizen?`<div><small>市民カード</small><img class="ygo-thumb" src="${cardImage(citizen)}"><strong>${jpName(citizen)}</strong><em>${cardInfo(citizen)}${cardStats(citizen)?" · "+cardStats(citizen):""}</em></div>`:""}${wolfCard?`<div><small>狼カード</small><img class="ygo-thumb" src="${cardImage(wolfCard)}"><strong>${jpName(wolfCard)}</strong><em>${cardInfo(wolfCard)}${cardStats(wolfCard)?" · "+cardStats(wolfCard):""}</em></div>`:""}</div><button class="primary-button compact" id="onlineBackButton" type="button"><span>ロビーへ戻る</span><span>↩</span></button>`;
  document.getElementById("onlineBackButton").addEventListener("click",async()=>{if(confirm("オンライン対戦を終了して部屋から退出しますか？")){await leaveOnlineRoom({returnToSetup:true});}});
  if(!onlineScoreRecorded){const myRole=onlineGame.reveal?.roles?.[firebaseUid];const won=(myRole==="wolf"&&wolfWon)||(myRole==="citizen"&&!wolfWon);if(won)matchRecord.wins++;else matchRecord.losses++;onlineScoreRecorded=true;renderRecord();}
}
function renderOnlineGame(){
  if(!onlineGame)return;
  renderOnlinePlayers();renderOnlineCard();renderOnlineLog();
  if(onlineGame.phase==="clue")renderOnlineClue();else if(onlineGame.phase==="vote")renderOnlineVote();else if(onlineGame.phase==="reverse")renderOnlineReverse();else renderOnlineResult();
}
async function submitOnlineAction(action){
  if(!onlineRoomCodeValue||!firebaseUid){console.warn("online action ignored: room/auth not ready");return false;}
  if(!onlineGame){console.warn("online action ignored: game state not ready");return false;}
  const actionId=`${firebaseUid}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  try{
    // Players are explicitly allowed to write to their own player node by the
    // Firebase rules. Queue the action there instead of using the separate
    // /actions branch, which was intermittently rejected on non-host clients.
    await set(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/players/${firebaseUid}/pendingActions/${actionId}`),{...action,uid:firebaseUid,actionId});
    return true;
  }catch(e){
    console.error("online action failed",e);
    alert(`操作を送信できませんでした。\n\n${e?.code?`エラーコード: ${e.code}\n`:""}${e?.message||e}`);
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
async function hostApplyClue(uid,clueId){
  if(!onlineHost||!onlineGame||onlineGame.phase!=="clue")return false;
  if(String(uid)!==String(onlineCurrentId()))return false;
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
  onlineGame.orderIndex++;
  if(onlineGame.orderIndex>=onlineGame.order.length){
    if(onlineGame.round<onlineGame.settings.speechRounds){onlineGame.round++;onlineGame.order=onlineGame.round===1?onlineGame.order.slice():[...onlineGame.order].reverse();onlineGame.orderIndex=0;onlineGame.logs.push({type:"system",name:"ラウンド切替",text:`第${onlineGame.round}ラウンド。発言順を逆にします。`});}
    else {onlineGame.phase="vote";onlineGame.orderIndex=0;await hostAssignCpuVotes();await hostWriteGame();return;}
  }
  await hostWriteGame();
  hostMaybeCpuTurn();
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
  const humanCount=onlineGame.players.filter(p=>p.isHuman).length;
  const voted=onlineGame.players.filter(p=>p.isHuman&&p.vote).length;
  if(voted<humanCount)return;
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
  const reveal={citizenCard:citizen,wolfCard,reverseGuess:onlineGame.reverseGuess,roles:{},cards:{},wolfId:onlineHostSecrets.wolfUid};
  onlineGame.players.forEach(p=>{reveal.roles[p.id]=onlineHostSecrets.wolves[p.id]?"wolf":"citizen";reveal.cards[p.id]=onlineHostSecrets.cards[p.id];});
  onlineGame.reveal=reveal;onlineGame.phase="result";
  await hostWriteGame();
}
async function hostProcessAction(action){
  if(!onlineHost||!onlineGame||!action)return;
  if(action.type==="clue"){await hostApplyClue(action.uid,action.clueId);}
  else if(action.type==="vote"&&onlineGame.phase==="vote"){
    const p=onlinePlayerById(action.uid);if(!p||!p.isHuman)return;
    if(onlineGame.players.some(x=>String(x.id)===String(action.voteId))&&String(action.voteId)!==String(action.uid)){p.vote=String(action.voteId);await hostEvaluateVotes();if(onlineGame.phase==="vote")await hostWriteGame();}
  }else if(action.type==="reverse"&&onlineGame.phase==="reverse"&&String(action.uid)===String(onlineHostSecrets.wolfUid)){
    const guess=CARD_POOL.find(c=>c.name===action.guess);if(guess)await hostFinishResult(guess.name);
  }
}
function attachOnlineHostActionListener(){
  if(onlineActionUnsubscribe||!onlineRoomCodeValue)return;
  // Listen to each player's own pending-action queue. The player rules already
  // permit a user to write only under their own UID, so this avoids the
  // non-host write failure that affected the first human clue.
  onlineActionUnsubscribe=onValue(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/players`),async snap=>{
    const data=snap.val()||{};
    for(const [uid,playerNode] of Object.entries(data)){
      const queue=playerNode?.pendingActions;
      if(!queue||typeof queue!=='object')continue;
      for(const [actionId,action] of Object.entries(queue)){
        if(!action||action.actionId!==actionId)continue;
        if(actionId===onlineLastActionId)continue;
        onlineLastActionId=actionId;
        try{
          // The path is authoritative for the sender; do not trust a forged uid
          // field from the client.
          await hostProcessAction({...action,uid});
        }finally{
          await remove(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/players/${uid}/pendingActions/${actionId}`)).catch(()=>{});
        }
      }
    }
  });
}
async function startOnlineHostGame(){
  if(!onlineHost||!onlineRoomCodeValue)return;
  const snap=await get(onlineRoomRef()),room=snap.val();if(!room)return;
  const humans=lobbyPlayersFromValue(room);
  const wantedCpu=Math.max(0,Math.min(Number(onlineCpuCount.value||0),4-humans.length));
  const cpuNeeded=Math.max(wantedCpu,3-humans.length);
  const total=humans.length+cpuNeeded;
  if(total<3||total>4){alert("オンラインは合計3〜4人で開始します。");return;}
  const [citizenCard,wolfCard]=chooseCardPair();
  const ids=humans.map(p=>p.uid);
  for(let i=0;i<cpuNeeded;i++)ids.push(`cpu-${i}`);
  const wolfUid=randomItem(ids);
  const publicPlayers=humans.map(p=>({id:p.uid,name:p.name,isHuman:true,clues:[],vote:null}));
  for(let i=0;i<cpuNeeded;i++)publicPlayers.push({id:`cpu-${i}`,name:CPU_NAMES[i]||`CPU${i+1}`,isHuman:false,clues:[],vote:null});
  const order=shuffle(ids);
  const cards={},wolves={},lies={};
  ids.forEach(id=>{cards[id]=String(id)===String(wolfUid)?wolfCard:citizenCard;wolves[id]=String(id)===String(wolfUid);lies[id]=0;});
  onlineHostSecrets={cards,wolves,lies,wolfUid,citizenCard,wolfCard};
  onlineMyCard=cards[firebaseUid]||null;onlineScoreRecorded=false;
  onlineGame={phase:"clue",round:1,order,orderIndex:0,usedClueIds:[],logs:[],settings:room.settings||onlineSettings(),players:publicPlayers,tallies:null,eliminatedId:null,result:null,reveal:null,reverseGuess:null};
  for(const p of humans)await set(ref(firebaseDb,`rooms/${onlineRoomCodeValue}/privateCards/${p.uid}`),{cardName:cards[p.uid].name});
  attachOnlineHostActionListener();
  await update(onlineRoomRef(),{status:"playing",game:onlineSnapshot()});
  renderOnlineGame();
  hostMaybeCpuTurn();
}
async function syncOnlinePrivateAndGame(data){
  await loadOnlineOwnCard(data);
  if(data.game){onlineGame=data.game;renderOnlineGame();}
}
soloModeButton.addEventListener("click",()=>setMode(false));
onlineModeButton.addEventListener("click",()=>setMode(true));
closeOnlineButton.addEventListener("click",()=>{
  try{onlineDialog.close();}catch{}
  if(onlineRoomCodeValue) leaveOnlineRoom().catch(e=>console.warn("online leave failed",e));
  setMode(false);
});
createRoomButton.addEventListener("click",()=>{
  createOnlineRoom().catch(e=>console.error("create room failed:",e));
});
joinRoomButton.addEventListener("click",()=>{
  joinOnlineRoom().catch(e=>console.error("join room failed:",e));
});
leaveRoomButton.addEventListener("click",async()=>{
  if(!onlineRoomCodeValue)return;
  if(!confirm("このオンライン対戦の部屋から退出しますか？"))return;
  await leaveOnlineRoom({returnToSetup:true});
});
onlineStartButton.addEventListener("click",startOnlineHostGame);
onlineCpuCount.addEventListener("change",()=>{if(onlineHost&&onlineRoomCodeValue){update(ref(firebaseDb,`rooms/${onlineRoomCodeValue}`),{cpuWanted:Number(onlineCpuCount.value||0)});}});

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

/* v37: route human online actions through each player's own Firebase node. */
