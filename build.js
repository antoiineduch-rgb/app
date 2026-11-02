import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const options = { absWorkingDir: import.meta.dirname, bundle: true, format: 'iife', platform: 'browser', target: 'chrome120', charset: 'utf8', legalComments: 'eof' };
await Promise.all([
  build({ ...options, entryPoints: ['app.js'], outfile: 'studio.js' }),
  build({ ...options, entryPoints: ['export-worker-source.js'], outfile: 'export-worker.js' }),
]);
await Promise.all(['studio.js','export-worker.js'].map(async name => {
  const path=join(import.meta.dirname,name);
  await writeFile(path,(await readFile(path,'utf8')).replace(/[\t ]+$/gm,''));
}));
const notices=[];
for(const [name,file]of[['earcut','LICENSE'],['polygon-clipping','LICENSE.md'],['robust-predicates','LICENSE'],['splaytree','Readme.md']]){
  const directory=join(import.meta.dirname,'node_modules',name);
  const metadata=JSON.parse(await readFile(join(directory,'package.json'),'utf8'));
  let license=await readFile(join(directory,file),'utf8');
  if(name==='splaytree')license=license.slice(license.indexOf('## License'));
  notices.push(`${name} ${metadata.version}\n${'='.repeat(60)}\n${license.trim()}`);
}
await writeFile(join(import.meta.dirname,'THIRD_PARTY_NOTICES.txt'),notices.join('\n\n')+'\n');
console.log('Built Clock Factory browser and export worker scripts.');
