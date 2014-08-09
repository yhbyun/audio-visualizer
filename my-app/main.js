var app      = require('app')
  , Menu     = require('menu')
  , MenuItem = require('menu-item')
  , BW       = require('browser-window')
  , ipc      = require('ipc')
  , dialog   = require('dialog')
  , path     = require('path')
  , win;

app.on('ready', function() {
  win = new BW({
    width: 800,
    height: 600,
    frame: true,
    title: 'Audio Visualizer'
  });

  win.on('closed', function() {
    win = null;
  });

  win.loadUrl('file://' + __dirname + '/index.html');
  win.show();

  var menu_tmpl = [{
    label: 'Audio Visualizer',
    submenu: [{
      label: 'Preferences...',
      accelerator: 'Command+,',
      click: function() {
        dialog.showMessageBox({
          type: 'warning',
          title: 'Waring',
          buttons: ['OK'],
          message: 'not implemented yet'
        });
      }
    }, {
      type: 'separator'
    }, {
      label: 'Reload',
      accelerator: 'Command+R',
      click: function() {
        win.reload();
      }
    }, {
      label: 'Toggle DevTools',
      accelerator: 'Alt+Command+I',
      click: function() {
        win.toggleDevTools();
      }
    }, {
      type: 'separator'
    },
    {
      label: 'Quit',
      accelerator: 'Command+Q',
      click: function() { app.quit(); }
    }]
  }];
  menu = Menu.buildFromTemplate(menu_tmpl);
  Menu.setApplicationMenu(menu);

  /**
   * @param {browser-window} win, target window to send console log message two.
   * @param {String} msg, the message we are sending.
   */
  console.send = function(win, msg) {
    win.webContents.on('did-finish-load', function() {
      win.webContents.send('send-console', msg);
    });
  }

});

