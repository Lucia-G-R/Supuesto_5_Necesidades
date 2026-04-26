# 🗣️ App CAA-TEA — Comunicación Aumentativa y Alternativa para TEA

> Aplicación web (PWA) pensada para niños y niñas con Trastorno del Espectro Autista de nivel 2-3 (edad 3-6 años) y para los adultos (familia, terapeutas, profesorado) que les acompañan.

Este README es la **visión de producto**: qué hace la app, por qué cada parte está donde está y cómo demostrarla.
Si lo que buscas es la guía técnica (instalación, API, esquema de BD), abre [`DESARROLLO.md`](./DESARROLLO.md).

---

## 🎯 Objetivo

Las personas con TEA presentan dificultades específicas en comunicación, interacción social, anticipación de rutinas y regulación emocional. Esta app cubre esas cuatro áreas con módulos visuales, accesibles y respaldados por pictogramas oficiales de **ARASAAC** (Centro Aragonés de Comunicación Aumentativa y Alternativa, banco de imágenes Creative Commons reconocido en logopedia).

La app tiene **dos vistas independientes**:

| Vista | Para quién | Acceso |
|---|---|---|
| **Niño** | El menor que usa la app en una tablet | Toca su nombre en la pantalla inicial |
| **Adulto** | Padre/madre/terapeuta/docente | Botón "Soy adulto" + PIN de 4 dígitos (demo: **1234**) |

---

## 👶 La vista del niño (4 módulos)

Cuando el niño selecciona su perfil entra a un panel con **4 botones grandes** en la barra lateral:

### 💬 Hablar (Constructor de frases)
- 9 categorías temáticas: Comida, Acciones, Sentir, Lugares, Familia, Objetos, Higiene, Tiempo, Pedir.
- ~14 pictogramas por categoría con imagen y etiqueta. Las imágenes vienen en directo del banco ARASAAC.
- También hay **buscador libre** (escribir cualquier palabra y aparecen pictogramas relacionados).
- El niño compone una frase tocando hasta 8 pictogramas y pulsa "▶ Escuchar mi frase". El sistema lee la frase en español usando síntesis de voz nativa del navegador.

### 📅 Mi día (Anticipación visual)
- Tres ranuras: **AHORA** (la actividad en curso), **DESPUÉS** y **LUEGO**.
- Cada ranura muestra el pictograma + etiqueta de la actividad (configurada por el adulto).
- Cuando completa la actividad actual, pulsa "✅ Completar" y la secuencia avanza.

### ❤️ Sentir (Regulador emocional)
- Paso 1: identifica la emoción ahora (Feliz, Triste, Enfadado, Asustado, Calmado, Sorprendido).
- Paso 2: el sistema le ofrece **3 estrategias de regulación** específicas a esa emoción (p. ej. "respirar", "pedir un abrazo", "contar hasta 10").
- Si elige una estrategia gana estrellas (autonomía emocional). Si no se ve capaz, hay un botón "Necesito ayuda de un adulto".

### 🏆 Logros
- Muestra el **nivel actual** (1-10) con barra de progreso al siguiente.
- Tabla **"Cómo ganar estrellas"** completamente visible para que el niño y la familia entiendan en qué se basa el sistema.
- **Racha semanal** real (días consecutivos con actividad).
- **Galería de amigos coleccionables**: cada nivel desbloquea un personaje (Burbujín, Llamita, Estrellux, Aletita, Arcorín, Fungito, Tortulín, Dragoncito, Pulgito, Unicornio).

### 🤝 Botón flotante "Adulto"
En cualquier momento, el niño puede pulsar el botón morado abajo a la derecha para llamar a un adulto. El sistema **guarda la sesión del niño** y muestra la pantalla de PIN. Cuando el adulto termina y pulsa "↩ Volver con el niño", la sesión del niño se restaura intacta sin tener que volver a iniciar sesión.

---

## ⭐ Sistema de estrellas y niveles (transparente)

Antes el nivel subía de forma opaca y el contador estaba hardcodeado. Ahora está **completamente documentado y visible** dentro de la app:

| Acción | Estrellas |
|---|---|
| Frase de 1 pictograma | +2 ⭐ |
| Frase de 2 o 3 pictogramas | +5 ⭐ |
| Frase de 4 o más pictogramas | +8 ⭐ |
| Elegir una estrategia emocional | +10 ⭐ |
| Completar un paso de la agenda | +15 ⭐ |
| Bonus de día completo (≥3 acciones distintas) | +20 ⭐ |

Niveles 1→10 con curva creciente: 0, 25, 60, 110, 180, 270, 380, 520, 700, 1000 estrellas.

Las estrellas se **persisten en la base de datos por niño**, no en localStorage. Si el niño cambia de tablet o se cierra el navegador, el progreso sigue ahí.

---

## 👨‍👩‍👧 La vista del adulto (Dashboard clínico)

Tras introducir PIN, el adulto entra a `/adult/dashboard` y ve **6 gráficas** justificadas teóricamente. Cada una se acompaña de una explicación corta para que terapeutas y familia entiendan qué muestra y por qué importa en el TEA.

### 1. Progreso de comunicación (pictogramas vs palabras)
Línea con dos series por semana: cuántos pictogramas ha tocado el niño y cuántas palabras (frases) ha producido. Permite valorar la evolución del lenguaje, área central afectada en el TEA.

### 2. Uso de la app (diario / semanal / mensual)
Barras con selector de granularidad. Detecta patrones de uso y rutinas. La estructura y la previsibilidad son fundamentales en TEA, así que un uso regular es señal de que la app forma parte de la rutina.

### 3. Tipo de comunicación (pictogramas sueltos vs frases)
Barras apiladas por semana: frases de 1 pictograma vs frases de 2+. Indicador de **complejidad lingüística**: a medida que el niño progresa, la barra verde (multi-pictograma) crece sobre la naranja (un solo pictograma).

### 4. Errores y tiempo de respuesta
Doble panel:
- Línea con el **tiempo medio de respuesta** (milisegundos entre que se le muestra el grid y elige el primer pictograma) — útil para detectar ralentizaciones puntuales.
- Tarjeta numérica con los **errores totales**: pictogramas borrados antes de leer la frase + frases descartadas con la papelera.

### 5. Interacción social
Porcentaje semanal de pictogramas considerados "sociales" (familia, emociones, fórmulas de cortesía: "gracias", "por favor", "ayuda", "compartir") sobre el total. La reciprocidad social es una de las áreas nucleares del TEA.

### 6. Pictogramas más utilizados
Top 10 con imagen real de ARASAAC, etiqueta y frecuencia. Identifica intereses focalizados y preferencias, característicos del TEA y útiles para personalizar la intervención.

### 📅 Pestaña Agenda
El adulto puede editar las tres ranuras AHORA / DESPUÉS / LUEGO buscando pictogramas y arrastrándolos a cada slot.

---

## 🚀 Cómo ejecutarla en local (resumen)

> Si nunca la has corrido antes, lee [`DESARROLLO.md`](./DESARROLLO.md) entero. Aquí solo el atajo.

```bash
# Una vez, instala dependencias
cd server && npm install
cd ../client && npm install

# Cada vez que quieras arrancar (en dos terminales)
cd server && npm run dev      # API en http://localhost:3001
cd client && npm run dev      # PWA en http://localhost:5173
```

Abre `http://localhost:5173` y verás la pantalla de selección. Datos demo precargados:

- Niño: **Mateo** (sin PIN)
- Adulto: **María (mamá)** con **PIN 1234**

---

## 🗺️ Mini-guion para demostrar la app a alguien

1. **Abre `http://localhost:5173`** → Selecciona "Mateo".
2. **Hablar**: cambia entre 2-3 categorías (Comida, Familia, Pedir). Comprueba que cada imagen se corresponde con su etiqueta.
3. **Construye una frase de 4 pictogramas** ("mamá", "por favor", "agua", "gracias") y pulsa "▶ Escuchar mi frase". El navegador lee la frase. Mira cómo el contador de estrellas y el nivel suben.
4. **Logros**: muestra la barra de progreso al siguiente nivel y la sección "Cómo ganar estrellas".
5. **Sentir**: elige "Triste" → "Pedir abrazo". Aparece el popup de recompensa.
6. **Mi día**: ve la agenda y completa la primera ranura.
7. **Pulsa el botón flotante 🤝 Adulto** → confirma → introduce **PIN 1234**.
8. **Dashboard**: muestra las 6 gráficas con datos reales de la sesión que acabas de hacer.
9. **Salir** desde la barra lateral (dirá "↩ Volver con el niño") → vuelve a la sesión de Mateo intacta.

---

## 🏗️ Decisiones de diseño relevantes

- **PWA** (Progressive Web App): la app se puede instalar en una tablet como si fuera nativa, funciona offline parcialmente y cachea las imágenes de ARASAAC.
- **Voz nativa**: usamos la Web Speech API del navegador (gratis, en español, sin servidores externos).
- **Pictogramas dinámicos**: en lugar de hardcodear IDs (que envejecen mal y pueden no coincidir con la imagen), declaramos solo *keywords* en español y resolvemos los IDs reales contra el banco ARASAAC al primer uso. Quedan cacheados en el navegador.
- **SQLite con `sql.js`**: base de datos en archivo único, sin servidor de BD, sin compilación nativa. Funciona en Windows sin Python ni Visual Studio Build Tools.
- **Sin librería UI**: estilos inline con tokens de color para que el diseño sea fácilmente ajustable y no dependa de Tailwind/MUI/etc.
- **Tracking ético**: los eventos que registramos (frases, emociones, latencia, errores) se guardan **solo en local** (en la misma BD del proyecto). No se mandan a ningún tercero.

---

## 📂 Estructura del repositorio

```
caa-tea/
├── README.md          ← este archivo
├── DESARROLLO.md      ← guía técnica
├── SETUP.md           ← notas adicionales de instalación en Windows
├── package.json       ← scripts del workspace
├── caa_tea.db         ← base de datos SQLite (se crea automáticamente)
├── sql/               ← esquema y semilla
├── server/            ← backend Express + SQLite
└── client/            ← frontend React + Vite
```

---

## 👥 Roles del equipo (sugerido)

- **Diseño/UX**: revisar paleta de colores, tamaños de pictograma, ergonomía en tablet.
- **Contenido pedagógico**: ajustar las *keywords* por categoría (`client/src/components/modules/PhraseBuilder.jsx`) y las estrategias por emoción (`EmotionRegulator.jsx`).
- **Desarrollo backend**: rutas REST, esquema de BD, fórmulas de progreso.
- **Desarrollo frontend**: componentes, gráficas del dashboard, accesibilidad.
- **Demo y memoria**: usar este README + `DESARROLLO.md` como base para la presentación.

---

## ❓ Preguntas frecuentes

**¿Necesito conexión a internet?**
Solo la primera vez que se abre cada categoría (para resolver los pictogramas en ARASAAC). Después se cachean y funciona offline.

**¿Y si la API de ARASAAC se cae?**
Las imágenes ya cacheadas se siguen viendo. El buscador libre dejaría de funcionar hasta que vuelva.

**¿El PIN se puede cambiar?**
Sí, está hasheado con bcrypt en `users.pin_hash`. En producción habría una pantalla de gestión; en demo el PIN es 1234 fijo.

**¿Qué pasa si dos adultos comparten un mismo niño?**
La tabla `adult_child_links` permite relación N:M. El dashboard de cada adulto solo muestra a los niños vinculados a él.

**¿Cómo añado un nuevo niño?**
Hoy se añade insertando una fila en la tabla `users` con `role='child'`. La pantalla de selección lo recogerá automáticamente.
