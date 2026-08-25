/**
 * USE CASE — misi harian: menampilkan progres dan mengambil hadiahnya.
 */
import { registerMissionClaim } from '../domain/profile.js';

/**
 * @param {{profileService: object}} dependencies
 */
export function createDailyMissionService({ profileService }) {
  return {
    /** Misi hari ini beserta progres masing-masing. */
    list() {
      return profileService.missions();
    },

    /** Berapa misi yang sudah tuntas hari ini. */
    completedCount() {
      return profileService.missions().filter((mission) => mission.done).length;
    },

    /**
     * Ambil hadiah sebuah misi.
     * @param {string} missionId
     * @returns {{reward: object, unlocked: Array, leveledUp: boolean}|null}
     */
    claim(missionId) {
      let reward = null;
      const applied = profileService.apply((profile) => {
        const outcome = registerMissionClaim(profile, missionId);
        if (!outcome) return profile;
        reward = outcome.reward;
        return outcome.profile;
      });
      if (!reward) return null;
      return { reward, unlocked: applied.unlocked, leveledUp: applied.leveledUp };
    },
  };
}
