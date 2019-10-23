@ECHO OFF
@cls
@node tools/r.js -o tools/build.js
@rmdir "docs\app" /s /q
@rmdir "docs\lib" /s /q
@del  "docs\build.txt"
@ping 127.0.0.1 -n 10 >> nul
@rmdir "docs\assets" /s /q
@ping 127.0.0.1 -n 10 >> nul
@rmdir "docs\assets" /s /q
@ECHO --------- build done ----------
pause