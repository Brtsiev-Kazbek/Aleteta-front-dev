@echo off
rem ===================================================================
rem  Настройка распознавания одной командой.
rem
rem  Делает всё, что нельзя сделать из браузера:
rem    1. выкладывает исполнителя (Edge Function ai-worker);
rem    2. задаёт ему секреты, включая ключ к модели;
rem    3. кладёт служебный ключ в vault — им расписание будит исполнителя;
rem    4. проверяет, что исполнитель отвечает.
rem
rem  Чего он НЕ делает: переменные Netlify. Их задают в панели Netlify —
rem  LLM_BASE_URL, LLM_MODEL_VISION и SUPABASE_SERVICE_ROLE_KEY. В конце
rem  скрипт напомнит.
rem
rem  Запускать из папки проекта двойным щелчком или командой:
rem    scripts\setup-ocr.bat
rem ===================================================================

setlocal enabledelayedexpansion
chcp 65001 >nul
title Алетейя — настройка распознавания

rem Работаем из корня проекта, где лежит папка supabase.
cd /d "%~dp0.."

echo.
echo ================================================================
echo   АЛЕТЕЙЯ. Настройка распознавания
echo ================================================================
echo.

rem --- Node ---------------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo [!] Не найден Node.js. Поставьте его с nodejs.org и запустите снова.
  goto :fail
)

where curl >nul 2>nul
if errorlevel 1 (
  echo [!] Не найден curl. Он есть в Windows 10 версии 1803 и новее —
  echo     обновите систему либо выполните шаги вручную: docs\START-OCR.md
  goto :fail
)

rem --- Адрес проекта из .env ----------------------------------------
rem Знак ^ внутри for /f съедается командной оболочкой, поэтому якоря начала
rem строки в образце нет: строка и так встречается только в одном месте.
for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-Content .env.local,.env -ErrorAction SilentlyContinue ^| Select-String 'NEXT_PUBLIC_SUPABASE_URL=' ^| Select-Object -First 1) -replace '.*NEXT_PUBLIC_SUPABASE_URL=','' -replace '\s',''"') do set "SUPA_URL=%%i"

if "%SUPA_URL%"=="" (
  echo [!] В .env нет NEXT_PUBLIC_SUPABASE_URL — не знаю, какой это проект.
  goto :fail
)

for /f "delims=" %%i in ('powershell -NoProfile -Command "'%SUPA_URL%' -replace 'https://','' -replace '\.supabase\.co.*',''"') do set "SUPA_REF=%%i"

echo Проект: %SUPA_REF%
echo.

rem --- Ключи --------------------------------------------------------
echo ----------------------------------------------------------------
echo  Ключ маршрутизатора RouterAI (обычный API-ключ, НЕ мастер-ключ).
echo  Ввод не отображается — вставьте правым щелчком и нажмите Enter.
echo ----------------------------------------------------------------
for /f "delims=" %%i in ('powershell -NoProfile -Command "$s=Read-Host -AsSecureString; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))"') do set "LLM_KEY=%%i"

if "%LLM_KEY%"=="" (
  echo [!] Ключ пустой.
  goto :fail
)

echo.
echo ----------------------------------------------------------------
echo  Служебный ключ Supabase: Settings - API - service_role.
echo  Начинается с eyJ... Ввод не отображается.
echo ----------------------------------------------------------------
for /f "delims=" %%i in ('powershell -NoProfile -Command "$s=Read-Host -AsSecureString; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))"') do set "SRV_KEY=%%i"

if "%SRV_KEY%"=="" (
  echo [!] Ключ пустой.
  goto :fail
)

rem --- Модель -------------------------------------------------------
set "VISION_MODEL=qwen/qwen3-vl-32b-instruct"
echo.
set /p "ANSWER=Модель для чтения картинок [%VISION_MODEL%]: "
if not "%ANSWER%"=="" set "VISION_MODEL=%ANSWER%"

echo.
echo ================================================================
echo   ШАГ 1 из 4. Вход в Supabase
echo ================================================================
echo Откроется браузер. Подтвердите вход и вернитесь сюда.
echo Первый запуск скачивает Supabase CLI — это займёт минуту.
echo.

call npx --yes supabase@latest projects list >nul 2>nul
if errorlevel 1 (
  call npx --yes supabase@latest login
  if errorlevel 1 (
    echo [!] Войти не удалось.
    goto :fail
  )
) else (
  echo Уже выполнен вход — пропускаю.
)

echo.
echo ================================================================
echo   ШАГ 2 из 4. Выкладка исполнителя
echo ================================================================
echo Первый раз это занимает пару минут: скачивается движок сборки.
echo.

call npx --yes supabase@latest functions deploy ai-worker --project-ref %SUPA_REF%
if errorlevel 1 (
  echo.
  echo [!] Выложить не удалось. Обычные причины:
  echo     - нет прав на проект у вошедшей учётной записи;
  echo     - старая версия CLI требует Docker: попробуйте добавить --use-api.
  goto :fail
)

echo.
echo ================================================================
echo   ШАГ 3 из 4. Секреты исполнителя
echo ================================================================

rem Пишем во временный файл и сразу удаляем: так ключ не попадает
rem ни в историю команд, ни в список процессов.
set "TMP_ENV=%TEMP%\aleteya-worker-%RANDOM%.env"

>"%TMP_ENV%" echo LLM_API_KEY=%LLM_KEY%
>>"%TMP_ENV%" echo LLM_BASE_URL=https://routerai.ru/api/v1
>>"%TMP_ENV%" echo LLM_MODEL_VISION=%VISION_MODEL%
>>"%TMP_ENV%" echo LLM_MODE=live

call npx --yes supabase@latest secrets set --project-ref %SUPA_REF% --env-file "%TMP_ENV%"
set "SECRETS_RESULT=%errorlevel%"

del /q "%TMP_ENV%" >nul 2>nul

if not "%SECRETS_RESULT%"=="0" (
  echo [!] Задать секреты не удалось.
  goto :fail
)

echo.
echo ================================================================
echo   ШАГ 4 из 4. Ключ для расписания
echo ================================================================
echo Расписание раз в минуту будит исполнителя. Кладу ключ в хранилище.
echo.

set "VAULT_OUT=%TEMP%\aleteya-vault-%RANDOM%.json"

curl -s -o "%VAULT_OUT%" -w "HTTP %%{http_code}\n" ^
  -X POST "%SUPA_URL%/rest/v1/rpc/configure_worker_key" ^
  -H "apikey: %SRV_KEY%" ^
  -H "Authorization: Bearer %SRV_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"new_key\":\"%SRV_KEY%\"}"

type "%VAULT_OUT%"
echo.
del /q "%VAULT_OUT%" >nul 2>nul

echo.
echo ================================================================
echo   ПРОВЕРКА. Отвечает ли исполнитель
echo ================================================================

curl -s -o nul -w "Исполнитель ответил: HTTP %%{http_code}\n" ^
  -X POST "%SUPA_URL%/functions/v1/ai-worker" ^
  -H "Authorization: Bearer %SRV_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"source\":\"setup\"}"

echo.
echo ================================================================
echo   ГОТОВО
echo ================================================================
echo.
echo Осталось одно, и это делается в панели Netlify —
echo Site configuration - Environment variables:
echo.
echo   LLM_BASE_URL              https://routerai.ru/api/v1
echo   LLM_MODEL_VISION          %VISION_MODEL%
echo   SUPABASE_SERVICE_ROLE_KEY служебный ключ, тот же что вводили
echo.
echo Ключ к модели туда НЕ кладите: приложение не должно уметь
echo позвать модель напрямую. Он уже там, где нужно — у исполнителя.
echo.
echo После правки переменных: Deploys - Trigger deploy -
echo Clear cache and deploy site. Затем загрузите скан на странице
echo «Распознавание» — строка должна пойти со «Страница 1 из N».
echo.
goto :done

:fail
echo.
echo Настройка не завершена. Подробный разбор — docs\START-OCR.md
echo.
pause
endlocal
exit /b 1

:done
pause
endlocal
exit /b 0
