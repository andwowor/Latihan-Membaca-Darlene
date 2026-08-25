/**
 * Bilah navigasi bawah.
 */
import { el, render } from '../dom.js';

export const TABS = [
  { route: 'belajar', icon: '🏫', label: 'Belajar' },
  { route: 'misi', icon: '🎯', label: 'Misi' },
  { route: 'piala', icon: '🏆', label: 'Piala' },
  { route: 'kata', icon: '📖', label: 'Kata' },
  { route: 'orangtua', icon: '👪', label: 'Orang Tua' },
];

/**
 * @param {HTMLElement} host
 * @param {{active: string, missionBadge: number, onNavigate: (route: string) => void}} viewModel
 */
export function renderTabbar(host, { active, missionBadge, onNavigate }) {
  render(host, ...TABS.map((tab) => el('button', {
    class: `tab${tab.route === active ? ' tab--active' : ''}`,
    type: 'button',
    'aria-current': tab.route === active ? 'page' : null,
    on: { click: () => onNavigate(tab.route) },
  }, [
    el('span', { class: 'tab__icon', text: tab.icon }),
    el('span', { text: tab.label }),
    tab.route === 'misi' && missionBadge > 0 ? el('span', { class: 'tab__dot' }) : null,
  ])));
}
