# Audio Visializer

I tried but it failed.


## How to Try

```
$ git clone https://github.com/yhbyun/alarm-clock.git

$ cd alarm-clock/my-app
$ mkdir node_modules && cd $_

$ git clone https://github.com/yhbyun/node-lame --branch hotfixes/branch lame
$ cd lame && npm install
$ HOME=~/.atom-shell-gyp node-gyp rebuild --target=0.11.13 --arch=x64 --dist-url=https://gh-contractor-zcbenz.s3.amazonaws.com/atom-shell/dist

$ cd ..
$ git clone https://github.com/yhbyun/node-speaker --branch hotfixes/branch speaker
$ cd speaker && npm install
$ HOME=~/.atom-shell-gyp node-gyp rebuild --target=0.11.13 --arch=x64 --dist-url=https://gh-contractor-zcbenz.s3.amazonaws.com/atom-shell/dist

$ cd ../..
$ npm install

$ cd ..
$ bower install

$ cd ..
$ npm install
$ grunt run
```
