const folded=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const SETTINGS=[
  ['diameterNumber','Clock size','Size & fit','diameter dimensions taille largeur diametre'],
  ['svgUpload','Import SVG','Shape','upload artwork fichier dessin importer'],
  ['hourStyle','Hour numbers','Hours','markers ticks arabic roman chiffres heures'],
  ['recessWidth','Movement dimensions','Mechanism','width height depth battery mecanisme boitier dimensions pile'],
  ['deskStand','Rear desk stand','Stand','shelf support pied bureau table'],
  ['exportFormat','File format','Download','export stl 3mf fichier telecharger'],
  ['proofPrinted','Print colors','Colors','filament ams palette spool couleur couleurs bambu'],
  ['myProjects','Saved clocks','Projects','library saved projects bibliotheque projets enregistrer'],
  ['presetsTab','Ready-made shapes','Shape','design presets formes'],
  ['pasteSvg','Paste SVG code','SVG','clipboard coller presse papiers source code importer'],
  ['svgDetail','SVG appearance','SVG','original silhouette artwork detail'],
  ['svgRelief','SVG detail relief','SVG','raised texture depth details relief'],
  ['artRotateLeft','Rotate or flip SVG','SVG','orientation mirror tourner rotation miroir'],
  ['svgBacking','Round backing','SVG','connect disconnected letters fond relier support rond'],
  ['hole','Center shaft hole','Size & fit','axis opening trou axe mecanisme'],
  ['showFitTest','Hole-fit test strip','Size & fit','calibration threaded shaft test bande essai'],
  ['thickness','Face thickness','Size & fit','base epaisseur'],
  ['mechanismRecess','Rear mechanism mount','Mechanism','box pocket boitier logement'],
  ['mechanismMount','Mount type','Mechanism','raised box recessed pocket logement'],
  ['mechanismWall','Box wall thickness','Mechanism','wall epaisseur paroi'],
  ['standClearance','Stand clearance','Stand','gap extra space below movement espace degagement mecanisme'],
  ['standLean','Stand lean','Stand','backward angle inclinaison'],
  ['hourColor','Hour contrast','Hours','automatic light dark visibility contraste couleur'],
  ['numberSize','Number size','Hours','labels font chiffres taille'],
  ['numberPosition','Number position','Hours','distance radius position chiffres'],
  ['hourFit','Fit hours to SVG','Hours','automatic labels fit adapter chiffres'],
  ['hourFollowPath','Follow SVG outline','Hours','path edge contour shape suivre chemin chiffres'],
  ['hourPathInset','Hours distance from edge','Hours','outline inset margin border contour distance bord'],
  ['hourPreserveNumbers','Keep numbers unchanged','Hours','upright fixed size preserve shape no distortion chiffres droits taille conserver sans deformer'],
  ['hourPathRotate','Rotate numbers with outline','Hours','orientation tangent path contour rotation tourner chiffres'],
  ['swatches','Face color','Colors','filament back couleur fond'],
  ['texture','Surface texture','Finish','smooth ripple crosshatch texture lisse'],
  ['threeMFTarget','3MF compatibility','Download','bambu studio standard color texture logiciel'],
  ['filamentCount','Filament limit','Download','maximum colors 2 4 ams spools couleurs'],
  ['checkModel','Check model and fit','Print checks','validate mesh dimensions volume verifier'],
  ['bedWidth','Printer build plate','Print checks','a1 bed width depth size imprimante plateau'],
].map(([id,title,section,aliases])=>({id,title,section,aliases}));

export function findSettings(query){
  const text=folded(String(query??'').trim().slice(0,80)),words=text.split(/\s+/).filter(Boolean);
  if(!words.length)return SETTINGS.slice(0,8);
  return SETTINGS.map((entry,index)=>{const title=folded(entry.title),haystack=folded([entry.title,entry.section,entry.aliases].join(' '));return {entry,index,score:words.every(word=>haystack.includes(word))?(title===text?100:title.startsWith(text)?80:words.every(word=>title.includes(word))?60:20):0};}).filter(row=>row.score).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,8).map(row=>row.entry);
}

export class SettingsFinder{
  constructor(onJump){
    this.input=document.getElementById('settingsSearch');this.list=document.getElementById('settingsResults');this.onJump=onJump;this.active=0;
    this.input.oninput=this.input.onfocus=()=>this.render();this.input.onblur=()=>this.hide();
    this.input.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();this.input.value='';this.hide();return;}
      if(!['ArrowDown','ArrowUp','Home','End','Enter'].includes(event.key))return;
      event.preventDefault();if(this.list.hidden)this.render();if(!this.matches.length)return;
      if(event.key==='Enter'){this.choose(this.active);return;}
      this.active=event.key==='Home'?0:event.key==='End'?this.matches.length-1:(this.active+(event.key==='ArrowUp'?-1:1)+this.matches.length)%this.matches.length;this.select();
    });
    this.list.onpointerdown=event=>{if(event.target.closest('[data-setting]'))event.preventDefault();};
    this.list.onclick=event=>{const button=event.target.closest('[data-setting]');if(button)this.choose(Number(button.dataset.setting));};
  }
  focus(){this.input.scrollIntoView({block:'center',behavior:'auto'});this.input.focus({preventScroll:true});this.input.select();this.render();}
  hide(){this.list.hidden=true;this.input.setAttribute('aria-expanded','false');this.input.removeAttribute('aria-activedescendant');}
  render(){
    this.matches=findSettings(this.input.value);this.active=0;this.list.replaceChildren();this.input.removeAttribute('aria-activedescendant');
    for(const [i,entry]of this.matches.entries()){
      const row=document.createElement('button'),title=document.createElement('span'),section=document.createElement('small');row.type='button';row.id='settingResult'+i;row.dataset.setting=i;row.tabIndex=-1;row.setAttribute('role','option');title.textContent=entry.title;section.textContent=entry.section;row.append(title,section);this.list.append(row);
    }
    if(!this.matches.length){const empty=document.createElement('p');empty.textContent='No match. Try size, SVG, numbers, stand, or colors.';this.list.append(empty);}
    this.list.hidden=false;this.input.setAttribute('aria-expanded','true');this.select();
  }
  select(){for(const [i,row]of [...this.list.querySelectorAll('[role="option"]')].entries())row.setAttribute('aria-selected',String(i===this.active));const selected=this.list.children[this.active];if(this.matches.length&&selected){this.input.setAttribute('aria-activedescendant',selected.id);selected.scrollIntoView({block:'nearest'});}}
  choose(index){const entry=this.matches[index];if(!entry)return;this.input.value='';this.hide();this.onJump(entry);}
}
