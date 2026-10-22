# Comportamiento (común)

Compórtate como un programador web fullstack junior, antes de hacer nada, reflexiona y redacta por pasos todo lo que vas a hacer, para entenderlo y para darte el okey para proceder con el código. Con cualquier duda siempre preguntarás, no darás nada por hecho.

Este es el `AGENTS.md` del **front-end**. El proyecto tiene dos repositorios, cada uno con su propio `AGENTS.md`: [backend-proyecto-final](https://github.com/AaronPvon/backend-proyecto-final) y [frontend-proyecto-final](https://github.com/AaronPvon/frontend-proyecto-final).

Toda decisión nueva que se tome sobre el proyecto se documentará en el `AGENTS.md` del repositorio afectado. Las secciones marcadas con **(común)** están en los dos archivos y deben ser idénticas: si cambia una de ellas, se actualiza en los dos repositorios.

# Objetivo (común)

Desarrollar una aplicación web (SPA) con un front-end desarrollado en [Angular v22](https://angular.dev/events/v22) y un back-end formado por una API REST creada con Python y FastAPI que se conecta a una base de datos MySQL 8.

El back-end en Python con FastAPI y la base de datos MySQL son obligatorios: es lo que exige el proyecto y son las herramientas aprendidas. No se sustituyen por otras.

# Definición del Proyecto (común)

Nombre de la app: "A Pachas"

Aplicación para dividir gastos compartidos que se adapte a cualquier situación: una cena de amigos, un regalo de cumpleaños, un viaje, los gastos de una casa compartida, etc.

El proyecto se basa en el enunciado "Compartir gastos" (`docs/Compartir_gastos.pdf`, copiado en los dos repositorios). En caso de conflicto entre el enunciado y este archivo, prevalece el enunciado, salvo que aquí se documente expresamente otra decisión.

La gestión de pagos reales (transferencias, Bizum, etc.) se realiza fuera de la aplicación. La app solo registra y calcula.

## Repositorios del proyecto (común)

El proyecto se divide en dos repositorios:

- Back-end: [backend-proyecto-final](https://github.com/AaronPvon/backend-proyecto-final). API REST con FastAPI en la raíz del repositorio (sin carpeta `backend/`) y carpeta `database/` con el script y el diagrama.
- Front-end: [frontend-proyecto-final](https://github.com/AaronPvon/frontend-proyecto-final). Proyecto de Angular en la raíz del repositorio.

En local, los dos repositorios están dentro de una carpeta de trabajo `proyecto_final/` (`proyecto_final/backend/` y `proyecto_final/frontend/`, cada una con su propio `.git`). Esa carpeta no es un repositorio: no contiene archivos del proyecto.

```
backend-proyecto-final/
├── README.md
├── AGENTS.md
├── docs/              # Compartir_gastos.pdf (enunciado)
├── database/          # a_pachas.sql y diagrama_er.mermaid
└── (main.py, core/, db/, models/, controllers/, routes/...)

frontend-proyecto-final/
├── README.md
├── AGENTS.md
├── docs/              # Compartir_gastos.pdf (enunciado)
└── (proyecto de Angular: src/, public/, package.json...)
```

- Cada repositorio tiene su `README.md` y su `AGENTS.md`, y es autosuficiente. Los dos README enlazan al otro repositorio.
- Cada README repite la descripción, las funcionalidades y la autoría, y explica solo la puesta en marcha de su parte. El del back explica también cómo crear el usuario de MySQL `a_pachas_user` (`CREATE USER` + `GRANT ALL PRIVILEGES ON a_pachas_db.*`).
- El `AGENTS.md` y el `README.md` generales (del antiguo repositorio único) se reparten entre los dos repositorios y se borran, para que no haya tres versiones que se desincronicen.

## Conceptos clave (común)

- **Grupo**: conjunto de usuarios que comparten gastos. Tiene título, descripción, presupuesto opcional y moneda.
- **Creador**: usuario que crea el grupo. Es el único que lo gestiona (ver Roles y permisos). No existen varios administradores por grupo.
- **Miembro**: usuario con estado `accepted` en un grupo. El creador siempre es miembro de sus grupos.
- **Gasto**: dinero que un miembro ha pagado en nombre del grupo (antes llamado "pago").
- **Reparto**: parte de un gasto que corresponde a cada participante.
- **Liquidación**: transferencia entre dos miembros para saldar una deuda (ej. un Bizum de Luis a Ana).
- **Saldo**: lo que cada miembro debe o le deben dentro del grupo. Se calcula, no se guarda.
- **Presupuesto**: cantidad objetivo opcional del grupo (antes llamado "total"). Es solo informativo y no afecta a ningún cálculo.
- **Estado del grupo**: `active` (se puede gestionar) o `closed` (solo lectura). Los grupos nunca se borran.

## Principios del ciclo de vida (común)

Todo el ciclo de vida de grupos y miembros se resume en estas reglas:

1. Los grupos nunca se borran. Solo el creador los cierra (con aviso si hay saldos pendientes) y los reabre.
2. El creador nunca sale de sus grupos. Si quiere desentenderse de uno, lo cierra.
3. Un miembro sale del grupo, por voluntad propia o expulsado, solo si su saldo es 0. Después pasa a `left` y deja de ver el grupo.
4. Las invitaciones pendientes, rechazadas o anuladas se borran.
5. Solo los miembros `accepted` ven el grupo, esté activo o cerrado.

## Roles y permisos (común)

Solo existe un gestor por grupo: su creador. El resto de miembros únicamente visualizan los datos.

| Acción                                       | Creador                    | Miembro              | Invitado pendiente |
| -------------------------------------------- | -------------------------- | -------------------- | ------------------ |
| Editar el grupo                              | Sí                         | No                   | No                 |
| Cerrar y reabrir el grupo                    | Sí                         | No                   | No                 |
| Invitar usuarios                             | Sí                         | No                   | No                 |
| Expulsar miembros (solo con saldo 0)         | Sí                         | No                   | No                 |
| Abandonar el grupo                           | No (lo cierra en su lugar) | Sí, solo con saldo 0 | No                 |
| Crear, editar y eliminar gastos              | Sí                         | No                   | No                 |
| Registrar, editar y eliminar liquidaciones   | Sí                         | No                   | No                 |
| Ver gastos, repartos, liquidaciones y saldos | Sí                         | Sí                   | No                 |
| Ver título, descripción y creador del grupo  | Sí                         | Sí                   | Sí                 |
| Aceptar o rechazar la invitación             | —                          | —                    | Sí                 |

Un usuario con estado `left` no tiene ningún permiso sobre el grupo y no lo ve.

Si un usuario pide un grupo del que no es miembro (o del que salió, `left`), la API responde 404 y no 403, igual que si el grupo no existiera. Así, quien vaya probando ids no puede saber qué grupos existen.

Un invitado `pending` también recibe 404 en todos los endpoints de grupo. El título, la descripción y el creador del grupo, que sí puede ver, los recibe a través de `GET /api/invitations`, que es donde los necesita para decidir si acepta.

En un grupo cerrado nadie puede hacer cambios: solo se permite visualizar. La única excepción es que el creador puede reabrirlo.

Los permisos se comprueban siempre en la API, no solo en el front-end, centralizados en una única función de permisos que tenga en cuenta también el estado del grupo.

## Front-End

- La app siempre muestra un navbar, el contenido y un footer.
- El navbar contiene el logotipo de la app y los enlaces de navegación:
  - Sin sesión iniciada: Inicio, Login y Register.
  - Con sesión iniciada: Inicio, Mis grupos, Invitaciones y Cerrar sesión.

### Rutas

| Ruta           | Acceso             | Contenido                                                                                                                                                                                                                                    |
| -------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`            | Pública            | Página de inicio. Por el momento muestra "¡Bienvenido!" de forma genérica y, con sesión iniciada, "¡Bienvenido, {{ nombre }}!" con el nombre del usuario.                                                                                    |
| `/login`       | Pública            | Formulario de login: email o nickname, y contraseña.                                                                                                                                                                                         |
| `/register`    | Pública            | Formulario de registro: nombre, apellidos, nickname, email, contraseña y repetir contraseña. Tras registrarse se redirige a `/login`.                                                                                                        |
| `/groups`      | Privada            | Listado "Mis grupos": grupos en los que el usuario es miembro `accepted`. Tiene un filtro que por defecto muestra los grupos activos; los cerrados se consultan cambiando el filtro y se abren en modo solo lectura. Botón para crear grupo. |
| `/groups/new`  | Privada            | Formulario de creación de grupo: título, descripción, presupuesto (opcional) y moneda.                                                                                                                                                       |
| `/groups/:id`  | Privada (miembros) | Detalle del grupo: gastos, liquidaciones, saldos y, si existe, progreso del gasto frente al presupuesto. El creador ve además los controles de gestión.                                                                                      |
| `/invitations` | Privada            | Invitaciones pendientes del usuario, con opción de aceptar o rechazar.                                                                                                                                                                       |

### Tecnología y configuración

- Proyecto creado con Angular 22.2 (`ng new frontend --style=tailwind --ssr=false --skip-tests`), sin zone.js. Requiere Node `^22.22.3`, `^24.15.0` o `>=26`.
- Se usan los scripts por defecto de Angular: `npm start` (`ng serve`, en `http://localhost:4200`) y `npm run build`.
- La URL de la API se define en `src/environments/environment.ts` (`apiUrl: 'http://localhost:8000/api'`). Para desplegar basta con cambiar ese valor.
- `http://localhost:4200` debe figurar en la variable `CORS_ORIGINS` de la API.
- Formularios reactivos (`ReactiveFormsModule`), con las mismas validaciones que la API.
- Idioma `es-ES` (`LOCALE_ID`) para los pipes `currency` y `date`: los importes se muestran como "176,66 €". Se convierten a número solo para mostrarlos.
- Los parámetros de ruta llegan a los componentes como `input()` (`withComponentInputBinding`).

### Estructura del proyecto

- `public/logo.svg`: logotipo y favicon.
- `src/environments/environment.ts`: URL de la API.
- `src/styles.css`: tokens de Tailwind y clases reutilizables de CSS propio (`field-input`, `btn`, `alert-error`, `.panel`, `.text-gradient`...).
- Estructura de `src/app/`: `core/` (`components/`, `guards/`, `interceptors/`, `interfaces/` y `utils/`) y `features/` con una carpeta por funcionalidad (`home/`, `users/` y `groups/`), cada una con `pages/` y `services/`.

### Autenticación en el cliente

- El token se guarda en `localStorage` (`a_pachas_token`). Al arrancar, la app recupera el usuario con `GET /api/users/me`.
- Un interceptor añade el token a cada petición en la cabecera `Authorization: Bearer <token>`, solo si va dirigida a la URL de la API. Si la API responde 401 (token caducado o no válido), se cierra la sesión y se redirige a `/login`, salvo en `POST /api/auth/login`, donde un 401 significa "Credenciales incorrectas".
- `authGuard` protege las rutas privadas y `guestGuard` redirige a `/groups` a quien ya ha iniciado sesión y entra en `/login` o `/register`.
- Tras el login se redirige a `/groups`. Tras el registro, a `/login?registered=1`, que muestra "Cuenta creada".
- Los permisos reales los comprueba siempre la API; el front-end solo oculta los controles que el usuario no puede usar.

### Diseño

- Diseño oscuro y futurista: fondo azul noche (`night`) con resplandores azules y una rejilla suave; contenido en cajas flotantes (`.panel`: cristal azulado con `backdrop-blur`, borde azul claro y sombra con brillo azul); títulos con degradado (`.text-gradient`); tipografías Sora (títulos) y Public Sans (texto).
- Colores globales (`styles.css`): `light-blue` #19b0d4, `dark-blue` #1e293b y `orange` #f5684a, más colores de apoyo en la gama de azules (`night`, `deep-blue`, `frost`, `muted`) y de significado (`owed` verde y `owes` rojo, claros para leerse sobre fondo oscuro). Los botones naranjas llevan el texto en `dark-blue`, porque el blanco no cumple el contraste mínimo.
- Logotipo: moneda en degradado azul (`light-blue` a `deep-blue`) cortada en diagonal por una línea `orange`, sobre un cuadrado redondeado de cristal azul oscuro con borde luminoso. Está en `public/logo.svg` (también es el favicon) y en el componente `core/components/logo`, que genera ids únicos para sus degradados.

### Páginas de grupos

- El filtro de "Mis grupos" va en la URL (`/groups?status=closed`).
- El presupuesto admite coma o punto en el formulario y se envía a la API como texto con punto ("150.50").
- Al crear un grupo, se redirige a su detalle.
- `/groups/abc` (422) y un grupo ajeno o inexistente (404) muestran el mismo mensaje: "Grupo no encontrado".
- Al abrir la página del grupo, las peticiones de cada parte (detalle, saldos...) se lanzan a la vez con `forkJoin`.

### Contrato con la API

La API está en [backend-proyecto-final](https://github.com/AaronPvon/backend-proyecto-final) y su documentación interactiva en `http://localhost:8000/docs`. Todas las rutas llevan el prefijo `/api`.

| Método   | Ruta                                       | Acceso                  | Respuesta                                                  |
| -------- | ------------------------------------------ | ----------------------- | ---------------------------------------------------------- |
| `GET`    | `/api/health`                              | Pública                 | Estado de la API y la base de datos.                       |
| `POST`   | `/api/auth/register`                       | Pública                 | 201 con el usuario creado.                                 |
| `POST`   | `/api/auth/login`                          | Pública                 | `{"access_token": "...", "token_type": "bearer"}`.         |
| `GET`    | `/api/users/me`                            | Con sesión              | Usuario actual.                                            |
| `GET`    | `/api/groups?status=active\|closed`        | Con sesión              | "Mis grupos".                                              |
| `POST`   | `/api/groups`                              | Con sesión              | 201 con el grupo creado.                                   |
| `GET`    | `/api/groups/{group_id}`                   | Miembro                 | Datos, creador, miembros y total gastado.                  |
| `GET`    | `/api/groups/{group_id}/balances`          | Miembro                 | Saldo de cada miembro.                                     |
| `GET`    | `/api/groups/{group_id}/invitations`       | Miembro                 | Invitaciones pendientes del grupo.                         |
| `POST`   | `/api/groups/{group_id}/invitations`       | Creador                 | Body `{"login": "<email o nickname>"}`. 201 con la invitación. |
| `DELETE` | `/api/groups/{group_id}/invitations/{user_id}` | Creador             | Anula la invitación. 204.                                  |
| `POST`   | `/api/groups/{group_id}/leave`             | Miembro (no el creador) | Sale del grupo, solo con saldo 0. 204.                     |
| `DELETE` | `/api/groups/{group_id}/members/{user_id}` | Creador                 | Expulsa a un miembro, solo con saldo 0. 204.               |
| `GET`    | `/api/invitations`                         | Con sesión              | Mis invitaciones pendientes, con título, descripción y creador del grupo. |
| `POST`   | `/api/invitations/{group_id}/accept`       | Invitado                | Acepta la invitación. 204.                                 |
| `DELETE` | `/api/invitations/{group_id}`              | Invitado                | Rechaza la invitación. 204.                                |

Pendientes en la API: `GET` y `POST /api/groups/{group_id}/expenses` (fase 4), liquidaciones (fase 5) y cierre y reapertura (fase 6).

- `POST /api/auth/login` recibe JSON: `{"login": "<email o nickname>", "password": "..."}`. El token caduca a los 60 minutos y no hay refresh token.
- Los importes viajan como texto (`"176.66"`) para que sean exactos.
- Los datos de usuario dentro de un grupo son id, nombre, apellidos y nickname. Nunca el email.
- Errores de grupo, en este orden: 404 "Grupo no encontrado" (no existe o no eres miembro `accepted`), 403 "Solo el creador del grupo puede hacer esto" y 409 "El grupo está cerrado".
- Autenticación: 401 "No autenticado" si falta la cabecera, "Token no válido o caducado" en el resto de casos y "Credenciales incorrectas" en el login.
- Duplicados (email, nickname o invitación pendiente): 409. Datos no válidos: 422.

## Reglas de negocio (común)

### Usuarios

- El email y el nickname son únicos.
- El nickname tiene entre 3 y 50 caracteres y solo puede contener letras sin tildes ni ñ (`A-Z`, `a-z`), números, `_`, `.` y `-` (patrón `^[A-Za-z0-9_.-]{3,50}$`). Nunca puede contener `@`, para que no se confunda con un email en el login.
- La contraseña debe tener entre 8 y 128 caracteres. El máximo no es una regla de seguridad para el usuario, sino una protección del servidor: calcular un hash Argon2 es lento a propósito. Por el momento no se exigen más reglas.
- En el login solo se exige que la contraseña no llegue vacía (y el máximo de 128), para que los usuarios con contraseñas antiguas puedan entrar si algún día cambian las reglas.
- Al registrarse se quitan los espacios del principio y del final del nombre, los apellidos y el nickname, pero nunca de la contraseña.
- Las reglas del nickname y de la contraseña se validan solo en la API (modelos Pydantic), no con `CHECK` en la base de datos.
- El login se hace con email o nickname (en el mismo campo) y contraseña. Si el usuario no existe o la contraseña es incorrecta, la API devuelve el mismo error, para no revelar qué cuentas existen.
- La contraseña nunca se guarda en claro: se almacena su hash con Argon2id (librería argon2-cffi). No es reversible. Se mantiene Argon2id aunque en un ejercicio de clase se usó bcrypt, porque está decidido desde el inicio y los hashes de los datos de prueba son Argon2id.
- La eliminación de cuenta queda fuera del alcance inicial (ver Funcionalidades futuras).

### Grupos

- El título es obligatorio (entre 1 y 100 caracteres) y la descripción opcional (máximo 1000). Se quitan los espacios del principio y del final, y una descripción en blanco se guarda como `NULL`.
- La moneda se elige de una lista cerrada: `EUR` (por defecto) o `USD`. Se valida solo en la API; la columna sigue siendo `CHAR(3)`, así que para añadir otra moneda basta con incluirla en la lista del modelo.
- Los datos de usuario que se muestran dentro de un grupo (creador, miembros y saldos) son id, nombre, apellidos y nickname. Nunca el email: los compañeros de grupo no necesitan verlo.

### Invitaciones

- Cualquier usuario puede crear todos los grupos que necesite.
- Al crear un grupo, el creador se añade automáticamente como miembro con estado `accepted`.
- El creador invita a usuarios registrados buscándolos por email o nickname. La búsqueda es por coincidencia exacta, para no permitir listar usuarios.
- Si no existe ningún usuario con ese email o nickname, la API responde 404 "Usuario no encontrado". Es un riesgo aceptado: permite comprobar si un email está registrado, pero hay que haber iniciado sesión, solo se comprueba un valor exacto cada vez y no se obtiene ningún dato de la cuenta. Se descartó responder siempre lo mismo sin crear la invitación, porque la lista de invitaciones pendientes del grupo, que ven todos los miembros, lo delataría igualmente, y el creador no sabría que se ha equivocado al escribir el email.
- La invitación crea una fila en `group_members` con estado `pending`.
- Si el invitado acepta, su estado pasa a `accepted`. Si la rechaza, la fila se borra.
- La fecha de una invitación (`invited_at`) es el `updated_at` de su fila en `group_members`, no el `created_at`: al reinvitar a alguien que salió, la fila pasa de `left` a `pending` y `created_at` sería la fecha de la primera invitación.
- Respuestas: invitar devuelve 201 con la invitación; aceptar, rechazar, anular, salir y expulsar devuelven 204 sin contenido. Tras aceptar, el front-end muestra un mensaje con un enlace al grupo (con el `group_id` y el título que ya tiene de la lista de invitaciones), para que el usuario elija si entra o no.
- Una invitación pendiente no tiene gastos ni repartos asociados, por lo que se puede borrar sin descuadrar nada.
- Anular o rechazar una invitación borra la fila solo si su estado es `pending` (`DELETE ... AND status = 'pending'`): así nunca se puede borrar por esta vía a un miembro `accepted`.
- Si dos peticiones invitan a la vez al mismo usuario, la clave primaria de `group_members` impide la segunda fila, y su error 1062 se responde con el mismo 409 de invitación pendiente.
- Se puede volver a invitar a cualquier usuario que no sea miembro: si rechazó, se crea una invitación nueva; si salió del grupo (`left`), su fila vuelve a `pending`.
- Solo los miembros `accepted` participan en gastos, repartos y liquidaciones.
- Todos los miembros `accepted` pueden ver las invitaciones pendientes de su grupo (`GET /api/groups/{group_id}/invitations`). Solo el creador puede crearlas y anularlas.

### Salida y expulsión de miembros

- Abandonar el grupo y ser expulsado son la misma operación con distinto protagonista, y siguen la misma regla: el saldo del miembro debe ser exactamente 0.
- Por dentro comparten la misma función del controlador, pero tienen rutas distintas porque sus permisos son distintos: `POST /api/groups/{group_id}/leave` (el propio miembro) y `DELETE /api/groups/{group_id}/members/{user_id}` (el creador).
- Si el saldo no es 0, la app impide la operación e indica el saldo pendiente. Primero hay que saldar cuentas: el creador registra la liquidación y después ya se puede salir o expulsar.
- Errores: 404 "Miembro no encontrado" si la persona que sale no es miembro `accepted`; 409 "El creador no puede salir del grupo; puede cerrarlo"; 409 "El saldo del miembro no es 0 (-108.33 EUR). Hay que saldar las cuentas antes de que salga del grupo", con el saldo y la moneda del grupo.
- Al salir o ser expulsado, el estado del miembro pasa a `left`. Su fila se conserva porque sus gastos y repartos antiguos la referencian.
- Un miembro `left` deja de ver el grupo.
- El creador no puede abandonar ni ser expulsado de sus grupos.

### Cierre y reapertura del grupo

- Los grupos nunca se eliminan físicamente, ni ellos ni sus miembros, gastos, repartos o liquidaciones.
- Solo el creador puede cerrar el grupo. Pasa a estado `closed` y se guarda la fecha en `closed_at`.
- Si en ese momento hay saldos pendientes (algún saldo distinto de cero), la app muestra antes un aviso y pide confirmación. Si el creador confirma, el grupo se cierra igualmente.
- Al cerrar el grupo, las invitaciones pendientes se borran.
- Un grupo cerrado queda en solo lectura: la API rechaza cualquier creación, edición o borrado de gastos, repartos, liquidaciones, invitaciones, salidas y expulsiones.
- Los miembros `accepted` siguen viendo el grupo cerrado con todo su historial y sus saldos.
- El creador puede reabrir un grupo cerrado: vuelve a estado `active` y `closed_at` pasa a `NULL`.

### Gastos y repartos

- Solo el creador del grupo registra, edita y elimina gastos.
- Cada gasto indica quién lo pagó (`paid_by`), que debe ser un miembro `accepted`.
- Hay tres modos de reparto:
  1. **Iguales entre todos**: el importe se divide a partes iguales entre todos los miembros `accepted` (en la interfaz aparecen todos marcados por defecto).
  2. **Iguales entre algunos**: el importe se divide a partes iguales solo entre los participantes seleccionados.
  3. **Personalizado**: se introduce a mano la cantidad de cada participante. La interfaz puede permitir introducir porcentajes, que se convierten a importes antes de guardar.
- Los modos 1 y 2 se guardan con `split_type = 'equal'` y el modo 3 con `split_type = 'custom'`.
- En todos los modos, el backend calcula y guarda la parte de cada participante en `expense_shares`. El cálculo de saldos no depende del modo.
- La fecha del gasto (`expense_date`) es la de hoy por defecto y se puede cambiar a una fecha pasada, nunca futura (422). Puede ser distinta de la fecha en que se registra: por ejemplo, los gastos de un viaje que se apuntan al volver.
- Ninguna parte puede ser de 0 €. En el modo personalizado, cada parte debe ser mayor que 0. En el modo igual, si a algún participante le tocara 0 € (por ejemplo, 0,02 € entre 3), la API responde 422 "El importe es demasiado pequeño para repartirlo entre N personas".
- Los gastos en los que aparece un miembro `left` (como pagador o como participante) no se pueden editar ni borrar: 409 "El gasto incluye a alguien que ya no es miembro del grupo y no se puede modificar". Si se pudieran, el saldo de ese ex miembro dejaría de ser 0 y, como ya no es miembro, no podría saldarlo.
- La API valida, dentro de una transacción, que la suma de las partes sea exactamente igual al importe del gasto.
- En los repartos iguales no exactos, cada participante recibe primero la parte redondeada hacia abajo al céntimo, y los céntimos sobrantes se reparten de uno en uno empezando por el participante con menor `user_id`. Ejemplos: 10 € entre 3 → 3,34 + 3,33 + 3,33; 20 € entre 3 → 6,67 + 6,67 + 6,66.

### Liquidaciones

- Solo el creador del grupo registra, edita y elimina liquidaciones.
- Una liquidación indica quién paga (`from_user_id`), quién cobra (`to_user_id`) y el importe. Ambos deben ser miembros `accepted` y distintos entre sí.

### Saldos

El saldo de cada miembro se calcula con una consulta, nunca se guarda:

```
saldo = (suma de gastos que ha pagado)
      − (suma de sus partes en expense_shares)
      + (suma de liquidaciones que ha enviado)
      − (suma de liquidaciones que ha recibido)
```

Saldo positivo: le deben dinero. Saldo negativo: debe dinero.

### Presupuesto

- Es opcional. Si existe, debe ser mayor que 0 y tener como máximo 2 decimales y 10 cifras en total (como `DECIMAL(10,2)`): un importe con más decimales se rechaza en lugar de redondearse.
- Si existe, la vista del grupo muestra el gasto acumulado frente al presupuesto (por ejemplo, con una barra de progreso).

# Funcionalidades futuras (común)

No se implementan todavía, pero el diseño debe permitir añadirlas sin rehacer el modelo.

- **Mensajería asíncrona entre los miembros de un grupo** ("should have" del enunciado). Tabla prevista:
  ```
  group_messages
    id          INT PK AUTO_INCREMENT
    group_id    INT NOT NULL FK → expense_groups.id ON DELETE RESTRICT
    user_id     INT NOT NULL
    content     TEXT NOT NULL
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    FK (group_id, user_id) → group_members(group_id, user_id)
  ```
- **Eliminación de cuenta.** Regla prevista: solo se podrá eliminar la cuenta con saldo 0 en todos los grupos activos; se hará con borrado lógico (`deleted_at`), y los grupos que haya creado el usuario se cerrarán automáticamente.
- Simplificación de deudas: calcular el mínimo número de transferencias para dejar todos los saldos a cero.
- Recuperación de contraseña y página de perfil.
- **Invitaciones a personas sin cuenta**: una tabla nueva (`group_invitations`) con el email invitado, que se asocia al usuario cuando se registra con ese email. Evitaría revelar si un email está registrado y permitiría invitar a amigos que aún no tienen cuenta. Requiere verificación de email (sin ella, cualquiera podría registrarse con el email de otro y quedarse con sus invitaciones), así que conviene hacerlo junto con la recuperación de contraseña, que también necesita enviar emails. Solo por email, nunca por nickname.
- Instalación de la app en el móvil (PWA).

# Decisiones pendientes (común)

- Qué cloud de prácticas se usará, ya que condiciona la configuración del despliegue.

# Estado actual

## Planificación de la entrega (común)

Cambio de planificación por la fecha de entrega (23/10/2026, antes de las 00:00):

- Se alterna back-end y front-end, priorizando los requisitos mínimos del enunciado.
- Estilos del front-end: Tailwind CSS y CSS propio.
- Alcance de la entrega: front-end de autenticación, grupos (listado, creación y detalle con saldos), invitaciones y gastos (listado y creación); back-end de la fase 4 reducida (`GET` y `POST /api/groups/{group_id}/expenses`).
- Quedan pendientes para después de la entrega: editar y borrar gastos, liquidaciones (fase 5), cierre y reapertura (fase 6), salir y expulsar desde la interfaz. El filtro de grupos cerrados se adelantó y ya está hecho (bloque 2 del front-end).
- Durante la entrega se prueba directamente en Swagger y en el navegador, sin scripts de pruebas temporales.
- Proyecto separado en dos repositorios (`backend-proyecto-final` y `frontend-proyecto-final`), cada uno con su `README.md` y su `AGENTS.md` (ver Repositorios del proyecto). ✅ Completado.

## Front-end

- Bloque 1 (base y autenticación: navbar, footer, inicio, registro, login, guards e interceptor) ✅ completado.
- Bloque 2 (grupos: listado "Mis grupos" con filtro activos/cerrados, creación de grupo y detalle con saldos, presupuesto y miembros) ✅ completado.
- Invitaciones (`/invitations` e invitar desde el detalle del grupo) ⏳ pendiente.
- Gastos (listado y creación) ⏳ pendiente; depende de la fase 4 de la API.
