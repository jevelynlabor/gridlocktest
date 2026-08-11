let isPro=false,saved=[],updateTimeout=null,tutorialStep=0,currentCodeFormat='css',currentAnalyzerFormat='css';
// Track last valid values to revert on error
let lastValidCols='200px 1fr auto';
let lastValidRows='auto auto';
// Gradient state
let gradientContainerDir='to right';
let gradientItemsDir='to bottom';
let currentGradientTarget='container';
const examples={'two-col':{cols:'250px 1fr',rows:'auto',gap:16,desc:'Sidebar + content'},'three-col':{cols:'1fr 1fr 1fr',rows:'auto',gap:20,desc:'Three equal columns'},'holy-grail':{cols:'200px 1fr 200px',rows:'auto 1fr auto',gap:12,areas:'"h h h"\n"n m a"\n"f f f"',desc:'Header, nav, main, aside, footer'},'cards':{cols:'1fr 1fr 1fr 1fr',rows:'auto',gap:16,desc:'Equal card grid'},'dashboard':{cols:'220px 1fr 1fr',rows:'auto auto',gap:16,desc:'Sidebar + widgets'},'magazine':{cols:'2fr 1fr',rows:'300px auto',gap:20,desc:'Featured + sidebar'},'asymmetric':{cols:'1fr 2fr',rows:'auto',gap:24,desc:'Unequal columns'},'masonry':{cols:'1fr 1fr 1fr',rows:'auto auto auto',gap:12,desc:'Pinterest-style'},'app-shell':{cols:'1fr',rows:'auto 1fr auto',gap:0,desc:'Header, content, footer'},'split-screen':{cols:'1fr 1fr',rows:'100vh',gap:0,desc:'50/50 split'},'portfolio':{cols:'1fr 1fr 1fr',rows:'300px 300px',gap:20,pro:true,desc:'🔒 PRO: Portfolio grid'},'blog':{cols:'2fr 1fr',rows:'auto auto auto',gap:24,pro:true,desc:'🔒 PRO: Blog layout'},'ecommerce':{cols:'1fr 1fr 1fr 1fr',rows:'auto auto',gap:16,pro:true,desc:'🔒 PRO: Product grid'},'landing':{cols:'1fr',rows:'auto 400px auto auto',gap:0,pro:true,desc:'🔒 PRO: Landing page'},'admin':{cols:'250px 1fr 300px',rows:'60px 1fr 40px',gap:0,pro:true,desc:'🔒 PRO: Admin panel'},'gallery':{cols:'1fr 2fr 1fr',rows:'200px 300px 200px',gap:12,pro:true,desc:'🔒 PRO: Photo gallery'},'pricing':{cols:'1fr 1fr 1fr',rows:'auto',gap:32,pro:true,desc:'🔒 PRO: Pricing table'},'timeline':{cols:'100px 1fr',rows:'auto auto auto',gap:20,pro:true,desc:'🔒 PRO: Timeline'},'form':{cols:'1fr 1fr',rows:'auto auto auto auto',gap:16,pro:true,desc:'🔒 PRO: Multi-column form'},'footer':{cols:'1fr 1fr 1fr 1fr',rows:'auto auto',gap:24,pro:true,desc:'🔒 PRO: Complex footer'}};

const tutorialSteps=[
{title:'Welcome to CSS Grid!',content:'CSS Grid is a powerful layout system that lets you create complex, responsive designs easily. Think of it like a spreadsheet where you can place items anywhere you want!'},
{title:'Understanding Columns',content:'<strong>Columns</strong> define the vertical sections of your grid.<br><br>• <code>200px</code> = Fixed width column<br>• <code>1fr</code> = Flexible column (takes available space)<br>• <code>auto</code> = Fits the content size<br><br><strong>⚠️ Important: Use SPACES, not commas!</strong><br>• ✅ Correct: <code>200px 1fr auto</code><br>• ❌ Wrong: <code>200px, 1fr, auto</code><br><br>Commas create named grid lines (advanced feature). For normal layouts, always use spaces to separate values!'},
{title:'Understanding Rows',content:'<strong>Rows</strong> define the horizontal sections.<br><br>• <code>auto</code> = Height adjusts to content<br>• <code>100px</code> = Fixed height<br>• <code>1fr</code> = Takes available space<br><br>Most layouts use <code>auto</code> for rows to let content determine height.<br><br><strong>⚠️ Remember: Use SPACES between values!</strong><br>• ✅ Correct: <code>auto auto</code><br>• ❌ Wrong: <code>auto, auto</code><br><br>Spaces separate track sizes. Commas are for advanced features you probably don\'t need!'},
{title:'The Gap Property',content:'<strong>Gap</strong> controls the spacing between grid items.<br><br>Instead of using margins on each item, gap gives you consistent spacing automatically. Try changing the Gap value and watch the preview update!'},
{title:'The Example Gallery',content:'The <strong>Example Gallery</strong> at the top contains pre-built layouts you can learn from.<br><br>Try selecting "Two Columns" or "Holy Grail" to see common layout patterns. Each example shows how professionals structure their grids!'},
{title:'Live Preview',content:'The <strong>Preview</strong> section shows your grid in real-time. Each box (A, B, C...) represents a grid item.<br><br>Notice how they automatically position themselves based on your column and row settings. This is the power of CSS Grid!'},
{title:'Generated CSS Code',content:'Below the preview, you\'ll see the actual <strong>CSS code</strong> that creates your grid.<br><br>This is the code you can copy and use in your own projects. Click the "Copy" button to grab it!'},
{title:'Pro Features',content:'Upgrade to <strong>Pro</strong> to unlock:<br><br><strong>🎨 Layout Tools:</strong><br>• Auto-Responsive Columns<br>• Named Layout Areas<br>• Item Positioning<br><br><strong>📚 Content:</strong><br>• 20+ Advanced Examples<br>• Professional Templates<br><br><strong>💎 Experience:</strong><br>• No Advertisements<br>• Priority Support<br>• Cloud Save (coming)<br><br><strong>💰 Choose Your Plan:</strong><br>📆 <strong>Monthly - £4.99/month</strong><br>📅 <strong>Annual - £14.99/year</strong> (SAVE 75%) ⭐<br>💎 <strong>Lifetime - £29.99</strong> (one-time) 🏆 BEST VALUE'},
{title:'Grid Detective',content:'<strong>Grid Detective</strong> is your CSS error checker!<br><br>Paste any CSS Grid code and it will:<br>• Catch typos and mistakes<br>• Give you helpful tips<br>• Help you learn proper syntax<br><br>Perfect for debugging!'},
{title:'You\'re Ready!',content:'That\'s it! You now know the basics of CSS Grid.<br><br><strong>Next steps:</strong><br>1. Try the Example Gallery<br>2. Experiment with different values<br>3. Save your favorite layouts<br>4. Share your creations<br><br>Happy grid building! 🎉<br><br><div class="mt-6 pt-4 border-t"><p class="text-xs text-gray-600 mb-3">This free tutorial is supported by:</p><div id="adsense-tutorial" class="bg-gray-100 border border-gray-300 rounded p-4 text-center"><p class="text-xs text-gray-500">📢 Ad Space 3 - Tutorial Completion</p><p class="text-xs text-gray-400 mt-1">Add your third AdSense code here</p></div></div>'}
];

function init(){
loadSaved();setupKeys();updateLineNumbers();updateGrid();toggleGrid();
}

function showTutorialStep(){
const step=tutorialSteps[tutorialStep];
const content=document.getElementById('tutorial-content');
content.innerHTML=`
<h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">${step.title}</h3>
<div class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">${step.content}</div>
<div class="mt-4 text-sm text-gray-500 dark:text-gray-400">Step ${tutorialStep+1} of ${tutorialSteps.length}</div>
`;

// Update dots
const dots=document.getElementById('tutorial-dots');
dots.innerHTML=tutorialSteps.map((_,i)=>`<div class="w-2 h-2 rounded-full ${i===tutorialStep?'bg-blue-600':'bg-gray-300'}"></div>`).join('');

// Update buttons
document.getElementById('tutorial-prev').style.display=tutorialStep===0?'invisible':'block';
const nextBtn=document.getElementById('tutorial-next');
if(tutorialStep===tutorialSteps.length-1){
nextBtn.textContent='Start Building! 🚀';
nextBtn.onclick=closeTutorial;
}else{
nextBtn.textContent='Next →';
nextBtn.onclick=nextTutorialStep;
}
}

function nextTutorialStep(){
if(tutorialStep<tutorialSteps.length-1){
tutorialStep++;
showTutorialStep();
}
}

function prevTutorialStep(){
if(tutorialStep>0){
tutorialStep--;
showTutorialStep();
}
}

function closeTutorial(){
document.getElementById('tutorial-modal').classList.add('hidden');
}

function setupKeys(){
document.addEventListener('keydown',e=>{
if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();if(document.getElementById('save-name').value.trim())saveLayout();}
if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();copyCode();}
if(e.key==='Escape'){closeShareModal();closeTutorial();}
if(e.shiftKey&&e.key==='?'&&!e.target.matches('input,textarea')){e.preventDefault();showKeyboardHelp();}
});
}

function showKeyboardHelp(){
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if(isMobile){
alert('📱 MOBILE TIPS:\n\n• Tap buttons to interact\n• Use dropdown menus to select values\n• Scroll within each section\n• Copy code with "Copy Code" button\n• Save layouts with "Save" button\n\nKeyboard shortcuts are only available on desktop.');
}else{
alert('⌨️ KEYBOARD SHORTCUTS:\n\nCtrl/Cmd+S: Save current layout\nCtrl/Cmd+K: Copy CSS code\nEsc: Close modals\nShift+/: Show this help\n\n💡 These shortcuts only work on desktop/laptop computers.');
}}
function showHelpModal(){
tutorialStep=0;
showTutorialStep();
document.getElementById('tutorial-modal').classList.remove('hidden');
}
function showProHelp(){alert('PRO FEATURES:\n\nLayout Tools:\n• Auto-Responsive Columns\n• Named Layout Areas\n• Item Positioning\n\nContent:\n• 20+ Advanced Examples\n• Professional Templates\n• Real-world Layouts\n\nExperience:\n• No Ads\n• Priority Support\n• Cloud Save (coming)\n\n💰 Choose Your Plan:\n📆 Monthly - £4.99/month\n📅 Annual - £14.99/year (SAVE 75%) ⭐\n💎 Lifetime - £29.99 (BEST VALUE) 🏆');}

function debouncedUpdate(){
document.getElementById('loading').style.display='flex';
clearTimeout(updateTimeout);
updateTimeout=setTimeout(()=>{updateGrid();document.getElementById('loading').style.display='none';},300);
}

function loadExample(){
const id=document.getElementById('example-gallery').value;
const desc=document.getElementById('example-desc');
if(!id){desc.classList.add('hidden');return;}
const ex=examples[id];
desc.textContent=ex.desc;desc.classList.remove('hidden');
if(ex.pro&&!isPro)togglePro();
document.getElementById('columns').value=ex.cols;
document.getElementById('rows').value=ex.rows;
document.getElementById('gap').value=ex.gap;
if(ex.areas)document.getElementById('grid-areas').value=ex.areas;
updateGrid();
}

function clearExample(){
document.getElementById('example-gallery').value='';
document.getElementById('example-desc').classList.add('hidden');
document.getElementById('columns').value='200px 1fr auto';
document.getElementById('rows').value='auto auto';
document.getElementById('gap').value=8;
updateGrid();
}

function togglePro(){
if(!isPro){
alert('💎 Upgrade to Gridlock Holmes Pro\n\n💰 CHOOSE YOUR PLAN:\n\n📆 MONTHLY - £4.99/month\n   Try it out. Cancel anytime.\n\n📅 ANNUAL - £14.99/year (SAVE 75%) ⭐\n   Best for regular users.\n   Save £44.89 vs monthly!\n\n💎 LIFETIME - £29.99 (one-time) 🏆 BEST VALUE\n   Pay once, own forever!\n   No subscription. No recurring fees.\n\n✨ ALL PLANS INCLUDE:\n\n🎨 Layout Tools:\n• Auto-Responsive Columns\n• Named Layout Areas\n• Item Positioning\n\n📚 Content:\n• 20+ Advanced Examples\n• Professional Templates\n\n💎 Experience:\n• No Advertisements\n• Priority Email Support\n• Cloud Save (coming)\n• All Future Updates\n\n💡 Want to upgrade later?\nEmail: jon.ellisdon@gridlock-holmes.com\n\n🚀 Coming Soon!');
return;
}
}

function validateGap(){const g=document.getElementById('gap');if(g.value>100)g.value=100;if(g.value<0)g.value=0;}

function checkForCommas(fieldId){const field=document.getElementById(fieldId);const value=field.value;if(value.includes(",")){let warning=document.getElementById(fieldId+"-comma-warning");if(!warning){warning=document.createElement("div");warning.id=fieldId+"-comma-warning";warning.className="text-xs text-orange-600 mt-1 font-medium";warning.innerHTML="⚠️ Commas detected! Did you mean spaces? (e.g., \"auto auto\" not \"auto, auto\")";field.parentElement.appendChild(warning);}}else{const warning=document.getElementById(fieldId+"-comma-warning");if(warning)warning.remove();}}

function validateMinWidth(){
const m=document.getElementById('min-width');
if(m.value>800)m.value=800;
if(m.value<50)m.value=50;
const display=document.getElementById('min-width-display');
if(display)display.textContent=m.value;
}


// Educational validation - teaches users about CSS Grid syntax
function validateGridValue(inputId, value, label) {
    const errorDiv = document.getElementById(inputId + '-error');
    if (!errorDiv) {
        // Create error message div if it doesn't exist
        const input = document.getElementById(inputId);
        const errorEl = document.createElement('div');
        errorEl.id = inputId + '-error';
        errorEl.className = 'mt-1 p-2 bg-red-50 border border-red-300 rounded text-xs text-red-700 hidden';
        input.parentNode.insertBefore(errorEl, input.nextSibling);
    }
    
    const errorElement = document.getElementById(inputId + '-error');
    const values = value.trim().split(/\s+/);
    const errors = [];
    
    // Valid CSS Grid units
    const validUnits = ['px', 'fr', '%', 'em', 'rem', 'vw', 'vh', 'auto', 'min-content', 'max-content'];
    
    values.forEach((v, i) => {
        // Check if it's just a number without a unit
        if (/^\d+$/.test(v)) {
            errors.push(`<strong>"${v}"</strong> - Missing unit! Try: <code>${v}fr</code> or <code>${v}px</code>`);
        }
        // Check for numbers with invalid units (like "1f", "2x", "1F", "2D")
        else if (/^\d+[a-zA-Z]{1,2}$/i.test(v) && !validUnits.some(unit => v.toLowerCase().endsWith(unit))) {
            errors.push(`<strong>"${v}"</strong> - Invalid unit! Valid units: px, fr, %, auto, em, rem`);
        }
        // Check for commas
        else if (v.includes(',')) {
            errors.push(`<strong>"${v}"</strong> - Remove commas! Use SPACES to separate values`);
        }
    });
    
    // Check for style warnings (not errors - still valid CSS but not best practice)
    const warnings = [];
    values.forEach((v, i) => {
        // Warn about uppercase units (valid but not idiomatic)
        if (/^\d+[A-Z]{2}$/.test(v)) {
            const lowercase = v.toLowerCase();
            warnings.push(`<strong>"${v}"</strong> - Use lowercase: <code>${lowercase}</code> (better style)`);
        }
    });
    
    if (errors.length > 0) {
        errorElement.innerHTML = '<strong>⚠️ Invalid CSS Grid syntax in ' + label + ':</strong><br>' + errors.join('<br>') + '<br><br><em>💡 Tip: Preview is frozen until errors are fixed!</em>';
        errorElement.classList.remove('hidden');
        return false;
    } else if (warnings.length > 0) {
        errorElement.innerHTML = '<strong>💡 Style suggestion for ' + label + ':</strong><br>' + warnings.join('<br>') + '<br><br><em>This works, but lowercase is the standard convention!</em>';
        errorElement.classList.remove('hidden');
        errorElement.className = 'mt-1 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-700';
        return true; // Valid, just a warning
    } else {
        errorElement.classList.add('hidden');
        errorElement.className = 'mt-1 p-2 bg-red-50 border border-red-300 rounded text-xs text-red-700 hidden';
        return true;
    }
}

// ═══════════════════════════════════════════════════════════
// GRADIENT FUNCTIONS
// ═══════════════════════════════════════════════════════════

function switchGradientTarget(target){
    currentGradientTarget=target;
    document.getElementById('grad-target-container').className='flex-1 py-1.5 text-xs font-medium rounded-md transition '+(target==='container'?'bg-white shadow text-gray-900':'text-gray-500');
    document.getElementById('grad-target-items').className='flex-1 py-1.5 text-xs font-medium rounded-md transition '+(target==='items'?'bg-white shadow text-gray-900':'text-gray-500');
    document.getElementById('grad-container-controls').classList.toggle('hidden',target!=='container');
    document.getElementById('grad-items-controls').classList.toggle('hidden',target!=='items');
}

function setGradientDir(target,dir,btn){
    if(target==='container'){
        gradientContainerDir=dir;
        document.querySelectorAll('.grad-dir-container').forEach(b=>{b.className='grad-dir-container text-xs py-1.5 border rounded hover:bg-gray-50';});
    }else{
        gradientItemsDir=dir;
        document.querySelectorAll('.grad-dir-items').forEach(b=>{b.className='grad-dir-items text-xs py-1.5 border rounded hover:bg-gray-50';});
    }
    btn.className=btn.className+' bg-blue-50 border-blue-300 font-medium';
    debouncedUpdate();
}

function buildGradientCSS(fromColor,toColor,dir){
    if(dir==='circle') return 'radial-gradient(circle, '+fromColor+', '+toColor+')';
    return 'linear-gradient('+dir+', '+fromColor+', '+toColor+')';
}

function getGradientState(){
    var enabled=document.getElementById('gradient-enabled')&&document.getElementById('gradient-enabled').checked;
    if(!enabled) return null;
    
    var containerFill=document.getElementById('container-fill-type').value;
    var itemsFill=document.getElementById('items-fill-type').value;
    
    var state={
        container:{fillType:containerFill},
        items:{fillType:itemsFill}
    };
    
    if(containerFill==='solid'){
        state.container.color=document.getElementById('container-solid-color').value;
    }else{
        state.container.from=document.getElementById('container-color-from').value;
        state.container.to=document.getElementById('container-color-to').value;
        state.container.dir=gradientContainerDir;
    }
    
    if(itemsFill==='solid'){
        state.items.color=document.getElementById('items-solid-color').value;
    }else{
        state.items.from=document.getElementById('items-color-from').value;
        state.items.to=document.getElementById('items-color-to').value;
        state.items.dir=gradientItemsDir;
    }
    
    return state;
}

function getBackgroundCSS(target){
    if(target.fillType==='solid') return target.color;
    return buildGradientCSS(target.from,target.to,target.dir);
}

function updateGradientPreviews(){
    var g=getGradientState();
    if(!g) return;
    
    // Toggle solid vs gradient controls visibility
    var cFill=document.getElementById('container-fill-type').value;
    document.getElementById('container-solid-controls').classList.toggle('hidden',cFill!=='solid');
    document.getElementById('container-gradient-controls').classList.toggle('hidden',cFill==='solid');
    
    var iFill=document.getElementById('items-fill-type').value;
    document.getElementById('items-solid-controls').classList.toggle('hidden',iFill!=='solid');
    document.getElementById('items-gradient-controls').classList.toggle('hidden',iFill==='solid');
    
    // Update hex displays
    if(cFill==='solid'){
        var sc=document.getElementById('container-solid-color').value;
        document.getElementById('container-solid-hex').textContent=sc.toUpperCase();
        document.getElementById('container-solid-preview').style.background=sc;
    }else{
        var cGrad=buildGradientCSS(g.container.from,g.container.to,g.container.dir);
        document.getElementById('container-grad-preview').style.background=cGrad;
        document.getElementById('container-hex-from').textContent=g.container.from.toUpperCase();
        document.getElementById('container-hex-to').textContent=g.container.to.toUpperCase();
    }
    
    if(iFill==='solid'){
        var si=document.getElementById('items-solid-color').value;
        document.getElementById('items-solid-hex').textContent=si.toUpperCase();
        document.getElementById('items-solid-preview').style.background=si;
    }else{
        var iGrad=buildGradientCSS(g.items.from,g.items.to,g.items.dir);
        document.getElementById('items-grad-preview').style.background=iGrad;
        document.getElementById('items-hex-from').textContent=g.items.from.toUpperCase();
        document.getElementById('items-hex-to').textContent=g.items.to.toUpperCase();
    }
}

function updateGrid(){
const preview=document.getElementById('grid-preview');
let cols=document.getElementById('columns').value;
const rows=document.getElementById('rows').value;
const gap=document.getElementById('gap').value;

// Validate inputs and REVERT to last valid state if there are errors
const colsValid = validateGridValue('columns', cols, 'Columns');
const rowsValid = validateGridValue('rows', rows, 'Rows');

// If validation fails, use last valid values for preview but DON'T revert input yet
// (Give user time to finish typing - revert only happens if they stop typing)
if (!colsValid) {
    cols = lastValidCols; // Use last valid for preview
    // Don't touch the input - let them finish typing!
}
if (!rowsValid) {
    rows = lastValidRows; // Use last valid for preview
    // Don't touch the input - let them finish typing!
}

// If BOTH invalid, stop execution (nothing to show)
if (!colsValid && !rowsValid) {
    return;
}
const areas=isPro?document.getElementById('grid-areas').value:'';
const alignItems=document.getElementById('align-items').value;
const justifyItems=document.getElementById('justify-items').value;
const minWidth=isPro?document.getElementById('min-width').value:'';

// Apply responsive columns if min-width is set
if(isPro&&minWidth&&minWidth>0){
cols=`repeat(auto-fit, minmax(${minWidth}px, 1fr))`;
document.getElementById('columns').value=cols;
}

preview.style.gridTemplateColumns=cols;
preview.style.gridTemplateRows=rows;
preview.style.gap=gap+'px';

// Save these as last known good values
lastValidCols = cols;
lastValidRows = rows;
preview.style.gridTemplateAreas=areas?areas.split('\n').map(l=>`"${l.trim().replace(/"/g,'')}"`).join(' '):'none';

// Apply alignment
if(alignItems||justifyItems){
const placeItems=`${alignItems||'stretch'} ${justifyItems||'stretch'}`;
preview.style.placeItems=placeItems;
}else{
preview.style.placeItems='';
}

const total=cols.trim().split(/[\s,]+/).filter(v=>v).length*rows.trim().split(/[\s,]+/).filter(v=>v).length;

// Dynamically create or remove grid items as needed
const gridItems = document.querySelectorAll('.grid-item');
const currentCount = gridItems.length;

if (total > currentCount) {
    // Need more items - create them
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = currentCount; i < total; i++) {
        const newItem = document.createElement('div');
        newItem.className = 'grid-item';
        newItem.textContent = letters[i % 26] + (Math.floor(i / 26) > 0 ? Math.floor(i / 26) : '');
        preview.appendChild(newItem);
    }
} else if (total < currentCount) {
    // Too many items - hide excess
    gridItems.forEach((item, i) => {
        item.style.display = i < total ? 'flex' : 'none';
    });
}

updateInfo();generateCode();

// Apply gradient to preview
var gradEnabled=document.getElementById('gradient-enabled')&&document.getElementById('gradient-enabled').checked;
document.getElementById('gradient-controls').classList.toggle('hidden',!gradEnabled);
var g=getGradientState();
if(g){
    preview.style.background=getBackgroundCSS(g.container);
    var itemBg=getBackgroundCSS(g.items);
    document.querySelectorAll('.grid-item').forEach(function(item){
        if(item.style.display!=='none') item.style.background=itemBg;
    });
    updateGradientPreviews();
}else{
    preview.style.background='';
    document.querySelectorAll('.grid-item').forEach(function(item){
        item.style.background='';
    });
}
}

function toggleGrid(){
const show=document.getElementById('show-grid').checked;
document.getElementById('grid-preview').style.backgroundImage=show?'repeating-linear-gradient(0deg,transparent,transparent 19px,rgba(147,197,253,0.3) 19px,rgba(147,197,253,0.3) 20px),repeating-linear-gradient(90deg,transparent,transparent 19px,rgba(147,197,253,0.3) 19px,rgba(147,197,253,0.3) 20px)':'none';
}

function updateInfo(){
const show=document.getElementById('show-info').checked;
document.querySelectorAll('.grid-item').forEach(item=>item.setAttribute('data-info',show?`${item.offsetWidth}×${item.offsetHeight}px`:''));
}

function generateCode(){
const cols=document.getElementById('columns').value;
const rows=document.getElementById('rows').value;
const gap=document.getElementById('gap').value;
const areas=isPro?document.getElementById('grid-areas').value:'';
const alignItems=document.getElementById('align-items').value;
const justifyItems=document.getElementById('justify-items').value;
const g=getGradientState();

let code='';

if(currentCodeFormat==='css'){
code=`.container {\n  display: grid;\n  grid-template-columns: ${cols};\n  grid-template-rows: ${rows};\n  gap: ${gap}px;`;
if(areas){
const fmt=areas.split('\n').map(l=>`  "${l.trim().replace(/"/g,'')}"`).join('\n');
code+=`\n  grid-template-areas:\n${fmt};`;
}
if(alignItems||justifyItems){
code+=`\n  place-items: ${alignItems||'stretch'} ${justifyItems||'stretch'};`;
}
if(g){
code+=`\n  background: ${getBackgroundCSS(g.container)};`;
}
code+='\n}';
if(g){
code+=`\n\n.container > * {\n  background: ${buildGradientCSS(g.items.from,g.items.to,g.items.dir)};\n}`;
}
}

else if(currentCodeFormat==='tailwind'){
const colClass=convertToTailwindCols(cols);
const gapClass=`gap-${Math.round(gap/4)}`;
let containerStyle='';
let itemStyle='';
if(g){
containerStyle=` style="background: ${buildGradientCSS(g.container.from,g.container.to,g.container.dir)}"`;
itemStyle=` style="background: ${buildGradientCSS(g.items.from,g.items.to,g.items.dir)}"`;
}
code=`<div class="grid ${colClass} ${gapClass}"${containerStyle}>
  <div${itemStyle}>Item 1</div>
  <div${itemStyle}>Item 2</div>
  <div${itemStyle}>Item 3</div>
  <!-- Add more items as needed -->
</div>`;
if(areas)code+=`\n\n<!-- Note: Grid template areas not directly supported in Tailwind.\n     Use custom CSS or grid positioning classes. -->`;
}

else if(currentCodeFormat==='js'){
code=`const gridStyles = {
  display: 'grid',
  gridTemplateColumns: '${cols}',
  gridTemplateRows: '${rows}',
  gap: '${gap}px'`;
if(areas){
const areasFmt=areas.split('\n').map(l=>`"${l.trim().replace(/"/g,'')}"`).join(' ');
code+=`,\n  gridTemplateAreas: '${areasFmt}'`;
}
if(alignItems||justifyItems){
code+=`,\n  placeItems: '${alignItems||'stretch'} ${justifyItems||'stretch'}'`;
}
if(g){
code+=`,\n  background: '${getBackgroundCSS(g.container)}'`;
}
code+='\n};';
if(g){
code+=`\n\nconst itemStyles = {\n  background: '${getBackgroundCSS(g.items)}'\n};`;
}
}

else if(currentCodeFormat==='scss'){
code=`.container {
  display: grid;
  grid-template-columns: ${cols};
  grid-template-rows: ${rows};
  gap: ${gap}px;`;
if(areas){
const fmt=areas.split('\n').map(l=>`    "${l.trim().replace(/"/g,'')}"`).join('\n');
code+=`\n  grid-template-areas:\n${fmt};`;
}
if(alignItems||justifyItems){
code+=`\n  place-items: ${alignItems||'stretch'} ${justifyItems||'stretch'};`;
}
if(g){
code+=`\n  background: ${getBackgroundCSS(g.container)};`;
code+=`\n\n  > * {\n    background: ${getBackgroundCSS(g.items)};\n  }`;
}
code+=`\n\n  // Responsive breakpoint
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}`;
}

document.getElementById('code-output').textContent=code;
}

function convertToTailwindCols(cols){
const parts=cols.trim().split(/\s+/);
if(parts.length===1&&parts[0].includes('fr'))return 'grid-cols-1';
if(parts.length===2&&parts.every(p=>p.includes('fr')))return 'grid-cols-2';
if(parts.length===3&&parts.every(p=>p.includes('fr')))return 'grid-cols-3';
if(parts.length===4&&parts.every(p=>p.includes('fr')))return 'grid-cols-4';
return `grid-cols-[${cols.replace(/\s+/g,'_')}]`;
}

function switchCodeTab(format){
currentCodeFormat=format;
document.querySelectorAll('.code-tab').forEach(btn=>{
btn.classList.remove('bg-blue-600','text-white');
btn.classList.add('bg-gray-300','text-gray-700');
});
document.getElementById(`code-tab-${format}`).classList.remove('bg-gray-300','text-gray-700');
document.getElementById(`code-tab-${format}`).classList.add('bg-blue-600','text-white');
generateCode();
}

function switchAnalyzerTab(format){
currentAnalyzerFormat=format;
document.querySelectorAll('.analyzer-tab').forEach(btn=>{
btn.classList.remove('bg-red-600','text-white');
btn.classList.add('bg-gray-300','text-gray-700');
});
document.getElementById(`analyzer-tab-${format}`).classList.remove('bg-gray-300','text-gray-700');
document.getElementById(`analyzer-tab-${format}`).classList.add('bg-red-600','text-white');
document.getElementById('analyze-input').value='';
document.getElementById('analyze-output').classList.add('hidden');
updateLineNumbers();
}

function copyCode(){
const code=document.getElementById('code-output').textContent;
navigator.clipboard.writeText(code).then(()=>alert(`✅ ${currentCodeFormat.toUpperCase()} code copied!`));
}



function shareLayout(){
const params=new URLSearchParams({cols:document.getElementById('columns').value,rows:document.getElementById('rows').value,gap:document.getElementById('gap').value});
if(isPro&&document.getElementById('grid-areas').value){params.set('areas',document.getElementById('grid-areas').value);params.set('pro','1');}
const url=(window.location.hostname?window.location.origin+window.location.pathname:'https://gridlock-holmes.com')+'?'+params;
document.getElementById('share-link').value=url;
document.getElementById('share-modal').classList.remove('hidden');
}

function closeShareModal(){document.getElementById('share-modal').classList.add('hidden');}
function copyShareLink(){navigator.clipboard.writeText(document.getElementById('share-link').value).then(()=>alert('✅ Link copied!'));}
function shareViaWhatsApp(){window.open(`https://wa.me/?text=${encodeURIComponent('Check this out! ')}${encodeURIComponent(document.getElementById('share-link').value)}`,'_blank');}
function shareViaEmail(){window.location.href=`mailto:?subject=${encodeURIComponent('CSS Grid')}&body=${encodeURIComponent(document.getElementById('share-link').value)}`;}

function saveLayout(){
const name=document.getElementById('save-name').value.trim();
if(!name){alert('⚠️ Enter a name!');return;}
saved.push({id:Date.now(),name,cols:document.getElementById('columns').value,rows:document.getElementById('rows').value,gap:document.getElementById('gap').value,areas:isPro?document.getElementById('grid-areas').value:''});
localStorage.setItem('gridlock-saved',JSON.stringify(saved));
document.getElementById('save-name').value='';
alert('✅ Saved!');
renderSaved();
}

function loadSaved(){
const data=localStorage.getItem('gridlock-saved');
if(data)saved=JSON.parse(data);
renderSaved();
}

function renderSaved(){
const section=document.getElementById('saved-section');
const list=document.getElementById('saved-list');
if(saved.length===0){section.classList.add('hidden');return;}
section.classList.remove('hidden');
list.innerHTML=saved.map(s=>`<div class="flex justify-between p-2 bg-white border rounded"><span class="text-sm">${s.name}</span><div class="flex gap-2"><button onclick="loadSavedLayout(${s.id})" class="px-2 py-1 bg-blue-500 text-white text-xs rounded">Load</button><button onclick="deleteSaved(${s.id})" class="px-2 py-1 bg-red-500 text-white text-xs rounded">Del</button></div></div>`).join('');
}

function loadSavedLayout(id){
const layout=saved.find(s=>s.id===id);
if(!layout)return;
if(layout.areas&&!isPro)togglePro();
document.getElementById('columns').value=layout.cols;
document.getElementById('rows').value=layout.rows;
document.getElementById('gap').value=layout.gap;
if(layout.areas)document.getElementById('grid-areas').value=layout.areas;
updateGrid();
}

function deleteSaved(id){
if(!confirm('Delete?'))return;
saved=saved.filter(s=>s.id!==id);
localStorage.setItem('gridlock-saved',JSON.stringify(saved));
renderSaved();
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

const errors=[],tips=[];
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
    
    // Check for commas (once per property)
    if (colValue.includes(',')) {
        errors.push(`❌ Remove commas from grid-template-columns${colLineInfo} - use spaces`);
    }
    
    // Check for missing spaces between values (e.g. "200px1frauto", "1fr1fr", "autoauto")
    if (/\d+(px|fr|%|em|rem|vw|vh)\d/.test(colValue) || /\d+(px|fr|%|em|rem|vw|vh)(auto|min-content|max-content|fit-content)/.test(colValue) || /(auto|min-content|max-content)\d/.test(colValue) || /(auto)(auto|min-content|max-content|\d)/.test(colValue)) {
        errors.push(`❌ Missing spaces between values in grid-template-columns${colLineInfo} — separate each value with a space (e.g. "200px 1fr auto")`);
    }
    
    const values = colValue.split(/\s+/).filter(v => v && v !== ',');
    values.forEach(v => {
        if (!v) return;
        // Check for missing units
        if (/^\d+$/.test(v)) {
            errors.push(`❌ Value "${v}" missing unit${colLineInfo} - try "${v}px" or "${v}fr"`);
        }
        // Check for invalid units
        else if (/^\d+[a-zA-Z]{1,2}$/.test(v) && !/(px|fr|%|em|rem|vw|vh|ch)$/.test(v)) {
            errors.push(`❌ Invalid unit in "${v}"${colLineInfo}`);
        }
        // Check for concatenated values that didn't split (e.g. "200px1frauto" as a single token)
        else if (/\d+(px|fr|%|em|rem|vw|vh).+/.test(v) && v.length > 6) {
            errors.push(`❌ Multiple values joined together "${v}"${colLineInfo} — add spaces between each value`);
        }

    });
}

// Validate grid-template-rows values
const rowMatch = code.match(/grid-template-rows\s*:\s*([^;]+);/);
if (rowMatch) {
    const rowValue = rowMatch[1].trim();
    const rowLine = findLineNumber('grid-template-rows');
    const rowLineInfo = rowLine ? ` (line ${rowLine})` : '';
    
    // Check for commas (once per property)
    if (rowValue.includes(',')) {
        errors.push('❌ Remove commas from grid-template-rows - use spaces to separate values');
    }
    
    // Check for missing spaces between values (e.g. "autoauto", "100pxauto")
    if (/\d+(px|fr|%|em|rem|vw|vh)(auto|min-content|max-content|\d)/.test(rowValue) || /(auto)(auto|min-content|max-content|\d)/.test(rowValue)) {
        errors.push(`❌ Missing spaces between values in grid-template-rows${rowLineInfo} — separate each value with a space (e.g. "auto auto")`);
    }
    
    const values = rowValue.split(/\s+/).filter(v => v && v !== ',');
    values.forEach(v => {
        if (!v) return;
        if (/^\d+$/.test(v)) {
            errors.push(`❌ Value "${v}" missing unit in grid-template-rows - try "${v}px" or "auto"`);
        }
        else if (/^\d+[a-zA-Z]{1,2}$/.test(v) && !/(px|fr|%|em|rem|vw|vh|ch|auto)$/.test(v)) {
            errors.push(`❌ Invalid unit in "${v}"`);
        }
        // Catch concatenated values
        else if (/(auto|min-content|max-content).+/.test(v) && v !== 'auto' && v !== 'min-content' && v !== 'max-content') {
            errors.push(`❌ Multiple values joined together "${v}"${rowLineInfo} — add spaces between each value`);
        }
    });
}

// Validate gap value
const gapMatch = code.match(/gap\s*:\s*([^;]+);/);
if (gapMatch) {
    const gapValue = gapMatch[1].trim();
    const gapLine = findLineNumber('gap');
    const gapLineInfo = gapLine ? ` (line ${gapLine})` : '';
    
    // Check if gap has units
    if (/^\d+$/.test(gapValue)) {
        errors.push(`❌ Gap "${gapValue}" missing unit${gapLineInfo} - try "${gapValue}px"`);
    }
    // Check for invalid units like "16x"
    else if (/\d+x(?!\d)/.test(gapValue)) {
        errors.push(`❌ Invalid unit "x" in gap${gapLineInfo} - should be "px"`);
    }
}

// Check for commas (handled in value validation above, so removed duplicate)
// Check for auto typo
if(/:\s*auo\s*[;\}]/.test(code))errors.push('❌ Typo: "auo" should be "auto"');
if(/\sauo\s/.test(code)||/:\s*auo/.test(code))errors.push('❌ Typo: "auo" should be "auto"');
if(/\suto\s/.test(code)||/:\s*uto/.test(code))errors.push('❌ Typo: "uto" - did you mean "auto"?');

// Check for uppercase units (should be lowercase)
if(/\d+FR\b/.test(code)){
    const lineNum = findLineNumber('FR');
    const lineInfo = lineNum ? ` (line ${lineNum})` : '';
    errors.push(`❌ Use lowercase${lineInfo}: "FR" should be "fr"`);
}
if(/\bAUTO\b/.test(code)){
    errors.push('❌ Use lowercase: "AUTO" should be "auto"');
}
if(/\b(MIN-CONTENT|MAX-CONTENT|FIT-CONTENT)\b/.test(code)){
    errors.push('❌ Use lowercase for CSS keywords (auto, min-content, max-content, etc.)');
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

// Check for missing semicolons (lines with : but no ;)
lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed && trimmed.includes(':') && !trimmed.includes(';') && !trimmed.includes('{') && !trimmed.includes('}')) {
        const lineNum = idx + 1;
        errors.push(`❌ Missing semicolon at end of line ${lineNum}`);
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
                    errors.push('❌ Invalid hex colour "'+hex+'"'+bgInfo+' — hex codes must be 3, 4, 6, or 8 valid hex digits (0-9, a-f)');
                }
            });
            
            // Check for missing comma between colour stops
            if(/#[0-9a-fA-F]+\s+#/.test(bgValue)){
                errors.push('❌ Missing comma between colour stops'+bgInfo+' — separate colours with commas');
            }
            
            // Check for invalid direction keywords
            var dirMatch2=bgValue.match(/(linear-gradient)\(\s*([^,]+),/);
            if(dirMatch2){
                var dir2=dirMatch2[2].trim();
                var validDirs2=['to right','to left','to top','to bottom','to top right','to top left','to bottom right','to bottom left'];
                // Only check if it starts with "to " (angle values like 45deg are also valid)
                if(dir2.startsWith('to ')&&validDirs2.indexOf(dir2)===-1){
                    errors.push('❌ Invalid gradient direction "'+dir2+'"'+bgInfo+' — valid: to right, to left, to top, to bottom, to top right, to bottom left, etc.');
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

classWords.forEach(word => {
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
        errors.push('❌ Gradient value must be a string in JS — wrap in quotes: \'linear-gradient(...)\'');
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
        errors.push(`❌ Missing semicolon at end of line ${idx+1}`);
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

let html='';
if(errors.length===0){
html='<div class="text-green-700 font-bold">✅ No errors detected!</div>';
if(tips.length>0)html+=`<div class="mt-2 text-sm">${tips.join('<br>')}</div>`;
output.className='mt-3 p-3 rounded bg-green-50 border border-green-200 text-sm';
}else{
html=`<div class="text-red-700 font-bold">🚨 Errors Found:</div><ul class="list-disc ml-5">${errors.map(e=>`<li>${e}</li>`).join('')}</ul>`;
if(tips.length>0)html+=`<div class="mt-2">${tips.join('<br>')}</div>`;
output.className='mt-3 p-3 rounded bg-red-50 border border-red-200 text-sm';
}
output.innerHTML=html;
}

// Simple trust-based license activation
function activateLicense() {
    const licenseKey = document.getElementById('license-key').value.trim().toUpperCase();
    
    // Basic validation - check format
    if (!licenseKey || licenseKey.length < 8) {
        alert('❌ Please enter a valid license key.\n\nYour key was sent via email after purchase.\n\nNeed help? Email: jon.ellisdon@gridlock-holmes.com');
        return;
    }
    
    // Store in localStorage (trust-based - no API validation)
    localStorage.setItem('gridlock_pro_license', licenseKey);
    localStorage.setItem('gridlock_pro_activated', 'true');
    localStorage.setItem('gridlock_pro_activation_date', new Date().toISOString());
    
    // Show success message
    alert('🎉 Pro Activated Successfully!\n\n✅ Your license key has been activated\n✅ Pro features are now unlocked\n✅ Ads have been removed\n\nRefreshing page...');
    
    // Reload page to show Pro features
    location.reload();
}

// Check if Pro is already activated
function checkProStatus() {
    const isActivated = localStorage.getItem('gridlock_pro_activated');
    const licenseKey = localStorage.getItem('gridlock_pro_license');
    
    if (isActivated === 'true' && licenseKey) {
        // User has Pro!
        return true;
    }
    return false;
}

// Initialize on page load
window.addEventListener('load', function() {
    if (checkProStatus()) {
        // Activate Pro features
        isPro = true;
        
        // Hide ads
        const ads = document.querySelectorAll('[id^="adsense-"]');
        ads.forEach(ad => ad.style.display = 'none');
        
        // Update Pro section to show activated status
        const upgradeBtn = document.getElementById('upgrade-btn');
        if (upgradeBtn) {
            upgradeBtn.textContent = '✅ Pro Activated';
            upgradeBtn.className = 'w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg mb-2 cursor-default';
            upgradeBtn.onclick = function() {
                const key = localStorage.getItem('gridlock_pro_license');
                alert('✅ Pro Status: ACTIVE\n\nLicense Key: ' + key + '\n\nAll Pro features are unlocked!\n\nNeed help? Email: jon.ellisdon@gridlock-holmes.com');
            };
        }
        
        // Hide license activation form
        const licenseForm = document.querySelector('.bg-blue-50.border-blue-200');
        if (licenseForm) {
            licenseForm.innerHTML = '<p class="text-green-700 font-bold text-sm">✅ Pro License Active</p><p class="text-xs text-gray-600 mt-1">All features unlocked!</p>';
        }
    }
});

// Add deactivation function (for testing/support)
function deactivateLicense() {
    if (confirm('Are you sure you want to deactivate Pro?\n\nYou can reactivate anytime with your license key.')) {
        localStorage.removeItem('gridlock_pro_license');
        localStorage.removeItem('gridlock_pro_activated');
        localStorage.removeItem('gridlock_pro_activation_date');
        alert('Pro deactivated. Refreshing page...');
        location.reload();
    }
}
window.onload=init;