# 🚀 Instalación CAA-TEA en Windows — Solo Node.js, nada más

## ✅ Sin PostgreSQL. Sin compilar. Solo Node.js.

La base de datos es un archivo `caa_tea.db.json` que se crea automáticamente
la primera vez que arrancas el servidor.

---

## Paso 1 — Verificar que tienes Node.js

Abre PowerShell en VS Code (**Terminal → New Terminal**) y escribe:
```powershell
node --version
```
Si sale `v20.x.x` o superior, perfecto. Si no, descárgalo en https://nodejs.org (LTS).

---

## Paso 2 — Abrir el proyecto

1. Descomprime el ZIP donde quieras
2. VS Code → **File → Open Folder** → selecciona la carpeta `caa-tea`

---

## Paso 3 — Backend (Terminal 1)

```powershell
cd server
copy .env.example .env
npm install
npm run dev
```

Verás:
```
✅ Base de datos creada con datos demo
   PIN adulto: 1234
🗣️  CAA-TEA API corriendo en http://localhost:3001
```

Si `npm install` da algún error, prueba:
```powershell
npm install --ignore-scripts
```

---

## Paso 4 — Frontend (Terminal 2)

Abre una NUEVA terminal con el botón **+** (junto al nombre de la terminal):

```powershell
cd client
npm install
npm run dev
```

Verás:
```
➜  Local:   http://localhost:5173/
```

---

## Paso 5 — Abrir en Chrome

Ve a **http://localhost:5173**

| Quién   | Cómo entrar            | Dato          |
|---------|------------------------|---------------|
| Niño    | Toca el avatar "Mateo" | Sin PIN       |
| Adulto  | Botón "Soy adulto"     | PIN: **1234** |

---

## Ver la base de datos

En VS Code, busca el archivo `caa_tea.db.json` en la raíz del proyecto.
Puedes abrirlo con cualquier editor — es un JSON con los datos de SQLite.

---

## Si algo falla

### Error en npm install del servidor
```powershell
cd server
npm install --ignore-scripts
npm run dev
```

### La app carga pero no hay niños en pantalla
→ El servidor no está corriendo. Comprueba que la Terminal 1 muestra el mensaje de arranque.

### Puerto en uso
```powershell
netstat -ano | findstr :3001
taskkill /PID [número_del_final] /F
```
