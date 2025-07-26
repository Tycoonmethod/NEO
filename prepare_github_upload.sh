#!/bin/bash

echo "🚀 Preparando archivos para subida a GitHub..."

# Crear directorio temporal
mkdir -p /tmp/neo_github_upload
cd /home/ubuntu/neo_app

# Copiar todos los archivos necesarios excluyendo los del .gitignore
rsync -av --exclude-from=.gitignore . /tmp/neo_github_upload/

# Ir al directorio temporal
cd /tmp/neo_github_upload

# Crear archivo con lista de archivos
find . -type f | sort > file_list.txt

echo "📁 Archivos preparados en: /tmp/neo_github_upload"
echo "📊 Total de archivos: $(wc -l < file_list.txt)"
echo ""
echo "📋 Estructura del proyecto:"
tree -I 'node_modules|.next|.build' -L 3

echo ""
echo "✅ Preparación completada!"
echo "📂 Los archivos están listos en: /tmp/neo_github_upload"
echo ""
echo "🔧 Para resolver el problema de GitHub MCP:"
echo "1. Ve a: https://apps.abacus.ai/chatllm/admin/mcp"
echo "2. Configura/actualiza las credenciales de GitHub"
echo "3. Asegúrate de que el token tenga permisos de 'repo'"
