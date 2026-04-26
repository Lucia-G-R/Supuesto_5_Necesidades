# 🚀 Guía de instalación paso a paso — App CAA-TEA

## Lo que necesitas instalar primero

### 1. Node.js
- Ve a https://nodejs.org
- Descarga la versión **LTS** (la verde)
- Instálala con las opciones por defecto
- Para verificar: abre una terminal y escribe `node --version`

### 2. PostgreSQL
- Ve a https://www.postgresql.org/download/
- Descarga el instalador para tu sistema operativo
- Durante la instalación, pon una contraseña para el usuario `postgres` — **guárdala bien**
- Puerto por defecto: 5432 (no lo cambies)

### 3. Visual Studio Code
- Ve a https://code.visualstudio.com
- Descarga e instala

### Extensiones recomendadas para VS Code
Abre VS Code → panel izquierdo → icono cuadrados → instala:
- **ESLint** — subraya errores en el código
- **Prettier** — formatea el código automáticamente
- **Thunder Client** — para probar la API sin salir de VS Code
- **PostgreSQL** (por Chris Kolkman) — para ver la base de datos

---

## Abrir el proyecto

1. Descomprime el archivo `caa-tea.zip` donde quieras (ej: `Escritorio/caa-tea`)
2. Abre VS Code
3. Ve a **File → Open Folder** → selecciona la carpeta `caa-tea`
4. Verás la estructura del proyecto en el panel izquierdo

---

## Configurar la base de datos

### Opción A — Con pgAdmin (interfaz gráfica, más fácil)
pgAdmin se instala junto con PostgreSQL.

1. Abre **pgAdmin** desde el menú de inicio
2. Conéctate con la contraseña que pusiste al instalar PostgreSQL
3. Clic derecho en **Databases → Create → Database**
4. Nombre: `caa_tea` → Save
5. Clic derecho en `caa_tea` → **Query Tool**
6. Abre el archivo `sql/001_schema.sql` (File → Open) → pulsa ▶ (Execute)
7. Repite con `sql/002_seed.sql`

### Opción B — Con terminal
```bash
# Crea la base de datos
psql -U postgres -c "CREATE DATABASE caa_tea;"

# Ejecuta las migraciones
psql -U postgres -d caa_tea -f sql/001_schema.sql
psql -U postgres -d caa_tea -f sql/002_seed.sql
```

---

## Configurar el backend

1. En VS Code, abre una terminal: **Terminal → New Terminal**
2. Escribe:
```bash
cd server
```
3. Copia el archivo de ejemplo de variables de entorno:
```bash
# En Windows:
copy .env.example .env

# En Mac/Linux:
cp .env.example .env
```
4. Abre el archivo `server/.env` y edítalo:
```
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/caa_tea
JWT_SECRET=cualquier_frase_larga_y_secreta_aqui_1234
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```
> ⚠️ Sustituye `TU_CONTRASEÑA` por la contraseña que pusiste al instalar PostgreSQL

5. Instala las dependencias:
```bash
npm install
```
6. Arranca el servidor:
```bash
npm run dev
```
Deberías ver: `CAA-TEA API running on :3001`

---

## Configurar el frontend

1. Abre **otra terminal** en VS Code: icono `+` en el panel de terminal
2. Escribe:
```bash
cd client
npm install
npm run dev
```
Deberías ver algo como:
```
  VITE v5.x.x  ready in 500ms
  ➜  Local:   http://localhost:5173/
```

---

## Abrir la app

Abre tu navegador y ve a: **http://localhost:5173**

### Credenciales demo
| Quién     | Cómo entrar            | Dato           |
|-----------|------------------------|----------------|
| Niño      | Toca el avatar "Mateo" | Sin contraseña |
| Adulto    | Botón "Soy adulto"     | PIN: **1234**  |

---

## Estructura de terminales en VS Code

Necesitas **2 terminales abiertas al mismo tiempo**:

```
Terminal 1 (Backend):          Terminal 2 (Frontend):
──────────────────             ──────────────────────
cd server                      cd client
npm run dev                    npm run dev
→ Puerto 3001                  → Puerto 5173
```

---

## Errores comunes y soluciones

### "Cannot connect to database"
- Asegúrate de que PostgreSQL está corriendo
- Windows: busca "Services" → PostgreSQL debe estar "Running"
- Mac: `brew services start postgresql`

### "Port 3001 already in use"
```bash
# Windows:
netstat -ano | findstr :3001
taskkill /PID [número] /F

# Mac/Linux:
lsof -ti:3001 | xargs kill
```

### "Module not found"
```bash
# Asegúrate de estar en la carpeta correcta y vuelve a instalar:
cd server && npm install
cd ../client && npm install
```

### Los pictogramas no cargan
- La app usa la API de ARASAAC (internet necesario)
- En modo offline, solo los emojis funcionan sin conexión

---

## Para instalar como app en tablet (PWA)

1. Abre Chrome en la tablet
2. Ve a la IP de tu ordenador: `http://192.168.X.X:5173`
   (Tu IP: en Windows → `ipconfig`, en Mac → `ifconfig`)
3. En Chrome → menú ⋮ → "Añadir a pantalla de inicio"
4. Ya aparece como una app nativa

---

## Scripts útiles

```bash
# Backend
cd server
npm run dev      # Modo desarrollo (se reinicia solo al guardar)
npm start        # Modo producción

# Frontend
cd client
npm run dev      # Desarrollo con hot-reload
npm run build    # Genera versión de producción en /dist
npm run preview  # Previsualiza la build de producción
```
