'use strict';
const { app, BrowserWindow, BrowserView, ipcMain, shell, session } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { normalizeNavigation, isSafeExternalUrl } = require('./security.cjs');
const { assertTrustedRenderer } = require('./ipc-security.cjs');

let windowRef;
let pageView;

const chromeFileUrl = pathToFileURL(path.join(__dirname, 'index.html')).href;

function assertChromeRenderer(event) {
  if (!windowRef || windowRef.isDestroyed()) {
    throw new Error('Browser chrome is not available.');
  }
  assertTrustedRenderer(event, windowRef.webContents, chromeFileUrl);
}

function createWindow() {
  windowRef = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Web4browser',
    backgroundColor: '#09090b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  pageView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      safeDialogs: true,
    },
  });

  windowRef.setBrowserView(pageView);

  const resizePage = () => {
    if (!windowRef || windowRef.isDestroyed() || !pageView) return;
    const [width, height] = windowRef.getContentSize();
    pageView.setBounds({
      x: 0,
      y: 88,
      width,
      height: Math.max(0, height - 88),
    });
    pageView.setAutoResize({ width: true, height: true });
  };

  windowRef.on('resize', resizePage);
  resizePage();

  pageView.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  pageView.webContents.on('will-navigate', (event, url) => {
    try {
      if (!['http:', 'https:'].includes(new URL(url).protocol)) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  pageView.webContents.on('did-navigate', (_event, url) => {
    windowRef?.webContents.send('browser:navigated', {
      url,
      title: pageView?.webContents.getTitle() || '',
    });
  });

  pageView.webContents.on('page-title-updated', (_event, title) => {
    windowRef?.webContents.send('browser:title', title);
  });

  windowRef.loadFile(path.join(__dirname, 'index.html'));
  pageView.webContents.loadURL('https://duckduckgo.com/');

  windowRef.on('closed', () => {
    windowRef = undefined;
    pageView = undefined;
  });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false),
  );

  ipcMain.handle('browser:navigate', async (event, address) => {
    assertChromeRenderer(event);
    if (!pageView) throw new Error('Browser view is not ready.');
    const url = normalizeNavigation(address);
    await pageView.webContents.loadURL(url);
    return { url };
  });

  ipcMain.handle('browser:back', (event) => {
    assertChromeRenderer(event);
    if (pageView?.webContents.canGoBack()) pageView.webContents.goBack();
  });

  ipcMain.handle('browser:forward', (event) => {
    assertChromeRenderer(event);
    if (pageView?.webContents.canGoForward()) pageView.webContents.goForward();
  });

  ipcMain.handle('browser:reload', (event) => {
    assertChromeRenderer(event);
    return pageView?.webContents.reload();
  });

  ipcMain.handle('browser:stop', (event) => {
    assertChromeRenderer(event);
    return pageView?.webContents.stop();
  });

  ipcMain.handle('browser:bookmark-current', (event) => {
    assertChromeRenderer(event);
    return pageView
      ? {
          url: pageView.webContents.getURL(),
          title: pageView.webContents.getTitle(),
        }
      : null;
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event) => event.preventDefault());
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
