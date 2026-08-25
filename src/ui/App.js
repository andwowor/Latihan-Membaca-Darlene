/**
 * Shell aplikasi (UI controller).
 *
 * Tugasnya hanya: memilih layar sesuai rute, menyiapkan konteks untuk view,
 * dan menjaga bilah atas/bawah tetap sinkron. Tidak ada aturan bisnis di sini
 * — semuanya dipanggil lewat lapisan aplikasi.
 */
import { createHashRouter } from '../adapters/inbound/hashRouter.js';
import { createInstallPrompt } from '../adapters/inbound/installPrompt.js';
import { renderTopbar } from './components/topbar.js';
import { renderTabbar, TABS } from './components/tabbar.js';
import { renderHomeView } from './views/homeView.js';
import { renderLessonView } from './views/lessonView.js';
import { renderMissionsView } from './views/missionsView.js';
import { renderTrophiesView } from './views/trophiesView.js';
import { renderWordsView } from './views/wordsView.js';
import { renderParentView } from './views/parentView.js';
import { APP_VERSION } from '../config/environment.js';

/** Rute yang tampil penuh layar (tanpa bilah atas & bawah). */
const FULLSCREEN_ROUTES = new Set(['pelajaran', 'latihan']);

/**
 * @param {{container: object, elements: {view: HTMLElement, topbar: HTMLElement,
 *          tabbar: HTMLElement, confetti: HTMLCanvasElement, toasts: HTMLElement}}} config
 */
export function createApp({ container, elements }) {
  const uiState = { wordFilter: 'all' };
  let currentRoute = { name: 'belajar', params: [] };

  const router = createHashRouter({
    onNavigate: (route) => {
      currentRoute = route;
      draw(route);
    },
  });

  const installPrompt = createInstallPrompt({
    onAvailable: () => {
      if (currentRoute.name === 'orangtua') draw(currentRoute);
    },
  });

  const context = {
    ...container,
    installPrompt,
    uiState,
    appVersion: APP_VERSION,
    confettiCanvas: elements.confetti,
    toastHost: elements.toasts,
    navigate: (name, ...params) => router.go(name, ...params),
    refresh: () => draw(currentRoute),
  };

  const VIEWS = {
    belajar: (host) => renderHomeView(host, context),
    misi: (host) => renderMissionsView(host, context),
    piala: (host) => renderTrophiesView(host, context),
    kata: (host) => renderWordsView(host, context),
    orangtua: (host) => renderParentView(host, context),
    pelajaran: (host, route) => renderLessonView(host, context, { lessonId: route.params[0] }),
    latihan: (host) => renderLessonView(host, context, { practice: true }),
  };

  function updateChrome(routeName) {
    const fullscreen = FULLSCREEN_ROUTES.has(routeName);
    elements.topbar.hidden = fullscreen;
    elements.tabbar.hidden = fullscreen;
    if (fullscreen) return;

    renderTopbar(elements.topbar, {
      summary: container.profileService.summary(),
      level: container.profileService.level(),
    });
    renderTabbar(elements.tabbar, {
      active: TABS.some((tab) => tab.route === routeName) ? routeName : 'belajar',
      missionBadge: container.missionService.list()
        .filter((mission) => mission.done && !mission.claimed).length,
      onNavigate: (route) => router.go(route),
    });
  }

  function draw(route) {
    container.speech.stop();
    const render = VIEWS[route.name] || VIEWS.belajar;
    elements.view.classList.remove('view--lesson');
    render(elements.view, route);
    updateChrome(route.name);
    globalThis.scrollTo?.({ top: 0, behavior: 'instant' });
  }

  return {
    start() {
      // Sentuhan pertama membuka kunci audio (syarat Safari iOS).
      const unlockOnce = () => {
        container.unlockAudio();
        globalThis.removeEventListener('pointerdown', unlockOnce);
        globalThis.removeEventListener('keydown', unlockOnce);
      };
      globalThis.addEventListener('pointerdown', unlockOnce, { once: false });
      globalThis.addEventListener('keydown', unlockOnce, { once: false });

      // Profil bisa berubah dari layar lain (mis. klaim misi): jaga bilah atas.
      container.profileService.subscribe(() => {
        if (!FULLSCREEN_ROUTES.has(currentRoute.name)) updateChrome(currentRoute.name);
      });

      router.start();
    },
  };
}
