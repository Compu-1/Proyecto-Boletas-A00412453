# Icesi Live Arena — Reserva de boletas

Aplicación distribuida de reserva de boletas para el curso Computación en Internet I. El backend está desarrollado en Java con ZeroC Ice y el frontend en JavaScript Vanilla con Webpack. El navegador se comunica con el servidor usando el protocolo Ice sobre WebSocket; no se usan frameworks de interfaz.

## Requisitos

- Java 17 instalado y disponible como `java` en la terminal.
- Node.js y npm instalados.
- PowerShell en Windows. El repositorio incluye Gradle Wrapper, por lo que no es necesario instalar Gradle globalmente.
- Puertos locales `10000`, `10002` y `3000` disponibles.

Comprueba las herramientas desde PowerShell:

```powershell
java -version
node --version
npm.cmd --version
```

El proyecto Java configura compatibilidad con Java 17. Gradle Wrapper usa Gradle 8.10 y descarga las dependencias necesarias en la primera ejecución.

## Estructura

```text
Proyecto-Boletas-A00412453/
├── client-js/                         # SPA Vanilla JS y configuración de Webpack
│   ├── src/
│   │   ├── components/                # Encabezado, plano, carrito y modales
│   │   ├── generated/                  # Proxy JavaScript generado desde Slice
│   │   ├── services/                  # Conexión Ice y operaciones de negocio
│   │   ├── state/                     # Estado compartido reactivo
│   │   ├── styles/                    # CSS por componente
│   │   └── utils/                     # Sesión y temporizador
│   ├── package.json
│   └── webpack.config.js
├── codigo_base/
│   ├── common/src/main/slice/          # Contrato BookingService.ice
│   ├── server/                         # Servidor Java ZeroC Ice
│   ├── client/                         # Cliente Java y prueba concurrente
│   ├── gradlew.bat                     # Gradle Wrapper para Windows
│   └── build.gradle                    # Configuración Java 17 y tareas
├── VIDEO_SCRIPT_C2.md                  # Guion del video de demostración
└── DOCS/
    ├── AGENT_WORKLOG.md                # Registro del trabajo
    ├── RUBRIC_CHECKLIST.md             # Lista de rúbrica y evidencia
    └── evidence/                       # Evidencias de pruebas
```

## Ejecutar en Windows

Abre dos terminales de PowerShell desde la raíz del repositorio.

**Terminal 1 — backend**

```powershell
cd C:\Proyecto-Boletas-A00412453\codigo_base
.\gradlew.bat runServer
```

El servidor atiende clientes Java por TCP en el puerto `10000` y navegadores por WebSocket en el puerto `10002`. Mantén esta terminal abierta.

**Terminal 2 — frontend**

```powershell
cd C:\Proyecto-Boletas-A00412453\client-js
npm.cmd install
npm.cmd start
```

Webpack inicia el servidor de desarrollo en `http://localhost:3000` y abre el navegador. Si la página no se abre automáticamente, visita esa dirección. El backend debe estar activo para que las operaciones RPC funcionen.

## Compilar el frontend para producción

Desde PowerShell:

```powershell
cd C:\Proyecto-Boletas-A00412453\client-js
npm.cmd run build
```

Webpack genera los archivos estáticos en `client-js\dist\`. Para probarlos en producción, sírvelos con un servidor de archivos estáticos y mantén el backend accesible desde el navegador. La configuración actual del frontend apunta a `localhost`; para otro equipo se debe cambiar el host en `client-js\src\services\iceClient.js` (`ICE_CONFIG.host`) y reconstruir.

Como opción para una vista previa local de los archivos generados, puedes servir `dist` con `http-server` usando `npx`:

```powershell
cd C:\Proyecto-Boletas-A00412453\client-js
npx.cmd --yes http-server .\dist -p 8080
```

La primera ejecución puede descargar `http-server`. Luego abre `http://localhost:8080`.

## Prueba de concurrencia corregida

La prueba usa diez clientes simultáneos para competir por `A-1`, valida que solo uno obtenga el bloqueo y comprueba la exclusión mutua entre compra y liberación, el estado final y el aforo total de 90 sillas.

1. Inicia el servidor con el comando anterior.
2. En otra terminal, inicia el cliente Java interactivo y elige la opción `8` para reiniciar las sillas. Luego elige `0` para salir:

   ```powershell
   cd C:\Proyecto-Boletas-A00412453\codigo_base
   .\gradlew.bat :client:runClient
   ```

3. Ejecuta la prueba automatizada:

   ```powershell
   .\gradlew.bat :client:runClient --args="--test-concurrency"
   ```

El resultado esperado incluye `1` bloqueo exitoso, `9` rechazos, aforo con suma `90` y el mensaje `[OK - PRUEBA INTEGRAL SUPERADA CON ÉXITO]`. La prueba puede dejar `A-1` vendida o disponible según cuál operación concurrente gane; reinicia el inventario con la opción `8` antes de repetirla o de hacer una demostración limpia en el navegador.

La evidencia histórica de las cinco corridas está en `DOCS\evidence\concurrency-despues.txt`.

## Arquitectura resumida

- **Contrato:** `BookingService.ice` define las operaciones RPC y los tipos compartidos entre Java y JavaScript. Gradle compila el contrato para el backend; el cliente web usa el proxy generado en `client-js\src\generated\BookingService.js`.
- **Backend:** `BookingServiceImpl` administra las 90 sillas, sus bloqueos de 90 segundos, las compras y la sincronización de operaciones concurrentes. `BookingServerApp` publica los adaptadores TCP y WebSocket.
- **Frontend:** `client-js\src\index.js` conecta los componentes y coordina las acciones. `services\bookingApi.js` reúne operaciones del servicio; `services\iceClient.js` crea el proxy WebSocket. `state\store.js` comparte el estado; `components\` contiene las vistas y `styles\` sus CSS.
- **Flujo de una operación:** el usuario actúa en un componente, el frontend llama al servicio mediante ZeroC Ice, el servidor valida y cambia el inventario, y la respuesta actualiza el estado y la interfaz.
- **Temporizador:** el navegador presenta el tiempo restante usando la expiración informada por el backend. La validez real del bloqueo y de la compra la decide el servidor.

