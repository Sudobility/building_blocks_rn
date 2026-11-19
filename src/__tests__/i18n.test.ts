/**
 * @fileoverview Tests for i18n initialization.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import i18n from 'i18next';

describe('i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset initialized flag by re-importing
    vi.resetModules();
  });

  it('should initialize i18n with default config', async () => {
    const { initializeI18nRN } = await import('../i18n/index');

    const result = initializeI18nRN();

    expect(result).toBeDefined();
    expect(i18n.use).toHaveBeenCalled();
    expect(i18n.init).toHaveBeenCalled();
  });

  it('should initialize only once', async () => {
    const { initializeI18nRN } = await import('../i18n/index');

    initializeI18nRN();
    const callCount = (i18n.init as ReturnType<typeof vi.fn>).mock.calls.length;

    initializeI18nRN();
    expect((i18n.init as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
      callCount
    );
  });

  it('should accept custom config', async () => {
    const { initializeI18nRN } = await import('../i18n/index');

    initializeI18nRN({
      supportedLanguages: ['en', 'fr'],
      debug: true,
      defaultNamespace: 'app',
    });

    expect(i18n.init).toHaveBeenCalledWith(
      expect.objectContaining({
        supportedLngs: ['en', 'fr'],
        debug: true,
        defaultNS: 'app',
      })
    );
  });

  it('should provide getI18n that initializes if needed', async () => {
    const { getI18n } = await import('../i18n/index');

    const result = getI18n();
    expect(result).toBeDefined();
  });

  it('should use Chinese fallback chain', async () => {
    const { initializeI18nRN } = await import('../i18n/index');

    initializeI18nRN({
      supportedLanguages: ['en', 'zh', 'zh-hant'],
    });

    expect(i18n.init).toHaveBeenCalledWith(
      expect.objectContaining({
        fallbackLng: {
          zh: ['zh', 'en'],
          'zh-hant': ['zh-hant', 'zh', 'en'],
          default: ['en'],
        },
      })
    );
  });

  it('should export the i18n instance', async () => {
    const mod = await import('../i18n/index');
    expect(mod.i18n).toBeDefined();
  });

  it("answers to the web package's name too", async () => {
    const { initializeI18n, initializeI18nRN } = await import('../i18n/index');

    expect(initializeI18n).toBe(initializeI18nRN);
  });
});
