
Analysis of Inter-Component Communication links (ICC) and source code of
Android applications (AST).

One of the main goal is to identify dark patterns through models computations on
piggybacked applications and non-piggybacked applications.

Different facets of Android applications are represented with
[JSMF](https://github.com/JS-MF) models.
These models are defined from a PEG.js grammar and instantiated with data that
are coming from decompiled Android applications.

This prototype started as a use case of [JSMF](https://github.com/JS-MF).

# Install

## Deploy on your server

```bash
$ git clone --recursive https://github.com/ICC-analysis/JSMF-Android.git
$ cd jsmf-interact/
$ ./install.sh
$ node app.js
Listening on port 3000
```

Do not do that on a production server.

If you want to access the application to the port 80:

```bash
$ sudo iptables -t nat -A PREROUTING -i [interface] -p tcp --dport 80 -j REDIRECT --to-port 3000
```

[demo instance](http://jsmf-android-visualization.list.lu)


## Deploy on Heroku

Heroku only provides 64 bits based architectures (cedar-14, heroku-16).
Consequently you will have problems with dare which is a 32 bit executable
(you will still be able to analyze ICC links).

```bash
$ git clone https://github.com/jssottet/protobuffToJSMF.git
$ cd jsmf-interact/
$ heroku create
$ heroku buildpacks:add --index 1 heroku/nodejs
$ heroku buildpacks:add --index 2 heroku/java
$ git push heroku master
$ heroku open
```

An instance is available
[here](https://jsmf-android-visualization.herokuapp.com).



# Concepts

![process](static/images/processM2.png)

The views are generated from the JSMF models of the applications.
More information [here](http://jsmf-android-visualization.list.lu/models).



# Contact

* [Jean-Sébastien Sottet](https://sites.google.com/site/jssottet/)
* [Cédric Bonhomme](https://www.cedricbonhomme.org)

