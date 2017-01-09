#! /bin/sh

# This script extracts information from an Android application (APK file).
# The output is a binary file with Inter-Component Communication
# (components, intents, intents filters, permissions, etc.).
#
#  $ ./apk2icc.sh ~/sample-APK/application.apk

ROOT_APPLICATION="bin/APK-analyzer"
ROOT_OUTPUT="uploads"

# Paths to dare and ic3 binaries
DARE_DIRECTORY=$ROOT_APPLICATION"/dare"
IC3_DIRECTORY=$ROOT_APPLICATION"/ic3"
ANDROID_JAR=`readlink -f $IC3_DIRECTORY/android.jar`

# APK file to analyze
APK_FILE=`readlink -f $1`
mv $APK_FILE $APK_FILE.apk
APK_FILE=$APK_FILE.apk
APK_NAME=`basename ${APK_FILE%.apk}`

ORIGINAL_NAME=$2

# Outputs
DARE_OUTPUT_DIRECTORY=$ROOT_OUTPUT"/dare/"$APK_NAME
IC3_OUTPUT_DIRECTORY=$ROOT_OUTPUT"/ic3/"$APK_NAME
mkdir -p $DARE_OUTPUT_DIRECTORY
mkdir -p $IC3_OUTPUT_DIRECTORY
DARE_OUTPUT_DIRECTORY=`readlink -f $DARE_OUTPUT_DIRECTORY`
IC3_OUTPUT_DIRECTORY=`readlink -f $IC3_OUTPUT_DIRECTORY`


# Generation of the retargeted APK
$DARE_DIRECTORY/dare -d $DARE_OUTPUT_DIRECTORY $APK_FILE

# Generation of the binary proto file
java -jar $IC3_DIRECTORY/ic3-0.2.0-full.jar \
    -apkormanifest $APK_FILE \
    -input $DARE_OUTPUT_DIRECTORY/retargeted/$APK_NAME \
    -cp $ANDROID_JAR \
    -protobuf $IC3_OUTPUT_DIRECTORY \
    -binary
#rm -Rf $DARE_OUTPUT_DIRECTORY sootOutput

mv $IC3_OUTPUT_DIRECTORY/*.dat $IC3_OUTPUT_DIRECTORY/result.dat
