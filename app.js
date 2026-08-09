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
function returnToSetup(){clearTimeout(cpuTimer);game=null;gameScreen.hidden=true;setupScreen.hidden=false;window.scrollTo({top:0,behavior:"smooth"});}
function openPool(){poolGrid.innerHTML=CARD_POOL.map(c=>`<div class="pool-card"><img src="${cardImage(c)}" alt="${escapeHtml(jpName(c))}">${cardDisplay(c)}</div>`).join("");poolDialog.showModal();}
decreasePlayersButton.addEventListener("click",()=>updatePlayerCount(-1));increasePlayersButton.addEventListener("click",()=>updatePlayerCount(1));startButton.addEventListener("click",startGame);restartButton.addEventListener("click",returnToSetup);document.getElementById("rulesButton").addEventListener("click",()=>rulesDialog.showModal());document.getElementById("closeRulesButton").addEventListener("click",()=>rulesDialog.close());document.getElementById("poolButton").addEventListener("click",openPool);document.getElementById("closePoolButton").addEventListener("click",()=>poolDialog.close());advancedSettingsButton.addEventListener("click",()=>settingsDialog.showModal());closeSettingsButton.addEventListener("click",()=>settingsDialog.close());closeSettingsButtonBottom.addEventListener("click",()=>settingsDialog.close());resetScoreButton.addEventListener("click",()=>{matchRecord={wins:0,losses:0};renderRecord();});rulesDialog.addEventListener("click",e=>{if(e.target===rulesDialog)rulesDialog.close();});poolDialog.addEventListener("click",e=>{if(e.target===poolDialog)poolDialog.close();});settingsDialog.addEventListener("click",e=>{if(e.target===settingsDialog)settingsDialog.close();});updatePlayerCount(0);renderRecord();if(CARD_POOL.length===0)startButton.disabled=true;






/* v20 reverse safety */

window.addEventListener("error", function(e){
  if(game && game.phase==="reverse" && !game.players[game.wolfIndex].isHuman){
    const b=document.getElementById("cpuGuessButton");
    if(b){ b.disabled=false; b.classList.remove("loading"); }
  }
});
