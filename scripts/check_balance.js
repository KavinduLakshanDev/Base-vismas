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
const openTags = s.match(/<([A-Za-z0-9_\-]+)/g) || [];
const closeTags = s.match(/<\/(\w+)/g) || [];
console.log('Open tags sample:', openTags.slice(0,10));
console.log('Close tags sample:', closeTags.slice(0,10));
