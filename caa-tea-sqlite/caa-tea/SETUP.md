# 🚀 Instalación CAA-TEA en Windows (VS Code)

## ✅ Buenas noticias: NO necesitas PostgreSQL
La app ahora usa **SQLite** — la base de datos se crea SOLA como un archivo `caa_tea.db`.

---

## Paso 1 — Instalar Node.js

1. Ve a https://nodejs.org
2. Descarga **Node.js LTS** (botón verde)
3. Instala con todas las opciones por defecto
4. Verifica: abre PowerShell y escribe:
   ```
   node --version
   ```
   Debe salir algo como `v20.x.x`

---

## Paso 2 — Abrir el proyecto en VS Code

1. Descomprime `caa-tea-v2.zip` en tu escritorio
2. Abre VS Code
3. **File → Open Folder** → selecciona la carpeta `caa-tea-v2`

---

## Paso 3 — Configurar el backend

En VS Code abre una terminal (**Terminal → New Terminal**):

```powershell
cd server
copy .env.example .env
npm install
npm run dev
```

La primera vez que arranque verás:
```
✅ Base de datos creada con datos demo
🗣️  CAA-TEA API corriendo en http://localhost:3001
📁  Base de datos: caa_tea.db (SQLite - se crea automáticamente)
```

> El archivo `caa_tea.db` aparecerá en la carpeta raíz del proyecto.
> Puedes abrirlo con la extensión **SQLite Viewer** de VS Code.

---

## Paso 4 — Arrancar el frontend

Abre **otra terminal** (icono `+` junto al nombre de la terminal):

```powershell
cd client
npm install
npm run dev
```

Verás:
```
  VITE v5.x.x  ready in 500ms
  ➜  Local:   http://localhost:5173/
```

---

## Paso 5 — Abrir la app

Abre Chrome y ve a: **http://localhost:5173**

### Usuarios demo (se crean automáticamente)
| Quién   | Cómo entrar            | Dato          |
|---------|------------------------|---------------|
| Niño    | Toca el avatar "Mateo" | Sin PIN       |
| Adulto  | Botón "Soy adulto"     | PIN: **1234** |

---

## Estructura de terminales

Necesitas **2 terminales abiertas** al mismo tiempo:

```
Terminal 1 — Backend        Terminal 2 — Frontend
─────────────────────       ──────────────────────
cd server                   cd client
npm run dev                 npm run dev
→ :3001 ✅                  → :5173 ✅
```

---

## Ver la base de datos en VS Code

1. Panel izquierdo → icono explorador
2. Clic en `caa_tea.db`
3. Se abre el **SQLite Viewer** — puedes ver todas las tablas y datos

---

## Errores comunes

### "npm no se reconoce"
→ Node.js no está instalado o hay que reiniciar VS Code tras instalarlo.

### "Error: Cannot find module 'better-sqlite3'"
```powershell
cd server
npm install
```

### La app carga pero no hay usuarios
→ Borra el archivo `caa_tea.db` y reinicia el servidor. Se recreará con los datos demo.

### Puerto ya en uso
```powershell
# Matar proceso en puerto 3001:
netstat -ano | findstr :3001
# Anota el PID del final y:
taskkill /PID [número] /F
```

---

## Instalar como app en tablet (PWA)

1. Asegúrate de que el ordenador y la tablet están en el **mismo WiFi**
2. En PowerShell escribe `ipconfig` y anota tu IPv4 (ej: `192.168.1.50`)
3. En Chrome de la tablet ve a `http://192.168.1.50:5173`
4. Chrome → ⋮ → **Añadir a pantalla de inicio**
