import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FileDownloads,fileSaveMessage} from './file-downloads.js';

function setup(t,{native=true,triggerError=false}={}){
  const updates=[],attempts=[],released=[];let listener,unsubscribed=false,count=0;
  const downloads=new FileDownloads({desktop:native?{onDownload:fn=>{listener=fn;return ()=>{unsubscribed=true;};}}:null,onChange:event=>updates.push(event),createURL:blob=>{const url='blob:clock://studio/'+(++count);attempts.push({url,blob});return url;},revokeURL:url=>released.push(url),trigger:(url,filename)=>{attempts.at(-1).filename=filename;if(triggerError)throw Error('Download unavailable');}});
  t.after(()=>downloads.dispose());return {downloads,updates,attempts,released,receipt:event=>listener(event),unsubscribed:()=>unsubscribed};
}
test('native receipts distinguish a prepared file, cancellation, retry, and an actual renamed save',t=>{
  const x=setup(t),blob=new Blob(['original print bytes']);x.downloads.save(blob,'clock-211mm.stl');
  assert.equal(x.updates.at(-1).state,'choosing');assert.doesNotMatch(fileSaveMessage(x.updates.at(-1)),/^Saved/);
  x.receipt({url:x.attempts[0].url,state:'cancelled'});assert.equal(x.updates.at(-1).canRetry,true);assert.equal(x.released.length,1);
  x.downloads.retry();assert.equal(x.attempts[1].blob,blob);assert.equal(x.attempts[1].filename,'clock-211mm.stl');
  x.receipt({url:x.attempts[1].url,state:'completed',filename:'Renamed clock.stl'});assert.equal(fileSaveMessage(x.updates.at(-1)),'Saved Renamed clock.stl.');assert.equal(x.updates.at(-1).canRetry,false);assert.equal(x.downloads.jobs.size,0);
});
test('older and unrelated receipts cannot replace the newest save feedback',t=>{
  const x=setup(t);x.downloads.save(new Blob(['first']),'first.clock','project');x.downloads.save(new Blob(['second']),'second.3mf');
  const before=x.updates.length;x.receipt({url:x.attempts[0].url,state:'completed'});x.receipt({url:'blob:unrelated',state:'completed'});x.receipt({url:x.attempts[1].url,state:'invented'});assert.equal(x.updates.length,before);
  x.receipt({url:x.attempts[1].url,state:'interrupted'});assert.equal(x.updates.at(-1).filename,'second.3mf');assert.equal(x.updates.at(-1).canRetry,true);assert.equal(x.released.length,2);
});
test('browser downloads report their start without pretending to confirm a disk save',t=>{
  const x=setup(t,{native:false});x.downloads.save(new Blob(['backup']),'backup.clock','project');assert.equal(x.updates.at(-1).state,'started');assert.match(fileSaveMessage(x.updates.at(-1)),/browser’s downloads/);
  x.downloads.dispose();assert.equal(x.released.length,1);assert.equal(x.downloads.latest,null);assert.equal(x.downloads.jobs.size,0);
});
test('an unavailable download releases resources and allows a retry; disposal detaches native receipts',t=>{
  const x=setup(t,{triggerError:true});x.downloads.save(new Blob(['strip']),'strip.stl','fit');assert.equal(x.updates.at(-1).state,'interrupted');assert.equal(x.released.length,1);assert.equal(x.downloads.jobs.size,0);
  x.downloads.dispose();assert.equal(x.unsubscribed(),true);
});
