import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openExternal } from '../lib/open-external';

const { shellOpen } = vi.hoisted(() => ({ shellOpen: vi.fn() }));

vi.mock('@tauri-apps/plugin-shell', () => ({ open: shellOpen }));

describe('openExternal()', () => {
  beforeEach(() => {
    shellOpen.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens the URL through the Tauri shell plugin', async () => {
    shellOpen.mockResolvedValue(undefined);

    await openExternal('https://example.com');

    expect(shellOpen).toHaveBeenCalledWith('https://example.com');
  });

  it('falls back to a new browser tab when the Tauri plugin fails', async () => {
    const browserOpen = vi.fn();
    shellOpen.mockRejectedValue(new Error('Tauri is unavailable'));
    vi.stubGlobal('window', { open: browserOpen });

    await openExternal('https://example.com');

    expect(browserOpen).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer'
    );
  });
});
