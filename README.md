# Prototipo Drive

Aplicación web para gestionar archivos utilizando Google Drive como almacenamiento y Supabase como base de datos para registrar los metadatos de los archivos asociados a cada usuario.

El proyecto utiliza autenticación con Google para identificar al usuario y permitirle gestionar sus propios archivos desde una interfaz web.

## Funcionalidades

- Inicio de sesión con una cuenta de Google.
- Subida de archivos a Google Drive.
- Creación automática de una carpeta para almacenar los archivos de la aplicación.
- Consulta y visualización de los archivos registrados.
- Descarga de archivos almacenados en Google Drive.
- Eliminación de archivos y limpieza de sus registros en Supabase.
- Validación de la sesión del usuario y control de acceso a las operaciones protegidas.
- Manejo de errores cuando un archivo ya no existe en Google Drive.

## Tecnologías y herramientas utilizadas

| Tecnología o servicio | Uso en el proyecto |
|---|---|
| React | Desarrollo de la interfaz de usuario. |
| Vite | Servidor de desarrollo y herramientas para el frontend. |
| JavaScript | Lenguaje de programación utilizado en el proyecto. |
| Node.js | Entorno de ejecución del backend. |
| Express | Desarrollo de las rutas y la API del servidor. |
| Passport.js | Implementación de la autenticación con Google. |
| Google OAuth 2.0 | Autenticación de usuarios mediante Google. |
| Google Cloud Console | Configuración del cliente OAuth y las credenciales de Google. |
| Google Drive API | Almacenamiento, consulta, descarga y eliminación de archivos. |
| Supabase | Base de datos para almacenar los metadatos de los archivos. |
| PostgreSQL | Sistema de base de datos utilizado por Supabase. |
| Multer | Procesamiento de archivos recibidos por el backend. |
| Express Session | Administración de las sesiones de usuario. |
| Git y GitHub | Control de versiones y alojamiento del código fuente. |

## Estructura del proyecto

La estructura general del proyecto está organizada en dos partes principales: el cliente y el servidor.

```text
prototipo-drive/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── passport.js
│   │   │   └── googleDrive.js
│   │   └── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

> Esta estructura es una referencia general. Puede ajustarse para reflejar todos los archivos y carpetas presentes en la versión final del repositorio.

### Cliente (`client/`)

Contiene la aplicación desarrollada con React y Vite. Se encarga de mostrar la interfaz, iniciar las solicitudes al backend y presentar las operaciones disponibles para el usuario.

### Servidor (`server/`)

Contiene la API desarrollada con Node.js y Express. Administra la autenticación, las sesiones, las operaciones con Google Drive y el registro de metadatos en Supabase.

### Configuración de Passport

Se utiliza para configurar la autenticación mediante Google OAuth 2.0.

### Integración con Google Drive

Gestiona las operaciones necesarias para crear la carpeta de la aplicación y subir, consultar, descargar y eliminar archivos.

## Servicios externos

### Google Cloud Console

Se utiliza para configurar las credenciales OAuth 2.0 y habilitar la integración con las API de Google.

Para configurar el proyecto se requiere:

1. Crear o seleccionar un proyecto en Google Cloud Console.
2. Habilitar la API de Google Drive.
3. Configurar la pantalla de consentimiento OAuth.
4. Crear un cliente OAuth de tipo aplicación web.
5. Configurar la URI de redirección autorizada para el backend:

   `http://localhost:3000/auth/google/callback`

6. Configurar el ID de cliente y el secreto de cliente como variables de entorno.

### Google Drive

Se utiliza como almacenamiento de los archivos. La aplicación trabaja con los permisos OAuth configurados para permitir las operaciones necesarias sobre los archivos gestionados por ella.

### Supabase

Se utiliza como servicio de base de datos. La tabla `archivos` almacena los metadatos necesarios para relacionar los archivos con sus propietarios y consultar sus registros desde la aplicación.

Los archivos se almacenan en Google Drive, mientras que Supabase conserva sus registros y la información necesaria para administrarlos.

## Requisitos previos

Antes de ejecutar el proyecto, es necesario contar con:

- Node.js y npm.
- Una cuenta de Google.
- Un proyecto configurado en Google Cloud Console con la API de Google Drive habilitada.
- Un proyecto de Supabase con la tabla `archivos` configurada.
- Las credenciales y variables de entorno necesarias para el backend y el cliente.

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
cd prototipo-drive
```

Sustituye `URL_DEL_REPOSITORIO` por la URL real del repositorio de GitHub.

### 2. Instalar las dependencias del servidor

```bash
cd server
npm install
```

### 3. Configurar las variables de entorno del servidor

Crea el archivo de entorno correspondiente al backend y configura las siguientes variables:

```dotenv
PORT=3000
CLIENT_URL=http://localhost:5173

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

SUPABASE_URL=
SUPABASE_SECRET_KEY=

SESSION_SECRET=
```

Completa los valores con las credenciales correspondientes. No compartas estos secretos ni los subas al repositorio.

### 4. Iniciar el servidor

Desde la carpeta `server/`, ejecuta:

```bash
npm run dev
```

El backend estará disponible en `http://localhost:3000`, siempre que el puerto configurado esté disponible.

### 5. Instalar las dependencias del cliente

Abre otra terminal y ejecuta:

```bash
cd prototipo-drive/client
npm install
```

### 6. Configurar el cliente

Configura la variable de entorno que indica la URL del backend:

```dotenv
VITE_API_URL=http://localhost:3000
```

Coloca esta variable en el archivo de entorno que utilice la configuración de Vite del proyecto.

### 7. Iniciar el frontend

Desde la carpeta `client/`, ejecuta:

```bash
npm run dev
```

Vite mostrará en la terminal la dirección local desde la que se puede abrir la aplicación, normalmente `http://localhost:5173`.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto en el que se ejecuta el servidor Express. |
| `CLIENT_URL` | Dirección del frontend a la que se redirige el usuario después de autenticarse. |
| `GOOGLE_CLIENT_ID` | Identificador del cliente OAuth de Google. |
| `GOOGLE_CLIENT_SECRET` | Secreto del cliente OAuth de Google. |
| `GOOGLE_CALLBACK_URL` | Dirección de retorno configurada para la autenticación de Google. |
| `SUPABASE_URL` | URL del proyecto de Supabase. |
| `SUPABASE_SECRET_KEY` | Clave secreta utilizada por el backend para acceder a Supabase. |
| `SESSION_SECRET` | Secreto utilizado para firmar las sesiones de Express. |
| `VITE_API_URL` | Dirección base del backend utilizada por el frontend. |

Los nombres deben coincidir con los utilizados en el código fuente. Las variables de entorno con prefijo `VITE_` pueden quedar expuestas al código del navegador; por ello, nunca se deben colocar secretos en ellas.

## Flujo general de funcionamiento

1. El usuario inicia sesión mediante Google OAuth 2.0.
2. El backend administra la sesión autenticada.
3. El usuario solicita subir, consultar, descargar o eliminar un archivo desde la interfaz.
4. El backend verifica la sesión y ejecuta la operación correspondiente.
5. Google Drive almacena o administra el archivo.
6. Supabase registra o actualiza los metadatos relacionados con el archivo.
7. El resultado de la operación se devuelve al frontend para mostrarlo al usuario.

## Seguridad

- Las credenciales y los secretos deben mantenerse en variables de entorno.
- Los archivos `.env` no deben incluirse en el repositorio.
- Las operaciones sobre archivos deben validar la sesión y la propiedad del archivo.
- Las claves secretas de Supabase deben utilizarse exclusivamente desde el backend.
- Las credenciales OAuth deben mantenerse privadas.

## Estado del proyecto

Prototipo funcional de gestión de archivos mediante Google Drive, con autenticación de Google e integración con Supabase para administrar los metadatos.
