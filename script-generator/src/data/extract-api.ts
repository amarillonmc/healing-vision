import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commonHPath = path.resolve(__dirname, '../../../ygopro-core/common.h');
const outputPath = path.resolve(__dirname, '../constants/api.ts');

interface ConstantGroup {
  name: string;
  prefix: string;
  constants: { name: string; value: string | number }[];
}

function parseCommonH(content: string): ConstantGroup[] {
  const groups: ConstantGroup[] = [];
  const lines = content.split('\n');
  
  let currentGroup: ConstantGroup | null = null;
  let inEnumOrDefine = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('//') || line === '') continue;
    
    if (line.startsWith('//') && line.includes('Locations')) {
      currentGroup = { name: 'Locations', prefix: 'LOCATION_', constants: [] };
      groups.push(currentGroup);
      continue;
    }
    if (line.startsWith('//') && line.includes('Positions')) {
      currentGroup = { name: 'Positions', prefix: 'POS_', constants: [] };
      groups.push(currentGroup);
      continue;
    }
    if (line.startsWith('//') && line.includes('Types')) {
      currentGroup = { name: 'Types', prefix: 'TYPE_', constants: [] };
      groups.push(currentGroup);
      continue;
    }
    if (line.startsWith('//') && line.includes('Attributes')) {
      currentGroup = { name: 'Attributes', prefix: 'ATTRIBUTE_', constants: [] };
      groups.push(currentGroup);
      continue;
    }
    if (line.startsWith('//') && line.includes('Races')) {
      currentGroup = { name: 'Races', prefix: 'RACE_', constants: [] };
      groups.push(currentGroup);
      continue;
    }
    if (line.startsWith('//') && line.includes('Reason')) {
      currentGroup = { name: 'Reason', prefix: 'REASON_', constants: [] };
      groups.push(currentGroup);
      continue;
    }
    if (line.startsWith('//') && line.includes('Phase')) {
      currentGroup = { name: 'Phase', prefix: 'PHASE_', constants: [] };
      groups.push(currentGroup);
      continue;
    }
    
    const defineMatch = line.match(/^#define\s+(\w+)\s+(.+?)(?:\s*\/\/.*)?$/);
    if (defineMatch) {
      const [, name, value] = defineMatch;
      
      if (name.startsWith('LOCATION_') || name.startsWith('POS_') || 
          name.startsWith('TYPE_') || name.startsWith('ATTRIBUTE_') || 
          name.startsWith('RACE_') || name.startsWith('REASON_') ||
          name.startsWith('PHASE_') || name.startsWith('CATEGORY_') ||
          name.startsWith('SUMMON_') || name.startsWith('EVENT_') ||
          name.startsWith('EFFECT_') || name.startsWith('LINK_MARKER_')) {
        
        let groupName = '';
        let prefix = '';
        if (name.startsWith('LOCATION_')) { groupName = 'Locations'; prefix = 'LOCATION_'; }
        else if (name.startsWith('POS_')) { groupName = 'Positions'; prefix = 'POS_'; }
        else if (name.startsWith('TYPE_')) { groupName = 'Types'; prefix = 'TYPE_'; }
        else if (name.startsWith('ATTRIBUTE_')) { groupName = 'Attributes'; prefix = 'ATTRIBUTE_'; }
        else if (name.startsWith('RACE_')) { groupName = 'Races'; prefix = 'RACE_'; }
        else if (name.startsWith('REASON_')) { groupName = 'Reason'; prefix = 'REASON_'; }
        else if (name.startsWith('PHASE_')) { groupName = 'Phase'; prefix = 'PHASE_'; }
        else if (name.startsWith('CATEGORY_')) { groupName = 'Category'; prefix = 'CATEGORY_'; }
        else if (name.startsWith('SUMMON_')) { groupName = 'SummonType'; prefix = 'SUMMON_'; }
        else if (name.startsWith('EVENT_')) { groupName = 'Event'; prefix = 'EVENT_'; }
        else if (name.startsWith('EFFECT_')) { groupName = 'EffectCode'; prefix = 'EFFECT_'; }
        else if (name.startsWith('LINK_MARKER_')) { groupName = 'LinkMarker'; prefix = 'LINK_MARKER_'; }
        
        let group = groups.find(g => g.name === groupName);
        if (!group) {
          group = { name: groupName, prefix, constants: [] };
          groups.push(group);
        }
        
        let parsedValue: string | number = value.trim();
        if (value.startsWith('0x') || value.startsWith('0X')) {
          parsedValue = parseInt(value, 16);
        } else if (/^\d+$/.test(value)) {
          parsedValue = parseInt(value, 10);
        }
        
        group.constants.push({ name, value: parsedValue });
      }
    }
  }
  
  return groups;
}

function generateTsFile(groups: ConstantGroup[]): string {
  let output = `// Auto-generated from ygopro-core/common.h\n// DO NOT EDIT MANUALLY\n\n`;
  
  for (const group of groups) {
    if (group.constants.length === 0) continue;
    
    output += `// ${group.name}\n`;
    output += `export const ${group.name} = {\n`;
    for (const c of group.constants) {
      const key = c.name.replace(group.prefix, '');
      if (typeof c.value === 'number') {
        output += `  ${key}: 0x${c.value.toString(16).toUpperCase()},\n`;
      } else {
        output += `  ${key}: ${c.value},\n`;
      }
    }
    output += `} as const;\n\n`;
  }
  
  output += `// Combined exports\n`;
  output += `export const API_CONSTANTS = {\n`;
  for (const group of groups) {
    if (group.constants.length > 0) {
      output += `  ...${group.name},\n`;
    }
  }
  output += `} as const;\n`;
  
  return output;
}

function main() {
  console.log('Reading common.h...');
  const content = fs.readFileSync(commonHPath, 'utf-8');
  
  console.log('Parsing constants...');
  const groups = parseCommonH(content);
  
  console.log('Generating TypeScript file...');
  const tsContent = generateTsFile(groups);
  
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, tsContent);
  console.log(`Generated: ${outputPath}`);
  
  let total = 0;
  for (const g of groups) {
    console.log(`  ${g.name}: ${g.constants.length} constants`);
    total += g.constants.length;
  }
  console.log(`Total: ${total} constants`);
}

main();
