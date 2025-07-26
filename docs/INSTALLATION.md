
# Guía de Instalación Detallada - NEO

Esta guía proporciona instrucciones paso a paso para instalar y configurar NEO en diferentes entornos.

## Instalación Local (Desarrollo)

### Requisitos del Sistema
- Node.js 18.0 o superior
- npm 9.0 o superior (o yarn 1.22+)
- Git
- 4GB RAM mínimo
- 2GB espacio en disco

### Pasos de Instalación

1. **Preparar el entorno**
```bash
# Verificar versiones
node --version  # debe ser 18+
npm --version   # debe ser 9+
```

2. **Navegar al proyecto**
```bash
cd ~/Desktop/NEO
```

3. **Instalar dependencias**
```bash
# Limpiar caché si es necesario
npm cache clean --force

# Instalar dependencias
npm install

# Si hay problemas, usar:
npm install --legacy-peer-deps
```

4. **Configurar variables de entorno**
```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar configuraciones
nano .env.local
```

5. **Configurar base de datos**
```bash
# Generar cliente Prisma
npx prisma generate

# Crear base de datos y tablas
npx prisma db push

# Verificar con Prisma Studio (opcional)
npx prisma studio
```

6. **Ejecutar en desarrollo**
```bash
npm run dev
```

## Instalación en Producción

### Usando PM2 (Recomendado)

1. **Instalar PM2**
```bash
npm install -g pm2
```

2. **Construir la aplicación**
```bash
npm run build
```

3. **Configurar PM2**
```bash
# Crear archivo ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'neo-app',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/neo',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF
```

4. **Iniciar con PM2**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Usando Docker

1. **Crear Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

2. **Construir y ejecutar**
```bash
docker build -t neo-app .
docker run -p 3000:3000 neo-app
```

## Configuración de Base de Datos

### SQLite (Desarrollo)
```env
DATABASE_URL="file:./dev.db"
```

### PostgreSQL (Producción)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/neo_db"
```

### MySQL (Alternativa)
```env
DATABASE_URL="mysql://username:password@localhost:3306/neo_db"
```

## Configuración de Autenticación

### NextAuth.js Setup
```env
NEXTAUTH_SECRET="tu-clave-secreta-muy-segura"
NEXTAUTH_URL="http://localhost:3000"
```

### Proveedores OAuth (Opcional)
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

## Solución de Problemas Comunes

### Error: "Module not found"
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: "Prisma Client not generated"
```bash
npx prisma generate
```

### Error: "Port 3000 already in use"
```bash
# Cambiar puerto en package.json o usar:
PORT=3001 npm run dev
```

### Error: "Database connection failed"
```bash
# Verificar DATABASE_URL en .env.local
# Asegurar que la base de datos esté ejecutándose
```

## Optimización de Rendimiento

### Para Desarrollo
```bash
# Usar turbopack para builds más rápidos
npm run dev -- --turbo
```

### Para Producción
```bash
# Optimizar imágenes
npm install sharp

# Configurar next.config.js para optimizaciones
```

## Monitoreo y Logs

### PM2 Logs
```bash
pm2 logs neo-app
pm2 monit
```

### Logs de Desarrollo
```bash
# Los logs aparecen en la consola durante npm run dev
```

## Backup y Restauración

### Backup de SQLite
```bash
cp dev.db backup_$(date +%Y%m%d_%H%M%S).db
```

### Backup de PostgreSQL
```bash
pg_dump neo_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Actualizaciones

### Actualizar Dependencias
```bash
# Verificar actualizaciones disponibles
npm outdated

# Actualizar dependencias menores
npm update

# Actualizar dependencias mayores (con cuidado)
npm install package@latest
```

### Actualizar Base de Datos
```bash
# Después de cambios en schema.prisma
npx prisma db push

# O crear migración
npx prisma migrate dev --name update_description
```
