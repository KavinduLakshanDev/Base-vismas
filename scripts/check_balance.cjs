const fs = require('fs');
const s = fs.readFileSync(process.argv[2], 'utf8');
const stacks = { '(':0, '{':0, '[':0 };
for(let i=0;i<s.length;i++){
  const ch = s[i];
  if(ch==='(') stacks['(']++;
  if(ch===')') stacks['(']--;
  if(ch==='{') stacks['{']++;
  if(ch==='}') stacks['{']--;
  if(ch==='[') stacks['[']++;
  if(ch===']') stacks['[']--;
}
console.log('Parens:', stacks);
// find unclosed JSX tags naively
const openTags = (s.match(/<([A-Za-z0-9_\-]+)/g) || []).map(x=>x.replace(/^</,''));
const closeTags = (s.match(/<\/([A-Za-z0-9_\-]+)/g) || []).map(x=>x.replace(/^<\//,''));
const tagCounts = {};
openTags.forEach(t=>tagCounts[t]=(tagCounts[t]||0)+1);
closeTags.forEach(t=>tagCounts[t]=(tagCounts[t]||0)-1);
console.log('Tag balance sample:', Object.entries(tagCounts).filter(([k,v])=>v!==0));
