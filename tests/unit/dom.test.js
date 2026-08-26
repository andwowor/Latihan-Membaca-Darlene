/**
 * Pembantu DOM. Diuji dengan `document` tiruan seadanya — cukup untuk
 * memastikan penjagaan yang penting, tanpa memasang peramban di CI.
 *
 * Yang dijaga: `onClick` (bukan `on: { click }`) pernah diterima diam-diam
 * sebagai atribut HTML biasa, membuat dua tombol di Area Orang Tua mati tanpa
 * satu pun galat. Yang menemukannya adalah uji peramban, bukan test.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

/** Elemen tiruan: hanya yang benar-benar dipakai `el()`. */
function fakeElement(tag) {
  return {
    tag,
    className: '',
    textContent: '',
    attributes: {},
    listeners: {},
    dataset: {},
    style: {},
    children: [],
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, handler) { this.listeners[name] = handler; },
    appendChild(child) { this.children.push(child); return child; },
  };
}

const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
Object.defineProperty(globalThis, 'document', {
  value: {
    createElement: fakeElement,
    createTextNode: (value) => ({ text: value }),
  },
  configurable: true,
  writable: true,
});

const { el } = await import('../../src/ui/dom.js');

test.after(() => {
  if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
  else delete globalThis.document;
});

test('peristiwa dipasang lewat on: { click }', () => {
  let ditekan = 0;
  const node = el('button', { on: { click: () => { ditekan += 1; } } });
  node.listeners.click();
  assert.equal(ditekan, 1);
});

test('onClick ditolak keras, tidak diam-diam jadi atribut', () => {
  assert.throws(
    () => el('button', { onClick: () => {} }),
    /Pakai on: \{ click \}, bukan onClick/,
  );
});

test('penjagaan berlaku untuk seluruh peristiwa yang salah tulis', () => {
  ['onChange', 'onInput', 'onSubmit'].forEach((key) => {
    assert.throws(() => el('div', { [key]: () => {} }), /Pakai on: \{/, key);
  });
});

test('atribut biasa tetap lewat apa adanya', () => {
  const node = el('button', { class: 'btn', type: 'button', text: 'Halo' });
  assert.equal(node.className, 'btn');
  assert.equal(node.attributes.type, 'button');
  assert.equal(node.textContent, 'Halo');
});

test('nilai kosong tidak menghasilkan atribut', () => {
  const node = el('div', { hidden: false, title: null, id: undefined });
  assert.deepEqual(node.attributes, {});
});
