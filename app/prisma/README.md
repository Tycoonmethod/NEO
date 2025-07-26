
# Base de Datos NEO - Prisma

Esta carpeta contiene la configuración y esquema de la base de datos para NEO.

## Archivos Principales

- **`schema.prisma`** - Esquema principal de la base de datos
- **`migrations/`** - Historial de migraciones (si existe)

## Modelos Principales

### Usuario y Autenticación
- `User` - Usuarios del sistema
- `Account` - Cuentas de proveedores OAuth
- `Session` - Sesiones de usuario

### Gestión de Proyectos
- `Project` - Proyectos principales
- `Task` - Tareas individuales
- `Milestone` - Hitos del proyecto

### Colaboración
- `Team` - Equipos de trabajo
- `Meeting` - Reuniones
- `Comment` - Comentarios y comunicación

### Archivos y Documentos
- `File` - Gestión de archivos
- `Document` - Documentos del proyecto

## Configuración

La base de datos está configurada para trabajar con:
- PostgreSQL (producción)
- SQLite (desarrollo local)

## Comandos Útiles

```bash
# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma db push

# Ver base de datos
npx prisma studio
```

## Relaciones

El esquema incluye relaciones complejas entre:
- Usuarios ↔ Proyectos ↔ Tareas
- Equipos ↔ Miembros ↔ Permisos
- Archivos ↔ Proyectos ↔ Tareas
