const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const {Window}=require('happy-dom');
for(const script of ['content.js','custom-script.js'])test(script+' handles speed, ads, live and navigation',async()=>{
 const w=new Window();w.document.body.innerHTML='<div class="html5-video-player"><video class="html5-main-video"></video><div class="ytp-time-display"><span class="ytp-time-current">12:00</span><span class="ytp-time-duration">26:00</span></div></div>';
 const old=w.document.querySelector('.html5-video-player');let video=old.querySelector('video');Object.defineProperties(video,{duration:{value:1560,configurable:true},currentTime:{value:720,configurable:true},playbackRate:{value:2,writable:true}});
 let observers=[];const observer=class{constructor(cb){this.cb=cb;observers.push(this)}observe(){}disconnect(){}};
 const ctx=vm.createContext({window:w,document:w.document,getComputedStyle:w.getComputedStyle.bind(w),MutationObserver:observer,requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},setTimeout:fn=>fn(),isFinite});
 vm.runInContext(fs.readFileSync(script,'utf8'),ctx);
 assert.equal(old.querySelector('.yt-speed-duration').textContent,'13:00');assert.equal(old.querySelector('.yt-speed-current').textContent,'6:00');
 old.classList.add('ad-showing');observers[1].cb([{target:old,oldValue:'html5-video-player yt-speed-scaled'}]);assert.equal(old.classList.contains('yt-speed-scaled'),false);
 old.classList.remove('ad-showing');observers[1].cb([{target:old,oldValue:'html5-video-player ad-showing'}]);assert.equal(old.classList.contains('yt-speed-scaled'),true);
 video.playbackRate=1;video.dispatchEvent(new w.Event('ratechange'));assert.equal(old.classList.contains('yt-speed-scaled'),false);
 Object.defineProperty(video,'duration',{value:Infinity,configurable:true});video.playbackRate=2;video.dispatchEvent(new w.Event('ratechange'));assert.equal(old.classList.contains('yt-speed-scaled'),false);
 const replacement=old.cloneNode(true);replacement.querySelectorAll('.yt-speed-current,.yt-speed-duration').forEach(n=>n.remove());old.remove();w.document.body.append(replacement);video=replacement.querySelector('video');Object.defineProperties(video,{duration:{value:600},currentTime:{value:120},playbackRate:{value:2,writable:true}});w.document.dispatchEvent(new w.Event('yt-navigate-finish'));assert.equal(old.classList.contains('yt-speed-scaled'),false);assert.equal(replacement.querySelectorAll('.yt-speed-duration').length,1);assert.equal(replacement.querySelector('.yt-speed-duration').textContent,'5:00');
});
