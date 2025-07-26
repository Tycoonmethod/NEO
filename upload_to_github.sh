#!/bin/bash

echo "🚀 Script para subir proyecto NEO a GitHub"
echo "=========================================="

# Cambiar al directorio del proyecto
cd ~/Desktop/NEO/

# Verificar que estamos en el directorio correcto
if [ ! -f "README.md" ]; then
    echo "❌ Error: No se encontró README.md. Asegúrate de estar en el directorio correcto."
    exit 1
fi

echo "📁 Directorio actual: $(pwd)"

# Configurar el repositorio remoto (si no existe)
echo "🔗 Configurando repositorio remoto..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/Tycoonmethod/NEO.git

# Verificar el estado del repositorio
echo "📊 Estado actual del repositorio:"
git status

# Agregar todos los archivos
echo "➕ Agregando archivos al staging..."
git add .

# Crear commit
echo "💾 Creando commit..."
COMMIT_MESSAGE="Subida inicial del proyecto NEO - $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MESSAGE"

# Configurar la rama principal
echo "🌿 Configurando rama principal..."
git branch -M main

# Hacer push al repositorio
echo "⬆️ Subiendo código a GitHub..."
echo "NOTA: Se te pedirá tu token de acceso personal de GitHub"
git push -u origin main

echo ""
echo "✅ ¡Proceso completado!"
echo "🌐 Tu repositorio debería estar disponible en: https://github.com/Tycoonmethod/NEO"
