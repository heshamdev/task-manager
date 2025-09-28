const fs = require('fs');

let content = fs.readFileSync('/Users/heshamahmed/nodes/Assiengment/client/src/views/Tasks.vue', 'utf8');

// Fix all the broken presets.quick calls with proper syntax
const fixes = [
  // Remove all the broken object syntax calls
  {
    from: /presets\.quick\(\s*message:/g,
    to: 'presets.quick('
  },
  // Remove color, backgroundColor, blur parameters
  {
    from: /,\s*color:\s*'[^']*'/g,
    to: ''
  },
  {
    from: /,\s*backgroundColor:\s*'[^']*'/g,
    to: ''
  },
  {
    from: /,\s*blur:\s*'[^']*'/g,
    to: ''
  },
  // Remove loader management code that's no longer needed
  {
    from: /if \(loader && !loader\.isDestroyed\) \{[\s\S]*?\}/g,
    to: '// Auto-managed by new loader system'
  }
];

fixes.forEach(fix => {
  content = content.replace(fix.from, fix.to);
});

// Write back the fixed content
fs.writeFileSync('/Users/heshamahmed/nodes/Assiengment/client/src/views/Tasks.vue', content);

console.log('Fixed Tasks.vue syntax errors');