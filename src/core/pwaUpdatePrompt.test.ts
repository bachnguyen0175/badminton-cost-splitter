import { describe, it, expect, vi, beforeEach } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRegisterSW = vi.fn<any>(() => vi.fn());

vi.mock('virtual:pwa-register', () => ({
  registerSW: mockRegisterSW,
}));

describe('PWA Update Prompt', () => {
  beforeEach(() => {
    mockRegisterSW.mockClear();
    mockRegisterSW.mockReturnValue(vi.fn());
  });

  it('should export initPwaUpdater function', async () => {
    const { initPwaUpdater } = await import('./pwaUpdatePrompt');
    expect(initPwaUpdater).toBeDefined();
    expect(typeof initPwaUpdater).toBe('function');
  });

  it('should call registerSW with onNeedRefresh and onOfflineReady callbacks', async () => {
    const { initPwaUpdater } = await import('./pwaUpdatePrompt');
    initPwaUpdater();

    expect(mockRegisterSW).toHaveBeenCalledWith(
      expect.objectContaining({
        onNeedRefresh: expect.any(Function),
        onOfflineReady: expect.any(Function),
      })
    );
  });

  it('should return an object with needRefresh, offlineReady, and updateSW', async () => {
    const { initPwaUpdater } = await import('./pwaUpdatePrompt');
    const result = initPwaUpdater();

    expect(result).toHaveProperty('needRefresh');
    expect(result).toHaveProperty('offlineReady');
    expect(result).toHaveProperty('updateSW');
    expect(typeof result.needRefresh).toBe('boolean');
    expect(typeof result.offlineReady).toBe('boolean');
    expect(typeof result.updateSW).toBe('function');
  });

  it('should start with needRefresh and offlineReady as false', async () => {
    const { initPwaUpdater } = await import('./pwaUpdatePrompt');
    const result = initPwaUpdater();

    expect(result.needRefresh).toBe(false);
    expect(result.offlineReady).toBe(false);
  });

  it('should return the updateSW function from registerSW', async () => {
    const mockUpdateSW = vi.fn();
    mockRegisterSW.mockReturnValue(mockUpdateSW);

    const { initPwaUpdater } = await import('./pwaUpdatePrompt');
    const result = initPwaUpdater();

    expect(result.updateSW).toBe(mockUpdateSW);
  });

  it('should set needRefresh to true when onNeedRefresh is called', async () => {
    let capturedOnNeedRefresh: (() => void) | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockRegisterSW as any).mockImplementation((opts: Record<string, (() => void) | undefined>) => {
      capturedOnNeedRefresh = opts?.onNeedRefresh;
      return vi.fn();
    });

    const { initPwaUpdater } = await import('./pwaUpdatePrompt');
    const result = initPwaUpdater();

    expect(result.needRefresh).toBe(false);
    capturedOnNeedRefresh!();
    expect(result.needRefresh).toBe(true);
  });

  it('should set offlineReady to true when onOfflineReady is called', async () => {
    let capturedOnOfflineReady: (() => void) | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockRegisterSW as any).mockImplementation((opts: Record<string, (() => void) | undefined>) => {
      capturedOnOfflineReady = opts?.onOfflineReady;
      return vi.fn();
    });

    const { initPwaUpdater } = await import('./pwaUpdatePrompt');
    const result = initPwaUpdater();

    expect(result.offlineReady).toBe(false);
    capturedOnOfflineReady!();
    expect(result.offlineReady).toBe(true);
  });
});
