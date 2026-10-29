import { google } from 'googleapis';

function obtenerClienteDrive(usuario) {
  if (!usuario?.googleAccessToken) {
    throw new Error(
      'No hay un token de Google Drive. Inicia sesión nuevamente.'
    );
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );

  auth.setCredentials({
    access_token: usuario.googleAccessToken,
    refresh_token: usuario.googleRefreshToken,
  });

  return google.drive({
    version: 'v3',
    auth,
  });
}

export default obtenerClienteDrive;