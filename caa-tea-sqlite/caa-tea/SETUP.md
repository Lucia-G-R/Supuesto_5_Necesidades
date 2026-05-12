# Instalación CAA-TEA en Windows (VS Code)

Guía paso a paso pensada para alguien que abre el proyecto por primera vez en Windows con Visual Studio Code. Para la guía completa (qué hace la app, scripts disponibles, troubleshooting extendido) ver [`README.md`](./README.md). Para detalles técnicos y API ver [`DESARROLLO.md`](./DESARROLLO.md).

---

## No necesitas PostgreSQL

La app usa **SQLite vía `sql.js`** (WASM). La base de datos se crea sola como un archivo `caa_tea.db` la primera vez que arranca el servidor. No hace falta instalar ningún motor de BD, ni Python, ni Visual Studio Build Tools.

---

## Paso 1 — Instalar Node.js

1. Ve a [https://nodejs.org](https://nodejs.org)
2. Descarga **Node.js LTS** (botón verde).
3. Instala con todas las opciones por defecto.
4. Verifica abriendo PowerShell:

   ```powershell
   node --version
   npm --version
   ```

   Debe salir algo como `v20.x.x` o superior.

---

## Paso 2 — Abrir el proyecto en VS Code

1. Descomprime el `.zip` del proyecto en tu escritorio (o clónalo con git).
2. Abre VS Code.
3. **File → Open Folder** → selecciona la carpeta `caa-tea/`.

---

## Paso 3 — Instalar dependencias

En VS Code abre una terminal (**Terminal → New Terminal**). Desde la carpeta `caa-tea/`:

```powershell
npm run install:all
```

Esto instala las dependencias del backend y del frontend en una sola orden. Tarda 1-3 minutos según conexión.

> Si prefieres hacerlo manualmente: `cd server; npm install; cd ..; cd client; npm install`.

---

## Paso 4 — (Opcional) Variables de entorno

Si quieres cambiar el puerto del backend, el secreto JWT o la URL del cliente, crea `server/.env`:

```env
PORT=3001
JWT_SECRET=cambia_esto_en_produccion
CLIENT_URL=http://localhost:5173
```

Si no lo creas, la app usa estos mismos valores por defecto. **Para una demo en local te puedes saltar este paso.**

---

## Paso 5 — Arrancar el backend

```powershell
cd server
npm run dev
```

La primera vez verás algo así:

```
  CAA-TEA API corriendo en http://localhost:3001
  Base de datos: caa_tea.db (SQLite via sql.js)
```

> El archivo `caa_tea.db` aparecerá en la raíz del proyecto.
> Puedes abrirlo con la extensión **SQLite Viewer** de VS Code.

---

## Paso 6 — Arrancar el frontend

Abre **otra terminal** en VS Code (icono `+` junto al nombre de la terminal). Desde `caa-tea/`:

```powershell
cd client
npm run dev
```

Verás:

```
  VITE v5.x.x  ready in 500ms
  ➜  Local:   http://localhost:5173/
```

---

## Paso 7 — Abrir la app

Abre Chrome y ve a: **http://localhost:5173**

### Usuarios demo (se crean automáticamente)

| Quién  | Cómo entrar            | Dato          |
|--------|------------------------|---------------|
| Niño   | Toca el avatar "Mateo" | Sin PIN       |
| Adulto | Botón "Soy adulto"     | PIN: **1234** |

---

## Estructura de terminales

Necesitas **2 terminales abiertas** al mismo tiempo:

```
Terminal 1 — Backend        Terminal 2 — Frontend
─────────────────────       ──────────────────────
cd server                   cd client
npm run dev                 npm run dev
→ :3001                     → :5173
```

---

## Ver la base de datos en VS Code

1. Panel izquierdo → icono explorador.
2. Clic en `caa_tea.db`.
3. Se abre el **SQLite Viewer** (extensión recomendada) — puedes ver todas las tablas y datos.

---

## Errores comunes

### "npm no se reconoce"
Node.js no está instalado o hay que reiniciar VS Code tras instalarlo.

### "Cannot find package 'sql.js'" o "Cannot find package 'express'"
Faltó el `npm install`. Desde `caa-tea/`:

```powershell
cd server && npm install
cd ..\client && npm install
```

### La app carga pero no hay usuarios
Borra el archivo `caa_tea.db` y reinicia el servidor. Se recreará con los datos demo.

### Puerto ya en uso

```powershell
# Encuentra el PID que ocupa el puerto 3001:
netstat -ano | findstr :3001
# Mata el proceso (sustituye <PID> por el número del final):
taskkill /PID <PID> /F
```

### "PIN incorrecto" con 1234
Pasa si tienes una BD de una versión vieja. Borra `caa_tea.db` y reinicia el server: el seed actual usa IDs deterministas y el PIN del adulto demo es siempre `1234`.

---

## Instalar como app en tablet (PWA)

1. Asegúrate de que el ordenador y la tablet están en el **mismo WiFi**.
2. En PowerShell escribe `ipconfig` y anota tu IPv4 (ej: `192.168.1.50`).
3. Edita `server/.env` y pon `CLIENT_URL=http://192.168.1.50:5173`. Reinicia el backend.
4. En Chrome de la tablet ve a `http://192.168.1.50:5173`.
5. Chrome → ⋮ → **Añadir a pantalla de inicio**.
