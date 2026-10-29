
import { useEffect, useState } from 'react';

// URL del backend configurada mediante una variable de entorno.
const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000'
).replace(/\/$/, '');

// Redirigir a Google si una petición protegida devuelve 401.
function redirigirAlLoginSiExpira(respuesta) {
  if (respuesta.status === 401) {
    window.location.href = `${API_URL}/auth/google`;
    return true;
  }

  return false;
}

function App() {
  const [usuario, setUsuario] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Consultar la sesión del usuario al abrir la aplicación.
  useEffect(() => {
    async function consultarSesion() {
      try {
        const respuesta = await fetch(`${API_URL}/api/me`, {
          credentials: 'include',
        });

        if (!respuesta.ok) {
          setUsuario(null);
          return;
        }

        const datos = await respuesta.json();
        setUsuario(datos.usuario);
      } catch {
        setError('No se pudo conectar con Express.');
      } finally {
        setCargando(false);
      }
    }

    consultarSesion();
  }, []);

  // Consultar los archivos del usuario autenticado.
  async function cargarArchivos() {
    try {
      const respuesta = await fetch(`${API_URL}/api/archivos`, {
        credentials: 'include',
      });

      if (redirigirAlLoginSiExpira(respuesta)) return;

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudieron consultar los archivos.'
        );
      }

      setArchivos(datos.archivos);
      setError('');
    } catch (error) {
      setError(error.message);
    }
  }

  // Cargar los archivos después de comprobar la sesión.
  useEffect(() => {
    if (usuario) {
      cargarArchivos();
    }
  }, [usuario]);

  // Subir un archivo a Google Drive.
  async function subirArchivo(event) {
    event.preventDefault();

    if (!archivoSeleccionado) {
      setError('Primero selecciona un archivo.');
      return;
    }

    setSubiendo(true);
    setMensaje('');
    setError('');

    try {
      const formulario = new FormData();
      formulario.append('archivo', archivoSeleccionado);

      const respuesta = await fetch(`${API_URL}/api/archivos/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formulario,
      });

      if (redirigirAlLoginSiExpira(respuesta)) return;

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo subir el archivo.'
        );
      }

      setMensaje(datos.mensaje);
      setArchivoSeleccionado(null);
      event.target.reset();

      await cargarArchivos();
    } catch (error) {
      setError(error.message);
    } finally {
      setSubiendo(false);
    }
  }

  // Descargar un archivo.
  async function descargarArchivo(id, nombreArchivo) {
    setError('');
    setMensaje('');

    try {
      const respuesta = await fetch(
        `${API_URL}/api/archivos/${id}/descargar`,
        {
          credentials: 'include',
        }
      );

      if (redirigirAlLoginSiExpira(respuesta)) return;

      if (!respuesta.ok) {
        let mensajeError = 'No se pudo descargar el archivo.';

        try {
          const datos = await respuesta.json();
          mensajeError = datos.mensaje || mensajeError;
        } catch {
          // La respuesta no contenía JSON.
        }

        throw new Error(mensajeError);
      }

      const archivoBlob = await respuesta.blob();
      const url = URL.createObjectURL(archivoBlob);
      const enlace = document.createElement('a');

      enlace.href = url;
      enlace.download = nombreArchivo;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setError(error.message);
    }
  }

  // Eliminar un archivo.
  async function eliminarArchivo(id, nombreArchivo) {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar "${nombreArchivo}"? Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    setError('');
    setMensaje('');

    try {
      const respuesta = await fetch(`${API_URL}/api/archivos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (redirigirAlLoginSiExpira(respuesta)) return;

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo eliminar el archivo.'
        );
      }

      setMensaje(datos.mensaje);
      await cargarArchivos();
    } catch (error) {
      setError(error.message);
    }
  }

  // Cerrar sesión.
  async function cerrarSesion() {
    setError('');
    setMensaje('');

    try {
      const respuesta = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo cerrar la sesión.'
        );
      }

      setUsuario(null);
      setArchivos([]);
      setArchivoSeleccionado(null);
      setMensaje('Sesión cerrada correctamente.');
    } catch (error) {
      setError(error.message);
    }
  }

  if (cargando) {
    return <h1>Comprobando sesión...</h1>;
  }

  return (
    <main>
      <h1>Prototipo de Google Drive</h1>

      {mensaje && <p>{mensaje}</p>}
      {error && <p role="alert">Error: {error}</p>}

      {!usuario ? (
        <section>
          <p>Inicia sesión para administrar tus archivos.</p>

          <a href={`${API_URL}/auth/google`}>
            Iniciar sesión con Google
          </a>
        </section>
      ) : (
        <>
          <section>
            <h2>Bienvenido</h2>

            {usuario.foto && (
              <img
                src={usuario.foto}
                alt="Foto de perfil"
                width="80"
              />
            )}

            <p>
              <strong>Nombre:</strong> {usuario.nombre}
            </p>

            <p>
              <strong>Correo:</strong> {usuario.correo}
            </p>

            <button onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </section>

          <hr />

          <section>
            <h2>Subir archivo</h2>

            <form onSubmit={subirArchivo}>
              <input
                type="file"
                onChange={(event) => {
                  setArchivoSeleccionado(
                    event.target.files?.[0] ?? null
                  );
                  setError('');
                  setMensaje('');
                }}
              />

              <button
                type="submit"
                disabled={!archivoSeleccionado || subiendo}
              >
                {subiendo ? 'Subiendo...' : 'Subir archivo'}
              </button>
            </form>

            {archivoSeleccionado && (
              <div>
                <p>
                  Archivo seleccionado: {archivoSeleccionado.name}
                </p>

                <p>
                  Tamaño:{' '}
                  {(archivoSeleccionado.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            <p>Tamaño máximo permitido: 10 MB.</p>
          </section>

          <hr />

          <section>
            <h2>Mis archivos</h2>

            <button onClick={cargarArchivos}>
              Actualizar lista
            </button>

            {archivos.length === 0 ? (
              <p>Aún no tienes archivos registrados.</p>
            ) : (
              <table className="tabla-archivos">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Fecha de carga</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {archivos.map((archivo) => (
                    <tr key={archivo.id}>
                      <td>{archivo.nombre_archivo}</td>

                      <td>
                        {archivo.fecha_carga
                          ? new Date(
                              archivo.fecha_carga
                            ).toLocaleString()
                          : 'Sin fecha'}
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            descargarArchivo(
                              archivo.id,
                              archivo.nombre_archivo
                            )
                          }
                        >
                          Descargar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            eliminarArchivo(
                              archivo.id,
                              archivo.nombre_archivo
                            )
                          }
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default App;
