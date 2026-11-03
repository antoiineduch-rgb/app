const { app, BrowserWindow, Menu, dialog, protocol, session } = require('electron');
const { join } = require('node:path');
const { appResponse, isAppURL, ORIGIN } = require('./assets.cjs');

app.setName('Clock Factory');
app.setAppUserModelId('com.clockfactory.studio');
protocol.registerSchemesAsPrivileged([
  { scheme: 'clock', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

const root = join(__dirname, '..');
let mainWindow;

function createWindow() {
  const window = new BrowserWindow({
    title: 'Clock Factory',
    width: 1380,
    height: 940,
    minWidth: 720,
    minHeight: 620,
    backgroundColor: '#faf9f6',
    icon: join(__dirname, 'icon.png'),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });
  mainWindow = window;
  window.once('ready-to-show', () => window.show());
  window.on('closed', () => { if (mainWindow === window) mainWindow = null; });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => { if (!isAppURL(url)) event.preventDefault(); });
  window.webContents.on('will-redirect', (event, url) => { if (!isAppURL(url)) event.preventDefault(); });
  window.loadURL(`${ORIGIN}/index.html`).catch(error => {
    dialog.showErrorBox('Clock Factory could not open', error.message);
    app.quit();
  });
  return window;
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
  app.whenReady().then(() => {
    protocol.handle('clock', request => appResponse(request, root));
    const appSession = session.defaultSession;
    appSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    appSession.setPermissionCheckHandler(() => false);
    // The editor has no remote dependencies. Keep this desktop window offline.
    appSession.webRequest.onBeforeRequest((details, callback) => {
      const allowed = isAppURL(details.url) || details.url.startsWith('blob:clock://studio/') || details.url.startsWith('data:');
      callback({ cancel: !allowed });
    });
    appSession.on('will-download', (event, item) => {
      const extension=item.getFilename().match(/\.(stl|3mf)$/i)?.[1].toLowerCase();
      if (!item.getURL().startsWith('blob:clock://studio/') || !extension) {
        event.preventDefault();
        return;
      }
      item.setSaveDialogOptions({
        title: 'Save your clock face',
        defaultPath: join(app.getPath('downloads'), item.getFilename()),
        filters: [{ name: extension==='3mf'?'3MF clock model':'STL clock mesh', extensions: [extension] }],
      });
    });
    app.setAboutPanelOptions({
      applicationName: 'Clock Factory',
      applicationVersion: app.getVersion(),
      copyright: 'Clock Factory · Design it. Print it. Make time your own.',
    });
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { label: 'File', submenu: [{ role: 'close' }, { type: 'separator' }, { role: 'quit' }] },
      { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
      { label: 'View', submenu: [{ role: 'reload' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
      { label: 'Help', submenu: [{ label: 'About Clock Factory', click: () => app.showAboutPanel() }] },
    ]));
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  }).catch(error => {
    dialog.showErrorBox('Clock Factory could not start', error.message);
    app.quit();
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
