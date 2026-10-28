'use strict';
const { app, BrowserWindow, BrowserView, ipcMain, shell, session } = require('electron');
const path = require('node:path');
const { normalizeNavigation, isSafeExternalUrl } = require('./security.cjs');
let windowRef; let pageView;
function createWindow() {
  windowRef = new BrowserWindow({ width: 1440, height: 900, minWidth: 900, minHeight: 600, title: 'Web4browser', backgroundColor: '#09090b', webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, allowRunningInsecureContent: false } });
  pageView = new BrowserView({ webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, allowRunningInsecureContent: false, safeDialogs: true } });
  windowRef.setBrowserView(pageView);
  const resizePage = () => { if (!windowRef || !pageView) return; const [width, height] = windowRef.getContentSize(); pageView.setBounds({ x: 0, y: 88, width, height: Math.max(0, height - 88) }); pageView.setAutoResize({ width: true, height: true }); };
  windowRef.on('resize', resizePage); resizePage();
  pageView.webContents.setWindowOpenHandler(({ url }) => { if (isSafeExternalUrl(url)) shell.openExternal(url).catch(() => {}); return { action: 'deny' }; });
  pageView.webContents.on('will-navigate', (event, url) => { try { if (!['http:', 'https:'].includes(new URL(url).protocol)) event.preventDefault(); } catch { event.preventDefault(); } });
  pageView.webContents.on('did-navigate', (_event, url) => windowRef?.webContents.send('browser:navigated', { url, title: pageView.webContents.getTitle() }));
  pageView.webContents.on('page-title-updated', (_event, title) => windowRef?.webContents.send('browser:title', title));
  windowRef.loadFile(path.join(__dirname, 'index.html')); pageView.webContents.loadURL('https://duckduckgo.com/');
  windowRef.on('closed', () => { windowRef = undefined; pageView = undefined; });
}
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  ipcMain.handle('browser:navigate', async (_event, address) => { if (!pageView) throw new Error('Browser view is not ready.'); const url = normalizeNavigation(address); await pageView.webContents.loadURL(url); return { url }; });
  ipcMain.handle('browser:back', () => { if (pageView?.webContents.canGoBack()) pageView.webContents.goBack(); });
  ipcMain.handle('browser:forward', () => { if (pageView?.webContents.canGoForward()) pageView.webContents.goForward(); });
  ipcMain.handle('browser:reload', () => pageView?.webContents.reload()); ipcMain.handle('browser:stop', () => pageView?.webContents.stop());
  ipcMain.handle('browser:bookmark-current', () => pageView ? { url: pageView.webContents.getURL(), title: pageView.webContents.getTitle() } : null);
  createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('web-contents-created', (_event, contents) => contents.on('will-attach-webview', event => event.preventDefault()));
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
