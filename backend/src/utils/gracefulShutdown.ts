import { Server } from "socket.io";

const cleanup = async (server: Server, additionalCleanup: () => void) => {
    let cleanupPromises = [];

    // HTTP-Server schließen
    if (server) {
        cleanupPromises.push(new Promise<void>((resolve) => {
            server.close(() => {
                console.log('HTTP-Server geschlossen.');
                resolve();
            });
        }));
    }

    /*
    // Datenbankverbindung trennen
    if (knex) {
        cleanupPromises.push(new Promise((resolve) => {
            knex.destroy()
                .then(() => {
                    console.log('Datenbankverbindung getrennt.');
                    resolve();
                })
                .catch((err) => {
                    console.error('Fehler beim Trennen der Datenbankverbindung:', err);
                    resolve(); // Trotz Fehler auflösen, um andere Cleanups nicht zu blockieren
                });
        }));
    }
 */

    // Zusätzliche Cleanups ausführen (wenn provided)
    if (additionalCleanup) {
        // Annahme: additionalCleanup gibt ein Promise zurück oder ist synchron
        cleanupPromises.push(Promise.resolve(additionalCleanup()));
    }

    return Promise.all(cleanupPromises);
};


/**
 * Konfiguriert den Prozess, um auf SIGINT, SIGTERM, SIGUSR2 sowie auf unhandledRejection/uncaughtException 
 * zu lauschen und den Server geordnet herunterzufahren.
 */
export default function gracefulShutdown(server: Server, additionalCleanup = () => {}) {
    /**
     * @function shutdown
     * @description Führt die eigentliche Logik zum Herunterfahren und Freigeben der Ressourcen aus.
     */
    const shutdown = () => {
        console.log('\nServer wird heruntergefahren...');
        
        // Führt alle asynchronen Cleanup-Schritte aus
        cleanup(server, additionalCleanup)
        .then(() => {
            console.log('Alle Ressourcen freigegeben.');
            process.exit(0);
        }).catch((err) => {
            console.error('Fehler während des Herunterfahrens:', err);
            process.exit(1);
        });

        // Timeout für erzwungenes Herunterfahren
        setTimeout(() => {
            console.error('Erzwungenes Herunterfahren nach Timeout!');
            process.exit(1);
        }, 10000); // 10 Sekunden Timeout
    };

    // Höre auf verschiedene Beendigungssignale
    process.on('SIGINT', shutdown);      // Ctrl+C
    process.on('SIGTERM', shutdown);     // kill command, PM2, Docker stop
    process.on('SIGUSR2', shutdown);     // Für nodemon Restarts

    // Unerwartete Fehler behandeln
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unerwartete Promise Rejection:', reason);
        // Bei unhandledRejection shutdown aufrufen, um den Prozess sauber zu beenden
        shutdown();
    });
    process.on('uncaughtException', (err) => {
        console.error('Unerwarteter Fehler (Uncaught Exception):', err);
        // Bei schwerwiegenden Fehlern immer den Prozess beenden
        shutdown();
    });
};