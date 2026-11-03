// Values are immutable snapshots owned by the caller. Shared SVG image/source
// references are retained once per import rather than copied on every slider move.
export class DesignHistory{
  constructor(limit=60){this.limit=Math.max(2,limit);this.entries=[];this.index=-1;this.endGroup();}
  get canUndo(){return this.index>0;}
  get canRedo(){return this.index<this.entries.length-1;}
  reset(value,key){this.entries=[{value,key}];this.index=0;this.endGroup();}
  endGroup(){this.group=null;this.time=-Infinity;}
  commit(value,key,{group=null,time=Date.now()}={}){
    if(this.entries[this.index]?.key===key)return false;
    const replace=group&&group===this.group&&time-this.time<700&&this.index>0&&!this.canRedo;
    this.entries.length=this.index+1;
    if(replace)this.entries[this.index]={value,key};
    else{this.entries.push({value,key});this.index++;}
    if(this.entries.length>this.limit){this.entries.shift();this.index--;}
    this.group=group;this.time=time;return true;
  }
  undo(){if(!this.canUndo)return null;this.endGroup();return this.entries[--this.index].value;}
  redo(){if(!this.canRedo)return null;this.endGroup();return this.entries[++this.index].value;}
}
