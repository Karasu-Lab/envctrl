import os from 'node:os';
import path from 'node:path';

/**
 * Resolves the envctrl application data root directory for the current platform.
 *
 * - Linux: `$XDG_DATA_HOME/envctrl` or `~/.local/share/envctrl`
 * - macOS: `~/Library/Application Support/envctrl`
 * - Windows: `%APPDATA%\envctrl`
 */
function resolveAppDataRoot(): string {
  const platform = os.platform();
  const home = os.homedir();

  if (platform === 'win32') {
    const appData = process.env['APPDATA'] ?? path.join(home, 'AppData', 'Roaming');
    return path.join(appData, 'envctrl');
  }

  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'envctrl');
  }

  const xdgDataHome = process.env['XDG_DATA_HOME'] ?? path.join(home, '.local', 'share');
  return path.join(xdgDataHome, 'envctrl');
}

/**
 * Resolves the default keystore directory.
 *
 * Placed inside a `keystores/default` subdirectory of the app data root
 * so that the registry JSON file at the root level is never deleted when
 * the default keystore is removed.
 */
export function resolveDefaultKeystorePath(): string {
  return path.join(resolveAppDataRoot(), 'keystores', 'default');
}

/**
 * Returns the path to the global keystores registry JSON file.
 *
 * Stored at the app data root, outside any individual keystore directory,
 * so it survives keystore deletion.
 */
export function resolveKeystoresRegistryPath(): string {
  return path.join(resolveAppDataRoot(), 'keystores.json');
}
