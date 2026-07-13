const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

let mainWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    backgroundColor: '#0b0e14',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    title: "HTMLSlides - Presenter Dashboard",
    autoHideMenuBar: true,
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    // In local development, load the running Vite server
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // In production build, load the compiled static files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Electron custom handler to manage new window popups gracefully
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Intercept and handle the Audience View window route
    if (url.includes('view=audience') || url.includes('?view=audience')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 1280,
          height: 720,
          title: "HTMLSlides - Audience Display",
          autoHideMenuBar: true,
          backgroundColor: '#0b0e14',
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          }
        }
      };
    }
    
    // For standard external links, open in the default browser instead of the app frame
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
