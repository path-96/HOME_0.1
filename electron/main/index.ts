import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { exec, spawn } from 'child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs/promises'
import { update } from './update'
import { setupAuth } from './auth'
import dotenv from 'dotenv'
import iconv from 'iconv-lite';

dotenv.config()

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    frame: false, // Disable native frame
    autoHideMenuBar: true,
    width: 1500,
    height: 750,
    x: 15,
    y: 100,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true, // Enable webview tag
    },
  })

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Auto update
  update(win)

  // Setup Auth Handlers
  setupAuth(win);
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// Window Control IPC Handlers
ipcMain.handle('window-minimize', () => {
  win?.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.handle('window-close', () => {
  win?.close();
});

ipcMain.handle('resize-window', (_, widthDelta) => {
  if (win && !win.isMaximized()) {
    const [currentWidth, currentHeight] = win.getSize();
    win.setSize(currentWidth + widthDelta, currentHeight, true);
  }
});

ipcMain.handle('is-maximized', () => {
  return win?.isMaximized() ?? false;
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

ipcMain.handle('get-file-icon', async (_, filePath) => {
  try {
    const icon = await app.getFileIcon(filePath, { size: 'large' });
    return icon.toDataURL();
  } catch (e) {
    console.error('Failed to get icon', e);
    return null;
  }
});

ipcMain.handle('open-path', async (_, filePath) => {
  await shell.openPath(filePath);
});

ipcMain.handle('open-external', async (_, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('save-markdown', async (_, { content, defaultPath }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath,
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });
  if (!canceled && filePath) {
    const fs = await import('node:fs/promises');
    await fs.writeFile(filePath, content);
    return true;
  }
  return false;
});

ipcMain.handle('select-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile']
  });
  if (!canceled && filePaths.length > 0) {
    return filePaths[0];
  }
  return null;
});

ipcMain.handle('select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (!canceled && filePaths.length > 0) {
    return filePaths[0];
  }
  return null;
});

ipcMain.handle('get-network-interfaces', async () => {
  return new Promise((resolve) => {
    // Use PowerShell to get the exact interface names as recognized by the OS
    // We use 'binary' encoding to get raw bytes, then decode with iconv-lite
    exec('powershell -Command "Get-NetAdapter | Select-Object -ExpandProperty Name"', { encoding: 'binary' }, (error, stdout, stderr) => {
      if (error) {
        console.error('Failed to list interfaces via PowerShell:', error);
        // Fallback to os.networkInterfaces if PowerShell fails
        const interfaces = os.networkInterfaces();
        const names = Object.keys(interfaces).filter(name =>
          !name.toLowerCase().includes('loopback') &&
          !name.toLowerCase().includes('pseudo')
        );
        resolve(names);
        return;
      }

      // Decode output from Shift-JIS (common on Japanese Windows) to UTF-8
      const decodedStdout = iconv.decode(Buffer.from(stdout, 'binary'), 'cp932'); // cp932 is Shift-JIS

      const names = decodedStdout.split('\r\n').map(n => n.trim()).filter(n => n.length > 0);
      console.log('Detected Network Interfaces (PowerShell):', names);
      resolve(names);
    });
  });
});

ipcMain.handle('set-network-settings', async (_, { ip, gateway, interfaceName }) => {
  return new Promise(async (resolve) => {
    const iface = (interfaceName || "Ethernet").trim();
    console.log(`Attempting to set network settings for interface: "${iface}"`);
    console.log(`IP: ${ip}, Gateway: ${gateway}`);

    // Check for admin privileges first
    exec('net session', async (adminErr) => {
      if (adminErr) {
        console.error('Not running as administrator');
        resolve({ success: false, error: 'Application is not running as Administrator. Please right-click and "Run as administrator".' });
        return;
      }

      // Use a temporary batch file to handle character encoding (Shift-JIS) for the interface name.
      // Node.js spawn/exec can have trouble passing non-ASCII arguments to legacy Windows tools like netsh.
      const tempPath = path.join(os.tmpdir(), `set_ip_${Date.now()}.bat`);
      // Command: netsh interface ipv4 set address name="Interface Name" static IP MASK GATEWAY
      // We add 'chcp 932' to ensure the batch file runs with the correct code page, though saving it as CP932 usually suffices.
      const command = `@echo off\r\nnetsh interface ipv4 set address name="${iface}" static ${ip} 255.255.255.0 ${gateway}`;

      try {
        console.log(`Writing batch file to: ${tempPath}`);
        // Encode the file content as CP932 (Shift-JIS)
        const encodedCommand = iconv.encode(command, 'cp932');
        await fs.writeFile(tempPath, encodedCommand);

        // Execute the batch file
        exec(`"${tempPath}"`, { encoding: 'binary' }, async (error, stdout, stderr) => {
          // Clean up temp file
          try { await fs.unlink(tempPath); } catch (e) { console.error('Failed to delete temp file:', e); }

          // Decode output
          const stdoutData = iconv.decode(Buffer.from(stdout, 'binary'), 'cp932');
          const stderrData = iconv.decode(Buffer.from(stderr, 'binary'), 'cp932');

          if (error) {
            console.error(`Batch file execution failed: ${error}`);
            console.error(`stderr: ${stderrData}`);
            console.error(`stdout: ${stdoutData}`);

            resolve({
              success: false,
              error: `Failed to set IP via batch file.\nError: ${stderrData}\nOutput: ${stdoutData}`
            });
            return;
          }
          console.log('Network settings applied successfully via batch file.');
          resolve({ success: true });
        });
      } catch (e) {
        console.error('Unexpected error in set-network-settings:', e);
        resolve({ success: false, error: `Unexpected error: ${e instanceof Error ? e.message : String(e)}` });
      }
    });
  });
});
