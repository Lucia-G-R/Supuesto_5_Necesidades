# 🗣️ App CAA-TEA

**Comunicación Aumentativa y Alternativa para niños con Trastorno del Espectro Autista (Nivel 2-3, 3-6 años)**

---

## Stack

| Capa       | Tecnología                        |
|------------|-----------------------------------|
| Frontend   | React 18 + Vite + PWA             |
| Backend    | Node.js + Express (ESM)           |
| Base datos | PostgreSQL 14+                    |
| Pictogramas| API ARASAAC (CC, gratuita)        |
| Voz        | Web Speech API (nativa, sin coste)|
| Estado     | Zustand                           |
| Gráficas   | Recharts                          |

---

## Módulos

| Módulo | Descripción |
|--------|-------------|
| **A – Constructor de frases** | Pictogramas ARASAAC por categorías → barra de frase → TTS |
| **B – Agenda visual** | Secuencia Ahora / Después / Luego configurable por adultos |
| **C – Regulador emocional** | Selección de emoción → intensidad → estrategia de calma |
| **D – Panel adulto** | KPIs clínicos (LMF, diversidad léxica, autonomía) + gráficas |

---

## Inicio rápido

### 1. Base de datos

```bash
# Crear base de datos
createdb caa_tea

# Ejecutar migraciones
psql -d caa_tea -f sql/001_schema.sql
psql -d caa_tea -f sql/002_seed.sql
```

### 2. Backend

```bash
cd server
cp .env.example .env
# Edita .env con tu DATABASE_URL y JWT_SECRET

npm install
npm run dev
# → http://localhost:3001
```

### 3. Frontend

```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

---

## Credenciales demo

| Rol   | Cómo entrar          | Dato         |
|-------|----------------------|--------------|
| Niño  | Toca "Mateo"         | Sin PIN      |
| Adulto| Botón "Soy adulto"   | PIN: **1234**|

---

## Variables de entorno (server/.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/caa_tea
JWT_SECRET=cambia_esto_en_produccion
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

---

## Estructura del proyecto

```
caa-tea/
├── sql/
│   ├── 001_schema.sql      # Esquema completo
│   └── 002_seed.sql        # Datos demo
├── server/
│   ├── index.js            # Entry point Express
│   ├── db/pool.js          # Conexión PostgreSQL
│   ├── middleware/auth.js  # JWT + roles
│   └── routes/
│       ├── auth.js         # Login niño/adulto
│       ├── users.js        # Perfiles
│       ├── phrases.js      # Módulo A
│       ├── schedule.js     # Módulo B
│       ├── emotion.js      # Módulo C
│       ├── dashboard.js    # Módulo D - KPIs
│       └── arasaac.js      # Proxy API ARASAAC
└── client/
    ├── index.html
    ├── vite.config.js      # PWA config
    └── src/
        ├── main.jsx        # Router
        ├── store.js        # Zustand
        ├── index.css       # Design tokens
        ├── hooks/
        │   └── useTTS.js   # Web Speech API
        ├── utils/
        │   └── api.js      # Fetch helper
        └── components/
            ├── SelectChild.jsx         # Pantalla inicio
            ├── ChildApp.jsx            # Shell niño + nav
            ├── shared/PinGate.jsx      # PIN adulto
            ├── modules/
            │   ├── PhraseBuilder.jsx   # Módulo A
            │   ├── Anticipation.jsx    # Módulo B
            │   └── EmotionRegulator.jsx # Módulo C
            └── adult/
                ├── AdultApp.jsx        # Panel adulto + KPIs
                └── ScheduleEditor.jsx  # Editor agenda
```

---

## API Endpoints

```
POST /api/auth/child-login         Login niño (sin PIN)
POST /api/auth/adult-login         Login adulto (PIN)

GET  /api/users/all-children       Lista de niños (pantalla inicio)
GET  /api/users/children           Niños del adulto autenticado

POST /api/phrases                  Guardar frase (Módulo A)
GET  /api/phrases?childId=         Historial de frases

GET  /api/schedule/:childId/today  Agenda de hoy (Módulo B)
PUT  /api/schedule/:childId        Configurar agenda
PATCH /api/schedule/:childId/advance  Avanzar slot

POST /api/emotion                  Registrar emoción (Módulo C)
GET  /api/emotion?childId=         Historial emocional

GET  /api/dashboard/:childId       KPIs completos (Módulo D)
GET  /api/arasaac/search?q=        Búsqueda pictogramas ARASAAC
```

---

## Consideraciones éticas

- **RGPD**: datos de menores con consentimiento explícito del tutor
- **Sin publicidad**: la app no muestra publicidad ni comparte datos
- **Almacenamiento local primero**: IndexedDB para uso offline
- **KPIs clínicos**: diseñados para interpretarse con logopeda o psicólogo, no como diagnóstico autónomo

---

## Próximos pasos (Fase 5 del blueprint)

- [ ] Testing con familias piloto
- [ ] PWA offline completo (Workbox)
- [ ] Pictogramas personalizados (fotos del entorno real del niño)
- [ ] Búsqueda manual ARASAAC en el panel adulto
- [ ] Exportación de informes PDF para el logopeda
- [ ] Soporte multiidioma (ca, eu, gl)
