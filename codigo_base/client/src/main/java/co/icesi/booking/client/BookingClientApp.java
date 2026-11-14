package co.icesi.booking.client;

import BookingApp.*;
import com.zeroc.Ice.Communicator;
import com.zeroc.Ice.ObjectPrx;
import com.zeroc.Ice.Util;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

public class BookingClientApp {

    public static final String DEFAULT_HOST = "localhost";
    public static final int DEFAULT_PORT = 10000;
    public static final String SERVICE_IDENTITY = "BookingService";

    public static void main(String[] args) {
        String host = DEFAULT_HOST;
        int port = DEFAULT_PORT;

        for (int i = 0; i < args.length; i++) {
            if (args[i].equals("--host") && i + 1 < args.length) {
                host = args[i + 1];
            } else if (args[i].equals("--port") && i + 1 < args.length) {
                try {
                    port = Integer.parseInt(args[i + 1]);
                } catch (NumberFormatException ignored) {
                }
            }
        }

        String proxyStr = String.format("%s:default -h %s -p %d", SERVICE_IDENTITY, host, port);
        System.out.println("==========================================================================");
        System.out.println("  CLIENTE DE PRUEBAS - RESERVA DE BOLETAS ZEROC ICE (COMPU 1)           ");
        System.out.println("==========================================================================");
        System.out.printf("[INFO] Conectando a: %s%n", proxyStr);

        try (Communicator communicator = Util.initialize(args)) {
            ObjectPrx base = communicator.stringToProxy(proxyStr);
            BookingServicePrx bookingService = BookingServicePrx.checkedCast(base);

            if (bookingService == null) {
                System.err.println("[ERROR] Proxy inválido o el servicio no responde.");
                return;
            }

            System.out.println("[OK] Conexión establecida con éxito con el servidor RPC.");
            String clientId = "CLI-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            System.out.printf("[INFO] Identificador de sesión de este cliente: %s%n", clientId);

            // Si se pasa el argumento --test-concurrency, ejecuta la prueba automática
            if (Arrays.asList(args).contains("--test-concurrency")) {
                runConcurrencyTest(bookingService, "A-1");
                return;
            }

            // Menú interactivo
            Scanner scanner = new Scanner(System.in);
            boolean exit = false;

            while (!exit) {
                printMenu();
                System.out.print("Seleccione una opción: ");
                String input = scanner.nextLine().trim();

                switch (input) {
                    case "1":
                        showEventInfo(bookingService);
                        break;
                    case "2":
                        showSeatMap(bookingService);
                        break;
                    case "3":
                        lockSeatInteractive(scanner, bookingService, clientId);
                        break;
                    case "4":
                        confirmBookingInteractive(scanner, bookingService, clientId);
                        break;
                    case "5":
                        releaseSeatInteractive(scanner, bookingService, clientId);
                        break;
                    case "6":
                        showMyStatus(bookingService, clientId);
                        break;
                    case "7":
                        runConcurrencyTest(bookingService, "A-1");
                        break;
                    case "8":
                        bookingService.resetSeats();
                        System.out.println("[OK] Inventario reiniciado con éxito.");
                        break;
                    case "0":
                    case "exit":
                    case "q":
                        exit = true;
                        System.out.println("[INFO] Cerrando cliente. ¡Hasta pronto!");
                        break;
                    default:
                        System.out.println("[WARN] Opción no válida. Intente nuevamente.");
                }
            }
        } catch (Exception e) {
            System.err.println("[ERROR] Fallo de comunicación: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void printMenu() {
        System.out.println("\n--------------------------------------------------------------------------");
        System.out.println("1. Ver información del evento y aforo");
        System.out.println("2. Consultar mapa de sillas");
        System.out.println("3. Bloquear silla (lockSeat)");
        System.out.println("4. Confirmar compra de sillas bloqueadas (confirmBooking)");
        System.out.println("5. Liberar silla bloqueada (releaseSeat)");
        System.out.println("6. Ver mis sillas bloqueadas y reservas confirmadas");
        System.out.println("7. EJECUTAR PRUEBA DE ESTRÉS DE CONCURRENCIA (Demostrar Race Condition)");
        System.out.println("8. Reiniciar catálogo de sillas (resetSeats)");
        System.out.println("0. Salir");
        System.out.println("--------------------------------------------------------------------------");
    }

    private static void showEventInfo(BookingServicePrx service) {
        EventInfo info = service.getEventInfo();
        System.out.println("\n--- DETALLES DEL EVENTO ---");
        System.out.printf("Evento      : %s (%s)%n", info.name, info.id);
        System.out.printf("Fecha/Hora  : %s%n", info.date);
        System.out.printf("Lugar       : %s%n", info.venue);
        System.out.printf("Aforo Total : %d sillas (Disponibles: %d | Bloqueadas: %d | Vendidas: %d)%n",
                info.totalSeats, info.availableSeats, info.lockedSeats, info.bookedSeats);
        System.out.printf("Precios     : VIP: $%,.0f | Platea: $%,.0f | General: $%,.0f COP%n",
                info.vipPrice, info.plateaPrice, info.generalPrice);
    }

    private static void showSeatMap(BookingServicePrx service) {
        Seat[] seats = service.getAllSeats();
        System.out.println("\n--- MAPA DE SILLAS (AUDITORIO MANUELITA) ---");
        String currentRow = "";
        for (Seat s : seats) {
            if (!s.row.equals(currentRow)) {
                currentRow = s.row;
                System.out.printf("%n[Fila %s - %s]: ", currentRow, s.zone);
            }
            char stateIcon = switch (s.state) {
                case AVAILABLE -> 'O'; // Libre
                case LOCKED -> 'L'; // Bloqueado temporal
                case BOOKED -> 'X'; // Vendido definitivo
            };
            System.out.printf("[%s:%c] ", s.id, stateIcon);
        }
        System.out.println("\n\nConvenciones: [O] Disponible | [L] Bloqueada temporal | [X] Vendida definitiva");
    }

    private static void lockSeatInteractive(Scanner sc, BookingServicePrx service, String clientId) {
        System.out.print("Ingrese el ID de la silla a bloquear (ej. A-1, C-5, F-2): ");
        String seatId = sc.nextLine().trim().toUpperCase();
        try {
            LockResult res = service.lockSeat(seatId, clientId);
            System.out.printf("%s (Expira a las: %s)%n", res.message, new Date(res.expiresAt));
        } catch (SeatNotFoundException e) {
            System.out.println(" Error: " + e.reason);
        } catch (SeatNotAvailableException e) {
            System.out.println(" No disponible: " + e.reason);
        }
    }

    private static void confirmBookingInteractive(Scanner sc, BookingServicePrx service, String clientId) {
        Seat[] locked = service.getMyLockedSeats(clientId);
        if (locked.length == 0) {
            System.out.println("No tienes sillas bloqueadas actualmente para confirmar.");
            return;
        }

        System.out.printf("Tienes %d sillas bloqueadas actualmente: ", locked.length);
        List<String> seatIds = new ArrayList<>();
        double total = 0;
        for (Seat s : locked) {
            System.out.print(s.id + " ");
            seatIds.add(s.id);
            total += s.price;
        }
        System.out.printf("%nTotal a pagar: $%,.0f COP%n", total);

        System.out.print("Nombre completo del comprador: ");
        String name = sc.nextLine().trim();
        System.out.print("Correo electrónico: ");
        String email = sc.nextLine().trim();

        try {
            BookingResult res = service.confirmBooking(seatIds.toArray(new String[0]), clientId, name, email);
            System.out.println(" ¡RESERVA CONFIRMADA!");
            System.out.printf("   Código de Reserva : %s%n", res.bookingCode);
            System.out.printf("   Total Facturado   : $%,.0f COP%n", res.totalAmount);
            System.out.printf("   Sillas Adquiridas : %s%n", Arrays.toString(res.seatIds));
        } catch (Exception e) {
            System.out.println(" Error al confirmar compra: " + e.getMessage());
        }
    }

    private static void releaseSeatInteractive(Scanner sc, BookingServicePrx service, String clientId) {
        System.out.print("Ingrese el ID de la silla a liberar: ");
        String seatId = sc.nextLine().trim().toUpperCase();
        try {
            boolean ok = service.releaseSeat(seatId, clientId);
            if (ok) {
                System.out.println(" Silla liberada correctamente.");
            } else {
                System.out.println(" No se pudo liberar la silla (no la tienes bloqueada o ya expiró).");
            }
        } catch (Exception e) {
            System.out.println(" Error: " + e.getMessage());
        }
    }

    private static void showMyStatus(BookingServicePrx service, String clientId) {
        Seat[] locked = service.getMyLockedSeats(clientId);
        System.out.printf("%n--- MIS SILLAS BLOQUEADAS (%d) ---%n", locked.length);
        for (Seat s : locked) {
            System.out.printf("  • Silla %s (%s) - $%,.0f COP%n", s.id, s.zone, s.price);
        }

        BookingRecord[] bookings = service.getMyBookings(clientId);
        System.out.printf("%n--- MIS RESERVAS CONFIRMADAS (%d) ---%n", bookings.length);
        for (BookingRecord b : bookings) {
            System.out.printf("  • Código: %s | Sillas: %s | Total: $%,.0f | Fecha: %s%n",
                    b.bookingCode, Arrays.toString(b.seatIds), b.totalAmount, new Date(b.timestamp));
        }
    }

    // =========================================================================
    // [PRUEBA DE ESTRÉS DE CONCURRENCIA - AMPLIADA PARA TAREA A7]
    // 1. Evalúa race condition en lockSeat (10 hilos simultáneos).
    // 2. Evalúa concurrencia y validación en confirmBooking y releaseSeat.
    // 3. Verifica invariante de aforo (suma = 90) y máximo 1 venta por silla.
    // =========================================================================
    private static void runConcurrencyTest(BookingServicePrx service, String targetSeatId) {
        System.out.println("\n==========================================================================");
        System.out.printf("  PRUEBA DE CONCURRENCIA INTEGRAL: SILLA '%s' %n", targetSeatId);
        System.out.println("==========================================================================");

        // Reiniciar inventario para asegurar estado limpio
        service.resetSeats();

        // ---------------------------------------------------------------------
        // FASE 1: 10 hilos compitiendo por lockSeat()
        // ---------------------------------------------------------------------
        System.out.println("\n--- FASE 1: 10 HILOS COMPITIENDO POR lockSeat() ---");
        int numThreads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numThreads);

        AtomicInteger successLocks = new AtomicInteger(0);
        AtomicInteger rejectedLocks = new AtomicInteger(0);
        AtomicReference<String> winnerClientId = new AtomicReference<>(null);

        for (int i = 1; i <= numThreads; i++) {
            final String threadClientId = "CONCURRENT-CLIENT-" + i;
            executor.submit(() -> {
                try {
                    startLatch.await(); // Todos los hilos esperan aquí para disparar al unísono
                    LockResult res = service.lockSeat(targetSeatId, threadClientId);
                    if (res.success) {
                        successLocks.incrementAndGet();
                        winnerClientId.compareAndSet(null, threadClientId);
                        System.out.printf("   [+] %s: ¡Bloqueo exitoso! (Expira: %d)%n", threadClientId, res.expiresAt);
                    }
                } catch (SeatNotAvailableException e) {
                    rejectedLocks.incrementAndGet();
                    System.out.printf("   [-] %s: Rechazado (Silla ocupada)%n", threadClientId);
                } catch (Exception e) {
                    System.out.printf("   [!] %s: Excepción: %s%n", threadClientId, e.getMessage());
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        System.out.println("[INFO] Disparando 10 peticiones simultáneas...");
        startLatch.countDown(); // Señal de salida instantánea

        try {
            doneLatch.await(5, TimeUnit.SECONDS);
        } catch (InterruptedException ignored) {
        }

        executor.shutdown();

        System.out.println("\n--- RESULTADOS FASE 1 (lockSeat) ---");
        System.out.printf("Peticiones que creyeron ganar el bloqueo : %d%n", successLocks.get());
        System.out.printf("Peticiones correctamente rechazadas     : %d%n", rejectedLocks.get());

        if (successLocks.get() > 1) {
            System.out.println(" [VULNERABILIDAD CONFIRMADA]: ¡CONDICIÓN DE CARRERA DETECTADA EN lockSeat!");
            System.out.printf("   Más de un cliente (%d) logró bloquear la misma silla simultáneamente.%n",
                    successLocks.get());
            System.out.println("==========================================================================\n");
            return;
        } else if (successLocks.get() == 0) {
            System.out.println(" [ERROR]: Ningún hilo pudo bloquear la silla. Abortando fases posteriores.");
            System.out.println("==========================================================================\n");
            return;
        }

        System.out.printf(" [SIN CONDICIÓN DE CARRERA]: Solo 1 hilo (%s) obtuvo el bloqueo.%n", winnerClientId.get());

        // ---------------------------------------------------------------------
        // FASE 2: Concurrencia en confirmBooking y releaseSeat
        // ---------------------------------------------------------------------
        System.out.println("\n--- FASE 2: CONCURRENCIA EN confirmBooking Y releaseSeat ---");
        String winner = winnerClientId.get();

        // 2.1 Intento de compra fraudulenta con cliente no poseedor
        String loserClientId = "CONCURRENT-CLIENT-LOSER";
        for (int i = 1; i <= numThreads; i++) {
            String cid = "CONCURRENT-CLIENT-" + i;
            if (!cid.equals(winner)) {
                loserClientId = cid;
                break;
            }
        }
        System.out.printf("[INFO] Intentando compra con cliente no poseedor (%s)...%n", loserClientId);
        try {
            service.confirmBooking(new String[]{targetSeatId}, loserClientId, "Impostor", "impostor@icesi.edu.co");
            System.out.println("   [!] FALLO DE SEGURIDAD: Cliente no poseedor logró confirmar la compra.");
        } catch (BookingException e) {
            System.out.printf("   [+] Compra no autorizada rechazada correctamente: %s%n", e.reason);
        } catch (Exception e) {
            System.out.printf("   [+] Compra no autorizada rechazada con excepción: %s%n", e.getMessage());
        }

        // 2.2 Carrera real entre confirmBooking() y releaseSeat() por parte del cliente legítimo
        System.out.println("[INFO] Lanzando carrera simultánea entre confirmBooking() y releaseSeat()...");
        ExecutorService raceExecutor = Executors.newFixedThreadPool(2);
        CountDownLatch raceStartLatch = new CountDownLatch(1);
        CountDownLatch raceDoneLatch = new CountDownLatch(2);

        AtomicInteger confirmWins = new AtomicInteger(0);
        AtomicInteger releaseWins = new AtomicInteger(0);
        AtomicReference<String> bookingCodeRef = new AtomicReference<>(null);

        // Hilo A: Intenta confirmar compra
        raceExecutor.submit(() -> {
            try {
                raceStartLatch.await();
                BookingResult bRes = service.confirmBooking(new String[]{targetSeatId}, winner, "Ganador Carrera", "ganador@icesi.edu.co");
                if (bRes != null && bRes.bookingCode != null) {
                    confirmWins.incrementAndGet();
                    bookingCodeRef.set(bRes.bookingCode);
                    System.out.printf("   [+] confirmBooking completada con éxito. Código: %s%n", bRes.bookingCode);
                }
            } catch (Exception e) {
                System.out.printf("   [-] confirmBooking rechazada/falló: %s%n", e.getMessage());
            } finally {
                raceDoneLatch.countDown();
            }
        });

        // Hilo B: Intenta liberar silla
        raceExecutor.submit(() -> {
            try {
                raceStartLatch.await();
                boolean relOk = service.releaseSeat(targetSeatId, winner);
                if (relOk) {
                    releaseWins.incrementAndGet();
                    System.out.println("   [+] releaseSeat completada con éxito. Silla liberada.");
                } else {
                    System.out.println("   [-] releaseSeat retornó false (silla ya vendida o no bloqueada).");
                }
            } catch (Exception e) {
                System.out.printf("   [-] releaseSeat lanzó excepción: %s%n", e.getMessage());
            } finally {
                raceDoneLatch.countDown();
            }
        });

        // Disparo de la carrera
        raceStartLatch.countDown();

        try {
            raceDoneLatch.await(5, TimeUnit.SECONDS);
        } catch (InterruptedException ignored) {
        }
        raceExecutor.shutdown();

        // ---------------------------------------------------------------------
        // FASE 3: Verificación de Invariantes y Aforo Total
        // ---------------------------------------------------------------------
        System.out.println("\n--- FASE 3: VERIFICACIÓN DE INVARIANTES Y AFORO TOTAL ---");
        Seat finalSeat;
        try {
            finalSeat = service.getSeat(targetSeatId);
        } catch (Exception e) {
            System.err.println("[ERROR] No se pudo consultar la silla: " + e.getMessage());
            return;
        }

        EventInfo eventInfo = service.getEventInfo();
        int calculatedSum = eventInfo.availableSeats + eventInfo.lockedSeats + eventInfo.bookedSeats;

        System.out.printf("Estado final de silla '%s': %s%n", targetSeatId, finalSeat.state);
        System.out.printf("Aforo: Disponibles=%d | Bloqueadas=%d | Vendidas=%d | Suma=%d (Total=%d)%n",
                eventInfo.availableSeats, eventInfo.lockedSeats, eventInfo.bookedSeats, calculatedSum, eventInfo.totalSeats);

        boolean aforoOk = (calculatedSum == eventInfo.totalSeats && calculatedSum == 90);
        boolean stateConsistent = (finalSeat.state == SeatState.BOOKED && confirmWins.get() == 1 && releaseWins.get() == 0) ||
                                  (finalSeat.state == SeatState.AVAILABLE && releaseWins.get() == 1 && confirmWins.get() == 0);
        boolean lockRaceOk = (successLocks.get() == 1);

        if (lockRaceOk && aforoOk && stateConsistent) {
            System.out.println("\n [OK - PRUEBA INTEGRAL SUPERADA CON ÉXITO]");
            System.out.println("   1. lockSeat: Exactamente 1 cliente obtuvo el bloqueo (sin doble bloqueo).");
            System.out.println("   2. confirmBooking / releaseSeat: Exclusión mutua atómica respetada (máximo 1 resultado).");
            System.out.printf("   3. Invariante de aforo: Suma exacta de %d sillas (%d disponibles + %d bloqueadas + %d vendidas).%n",
                    calculatedSum, eventInfo.availableSeats, eventInfo.lockedSeats, eventInfo.bookedSeats);
            System.out.println("   4. Máximo 1 venta por silla y sin sobreventa.");
        } else {
            System.out.println("\n [ALERTA - INCONSISTENCIA DETECTADA]");
            System.out.printf("   lockRaceOk=%b, aforoOk=%b, stateConsistent=%b%n", lockRaceOk, aforoOk, stateConsistent);
        }
        System.out.println("==========================================================================\n");
    }
}
