
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import multer from 'multer';
import { Readable } from 'node:stream';

import passport from './config/passport.js';
import supabase from './config/supabase.js';
import obtenerClienteDrive from './config/googleDrive.js';
import { obtenerOCrearCarpeta } from './utils/driveFolder.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const CLIENT_URL =
  process.env.CLIENT_URL || 'http://localhost:5173';

app.set('trust proxy', 1);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

if (!process.env.SESSION_SECRET) {
  throw new Error('Falta SESSION_SECRET en el archivo .env');
}

// Configuración general.
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);


app.use(
  session({
    name: 'prototipo.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);


app.use(passport.initialize());
app.use(passport.session());

// Verificar autenticación.
function requiereAutenticacion(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      mensaje: 'Debes iniciar sesión con Google.',
    });
  }

  next();
}

// Endpoint principal.
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API del prototipo Drive funcionando',
  });
});

// Comprobar conexión con Supabase.
app.get('/api/health', async (req, res) => {
  try {
    const { error } = await supabase
      .from('archivos')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error de Supabase:', error.message);

      return res.status(500).json({
        servidor: 'funcionando',
        supabase: 'error',
        mensaje: 'No se pudo consultar la tabla archivos',
      });
    }

    return res.json({
      servidor: 'funcionando',
      supabase: 'conectado',
      tabla: 'archivos accesible',
    });
  } catch (error) {
    console.error('Error inesperado:', error.message);

    return res.status(500).json({
      servidor: 'funcionando',
      supabase: 'error',
    });
  }
});

// Iniciar sesión con Google.
app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/drive.file',
    ],
    accessType: 'offline',
    prompt: 'consent',
    includeGrantedScopes: true,
  })
);

// Callback de Google.
app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${CLIENT_URL}/?error=google`,
  }),
  (req, res) => {
    res.redirect(CLIENT_URL);
  }
);

// Consultar la sesión sin exponer los tokens.
app.get('/api/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      autenticado: false,
      mensaje: 'No has iniciado sesión',
    });
  }

  return res.json({
    autenticado: true,
    usuario: {
      id: req.user.id,
      nombre: req.user.nombre,
      correo: req.user.correo,
      foto: req.user.foto,
    },
  });
});

// Cerrar sesión.
app.post('/auth/logout', (req, res, next) => {
  req.logout((error) => {
    if (error) {
      return next(error);
    }

    req.session.destroy((error) => {
      if (error) {
        return next(error);
      }

      res.clearCookie('prototipo.sid', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return res.json({
        mensaje: 'Sesión cerrada correctamente',
      });
    });
  });
});

// Subir un archivo a Drive y registrar sus datos en Supabase.
app.post(
  '/api/archivos/upload',
  requiereAutenticacion,
  upload.single('archivo'),
  async (req, res) => {
    let drive;
    let archivoDriveId;

    try {
      if (!req.file) {
        return res.status(400).json({
          mensaje: 'Debes seleccionar un archivo.',
        });
      }

      drive = obtenerClienteDrive(req.user);

      // 1. Buscar la carpeta o crearla si no existe.
      const carpetaId = await obtenerOCrearCarpeta(drive);

      // 2. Subir el archivo dentro de esa carpeta.
      const resultado = await drive.files.create({
        requestBody: {
          name: req.file.originalname,
          mimeType: req.file.mimetype,
          parents: [carpetaId],
        },
        media: {
          mimeType: req.file.mimetype,
          body: Readable.from(req.file.buffer),
        },
        fields: 'id,name,mimeType',
      });

      archivoDriveId = resultado.data.id;

      // 3. Registrar los metadatos en Supabase.
      const { data, error } = await supabase
        .from('archivos')
        .insert({
          usuario_google_id: req.user.id,
          nombre_archivo: resultado.data.name,
          drive_file_id: archivoDriveId,
        })
        .select('id,nombre_archivo,drive_file_id,fecha_carga')
        .single();

      if (error) {
        console.error(
          'Error al registrar el archivo en Supabase:',
          error.message
        );

        // Intentar evitar un archivo sin registro.
        try {
          await drive.files.delete({
            fileId: archivoDriveId,
          });
        } catch (errorDrive) {
          console.error(
            'No se pudo eliminar el archivo de Drive:',
            errorDrive.message
          );
        }

        return res.status(500).json({
          mensaje: 'El archivo se subió, pero no pudo registrarse.',
        });
      }

      return res.status(201).json({
        mensaje: 'Archivo subido correctamente.',
        archivo: data,
      });
    } catch (error) {
      console.error('Error al subir el archivo:', error.message);

      // Limpiar el archivo si ya se había subido a Drive.
      if (drive && archivoDriveId) {
        try {
          await drive.files.delete({
            fileId: archivoDriveId,
          });
        } catch (errorDrive) {
          console.error(
            'No se pudo limpiar el archivo de Drive:',
            errorDrive.message
          );
        }
      }

      return res.status(500).json({
        mensaje: 'No se pudo subir el archivo.',
      });
    }
  }
);

// Consultar únicamente los archivos del usuario autenticado.
app.get(
  '/api/archivos',
  requiereAutenticacion,
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('archivos')
        .select('id,nombre_archivo,drive_file_id,fecha_carga')
        .eq('usuario_google_id', req.user.id)
        .order('fecha_carga', { ascending: false });

      if (error) {
        console.error(
          'Error al consultar archivos:',
          error.message
        );

        return res.status(500).json({
          mensaje: 'No se pudieron consultar los archivos.',
        });
      }

      return res.json({
        archivos: data,
      });
    } catch (error) {
      console.error('Error inesperado:', error.message);

      return res.status(500).json({
        mensaje: 'Ocurrió un error al consultar los archivos.',
      });
    }
  }
);

// Descargar un archivo.
app.get(
  '/api/archivos/:id/descargar',
  requiereAutenticacion,
  async (req, res) => {
    try {
      const { data: archivo, error } = await supabase
        .from('archivos')
        .select('id,nombre_archivo,drive_file_id')
        .eq('id', req.params.id)
        .eq('usuario_google_id', req.user.id)
        .single();

      if (error || !archivo) {
        return res.status(404).json({
          mensaje:
            'Archivo no encontrado o no tienes permiso para descargarlo.',
        });
      }

      const drive = obtenerClienteDrive(req.user);

      const metadatos = await drive.files.get({
        fileId: archivo.drive_file_id,
        fields: 'id,name,mimeType',
      });

      const tipoMime =
        metadatos.data.mimeType || 'application/octet-stream';

      const resultado = await drive.files.get(
        {
          fileId: archivo.drive_file_id,
          alt: 'media',
        },
        {
          responseType: 'stream',
        }
      );

      res.setHeader('Content-Type', tipoMime);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(archivo.nombre_archivo)}`
      );

      resultado.data.on('error', (error) => {
        console.error(
          'Error al descargar desde Drive:',
          error.message
        );

        if (!res.headersSent) {
          res.status(500).end('No se pudo descargar el archivo.');
        } else {
          res.destroy(error);
        }
      });

      resultado.data.pipe(res);

    } catch (error) {
      console.error(
        'Error al descargar el archivo:',
        error.message
      );

      if (!res.headersSent) {
        if (Number(error.code) === 404) {
          return res.status(404).json({
            mensaje:
              'El archivo ya no existe en Google Drive o no está disponible. Puedes actualizar la lista de archivos.',
          });
        }

        return res.status(500).json({
          mensaje: 'No se pudo descargar el archivo. Inténtalo de nuevo.',
        });
      }

      res.destroy(error);
    }

  }
);

// Eliminar un archivo de Drive y su registro en Supabase.
app.delete(
  '/api/archivos/:id',
  requiereAutenticacion,
  async (req, res) => {
    try {
      const { data: archivo, error: errorConsulta } = await supabase
        .from('archivos')
        .select('id,nombre_archivo,drive_file_id')
        .eq('id', req.params.id)
        .eq('usuario_google_id', req.user.id)
        .single();

      if (errorConsulta || !archivo) {
        return res.status(404).json({
          mensaje:
            'Archivo no encontrado o no tienes permiso para eliminarlo.',
        });
      }


      const drive = obtenerClienteDrive(req.user);

      let yaNoExisteEnDrive = false;

      try {
        await drive.files.delete({
          fileId: archivo.drive_file_id,
        });
      } catch (errorDrive) {
        if (Number(errorDrive.code) === 404) {
          // El archivo ya no está disponible en Drive.
          // Aun así, debemos limpiar su registro de Supabase.
          yaNoExisteEnDrive = true;
        } else {
          throw errorDrive;
        }
      }


      const { error: errorEliminacion } = await supabase
        .from('archivos')
        .delete()
        .eq('id', archivo.id)
        .eq('usuario_google_id', req.user.id);

      if (errorEliminacion) {
        console.error(
          'El archivo se eliminó de Drive, pero falló Supabase:',
          errorEliminacion.message
        );

        return res.status(500).json({
          mensaje:
            'El archivo se eliminó de Drive, pero no se pudo eliminar su registro de Supabase.',
        });
      }

      return res.json({
        mensaje: yaNoExisteEnDrive
          ? 'El archivo ya no estaba en Drive. Se eliminó su registro de la aplicación.'
          : 'Archivo eliminado correctamente.',
      });
    } catch (error) {
      console.error(
        'Error al eliminar el archivo:',
        error.message
      );

      return res.status(500).json({
        mensaje: 'No se pudo eliminar el archivo de Google Drive.',
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(
    `Servidor Express disponible en http://localhost:${PORT}`
  );
});
