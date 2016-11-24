
# Install

## On your computer

Dependencies are managed with the Node Package Manager (server side packages)
and Bower (client side packages).

```bash
$ npm install
$ bower install
$ node app.js
Listening on port 3000
```

Bower will install *material-design-lite*, *d3* (v3.15), *lodash*, *node-uuid*
and *jsmf-browser*.


## Deploy on Heroku

```bash
$ git clone https://git.list.lu/jsmf/jsmf-interact.git
$ cd jsmf-interact/
$ heroku create
$ git push heroku master
$ heroku open
```

An instance is available
[here](https://jsmf-android-visualization.herokuapp.com/).
