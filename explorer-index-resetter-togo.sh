#!/bin/bash
fname="/home/node-1/explorer/tmp/index.pid"
if [[ -f "$fname" ]];
then
        pid=$(</home/node-1/explorer/tmp/index.pid)
        echo $pid
        ps -p $pid > /dev/null
        r=$?
        echo $r
        if [ $r -eq 0 ]; then
                exit 1
        else
                rm $fname
        fi
fi
