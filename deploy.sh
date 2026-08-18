#!/bin/bash
# ============================================================
# QRV Artigos Táticos - Script de deploy (macOS/Linux/Git Bash)
# Adiciona todas as alterações, comita e envia (push) para o
# GitHub. A Vercel está conectada ao repositório e redesenha o
# site automaticamente a cada push na branch main.
#
# Como usar: dentro da pasta do projeto, rode:
#   chmod +x deploy.sh   (só na primeira vez)
#   ./deploy.sh
# ============================================================
set -e

echo "============================================"
echo "  QRV Artigos Táticos - Deploy para o GitHub"
echo "============================================"
echo ""

read -p "Mensagem do commit (Enter para usar uma padrão): " MSG
MSG=${MSG:-"update: alterações no site QRV Artigos Táticos"}

git add -A
if git diff --cached --quiet; then
  echo "Nada novo para comitar."
else
  git commit -m "$MSG"
  git push origin main
  echo ""
  echo "Deploy enviado! A Vercel deve atualizar o site em poucos minutos."
fi
