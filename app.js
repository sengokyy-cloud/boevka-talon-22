(() => {
  "use strict";
  const story = window.STORY;
  const q = (id) => document.getElementById(id);
  const e = Object.fromEntries(["book","scene-art","scene-title","scene-desc","folio","note","note-message","verse-slot","stamp","feedback","choices","stage-fx","sound","picture","skip-cut","cut-dots","song","audio-gate","audio-state","start","resume"].map(k=>[k,q(k)]));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const key = "talon22-directors-cut-v2";
  const flavorKey = key+"-flavor";
  const cover = { id:"00", art:"art/01.webp", mood:"day", title:"Талон №22",
    lines:["Одна прогулка на роликах, один порыв ветра и целая Боевка впереди.","Курск. Один летний день."] };
  const indexById = new Map(story.map((s,i)=>[s.id,i]));
  const assets = new Map();
  let current = -1, visited = -1, busy = false, starting = false, cut = null, flavor = "raspberry";
  try {const saved=localStorage.getItem(flavorKey);if(["raspberry","melon"].includes(saved))flavor=saved;} catch {}
  try {const v=Number(localStorage.getItem(key)); if(Number.isInteger(v)&&v>=0&&v<story.length&&localStorage.getItem(key)!==null) visited=v;} catch {}
  let fx = (v) => { try{window.PaperMotion?.play(e["stage-fx"],v);}catch(err){console.warn("paper movement",err);} };
  const wait = (time) => new Promise(resolve => setTimeout(resolve,time));
  function img(path) {
    if(!assets.has(path)){
      const image=new Image(); image.src=path;
      const decoded=typeof image.decode==="function" ? image.decode().catch(()=>{}) : Promise.resolve();
      assets.set(path,{image,decoded});
      if(assets.size>5)assets.delete(assets.keys().next().value);
    }
    return assets.get(path);
  }
  img(cover.art); img(story[1].art);
  function say(text) { e.feedback.textContent=text||"";e.feedback.hidden=!text; }
  function button(label, isPrimary, handler) {
    const b=document.createElement("button");
    b.type="button";b.textContent=label;b.className="choice "+(isPrimary?"choice--primary":"choice--secondary");
    b.addEventListener("click",handler); return b;
  }
  function currentScene(){return current<0 ? cover : story[current];}
  function artFor(scene) {
    return scene.id==="07" ? "art/07-"+flavor+".webp" : scene.art;
  }
  function render(moveFocus=false) {
    const s=currentScene(), last=current===story.length-1;
    e.book.classList.toggle("is-cover",current===-1);
    e.book.classList.toggle("is-finale",last);
    toggleGate(current===-1);
    if(current===-1 && !starting) {
      e.song.pause();
      if(e.song.readyState>0) e.song.currentTime=0;
      e["audio-state"].textContent="";
    }
    e.book.dataset.mood=s.mood;
    e.book.dataset.scene=s.id;
    e["scene-art"].src=artFor(s);
    e["scene-art"].alt=window.Shots.stills[s.id]||window.Shots.stills["01"];
    e["cut-dots"].replaceChildren();
    e["scene-title"].textContent=s.title;
    e["scene-desc"].replaceChildren(...(last?[s.lines[0]]:s.lines).map(t=>{
      const p=document.createElement("p");p.textContent=t;return p;
    }));
    e.note.hidden=!last;
    if(last){
      e["note-message"].textContent=s.note.replace(/\s+Паша\.?$/u,"");
      e["verse-slot"].textContent=s.poem||"";
      e.stamp.textContent=s.stamp;
    }
    e.folio.hidden=current<0;
    e.folio.textContent=current<0?"":((current+1)+" / "+story.length);
    e.folio.setAttribute("aria-label", "Глава "+(current+1)+" из "+story.length);
    e.choices.classList.toggle("has-choices", current>=0 && !last && s.choices.length>1);
    say("");
    if(current<0){
      e.choices.replaceChildren();
      e.resume.hidden=!(visited>0 && visited<story.length-1);
    } else if(last){
      e.choices.replaceChildren(button("Перечитать с начала",true,()=>go(-1,{kind:"replay"})));
    } else{
      e.choices.replaceChildren(...s.choices.map((item,j)=>button(item.label,j===0,()=>choose(item))));
    }
    if(moveFocus) e["scene-title"].focus({preventScroll:true});
    if(story[current+1]) img(artFor(story[current+1]));
    if(story[current+2]) img(artFor(story[current+2]));
    if(current>=0 && current<story.length-1) {
      const choices=current===3?["Малиновое","Дыневое"]:[""];
      const frames=[...new Set(choices.flatMap(label=>window.Shots.sequence(s.id,label)))];
      window.Cinema?.preload(s.id,{frames,destination:artFor(story[current+1])});
    }
  }
  function updateSound() {
    const playing = !e.song.paused && !e.song.ended;
    e.sound.setAttribute("aria-pressed",String(playing));
    e.sound.setAttribute("aria-label",playing?"Выключить музыку":"Включить музыку");
    e.sound.title=playing?"Выключить музыку":"Включить музыку";
  }
  function toggleGate(visible) {
    e["audio-gate"].hidden=!visible;
    e.sound.hidden=visible;
  }
  async function startWithMusic(i, kind) {
    if(starting || busy || current!==-1) return;
    starting=true;
    e.start.disabled=e.resume.disabled=true;
    e["audio-state"].textContent="Запускается музыка…";
    try {
      await e.song.play();
      if(e.song.paused || e.song.readyState<2) throw Error("Playback could not start");
      e["audio-state"].textContent="";
      await go(i,{kind});
    } catch {
      e["audio-state"].textContent="Музыка не запустилась. Нажми ещё раз.";
    } finally {
      starting=false;
      e.start.disabled=e.resume.disabled=false;
    }
  }
  function setBusy(v){
    busy=v;
    if(v)e.book.setAttribute("aria-busy","true"); else e.book.removeAttribute("aria-busy");
    for(const b of e.choices.querySelectorAll("button")) b.disabled=v;
  }
  function setVisited(i){
    if(i>visited){ visited=i;try{localStorage.setItem(key,String(i));}catch{} }
  }
  function showCut(show) {
    e["skip-cut"].hidden=!show;
    if(!show) e["cut-dots"].replaceChildren();
  }
  function showBeat({index,count}) {
    if(!cut?.cancelled && index<count) {
      const bars=Array.from({length:count},(_,j)=>{
        const v=document.createElement("span");
        if(j<index)v.className="past";
        if(j===index)v.className="now";
        return v;
      });
      e["cut-dots"].replaceChildren(...bars);
    }
  }
  async function go(i,opts={}) {
    if(busy||i===current||i>=story.length||i< -1)return;
    const before=currentScene(), after=i<0?cover:story[i];
    const animated=!reduced.matches;
    const cinematic=animated && current>=0 && i===current+1 && !!window.Cinema;
    setBusy(true);
    const fromArt=artFor(before), toArt=artFor(after);
    const destination=img(toArt);
    if(opts.response) say(opts.response);
    let played=false, skipped=false;
    try{
      if(cinematic){
        cut={cancelled:false};
        showCut(true);
        fx({from:before.id,to:after.id,choice:opts.label||opts.kind||""});
        await Promise.race([destination.decoded,wait(350)]);
        if(!cut.cancelled) played=await window.Cinema.play(e.picture,{
          from:before.id,to:after.id,choice:opts.label||"",onBeat:showBeat,
          frames:window.Shots.sequence(before.id,opts.label||""),
          destination:toArt, msPerFrame:before.id==="09"?1310:before.id==="07"||before.id==="08"?1440:1275
        });
        skipped=cut.cancelled;
        cut=null;
      }
      if(animated&&!played&&!skipped){
        if(!cinematic)fx({from:before.id,to:after.id,choice:opts.label||opts.kind||""});
        await Promise.all([Promise.race([destination.decoded,wait(550)]),wait(opts.response?610:100)]);
        e.book.style.setProperty("--current-art","url("+fromArt+")");
        e.book.style.setProperty("--next-art","url("+toArt+")");
        e.book.classList.toggle("is-backward",i<current);
        e.book.classList.add("is-flipping");
        await wait(360);
      } else if(!animated){
        await Promise.all([Promise.race([destination.decoded,wait(550)]),wait(opts.response?650:0)]);
      }
      current=i;setVisited(i);
      render(false);
      setBusy(true);
      if(animated&&!played&&!skipped) await wait(360);
    } finally {
      e.book.classList.remove("is-flipping","is-backward");
      cut=null;
      showCut(false);
      setBusy(false);
      (i<0 ? e.start : e["scene-title"]).focus({preventScroll:true});
    }
  }
  function choose(item){
    if(busy)return;
    const s=currentScene();
    if(item.next===s.id){
      say(item.response);
      e.book.classList.remove("is-retrying");
      void e.book.offsetWidth;
      e.book.classList.add("is-retrying");
      fx({from:s.id,to:s.id,choice:item.label});
      return;
    }
    if(!indexById.has(item.next))return;
    if(s.id==="04"){
      flavor=/дыневое/i.test(item.label)?"melon":"raspberry";
      try{localStorage.setItem(flavorKey,flavor);}catch{}
    }
    go(indexById.get(item.next),{response:item.response,label:item.label});
  }
  e["skip-cut"].addEventListener("click",()=>{
    if(!cut)return;
    cut.cancelled=true;
    window.Cinema.cancel(e.picture);
  });
  e.start.addEventListener("click",()=>startWithMusic(0,"start"));
  e.resume.addEventListener("click",()=>startWithMusic(visited,"resume"));
  for(const event of ["playing","pause","ended"]) e.song.addEventListener(event,updateSound);
  e.sound.addEventListener("click",()=>{
    if(e.song.paused) e.song.play().catch(()=>{});
    else e.song.pause();
  });
  render();
})();
