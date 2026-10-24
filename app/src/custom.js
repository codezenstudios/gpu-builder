export const CAPACITIES = [24, 48, 96, 192, 384, 512];
export const MODULE_SIZES = [8, 16, 32];
export const CHIPS_PER_BANK = 8;

const supported = (list, value) => list.includes(value);

export function chipCount(capacityGB, moduleGB) {
  if (!supported(CAPACITIES, capacityGB)) throw new Error('Choose a supported memory capacity.');
  if (!supported(MODULE_SIZES, moduleGB)) throw new Error('Choose a supported module size.');
  if (capacityGB % moduleGB) throw new Error(`${capacityGB} GB does not divide evenly into ${moduleGB} GB packages. Choose another module size.`);
  return capacityGB / moduleGB;
}

export function createCustom({capacityGB = 24, moduleGB = 8, name = 'My custom graphics card'} = {}) {
  return {version: 1, kind: 'custom', name, capacityGB, moduleGB, chips: chipCount(capacityGB, moduleGB), placed: []};
}

export function bankLayout(count) {
  const banks = [];
  for (let first = 1; first <= count; first += CHIPS_PER_BANK) {
    const ids = [];
    for (let id = first; id < Math.min(first + CHIPS_PER_BANK, count + 1); id += 1) ids.push('M' + id);
    banks.push({index: banks.length, ids});
  }
  return banks;
}

export function placeBank(custom, index) {
  const bank = bankLayout(custom.chips)[index];
  if (!bank) throw new Error('That memory bank does not exist in this build.');
  const ids = bank.ids.filter((id) => !custom.placed.includes(id));
  if (!ids.length) throw new Error('That bank is already placed.');
  return {...custom, placed: [...custom.placed, ...ids]};
}

export function placeChip(custom, id) {
  if (typeof id !== 'string' || !/^M\d+$/.test(id)) throw new Error('Unknown memory package identifier.');
  const number = Number(id.slice(1));
  if (number < 1 || number > custom.chips) throw new Error('That memory package is outside this build.');
  if (custom.placed.includes(id)) return custom;
  return {...custom, placed: [...custom.placed, id]};
}

export function placeAllBanks(custom) {
  return {...custom, placed: bankLayout(custom.chips).flatMap((bank) => bank.ids)};
}

export function setTarget(custom, {capacityGB = custom.capacityGB, moduleGB = custom.moduleGB}) {
  const chips = chipCount(capacityGB, moduleGB);
  const placed = custom.placed.filter((id) => Number(id.slice(1)) <= chips);
  return {...custom, capacityGB, moduleGB, chips, placed};
}

export function customStats(custom) {
  const placed = custom.placed.length;
  return {
    placed,
    total: custom.chips,
    banks: bankLayout(custom.chips).length,
    placedCapacityGB: placed * custom.moduleGB,
    capacityGB: custom.capacityGB,
    busBits: custom.chips * 32,
    complete: placed === custom.chips,
  };
}

export function validateCustom(value) {
  if (!value || typeof value !== 'object') throw new Error('Custom builder data must be an object.');
  const capacityGB = Number(value.capacityGB);
  const moduleGB = Number(value.moduleGB);
  const chips = chipCount(capacityGB, moduleGB);
  const placed = Array.isArray(value.placed) ? value.placed : [];
  const seen = new Set();
  for (const id of placed) {
    if (typeof id !== 'string' || !/^M\d+$/.test(id)) throw new Error('Unknown memory package identifier.');
    const number = Number(id.slice(1));
    if (number < 1 || number > chips) throw new Error('Memory package identifier exceeds the configured capacity.');
    if (seen.has(id)) throw new Error('Duplicate memory package identifier.');
    seen.add(id);
  }
  const name = typeof value.name === 'string' && value.name.trim() ? value.name.trim().slice(0, 80) : 'My custom graphics card';
  return {version: 1, kind: 'custom', name, capacityGB, moduleGB, chips, placed: [...seen]};
}
