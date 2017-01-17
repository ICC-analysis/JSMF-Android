
# Install

## On your computer

Dependencies are managed with the Node Package Manager (server side packages)
and Bower (client side packages).

```bash
$ git clone --recursive https://git.list.lu/jsmf/jsmf-interact.git
$ cd jsmf-interact/
$ npm install
$ sudo apt-get install libc6-i386 lib32stdc++6 zlib1g:i386
$ sudo apt-get install openjdk-8-jre openjdk-8-jdk
$ node app.js
Listening on port 3000
```

An instance is available
[here](http://jsmf-android-visualization.list.lu:3000/).


## Deploy on Heroku

You will have problems with dare (32 bit executable).

```bash
$ git clone https://git.list.lu/jsmf/jsmf-interact.git
$ cd jsmf-interact/
$ heroku create
$ heroku buildpacks:add --index 1 heroku/nodejs
$ heroku buildpacks:add --index 2 heroku/java
$ git push heroku master
$ heroku open
```

An instance is available
[here](https://jsmf-android-visualization.herokuapp.com/).
