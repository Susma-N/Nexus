// Test digester.js calculations without DOM
const fs = require('fs');

// Mock document
const values = {
  'dig_Qi': 21600, 'dig_PF': 1.2, 'dig_TSSi': 400, 'dig_TSSp': 360,
  'dig_PrimSldgeSolidsConc': 0.05, 'dig_PrimSldgeSpGrav': 1.02, 'dig_PrimClarifTSSRem': 0.7,
  'dig_BODi': 375, 'dig_PrimClarifBODRem': 0.33, 'dig_X': 3500, 'dig_SRT': 13.0,
  'dig_VL': 0.8, 'dig_TSSw': 10000, 'dig_TSSe': 20,
  'dig_ThkndSludgeConc': 0.05, 'dig_SolidsRecov': 0.9,
  'dig_VolSolidsPrim': 0.7, 'dig_VolSolidsWAS': 0.8,
  'dig_CriteriaType': 'SRT', 'dig_CriteriaVal': 12.0,
  'dig_NumTanks': 2, 'dig_SWD': 10.0
};

const document = {
  getElementById: (id) => ({ value: values[id] || '', textContent: '', innerHTML: '' })
};

// Mock other UI functions
const f2 = (n) => n;
const fi = (n) => n;
const rs = () => '';
const rg = () => '';
const rc = () => '';
const ck = () => '';
const G = { Q: 21600 };

eval(fs.readFileSync('./js/modules/digester.js', 'utf8'));

// Run logic
calcDigesterWB();

console.log("SUCCESS! Tested without errors.");
