// Grid Detective — standalone analyzer engine
// Extracted from the main Gridlock Holmes script.js so this page can run
// the analyzer independently, without the full grid generator.

let currentAnalyzerFormat='css';

function switchAnalyzerTab(format){
currentAnalyzerFormat=format;
document.querySelectorAll('.analyzer-tab').forEach(btn=>{
btn.classList.remove('bg-brown-600','text-white');
btn.classList.add('bg-gray-300','text-gray-700');
});
document.getElementById(`analyzer-tab-${format}`).classList.remove('bg-gray-300','text-gray-700');
document.getElementById(`analyzer-tab-${format}`).classList.add('bg-brown-600','text-white');
document.getElementById('analyze-input').value='';
document.getElementById('analyze-output').classList.add('hidden');
updateLineNumbers();
}

function updateLineNumbers(){
const textarea=document.getElementById('analyze-input');
const div=document.getElementById('line-nums');
const lines=textarea.value.split('\n').length;
div.textContent=Array.from({length:lines},(_,i)=>i+1).join('\n');
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[b.length][a.length];
}

// Fuzzy match against known CSS Grid properties
function fuzzyMatchProperty(word) {
    const knownProperties = [
        'display', 'container', 'grid', 'grid-template-columns', 
        'grid-template-rows', 'grid-template-areas', 'gap', 'grid-gap',
        'align-items', 'justify-items', 'align-content', 'justify-content',
        'grid-auto-flow', 'grid-auto-columns', 'grid-auto-rows',
        'grid-column', 'grid-row', 'place-items', 'place-content',
        'background', 'background-image', 'background-color',
        'linear-gradient', 'radial-gradient'
    ];
    
    // Skip if word is too short or already correct
    if (word.length < 4) return null;
    if (knownProperties.includes(word)) return null;
    
    let bestMatch = null;
    let bestDistance = Infinity;
    
    knownProperties.forEach(prop => {
        // Only check if lengths are similar (optimization)
        if (Math.abs(word.length - prop.length) > 3) return;
        
        const distance = levenshteinDistance(word, prop);
        
        // If 1-2 character difference, consider it
        if (distance > 0 && distance <= 2 && distance < bestDistance) {
            bestMatch = prop;
            bestDistance = distance;
        }
    });
    
    return bestMatch;
}

function analyzeCode(){
const code=document.getElementById('analyze-input').value.trim();
const output=document.getElementById('analyze-output');
if(!code){output.classList.add('hidden');return;}
output.classList.remove('hidden');

const errors=[],warnings=[],tips=[];
const lines = code.split('\n');

// Helper to find line number of a string
function findLineNumber(searchStr) {
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(searchStr)) {
            return i + 1;
        }
    }
    return null;
}

// Masks commas/spaces *inside* function calls (minmax(), repeat(), fit-content(), clamp(), even nested)
// so they aren't mistaken for track-separator commas or missing-space typos. Parens themselves are preserved.
function maskGridFunctions(value) {
    let s = value;
    while (/\([^()]*\)/.test(s)) {
        s = s.replace(/\(([^()]*)\)/g, (m, inner) => {
            const maskedInner = inner.replace(/,/g, '\u0001').replace(/\s+/g, '\u0002');
            return '\u0003' + maskedInner + '\u0004';
        });
    }
    return s.replace(/\u0003/g, '(').replace(/\u0004/g, ')');
}
function unmaskGridToken(v) {
    return v.replace(/\u0001/g, ',').replace(/\u0002/g, ' ');
}

// Real, complete list of valid CSS length/percentage units — used to properly validate
// grid-template-columns/rows track sizes and gap values (previously only a couple of
// specific typo patterns were checked, e.g. things like "8dpx" slipped through undetected).
const VALID_LENGTH_UNITS = ['px','fr','%','em','rem','vw','vh','vmin','vmax','ch','ex','pt','pc','cm','mm','in','q'];
const UNIT_ALTERNATION = VALID_LENGTH_UNITS.filter(u => u !== '%').join('|'); // for use inside regexes
const GRID_TRACK_KEYWORDS = ['auto','min-content','max-content','fit-content'];

// Validates a single value token (e.g. "200px", "8dpx", "0", "1fr"). Returns a
// human-readable problem description, or null if the token is valid.
function invalidUnitMessage(token, { allowFr = true } = {}) {
    if (GRID_TRACK_KEYWORDS.includes(token)) return null; // valid CSS keyword
    const m = token.match(/^(\d+(?:\.\d+)?)([a-zA-Z%]*)$/);
    if (!m) return null; // not a plain number+unit token — other checks handle these
    const [, num, unit] = m;
    if (parseFloat(num) === 0) return null; // "0" is valid without a unit in CSS
    const validList = allowFr ? VALID_LENGTH_UNITS : VALID_LENGTH_UNITS.filter(u => u !== 'fr');
    if (!unit) return `is missing a unit, try "${token}px"${allowFr ? ` or "${token}fr"` : ''}`;
    if (!validList.includes(unit.toLowerCase())) return `has an invalid unit "${unit}" - valid units: ${validList.join(', ')}`;
    return null;
}

// A "propname:" line with no semicolon isn't necessarily broken — e.g. grid-template-areas
// legitimately spans several lines before its closing semicolon. Only flag it if a NEW
// property declaration starts (or the rule closes) before we ever find that semicolon.
function isMissingSemicolon(lineArr, idx) {
    for (let j = idx + 1; j < lineArr.length; j++) {
        const next = lineArr[j].trim();
        if (!next) continue;
        if (next.includes('{') || next.includes('}')) return true; // rule ended without closing it
        if (/^[a-zA-Z$-]+\s*:/.test(next)) return true; // a new declaration started — previous one was broken
        if (next.includes(';')) return false; // this continuation line closes the value — valid multi-line value
        // otherwise (e.g. a quoted area row like "sidebar header") — still the same value, keep scanning
    }
    return true; // reached end of code without a closing semicolon
}

if(currentAnalyzerFormat==='css'){
// Check for missing colons (common mistake)
const lines = code.split('\n');
lines.forEach((line, idx) => {
    const trimmed = line.trim();
    // Skip empty lines, comments, and lines with braces
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.includes('{') || trimmed.includes('}')) return;
    
    // Check if line looks like a property but has no colon
    if (/^[a-z-]+\s+[^:]+$/.test(trimmed)) {
        // Has property name and value but no colon
        const propMatch = trimmed.match(/^([a-z-]+)\s/);
        if (propMatch) {
            errors.push(`❌ Missing colon after "${propMatch[1]}" (line ${idx+1}) - should be "${propMatch[1]}:"`);
        }
    }
});

// Fuzzy match property names with line numbers
const words = code.match(/[a-z-]{4,}/g) || [];
const checkedWords = new Set();
words.forEach(word => {
    if (checkedWords.has(word)) return;
    checkedWords.add(word);
    const match = fuzzyMatchProperty(word);
    if (match) {
        const lineNum = findLineNumber(word);
        const lineInfo = lineNum ? ` (line ${lineNum})` : '';
        errors.push(`❌ Possible typo${lineInfo}: "${word}" → did you mean "${match}"?`);
    }
});

// Check for display:grid
if(!code.includes('display')||!/display\s*:\s*grid/.test(code)){
const lineNum = findLineNumber('display');
const lineInfo = lineNum ? ` (line ${lineNum})` : '';
errors.push(`❌ Missing or incorrect display:grid${lineInfo}`);
}

// Validate grid-template-columns values
const colMatch = code.match(/grid-template-columns\s*:\s*([^;]+);/);
if (colMatch) {
    const colValue = colMatch[1].trim();
    const colLine = findLineNumber('grid-template-columns');
    const colLineInfo = colLine ? ` (line ${colLine})` : '';

    // Mask commas/spaces *inside* function calls like minmax()/repeat()/fit-content()/clamp()
    // so they aren't mistaken for track-separator commas or missing-space typos.
    const maskedColValue = maskGridFunctions(colValue);

    // Check for commas (once per property) — ignores commas inside minmax()/repeat()
    if (maskedColValue.includes(',')) {
        errors.push(`❌ Remove commas from grid-template-columns${colLineInfo} - use spaces`);
    }
    
    // Check for missing spaces between values (e.g. "200px1frauto", "1fr1fr", "autoauto")
    if (new RegExp(`\\d+(${UNIT_ALTERNATION})\\d`).test(maskedColValue) || new RegExp(`\\d+(${UNIT_ALTERNATION})(auto|min-content|max-content|fit-content)`).test(maskedColValue) || /(auto|min-content|max-content)\d/.test(maskedColValue) || /(auto)(auto|min-content|max-content|\d)/.test(maskedColValue)) {
        errors.push(`❌ Missing spaces between values in grid-template-columns${colLineInfo} - separate each value with a space (e.g. "200px 1fr auto")`);
    }
    
    const values = maskedColValue.split(/\s+/).filter(v => v && v !== ',').map(unmaskGridToken);
    values.forEach(v => {
        if (!v) return;
        // Function calls (minmax(), repeat(), fit-content(), clamp()) are valid as-is — skip granular checks
        if (/^[a-zA-Z-]+\(.*\)$/.test(v)) return;
        const unitMsg = invalidUnitMessage(v, { allowFr: true });
        if (unitMsg) {
            errors.push(`❌ Value "${v}" ${unitMsg}${colLineInfo}`);
            return;
        }
        // Check for concatenated values that didn't split (e.g. "200px1frauto" as a single token)
        if (new RegExp(`\\d+(${UNIT_ALTERNATION}).+`).test(v) && v.length > 6) {
            errors.push(`❌ Multiple values joined together "${v}"${colLineInfo} - add spaces between each value`);
        }

    });

    // Tip: all-fixed-px tracks with no fr/auto/minmax — suggest responsive units
    const isAllFixedPx = values.length > 0 && values.every(v => /^\d+(\.\d+)?px$/.test(v));
    if (isAllFixedPx) {
        tips.push(`💡 Try minmax() for responsive tracks${colLineInfo}, e.g. "minmax(200px, 1fr)" instead of fixed pixel widths`);
    }
}

// Validate grid-template-rows values
const rowMatch = code.match(/grid-template-rows\s*:\s*([^;]+);/);
if (rowMatch) {
    const rowValue = rowMatch[1].trim();
    const rowLine = findLineNumber('grid-template-rows');
    const rowLineInfo = rowLine ? ` (line ${rowLine})` : '';

    const maskedRowValue = maskGridFunctions(rowValue);

    // Check for commas (once per property) — ignores commas inside minmax()/repeat()
    if (maskedRowValue.includes(',')) {
        errors.push('❌ Remove commas from grid-template-rows - use spaces to separate values');
    }
    
    // Check for missing spaces between values (e.g. "autoauto", "100pxauto")
    if (new RegExp(`\\d+(${UNIT_ALTERNATION})(auto|min-content|max-content|\\d)`).test(maskedRowValue) || /(auto)(auto|min-content|max-content|\d)/.test(maskedRowValue)) {
        errors.push(`❌ Missing spaces between values in grid-template-rows${rowLineInfo} - separate each value with a space (e.g. "auto auto")`);
    }
    
    const values = maskedRowValue.split(/\s+/).filter(v => v && v !== ',').map(unmaskGridToken);
    values.forEach(v => {
        if (!v) return;
        if (/^[a-zA-Z-]+\(.*\)$/.test(v)) return;
        const unitMsg = invalidUnitMessage(v, { allowFr: true });
        if (unitMsg) {
            errors.push(`❌ Value "${v}" ${unitMsg} in grid-template-rows${rowLineInfo}`);
            return;
        }
        // Catch concatenated values
        if (/(auto|min-content|max-content).+/.test(v) && v !== 'auto' && v !== 'min-content' && v !== 'max-content') {
            errors.push(`❌ Multiple values joined together "${v}"${rowLineInfo} - add spaces between each value`);
        }
    });
}

// Validate gap value
const gapMatch = code.match(/gap\s*:\s*([^;]+);/);
if (gapMatch) {
    const gapValue = gapMatch[1].trim();
    const gapLine = findLineNumber('gap');
    const gapLineInfo = gapLine ? ` (line ${gapLine})` : '';

    // gap accepts one value (both axes) or two (row-gap column-gap) — validate each
    const gapTokens = gapValue.split(/\s+/).filter(Boolean);
    gapTokens.forEach(tok => {
        const unitMsg = invalidUnitMessage(tok, { allowFr: false });
        if (unitMsg) {
            errors.push(`❌ Gap value "${tok}" ${unitMsg}${gapLineInfo}`);
        }
    });
}

// Check for commas (handled in value validation above, so removed duplicate)
// Check for auto typo
if(/:\s*auo\s*[;\}]/.test(code))errors.push('❌ Typo: "auo" should be "auto"');
if(/\sauo\s/.test(code)||/:\s*auo/.test(code))errors.push('❌ Typo: "auo" should be "auto"');
if(/\suto\s/.test(code)||/:\s*uto/.test(code))errors.push('❌ Typo: "uto" - did you mean "auto"?');

// Check for uppercase units (still valid CSS, just not conventional - warning not error)
if(/\d+FR\b/.test(code)){
    const lineNum = findLineNumber('FR');
    const lineInfo = lineNum ? ` (line ${lineNum})` : '';
    warnings.push(`⚠️ Use lowercase${lineInfo}: "FR" should be "fr" (works either way, but lowercase is convention)`);
}
if(/\bAUTO\b/.test(code)){
    warnings.push('⚠️ Use lowercase: "AUTO" should be "auto" (works either way, but lowercase is convention)');
}
if(/\b(MIN-CONTENT|MAX-CONTENT|FIT-CONTENT)\b/.test(code)){
    warnings.push('⚠️ Use lowercase for CSS keywords (auto, min-content, max-content, etc.)');
}

// Warn about unnamed/unused grid-area references
const areasDeclMatch = code.match(/grid-template-areas\s*:\s*([\s\S]*?);/);
if (areasDeclMatch) {
    const areasLine = findLineNumber('grid-template-areas');
    const areasLineInfo = areasLine ? ` (line ${areasLine})` : '';
    const rows = areasDeclMatch[1].match(/"([^"]*)"/g) || [];
    if (rows.length > 1) {
        const counts = rows.map(r => r.replace(/"/g, '').trim().split(/\s+/).filter(Boolean).length);
        if (!counts.every(c => c === counts[0])) {
            warnings.push(`⚠️ Uneven columns in grid-template-areas${areasLineInfo} - every row should name the same number of cells`);
        }
        const namedAreas = new Set();
        rows.forEach(r => r.replace(/"/g, '').trim().split(/\s+/).forEach(cell => { if (cell && cell !== '.') namedAreas.add(cell); }));
        namedAreas.forEach(name => {
            const usedElsewhere = new RegExp(`grid-area\\s*:\\s*${name}\\b`).test(code);
            if (!usedElsewhere) {
                warnings.push(`⚠️ Unused grid-area name "${name}"${areasLineInfo} - no element has "grid-area: ${name}"`);
            }
        });
    }
}

// Check for missing opening brace after selector
lines.forEach((line, idx) => {
    const trimmed = line.trim();
    // If line looks like a selector (starts with . or #) but next line has properties
    if (/^[\.#][a-z-]+\s*$/.test(trimmed) && idx + 1 < lines.length) {
        const nextLine = lines[idx + 1].trim();
        if (/^[a-z-]+\s*:/.test(nextLine)) {
            errors.push(`❌ Missing opening brace { after selector on line ${idx+1}`);
        }
    }
});

// Check for missing semicolons (skip lines that are just continuing a multi-line
// value, e.g. quoted grid-template-areas rows, which get their semicolon later)
lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed && trimmed.includes(':') && !trimmed.includes(';') && !trimmed.includes('{') && !trimmed.includes('}')) {
        if (isMissingSemicolon(lines, idx)) {
            errors.push(`❌ Missing semicolon at end of line ${idx + 1}`);
        }
    }
});

// Tips
if(!code.includes('grid-template-columns'))tips.push('💡 Add grid-template-columns to define columns');
if(!code.includes('gap')&&!code.includes('grid-gap'))tips.push('💡 Consider adding gap for spacing');

// Gradient and background validation
if(/background\s*:/.test(code)){
    // Extract all background values
    var bgMatches=code.match(/background\s*:\s*([^;]+);?/g)||[];
    bgMatches.forEach(function(bgMatch){
        var bgValue=bgMatch.replace(/background\s*:\s*/,'').replace(/;$/,'').trim();
        var bgLine=findLineNumber('background');
        var bgInfo=bgLine?' (line '+bgLine+')':'';
        
        // Check for linear-gradient or radial-gradient
        if(/gradient/.test(bgValue)){
            // Check for "linear gradient" instead of "linear-gradient"
            if(/linear\s+gradient/.test(bgValue)){
                errors.push('❌ Missing hyphen'+bgInfo+': "linear gradient" should be "linear-gradient"');
            }
            if(/radial\s+gradient/.test(bgValue)){
                errors.push('❌ Missing hyphen'+bgInfo+': "radial gradient" should be "radial-gradient"');
            }
            
            // Check for missing space in direction (e.g. "toright" instead of "to right")
            if(/linear-gradient\(\s*to[a-z]/i.test(bgValue)){
                var badDir=bgValue.match(/to([a-z]+)/i);
                if(badDir) errors.push('❌ Missing space in gradient direction'+bgInfo+': "to'+badDir[1]+'" should be "to '+badDir[1]+'"');
            }
            
            // Check for unclosed parenthesis
            var openParens=(bgValue.match(/\(/g)||[]).length;
            var closeParens=(bgValue.match(/\)/g)||[]).length;
            if(openParens>closeParens){
                errors.push('❌ Unclosed parenthesis in gradient'+bgInfo);
            }
            
            // Validate hex colour codes inside gradient
            var hexCodes=bgValue.match(/#[^\s,;)]+/g)||[];
            hexCodes.forEach(function(hex){
                if(!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex)){
                    errors.push('❌ Invalid hex colour "'+hex+'"'+bgInfo+' - hex codes must be 3, 4, 6, or 8 valid hex digits (0-9, a-f)');
                }
            });
            
            // Check for missing comma between colour stops
            if(/#[0-9a-fA-F]+\s+#/.test(bgValue)){
                errors.push('❌ Missing comma between colour stops'+bgInfo+' - separate colours with commas');
            }
            
            // Check for invalid direction keywords
            var dirMatch2=bgValue.match(/(linear-gradient)\(\s*([^,]+),/);
            if(dirMatch2){
                var dir2=dirMatch2[2].trim();
                var validDirs2=['to right','to left','to top','to bottom','to top right','to top left','to bottom right','to bottom left'];
                // Only check if it starts with "to " (angle values like 45deg are also valid)
                if(dir2.startsWith('to ')&&validDirs2.indexOf(dir2)===-1){
                    errors.push('❌ Invalid gradient direction "'+dir2+'"'+bgInfo+' - valid: to right, to left, to top, to bottom, to top right, to bottom left, etc.');
                }
                // Check for angle values
                if(/^\d+$/.test(dir2)){
                    errors.push('❌ Gradient angle missing unit'+bgInfo+': "'+dir2+'" should be "'+dir2+'deg"');
                }
            }
        }
        // Solid colour background — validate hex
        else if(/^#/.test(bgValue)){
            if(!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(bgValue.trim())){
                errors.push('❌ Invalid hex colour "'+bgValue.trim()+'"'+bgInfo);
            }
        }
    });
}
// Catch common background typos even without a value
if(/backgroud\s*:/.test(code)){
    var typoLine=findLineNumber('backgroud');
    errors.push('❌ Typo'+(typoLine?' (line '+typoLine+')':'')+': "backgroud" should be "background"');
}
if(/backgorund\s*:/.test(code)){
    var typoLine2=findLineNumber('backgorund');
    errors.push('❌ Typo'+(typoLine2?' (line '+typoLine2+')':'')+': "backgorund" should be "background"');
}
if(/backround\s*:/.test(code)){
    var typoLine3=findLineNumber('backround');
    errors.push('❌ Typo'+(typoLine3?' (line '+typoLine3+')':'')+': "backround" should be "background"');
}
}

else if(currentAnalyzerFormat==='tailwind'){
// Fuzzy match Tailwind classes
const knownClasses = ['grid', 'grid-cols', 'grid-rows', 'gap', 'grid-flow', 'auto-cols', 'auto-rows'];
const classWords = code.match(/[a-z-]+/g) || [];

classWords.forEach(rawWord => {
    // Tailwind utilities like "grid-cols-3" or "gap-4" get truncated to "grid-cols-"/"gap-"
    // by the word-extraction regex (it stops at the digit) — strip the trailing hyphen so a
    // valid utility-with-suffix isn't mistaken for a typo of its own base class.
    const word = rawWord.replace(/-+$/, '');
    if (!word) return;
    if (knownClasses.includes(word)) return; // exact valid match — never flag it as a typo of a *different* known class
    knownClasses.forEach(known => {
        if (word.length >= 4 && Math.abs(word.length - known.length) <= 2) {
            const dist = levenshteinDistance(word, known);
            if (dist > 0 && dist <= 2 && word !== known) {
                const lineNum = findLineNumber(word);
                const lineInfo = lineNum ? ` (line ${lineNum})` : '';
                errors.push(`❌ Possible typo${lineInfo}: "${word}" → did you mean "${known}"?`);
            }
        }
    });
});

// Check for missing grid class
if(!code.includes('grid') && !code.includes('grd'))errors.push('❌ Missing "grid" class');

// Check for invalid HTML tags
if(/<dv[^a-z]/.test(code))errors.push('❌ Invalid tag: "<dv>" should be "<div>"');
if(/<\/dv>/.test(code))errors.push('❌ Invalid closing tag: "</dv>" should be "</div>"');

// Check for class attribute typos
if(/clss=/.test(code)){
    const lineNum = findLineNumber('clss=');
    errors.push(`❌ Typo (line ${lineNum}): "clss=" should be "class="`);
}
if(/clas=/.test(code) && !/class=/.test(code)){
    errors.push('❌ Typo: "clas=" should be "class="');
}

// Check for invalid Tailwind arbitrary values
const arbMatch = code.match(/\[([^\]]+)\]/g);
if (arbMatch) {
    arbMatch.forEach(arb => {
        // Check for typos in units within arbitrary values
        if(/[0-9]+x[^\]]/.test(arb))errors.push(`❌ Invalid unit in ${arb} - "x" should be "px"`);
        if(/[0-9]+f[^r\]]/.test(arb))errors.push(`❌ Invalid unit in ${arb} - "f" should be "fr"`);
        if(/auo/.test(arb))errors.push(`❌ Typo in ${arb}: "auo" should be "auto"`);
    });
}

// Check for grid-cols without grid
if(/grid-cols-/.test(code) && !code.includes('grid'))errors.push('❌ "grid-cols-X" requires "grid" class');

// Tips
if(!code.match(/grid-cols-/))tips.push('💡 Add grid-cols-X to define columns (e.g., grid-cols-3)');
if(!code.includes('gap-'))tips.push('💡 Consider adding gap-X for spacing (e.g., gap-4)');
}

else if(currentAnalyzerFormat==='js'){
// Fuzzy match JS property names
const knownProps = ['display', 'grid', 'gridTemplateColumns', 'gridTemplateRows', 'gridTemplateAreas', 'gap', 'gridGap', 'alignItems', 'justifyItems', 'background', 'backgroundImage'];
const jsWords = code.match(/[a-zA-Z]+/g) || [];

jsWords.forEach(word => {
    if (word.length < 4) return;
    knownProps.forEach(prop => {
        if (Math.abs(word.length - prop.length) <= 3) {
            const dist = levenshteinDistance(word.toLowerCase(), prop.toLowerCase());
            if (dist > 0 && dist <= 2 && word !== prop) {
                const lineNum = findLineNumber(word);
                const lineInfo = lineNum ? ` (line ${lineNum})` : '';
                errors.push(`❌ Possible typo${lineInfo}: "${word}" → did you mean "${prop}"?`);
            }
        }
    });
});

// Check for display: grid
if(!code.includes('display')&&!code.includes('grid'))errors.push('❌ Missing display: "grid" property');

// Check for kebab-case instead of camelCase
if(/grid-template-columns/.test(code))errors.push('❌ Use camelCase: "gridTemplateColumns" not "grid-template-columns"');
if(/grid-template-rows/.test(code))errors.push('❌ Use camelCase: "gridTemplateRows" not "grid-template-rows"');
if(/align-items/.test(code))errors.push('❌ Use camelCase: "alignItems" not "align-items"');

// Check for missing quotes on string values
const valueMatch = code.match(/:\s*([0-9]+(?:px|fr|%|em|rem))/g);
if (valueMatch) {
    valueMatch.forEach(v => {
        if (!/["']/.test(v)) {
            errors.push(`❌ CSS values must be strings in JS: ${v.trim()} should be in quotes`);
        }
    });
}

// Check for invalid units
if(/[0-9]+x[^'"]/.test(code))errors.push('❌ Invalid unit: "x" should be "px"');
if(/[0-9]+f[^r'"]/.test(code))errors.push('❌ Invalid unit: "f" should be "fr"');

// Tips
if(!code.includes('gridTemplateColumns'))tips.push('💡 Add gridTemplateColumns to define columns');
if(!code.includes('gap') && !code.includes('gridGap'))tips.push('💡 Consider adding gap property');

// Gradient checks for JS
if(/linear-gradient|radial-gradient/.test(code)){
    // Check for kebab-case background property in JS
    if(/['"]background['"]/.test(code)===false&&/background\s*:/.test(code)){
        tips.push('💡 In JS objects, use background as a quoted string key');
    }
    // Check gradient values are wrapped in quotes
    var gradVal=code.match(/background\s*:\s*(linear|radial)-gradient/);
    if(gradVal){
        errors.push('❌ Gradient value must be a string in JS - wrap in quotes: \'linear-gradient(...)\'');
    }
}
}

else if(currentAnalyzerFormat==='scss'){
// SCSS uses same syntax as CSS, so reuse CSS validation
// Check for missing colons
const scssLines = code.split('\n');
scssLines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.includes('{') || trimmed.includes('}') || trimmed.startsWith('$')) return;
    
    if (/^[a-z-]+\s+[^:]+$/.test(trimmed)) {
        const propMatch = trimmed.match(/^([a-z-]+)\s/);
        if (propMatch) {
            errors.push(`❌ Missing colon after "${propMatch[1]}" (line ${idx+1})`);
        }
    }
});

// Fuzzy match SCSS property names (same as CSS)
const scssWords = code.match(/[a-z-]{4,}/g) || [];
const checkedScss = new Set();
scssWords.forEach(word => {
    if (checkedScss.has(word)) return;
    if (word.startsWith('$')) return; // Skip variables
    checkedScss.add(word);
    const match = fuzzyMatchProperty(word);
    if (match) {
        const lineNum = findLineNumber(word);
        const lineInfo = lineNum ? ` (line ${lineNum})` : '';
        errors.push(`❌ Possible typo${lineInfo}: "${word}" → did you mean "${match}"?`);
    }
});

// Check for display:grid
if(!code.includes('display')||!/display\s*:\s*grid/.test(code)){
    const lineNum = findLineNumber('display');
    const lineInfo = lineNum ? ` (line ${lineNum})` : '';
    errors.push(`❌ Missing or incorrect display:grid${lineInfo}`);
}

// Check for missing semicolons
scssLines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed && trimmed.includes(':') && !trimmed.includes(';') && !trimmed.includes('{') && !trimmed.includes('}') && !trimmed.startsWith('$')) {
        if (isMissingSemicolon(scssLines, idx)) {
            errors.push(`❌ Missing semicolon at end of line ${idx+1}`);
        }
    }
});

// SCSS-specific tips
if(!code.includes('$')&&code.includes('@media'))tips.push('💡 Use SCSS variables for reusable values (e.g., $gap: 16px)');
if(!code.includes('grid-template-columns'))tips.push('💡 Add grid-template-columns to define columns');

// Gradient and background validation (same as CSS)
if(/background\s*:/.test(code)){
    var bgMatches=code.match(/background\s*:\s*([^;]+);?/g)||[];
    bgMatches.forEach(function(bgMatch){
        var bgValue=bgMatch.replace(/background\s*:\s*/,'').replace(/;$/,'').trim();
        var bgLine=findLineNumber('background');
        var bgInfo=bgLine?' (line '+bgLine+')':'';
        
        if(/gradient/.test(bgValue)){
            if(/linear\s+gradient/.test(bgValue))errors.push('❌ Missing hyphen'+bgInfo+': "linear gradient" should be "linear-gradient"');
            if(/radial\s+gradient/.test(bgValue))errors.push('❌ Missing hyphen'+bgInfo+': "radial gradient" should be "radial-gradient"');
            if(/linear-gradient\(\s*to[a-z]/i.test(bgValue)){
                var badDir=bgValue.match(/to([a-z]+)/i);
                if(badDir) errors.push('❌ Missing space in direction'+bgInfo+': "to'+badDir[1]+'" should be "to '+badDir[1]+'"');
            }
            var openP=(bgValue.match(/\(/g)||[]).length;
            var closeP=(bgValue.match(/\)/g)||[]).length;
            if(openP>closeP) errors.push('❌ Unclosed parenthesis in gradient'+bgInfo);
            
            var hexCodes=bgValue.match(/#[^\s,;)]+/g)||[];
            hexCodes.forEach(function(hex){
                // Skip SCSS variables like #{$var}
                if(hex.startsWith('#{')) return;
                if(!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex)){
                    errors.push('❌ Invalid hex colour "'+hex+'"'+bgInfo);
                }
            });
            if(/#[0-9a-fA-F]+\s+#/.test(bgValue))errors.push('❌ Missing comma between colour stops'+bgInfo);
        }
        else if(/^#/.test(bgValue)){
            if(!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(bgValue.trim())){
                errors.push('❌ Invalid hex colour "'+bgValue.trim()+'"'+bgInfo);
            }
        }
    });
    // SCSS-specific: suggest variables for hardcoded gradient colours
    if(!code.includes('$')&&code.match(/#[0-9a-fA-F]{3,8}/g)&&code.match(/#[0-9a-fA-F]{3,8}/g).length>=2){
        tips.push('💡 Use SCSS variables for gradient colours (e.g., $primary: #1D9E75; background: linear-gradient(to right, $primary, $secondary))');
    }
}
if(/backgroud\s*:/.test(code))errors.push('❌ Typo: "backgroud" should be "background"');
if(/backgorund\s*:/.test(code))errors.push('❌ Typo: "backgorund" should be "background"');
if(/backround\s*:/.test(code))errors.push('❌ Typo: "backround" should be "background"');
}

// Strip the leading emoji marker — the coloured dot + label now carries that meaning
function cleanMsg(m){ return m.replace(/^(❌|⚠️|💡)\s*/,''); }

function rItem(type,label,text){
return `<div class="r-item"><span class="r-dot ${type}"></span><div><div class="r-label">${label}</div><div class="r-text">${cleanMsg(text)}</div></div></div>`;
}

let itemsHtml='';
errors.forEach(e=>itemsHtml+=rItem('rd-e','Error',e));
warnings.forEach(w=>itemsHtml+=rItem('rd-w','Warning',w));
tips.forEach(t=>itemsHtml+=rItem('rd-t','Tip',t));

let countBadge;
if(errors.length>0){
const w=warnings.length?`, ${warnings.length} warning${warnings.length>1?'s':''}`:'';
countBadge=`<span class="diagnostic-count" style="background:rgba(229,62,62,0.15);color:#f87171;">${errors.length} error${errors.length>1?'s':''}${w}</span>`;
}else if(warnings.length>0){
countBadge=`<span class="diagnostic-count" style="background:rgba(221,107,32,0.18);color:#fbbf24;">${warnings.length} warning${warnings.length>1?'s':''}</span>`;
}else{
countBadge='<span class="diagnostic-count" style="background:rgba(16,185,129,0.15);color:#34d399;">All clear</span>';
}

if(errors.length===0&&warnings.length===0){
itemsHtml=`<div class="diagnostic-success">✅ No errors detected!</div>`+itemsHtml;
}

output.className='mt-3';
output.innerHTML=`<div class="diagnostic-panel">
<div class="diagnostic-head"><span class="diagnostic-title">🔍 Results</span>${countBadge}</div>
<div class="diagnostic-body">${itemsHtml}</div>
</div>`;
}

// Init
window.addEventListener('load', updateLineNumbers);
