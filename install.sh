#! /usr/bin/env bash


sudo apt-get install nodejs-legacy npm

npm install


# 32 bits libraries for dare
sudo apt-get install libc6-i386 lib32stdc++6 zlib1g:i386
# Java runtime is needed for IC3 and dare
sudo apt-get install openjdk-8-jre openjdk-8-jdk
