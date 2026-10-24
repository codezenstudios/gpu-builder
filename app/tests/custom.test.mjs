import test from 'node:test';
import assert from 'node:assert/strict';
import {CAPACITIES, MODULE_SIZES, CHIPS_PER_BANK, bankLayout, chipCount, createCustom, customStats, placeAllBanks, placeBank, placeChip, setTarget, validateCustom} from '../src/custom.js';

test('chip count follows capacity and module size, including the 512 GB ceiling', () => {
  assert.equal(chipCount(24, 8), 3);
  assert.equal(chipCount(48, 16), 3);
  assert.equal(chipCount(192, 32), 6);
  assert.equal(chipCount(512, 32), 16);
  assert.equal(chipCount(512, 8), 64);
  assert.equal(chipCount(96, 32), 3);
  assert.equal(chipCount(48, 16), 3);
});

test('unsupported targets and uneven divisions are rejected with a reason', () => {
  assert.throws(() => chipCount(20, 8), /supported memory capacity/);
  assert.throws(() => chipCount(24, 12), /supported module size/);
  assert.throws(() => chipCount(24, 16), /does not divide evenly/);
  assert.throws(() => chipCount(24, 32), /does not divide evenly/);
  assert.throws(() => chipCount(48, 32), /does not divide evenly/);
});

test('banks group memory packages in eights with stable designators', () => {
  assert.deepEqual(bankLayout(3).map((b) => b.ids), [['M1', 'M2', 'M3']]);
  const banks = bankLayout(16);
  assert.equal(banks.length, 2);
  assert.deepEqual(banks[0].ids, ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8']);
  assert.deepEqual(banks[1].ids, ['M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16']);
  assert.equal(CHIPS_PER_BANK, 8);
});

test('placing a bank adds only that bank and refuses a second placement', () => {
  let custom = createCustom({capacityGB: 512, moduleGB: 32});
  custom = placeBank(custom, 0);
  assert.deepEqual(custom.placed, ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8']);
  assert.throws(() => placeBank(custom, 0), /already placed/);
  assert.throws(() => placeBank(custom, 4), /does not exist/);
  custom = placeBank(custom, 1);
  assert.equal(custom.placed.length, 16);
  assert.deepEqual(customStats(custom), {placed: 16, total: 16, banks: 2, placedCapacityGB: 512, capacityGB: 512, busBits: 512, complete: true});
});

test('a single package can be placed on its own', () => {
  const custom = placeChip(createCustom({capacityGB: 24, moduleGB: 8}), 'M2');
  assert.deepEqual(custom.placed, ['M2']);
  assert.equal(customStats(custom).placedCapacityGB, 8);
  assert.equal(placeChip(custom, 'M2'), custom);
  assert.throws(() => placeChip(custom, 'M9'), /outside this build/);
});

test('placing every bank reaches the capacity target exactly', () => {
  const custom = placeAllBanks(createCustom({capacityGB: 384, moduleGB: 8}));
  assert.equal(custom.placed.length, 48);
  assert.equal(customStats(custom).placedCapacityGB, 384);
  assert.equal(customStats(custom).complete, true);
});

test('lowering the target drops packages that no longer exist', () => {
  const custom = placeAllBanks(createCustom({capacityGB: 512, moduleGB: 32}));
  const smaller = setTarget(custom, {capacityGB: 192, moduleGB: 32});
  assert.equal(smaller.chips, 6);
  assert.deepEqual(smaller.placed, ['M1', 'M2', 'M3', 'M4', 'M5', 'M6']);
  assert.equal(customStats(smaller).placedCapacityGB, 192);
});

test('import validation rejects unknown, duplicate and out-of-range packages', () => {
  assert.throws(() => validateCustom({capacityGB: 24, moduleGB: 8, placed: ['M1', 'M1']}), /Duplicate/);
  assert.throws(() => validateCustom({capacityGB: 24, moduleGB: 8, placed: ['M9']}), /exceeds/);
  assert.throws(() => validateCustom({capacityGB: 24, moduleGB: 8, placed: ['X1']}), /Unknown/);
  const clean = validateCustom({capacityGB: 24, moduleGB: 8, placed: ['M1', 'M2'], name: '  Bench card  '});
  assert.deepEqual(clean.placed, ['M1', 'M2']);
  assert.equal(clean.name, 'Bench card');
  assert.equal(clean.chips, 3);
  assert.equal(CAPACITIES.at(-1), 512);
  assert.deepEqual(MODULE_SIZES, [8, 16, 32]);
});
