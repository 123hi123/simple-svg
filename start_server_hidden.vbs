Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentPath = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "cmd /c """ & currentPath & "\silent_server.bat""", 0, False
Set WshShell = Nothing