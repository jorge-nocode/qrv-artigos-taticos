@echo off
REM ============================================================
REM QRV Artigos Taticos - Script de deploy (Windows)
REM Adiciona todas as alteracoes, comita e envia (push) para o
REM GitHub. A Vercel esta conectada ao repositorio e redesenha o
REM site automaticamente a cada push na branch main.
REM
REM Como usar: de dois cliques neste arquivo (ou rode "push.bat"
REM no terminal, dentro da pasta do projeto).
REM ============================================================

echo ============================================
echo   QRV Artigos Taticos - Deploy para o GitHub
echo ============================================
echo.

set /p MSG="Mensagem do commit (Enter para usar uma padrao): "
if "%MSG%"=="" set MSG=update: alteracoes no site QRV Artigos Taticos

git add -A
git commit -m "%MSG%"
if errorlevel 1 (
  echo.
  echo Nao havia nada novo para comitar, ou o commit falhou. Verifique acima.
) else (
  git push origin main
  echo.
  echo Deploy enviado! A Vercel deve atualizar o site em poucos minutos.
)

echo.
pause
