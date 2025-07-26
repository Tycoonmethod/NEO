
# NEO - Sistema de Gestión Empresarial

NEO es una aplicación web completa desarrollada con Next.js que proporciona un sistema integral de gestión empresarial con funcionalidades de CRM, gestión de proyectos, recursos humanos, finanzas y más.

## 🚀 Características Principales

- **Dashboard Ejecutivo**: Vista general con métricas clave y KPIs
- **CRM Completo**: Gestión de clientes, leads y oportunidades de venta
- **Gestión de Proyectos**: Planificación, seguimiento y colaboración en proyectos
- **Recursos Humanos**: Gestión de empleados, nóminas y evaluaciones
- **Finanzas**: Control de ingresos, gastos y reportes financieros
- **Inventario**: Gestión de productos y stock
- **Comunicaciones**: Sistema de mensajería interna
- **Reportes y Analytics**: Dashboards interactivos con visualizaciones

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: SQLite (desarrollo), PostgreSQL (producción)
- **Autenticación**: NextAuth.js
- **UI Components**: Radix UI, Lucide Icons
- **Charts**: Recharts
- **Formularios**: React Hook Form + Zod

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Git

## 🔧 Instalación y Configuración

### 1. Clonar el repositorio
```bash
# Si estás usando este proyecto desde el escritorio
cd ~/Desktop/NEO
```

### 2. Instalar dependencias
```bash
npm install
# o
yarn install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
```

Edita el archivo `.env.local` con tus configuraciones:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="tu-secret-key-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Configurar la base de datos
```bash
# Generar el cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma db push

# Poblar con datos de ejemplo (opcional)
npx prisma db seed
```

### 5. Ejecutar en modo desarrollo
```bash
npm run dev
# o
yarn dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🔐 Credenciales de Acceso

Para acceder al sistema, utiliza las siguientes credenciales de prueba:

**Usuario Administrador:**
- Email: `john@doe.com`
- Contraseña: `johndoe123`

## 📁 Estructura del Proyecto

```
NEO/
├── README.md              # Este archivo
├── ARCHITECTURE.md        # Documentación de arquitectura
├── FEATURES.md           # Lista detallada de funcionalidades
├── package.json          # Dependencias del proyecto
├── .env.example          # Variables de entorno ejemplo
├── app/                  # Código fuente Next.js
│   ├── (dashboard)/      # Rutas del dashboard
│   ├── api/             # API Routes
│   ├── auth/            # Páginas de autenticación
│   └── globals.css      # Estilos globales
├── components/          # Componentes React reutilizables
├── lib/                 # Utilidades y configuraciones
├── prisma/             # Schema y migraciones de base de datos
└── docs/               # Documentación adicional
```

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Ejecutar en modo desarrollo
npm run build        # Construir para producción
npm run start        # Ejecutar en modo producción
npm run lint         # Ejecutar linter

# Base de datos
npx prisma studio    # Abrir Prisma Studio
npx prisma generate  # Generar cliente Prisma
npx prisma db push   # Aplicar cambios al schema
```

## 📊 Funcionalidades Principales

### Dashboard
- Métricas en tiempo real
- Gráficos interactivos
- KPIs personalizables

### CRM
- Gestión de contactos y clientes
- Pipeline de ventas
- Seguimiento de oportunidades

### Proyectos
- Planificación de tareas
- Asignación de recursos
- Seguimiento de progreso

### Recursos Humanos
- Gestión de empleados
- Control de asistencia
- Evaluaciones de desempeño

### Finanzas
- Control de ingresos y gastos
- Reportes financieros
- Presupuestos

## 🔧 Personalización

El sistema está diseñado para ser altamente personalizable. Puedes:

- Modificar los componentes en `/components`
- Agregar nuevas rutas en `/app`
- Personalizar el schema de base de datos en `/prisma/schema.prisma`
- Ajustar estilos en `/app/globals.css`

## 📚 Documentación Adicional

- [Arquitectura del Sistema](./ARCHITECTURE.md)
- [Lista Completa de Funcionalidades](./FEATURES.md)
- [Documentación de API](./docs/)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo

---

**¡Gracias por usar NEO!** 🎉
