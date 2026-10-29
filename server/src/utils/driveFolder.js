
export async function obtenerOCrearCarpeta(drive) {
  const nombreCarpeta = 'Prototipo Drive';

  const respuesta = await drive.files.list({
    q: `name = '${nombreCarpeta}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 100,
  });

  if (respuesta.data.files?.length > 0) {
    return respuesta.data.files[0].id;
  }

  const carpeta = await drive.files.create({
    requestBody: {
      name: nombreCarpeta,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id, name',
  });

  return carpeta.data.id;
}
