const hex=/^#[0-9a-f]{6}$/i;
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
export function validFilamentOverrides(value){
  return record(value)&&Object.keys(value).length<=64&&Object.entries(value).every(([source,target])=>hex.test(source)&&typeof target==='string'&&hex.test(target));
}
export function normalizeFilamentOverrides(value){
  if(!record(value))return {};
  return Object.fromEntries(Object.entries(value).filter(([source,target])=>hex.test(source)&&typeof target==='string'&&hex.test(target)).slice(-64).map(([source,target])=>[source.toUpperCase(),target.toUpperCase()]));
}
// Keep the base filament first. Identical chosen colors share one filament;
// indices map each original color region to its final project filament.
export function filamentColors(sourcePalette,overrides={}){
  if(!validFilamentOverrides(overrides))throw Error('Filament colors must use valid six-digit HEX values.');
  const normalized=normalizeFilamentOverrides(overrides),palette=[],indices=[],colors=[];
  for(const source of sourcePalette){
    const color=normalized[source.toUpperCase()]||source.toUpperCase();
    let index=palette.indexOf(color);if(index<0){index=palette.length;palette.push(color);}
    indices.push(index);colors.push(color);
  }
  return {palette,indices,colors};
}
