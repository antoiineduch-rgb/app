// Optional real-consumer check: node tests/bambu-reference.cjs /path/to/bambu-studio exported-bambu-a1.3mf
// Uses an isolated temporary profile and never slices, uploads, or prints.
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync}=require('node:fs');
const {tmpdir}=require('node:os');
const {resolve,join}=require('node:path');
const {unzipSync,strFromU8}=require('fflate');
const [binary,input]=process.argv.slice(2);if(!binary||!input)throw Error('Usage: node tests/bambu-reference.cjs /path/to/bambu-studio exported-bambu-a1.3mf');
const directory=mkdtempSync(join(tmpdir(),'clock-bambu-reference-'));mkdirSync(join(directory,'profile'));
function read(path){const files=unzipSync(readFileSync(path));return {settings:JSON.parse(strFromU8(files['Metadata/project_settings.config'])),paint:Object.entries(files).filter(([key])=>key.endsWith('.model')).flatMap(([_key,bytes])=>[...strFromU8(bytes).matchAll(/paint_color="([0-9A-F]+)"/g)].map(m=>m[1]))};}
try{
  const before=read(resolve(input)),output=join(directory,'roundtrip.3mf');
  const result=spawnSync(resolve(binary),['--datadir',join(directory,'profile'),'--debug','1','--export-3mf',output,resolve(input)],{cwd:directory,encoding:'utf8',timeout:90000});
  writeFileSync(join(directory,'consumer.log'),(result.stdout||'')+(result.stderr||''));
  assert.equal(result.status,0,'Bambu Studio must open and save the exported project: '+((result.stdout||'')+(result.stderr||'')).slice(-2000));
  const after=read(output);assert.deepEqual(after.settings.filament_colour,before.settings.filament_colour,'Bambu Studio retains every filament color');assert.deepEqual(after.paint,before.paint,'Bambu Studio preserves the native paint for every facet, including subdivision trees');
  assert.equal(after.settings.printer_settings_id,'Bambu Lab A1 0.4 nozzle');
  console.log(`Bambu Studio round-trip passed: ${after.settings.filament_colour.length} filament colors and ${after.paint.length} painted facets retained.`);
}finally{rmSync(directory,{recursive:true,force:true});}
