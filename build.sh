#!/bin/bash

echo "Using Docker as our container runtime"
RUNTIME=docker

$RUNTIME compose build
$RUNTIME compose up