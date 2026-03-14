# Garmin Health Dashboard

**English** · [Español](#español)

A personal health dashboard that connects to Garmin Connect and displays your daily metrics in a clean, mobile-first interface. Works with demo data if no credentials are configured.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cggmx/garmin-health-dashboard&env=GARMIN_USERNAME,GARMIN_PASSWORD&envDescription=Garmin%20Connect%20credentials.%20Leave%20empty%20to%20use%20demo%20data.&project-name=garmin-health-dashboard&repository-name=garmin-health-dashboard)

---

## Screenshots

| Dashboard | Sleep & HRV | Strain & Stress |
|-----------|-------------|-----------------|
| ![Dashboard](docs/screenshots/01-dashboard.jpeg) | ![Sleep & HRV](docs/screenshots/02-cards.jpeg) | ![Strain & Stress](docs/screenshots/03-strain-stress.jpeg) |

| Sleep Detail | Strain Detail |
|--------------|---------------|
| ![Sleep Detail](docs/screenshots/04-sleep-detail.jpeg) | ![Strain Detail](docs/screenshots/05-strain-detail.jpeg) |

---

## What it does

| Screen | Metrics |
|--------|---------|
| **Dashboard** | Recovery score, HRV, Sleep, Body Battery, Strain, Stress, Steps, Calories |
| **Sleep** | Sleep stages (Deep / REM / Light / Awake), SpO₂, overnight HRV, 7-day trend |
| **Strain** | Daily strain (0–21 scale), ACWR load ratio, activities breakdown |
| **Trends** | 7 / 14 / 30-day sparklines, weekly AI summary (optional), PDF export |
| **Profile** | BMI, VO2max estimate, training zones, weight log |

**Key features**
- 🌐 English / Spanish toggle (auto-detects browser language)
- 🤖 AI weekly summary via Claude Haiku (optional — requires Anthropic API key)
- 📱 Installable PWA (iOS Safari & Android Chrome)
- 🔔 Body Battery push notifications
- 🎭 Full demo mode — works without Garmin credentials
- 🔒 No database — all personal data stays in your browser (localStorage)

---

## Tech stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Garmin**: `garmin-connect` npm package
- **AI**: Anthropic Claude Haiku (optional)

---

## Deploy your own

### Option A — One-click (Vercel)

Click the **Deploy with Vercel** button above. You'll be prompted for:

| Variable | Required | Description |
|----------|----------|-------------|
| `GARMIN_USERNAME` | No | Your Garmin Connect email |
| `GARMIN_PASSWORD` | No | Your Garmin Connect password |
| `ANTHROPIC_API_KEY` | No | For AI weekly summary (Claude Haiku) |

Leave credentials empty to run in demo mode.

### Option B — Manual deploy

```bash
# 1. Clone
git clone https://github.com/cggmx/garmin-health-dashboard.git
cd garmin-health-dashboard

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials (all optional)

# 4. Run locally
npm run dev
# → http://localhost:3000

# 5. Deploy to Vercel
npx vercel deploy --prod
```

### Option C — Self-host (Node.js)

```bash
npm run build
npm start
# Runs on port 3000 by default
```

---

## Environment variables

```env
# Garmin Connect (optional — uses demo data if not set)
GARMIN_USERNAME=your@email.com
GARMIN_PASSWORD=yourpassword

# Garmin OAuth tokens — use these if your account has MFA/2FA enabled (see below)
GARMIN_OAUTH1={"oauth_token":"...","oauth_token_secret":"..."}
GARMIN_OAUTH2={"access_token":"...","refresh_token":"...","expires_at":...}

# AI weekly summary (optional — feature hidden if not set)
ANTHROPIC_API_KEY=sk-ant-...

# Push notifications (optional — generated with npm run generate-vapid)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:your@email.com
```

Copy `.env.example` for the full template.

### Accounts with MFA / 2-factor authentication enabled

If Garmin sends you a verification code by email when you sign in, you need to generate OAuth tokens once using the included script:

```bash
node scripts/get-garmin-tokens.js
```

The script will:
1. Ask for your Garmin email and password
2. Detect that MFA is required and wait for you to enter the email code
3. Automatically add `GARMIN_OAUTH1` and `GARMIN_OAUTH2` to your Vercel project
4. Redeploy the app

> **Token expiry**: tokens last ~90 days. Re-run the script when they expire. When `GARMIN_OAUTH1` / `GARMIN_OAUTH2` are set, `GARMIN_USERNAME` / `GARMIN_PASSWORD` are still needed for display purposes but not for authentication.

---

## Privacy

- Garmin credentials are stored **only in your server environment** (Vercel env vars or `.env.local`)
- Health data is fetched server-side and never persisted
- Profile, weight log, and preferences are stored in **your browser's localStorage only**
- No analytics, no tracking, no third-party data collection

---

## License

MIT © 2025 — free to use, modify, and distribute. See [LICENSE](LICENSE).

---

---

# Español

Dashboard personal de salud que se conecta a Garmin Connect y muestra tus métricas diarias en una interfaz móvil limpia. Funciona con datos demo si no hay credenciales configuradas.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cggmx/garmin-health-dashboard&env=GARMIN_USERNAME,GARMIN_PASSWORD&envDescription=Credenciales%20de%20Garmin%20Connect.%20Deja%20vacío%20para%20usar%20datos%20demo.&project-name=garmin-health-dashboard&repository-name=garmin-health-dashboard)

---

## Capturas de pantalla

| Dashboard | Sueño & HRV | Esfuerzo & Estrés |
|-----------|-------------|-------------------|
| ![Dashboard](docs/screenshots/01-dashboard.jpeg) | ![Sueño & HRV](docs/screenshots/02-cards.jpeg) | ![Esfuerzo & Estrés](docs/screenshots/03-strain-stress.jpeg) |

| Detalle de Sueño | Detalle de Esfuerzo |
|------------------|---------------------|
| ![Detalle de Sueño](docs/screenshots/04-sleep-detail.jpeg) | ![Detalle de Esfuerzo](docs/screenshots/05-strain-detail.jpeg) |

---

## Qué hace

| Pantalla | Métricas |
|----------|----------|
| **Dashboard** | Recuperación, HRV, Sueño, Body Battery, Esfuerzo, Estrés, Pasos, Calorías |
| **Sueño** | Fases del sueño (Profundo / REM / Ligero / Despierto), SpO₂, HRV nocturno, tendencia 7d |
| **Esfuerzo** | Esfuerzo diario (escala 0–21), ratio ACWR, desglose de actividades |
| **Tendencias** | Sparklines 7 / 14 / 30 días, resumen IA semanal (opcional), exportación PDF |
| **Perfil** | IMC, estimación VO2max, zonas de entrenamiento, registro de peso |

**Características principales**
- 🌐 Toggle inglés / español (detecta el idioma del navegador automáticamente)
- 🤖 Resumen semanal IA con Claude Haiku (opcional — requiere API key de Anthropic)
- 📱 PWA instalable (iOS Safari y Android Chrome)
- 🔔 Notificaciones push de Body Battery
- 🎭 Modo demo completo — funciona sin credenciales de Garmin
- 🔒 Sin base de datos — todos los datos personales quedan en tu navegador (localStorage)

---

## Stack técnico

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Estilos**: Tailwind CSS
- **Gráficas**: Recharts
- **Garmin**: paquete npm `garmin-connect`
- **IA**: Anthropic Claude Haiku (opcional)

---

## Despliega tu propia instancia

### Opción A — Un clic (Vercel)

Haz clic en el botón **Deploy with Vercel** de arriba. Se te pedirán:

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `GARMIN_USERNAME` | No | Tu correo de Garmin Connect |
| `GARMIN_PASSWORD` | No | Tu contraseña de Garmin Connect |
| `ANTHROPIC_API_KEY` | No | Para el resumen IA semanal (Claude Haiku) |

Deja las credenciales vacías para ejecutar en modo demo.

### Opción B — Deploy manual

```bash
# 1. Clonar
git clone https://github.com/cggmx/garmin-health-dashboard.git
cd garmin-health-dashboard

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales (todas opcionales)

# 4. Ejecutar localmente
npm run dev
# → http://localhost:3000

# 5. Desplegar en Vercel
npx vercel deploy --prod
```

### Opción C — Self-hosting (Node.js)

```bash
npm run build
npm start
# Corre en el puerto 3000 por defecto
```

---

## Variables de entorno

```env
# Garmin Connect (opcional — usa datos demo si no está configurado)
GARMIN_USERNAME=tu@correo.com
GARMIN_PASSWORD=tucontraseña

# Tokens OAuth de Garmin — úsalos si tu cuenta tiene MFA/2FA activado (ver abajo)
GARMIN_OAUTH1={"oauth_token":"...","oauth_token_secret":"..."}
GARMIN_OAUTH2={"access_token":"...","refresh_token":"...","expires_at":...}

# Resumen IA semanal (opcional — la función se oculta si no está configurado)
ANTHROPIC_API_KEY=sk-ant-...

# Notificaciones push (opcional — genera con npm run generate-vapid)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:tu@correo.com
```

Copia `.env.example` para la plantilla completa.

### Cuentas con MFA / verificación en dos pasos activada

Si Garmin te envía un código por correo al iniciar sesión, necesitas generar tokens OAuth una sola vez con el script incluido:

```bash
node scripts/get-garmin-tokens.js
```

El script:
1. Pide tu correo y contraseña de Garmin
2. Detecta que se requiere MFA y espera a que ingreses el código del correo
3. Agrega automáticamente `GARMIN_OAUTH1` y `GARMIN_OAUTH2` a tu proyecto de Vercel
4. Redespliega la app

> **Expiración**: los tokens duran ~90 días. Vuelve a ejecutar el script cuando expiren. Con `GARMIN_OAUTH1` / `GARMIN_OAUTH2` configurados, `GARMIN_USERNAME` / `GARMIN_PASSWORD` siguen siendo necesarios para mostrar tu nombre, pero no para autenticarse.

---

## Privacidad

- Las credenciales de Garmin se almacenan **solo en tu entorno de servidor** (variables de entorno de Vercel o `.env.local`)
- Los datos de salud se obtienen del lado del servidor y nunca se persisten
- El perfil, registro de peso y preferencias se almacenan **solo en el localStorage de tu navegador**
- Sin analíticas, sin rastreo, sin recolección de datos de terceros

---

## Licencia

MIT © 2025 — libre de usar, modificar y distribuir. Ver [LICENSE](LICENSE).
