#!/bin/bash

echo "=== MANUAL GITHUB UPLOAD SCRIPT ==="
echo "Este script te ayudará a subir el proyecto NEO a GitHub"
echo ""
echo "PASOS A SEGUIR:"
echo "1. Ve a https://github.com/settings/tokens"
echo "2. Genera un nuevo token con permisos 'repo' completos"
echo "3. Ejecuta este script con el nuevo token"
echo ""

read -p "Ingresa tu nuevo token de GitHub: " NEW_TOKEN

if [ -z "$NEW_TOKEN" ]; then
    echo "Error: No se proporcionó token"
    exit 1
fi

echo "=== CONFIGURANDO REPOSITORIO ==="
git remote set-url origin https://$NEW_TOKEN@github.com/Tycoonmethod/NEO.git

echo "=== SUBIENDO ARCHIVOS ==="
git push origin main --force

if [ $? -eq 0 ]; then
    echo "✅ ¡ÉXITO! El proyecto NEO se ha subido correctamente a GitHub"
    echo "Puedes verlo en: https://github.com/Tycoonmethod/NEO"
else
    echo "❌ Error al subir. Verifica que el token tenga permisos correctos."
fi
