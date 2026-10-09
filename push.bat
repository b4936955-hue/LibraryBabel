@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "REMOTE_URL=https://github.com/b4936955-hue/LibraryBabel"
set "BRANCH="
set "REMOTE_HEAD="
set "CURRENT_REMOTE="
set "CURRENT_BRANCH="
set "RESULT=0"
set "GIT_NAME="
set "GIT_EMAIL="

echo ============================================================
echo GitHub push helper
echo Folder: %CD%
echo Target: %REMOTE_URL%
echo ============================================================

where git >nul 2>&1
if errorlevel 1 (
  echo ERROR: Git was not found.
  echo Install Git for Windows from https://git-scm.com/download/win,
  echo then run push.bat again.
  goto :failed
)

rem Initialize Git only when this folder is not already a repository.
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo This folder is not a Git repository. Initializing it now...
  git init
  if errorlevel 1 goto :git_error
)

rem Ask for a local commit name/email only when Git cannot find them.
git config user.name >nul 2>&1
if errorlevel 1 (
  call :configure_name
  if errorlevel 1 goto :failed
)
git config user.email >nul 2>&1
if errorlevel 1 (
  call :configure_email
  if errorlevel 1 goto :failed
)

rem Add the requested GitHub repository, or verify the existing origin.
for /f "delims=" %%U in ('git remote get-url origin 2^>nul') do set "CURRENT_REMOTE=%%U"
if not defined CURRENT_REMOTE (
  git remote add origin "%REMOTE_URL%"
  if errorlevel 1 goto :git_error
) else if /I not "%CURRENT_REMOTE%"=="%REMOTE_URL%" (
  echo Existing origin: %CURRENT_REMOTE%
  echo Requested origin: %REMOTE_URL%
  choice /C YN /M "Change origin to the requested GitHub repository"
  if errorlevel 2 goto :cancelled
  git remote set-url origin "%REMOTE_URL%"
  if errorlevel 1 goto :git_error
)

rem Fast path: use the current local branch and push directly.
for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "BRANCH=%%B"
if not defined BRANCH set "BRANCH=master"
rem Avoid accidentally publishing a common local secrets file.
if exist ".env" (
  git check-ignore -q ".env"
  if errorlevel 1 (
    echo ERROR: .env exists and is not ignored by Git.
    echo Add .env to .gitignore before pushing so private settings are not uploaded.
    goto :failed
  )
)

rem Big pushes can fail on Windows with "RPC failed; HTTP 400", so raise Git's upload buffer.
git config http.postBuffer 524288000

rem Keep node_modules out of the repo. It is hundreds of files the site never uses.
findstr /x /c:"node_modules/" .gitignore >nul 2>&1
if errorlevel 1 echo node_modules/>> .gitignore
git ls-files --error-unmatch node_modules >nul 2>&1
if not errorlevel 1 (
  echo Removing node_modules from Git so the push is small...
  git rm -r -q --cached node_modules
)

echo.
echo Files Git sees in this folder:
git status --short
if errorlevel 1 goto :git_error
echo.
echo Staging, committing, and pushing without asking...

git add -A
if errorlevel 1 goto :git_error

git diff --cached --quiet
if errorlevel 2 goto :git_error
if errorlevel 1 (
  git commit -m "Update site files"
  if errorlevel 1 goto :git_error
) else (
  echo No new file changes to commit.
)

rem Push directly for speed; if Git rejects it, resolve the message it prints and retry.
git push -u origin "%BRANCH%"
if not errorlevel 1 goto :pushed

echo.
echo GitHub has commits this folder does not. Merging them in, then pushing again...
git pull --rebase origin "%BRANCH%"
if errorlevel 1 goto :conflict
git push -u origin "%BRANCH%"
if errorlevel 1 goto :pushfail
goto :pushed

:conflict
git rebase --abort >nul 2>&1
echo.
echo The GitHub version and this folder clash, so they could not be merged automatically.
choice /C YN /M "Overwrite what is on GitHub with the files in this folder"
if errorlevel 2 goto :cancelled
git push --force-with-lease -u origin "%BRANCH%"
if errorlevel 1 goto :pushfail
goto :pushed

:pushfail
echo.
echo Push failed. Git may need you to sign in to GitHub in the browser.
echo Your local files are still here. Resolve any Git message above, then run push.bat again.
goto :failed

:pushed

echo.
echo Checking that GitHub really received everything...
git fetch origin "%BRANCH%" >nul 2>&1
set "MISSING="
for %%F in (index.html babel-loader.html app/manifest.json app/shell.html app/style.css app/js/core.js app/js/settings.js app/js/random.js app/js/home.js app/js/room.js app/js/library.js app/js/pictures.js app/js/sound.js app/js/synth.js app/js/music.js app/js/search.js app/js/main.js data/words.txt) do call :checkfile "%%F"
if defined MISSING (
  echo.
  echo Some files are NOT on GitHub. The app folder must sit right next to push.bat.
  echo Move it there if it is somewhere else, then run push.bat again.
  goto :failed
)

echo.
echo Push completed successfully to %BRANCH%. Every app file is on GitHub.
goto :done

:git_error
echo.
echo ERROR: A Git command failed. Read the message above for details.
goto :failed

:cancelled
echo Cancelled. Nothing was pushed.
goto :done

:failed
set "RESULT=1"
echo.
echo Push helper stopped. Your local files were not deleted.

:done
echo.
pause
endlocal & exit /b %RESULT%

:configure_name
set /p "GIT_NAME=Name to show on your Git commits: "
if not defined GIT_NAME exit /b 1
git config user.name "%GIT_NAME%"
exit /b %errorlevel%

:configure_email
set /p "GIT_EMAIL=Email to show on your Git commits: "
if not defined GIT_EMAIL exit /b 1
git config user.email "%GIT_EMAIL%"
exit /b %errorlevel%

:checkfile
git cat-file -e "origin/%BRANCH%:%~1" >nul 2>&1
if errorlevel 1 (
  echo   MISSING on GitHub: %~1
  set "MISSING=1"
)
exit /b 0