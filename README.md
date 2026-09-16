# Aplicacion Web

Actúa como un diseñador senior experto en desarrollo de aplicaciones web en Colombia, especializado en productos para negocios de servicios y agendamiento de citas.

Crea una aplicación web para una barbería local llamada "BarberStudio" (o un nombre moderno de barbería en Colombia) que ayude al dueño y a los barberos a organizar su agenda diaria de forma confiable, evitando dobles reservas y cuadernos de papel.

Función central: Agendamiento libre de turnos para clientes (seleccionando hora, barbero y servicio) y un panel administrativo para que el personal gestione la agenda del día.

Pantallas (solo estas 3):

1. Vista pública de Agendamiento (Cliente):

   - Selector de servicio (ej: Corte Clásico, Barba, Combo Imperial) con su precio en pesos colombianos ($ COP) y duración.

   - Selector de barbero preferido (o opción "Cualquiera").

   - Selector de fecha y hora disponible (grid de horas visuales).

   - Formulario sencillo con Nombre y Teléfono del cliente para confirmar la cita.

   - Mensaje claro que indique: "El pago se realiza directamente en el establecimiento en efectivo o Nequi/Daviplata al finalizar el servicio".

2. Panel Administrativo (Barbero / Administrador):

   - Protegido por una contraseña o PIN sencillo.

   - Vista de la agenda del día con tarjetas de citas organizadas cronológicamente.

   - Muestra de estado de cada cita mediante etiquetas o badges (Pendiente, Completada, Cancelada).

   - Filtro rápido por barbero o por fecha.

   - Botón para cambiar rápidamente el estado de una cita o cancelar.

3. Formulario / Modal de Cita Rápida (Administrador):

   - Permite al barbero agendar manualmente una cita telefónica o de un cliente que llega caminando (walk-in).

Estilo:

- Moderno, elegante y masculino (tonos oscuros como negro, gris carbón y acentos en dorado o blanco).

- Mobile-first, botones amplios e interfaz limpia fácil de usar desde un celular en la barbería.

- Todos los textos en español colombiano.

Datos de ejemplo realistas:

- Barberos: "Carlos", "Santi", "Mateo".

- Servicios: "Corte Tradicional ($25.000 COP)", "Perfilado de Barba ($15.000 COP)", "Combo Corte + Barba ($35.000 COP)".

- Citas ficticias para el día de hoy con clientes como "Juan Pérez", "Felipe Gómez", "Andrés".

NO incluyas:

- Pasarelas de pago en línea (sin Stripe, Wompi, etc.).

- Registro/login complejo para los clientes.

- Reportes financieros o gráficas complejas.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f8663fd3-2cbc-430b-8daf-d34d8419a47d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
