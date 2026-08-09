import { Settings } from './settings.model.js';

const POPULATE_FIELDS = ['logoMedia', 'faviconMedia', 'seoDefaults.ogImageMedia'];

export const settingsRepository = {
  async findSingleton() {
    const existing = await Settings.findOne().populate(POPULATE_FIELDS);
    if (existing) return existing;
    return Settings.create({});
  },

  async updateSingleton(data) {
    const settings = await Settings.findOne().then((doc) => doc || Settings.create({}));
    Object.assign(settings, data);
    await settings.save();
    return settings.populate(POPULATE_FIELDS);
  },
};
