class StudyTimer {
    constructor() {
        this.duration = 25 * 60; // default 25 minutes in seconds
        this.remaining = this.duration;
        this.interval = null;
        this.notificationInterval = null;
        this.isRunning = false;
        this.isFinished = false;

        // Real-time tracking (fixes background tab throttling)
        this.endTime = null; // Timestamp when timer should end

        // Visual Elements
        this.elDisplay = document.getElementById('timer-input');
        this.elTitle = document.getElementById('session-title');
        this.elDesc = document.getElementById('session-desc');
        this.elBtnStart = document.getElementById('btn-start');
        this.elBtnPause = document.getElementById('btn-pause');
        this.elBtnReset = document.getElementById('btn-reset');
        this.elCheckLoop = document.getElementById('check-loop-notify');

        // Logic Bindings
        this.bindEvents();
        this.render();
        // this.requestNotificationPermission(); // Optional on load
    }

    bindEvents() {
        this.elBtnStart.addEventListener('click', () => this.start());
        this.elBtnPause.addEventListener('click', () => this.pause());
        this.elBtnReset.addEventListener('click', () => this.reset());

        document.getElementById('btn-plus-15').addEventListener('click', () => this.adjustTime(15));
        document.getElementById('btn-minus-15').addEventListener('click', () => this.adjustTime(-15));

        // document.getElementById('btn-repeat-last').addEventListener('click', () => this.repeatLast());
        document.getElementById('btn-test-notify').addEventListener('click', () => this.testNotification());

        // Manual Input Handling
        this.elDisplay.addEventListener('change', (e) => this.handleManualInput(e.target.value));
        this.elDisplay.addEventListener('focus', () => {
            if (this.isRunning) this.pause();
        });
    }

    testNotification() {
        if (!('Notification' in window)) {
            alert('Este navegador no soporta notificaciones de escritorio.');
            return;
        }

        if (Notification.permission === 'granted') {
            new Notification("Prueba de Ducky-Time", {
                body: "¡Las notificaciones están funcionando correctamente!",
                icon: 'assets/duck-icon.png'
            });
        } else {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification("Prueba de Ducky-Time", {
                        body: "¡Gracias! Ahora recibirás avisos al terminar el tiempo.",
                        icon: 'assets/duck-icon.png'
                    });
                } else {
                    alert('Permiso denegado. No podremos avisarte cuando termine el tiempo.');
                }
            });
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }

    start() {
        // Request permission explicitly on user interaction (Start Click)
        if ('Notification' in window && (Notification.permission === 'default' || Notification.permission === 'denied')) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                }
            });
        }

        if (this.isRunning) return;
        if (this.remaining <= 0) this.remaining = this.duration; // Restart if 0

        this.isRunning = true;
        this.isFinished = false;
        this.stopNotificationLoop();
        this.updateButtons();

        // Set the absolute end time based on real clock
        this.endTime = Date.now() + (this.remaining * 1000);

        this.interval = setInterval(() => {
            // Calculate remaining time from real clock (fixes background throttling)
            const now = Date.now();
            this.remaining = Math.max(0, Math.ceil((this.endTime - now) / 1000));

            if (this.remaining > 0) {
                this.render();
            } else {
                this.complete();
            }
        }, 250); // Check more frequently for responsiveness
    }

    pause() {
        if (!this.isRunning) return;
        this.isRunning = false;
        clearInterval(this.interval);
        this.updateButtons();
    }

    reset() {
        this.pause();
        this.remaining = this.duration;
        this.endTime = null;
        this.isFinished = false;
        this.stopNotificationLoop();
        this.render();
        this.updateButtons();
    }

    complete() {
        this.pause();
        this.isFinished = true;
        this.render(); // Ensure 00:00 is shown
        this.triggerNotification();
    }

    adjustTime(minutes) {
        if (this.isRunning) this.pause();
        const newDuration = this.duration + (minutes * 60);
        if (newDuration > 0) {
            this.duration = newDuration;
            this.remaining = this.duration;
            this.render();
        }
    }

    handleManualInput(value) {
        // Parse "MM:SS" or "MM"
        const parts = value.split(':');
        let minutes = 0;
        let seconds = 0;

        if (parts.length === 1) {
            minutes = parseInt(parts[0]) || 0;
        } else if (parts.length === 2) {
            minutes = parseInt(parts[0]) || 0;
            seconds = parseInt(parts[1]) || 0;
        }

        // Validate seconds
        if (seconds > 59) {
            alert('Los segundos no pueden ser mayores a 59.');
            this.render(); // Revert to previous valid time
            return;
        }

        const totalSeconds = (minutes * 60) + seconds;
        if (totalSeconds > 0) {
            this.duration = totalSeconds;
            this.remaining = totalSeconds;
            this.render();
        } else {
            this.render();
        }
    }

    repeatLast() {
        this.reset();
        this.start();
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    render() {
        this.elDisplay.value = this.formatTime(this.remaining);
        document.title = `(${this.formatTime(this.remaining)}) Ducky-Time`;
    }

    updateButtons() {
        this.elBtnStart.disabled = this.isRunning;
        this.elBtnPause.disabled = !this.isRunning;
        this.elBtnStart.classList.toggle('btn--secondary', this.isRunning);
        this.elBtnStart.classList.toggle('btn--primary', !this.isRunning);
        this.elBtnStart.classList.toggle('btn--running', this.isRunning);
    }

    showCheckNotification() {
        const title = this.elTitle.value || "¡Tiempo Terminado!";
        const body = this.elDesc.value || "Tu sesión de enfoque ha terminado. ¡Toma un descanso!";

        // Use global showNotification (via Service Worker) for reliable OS notifications
        if (typeof showNotification === 'function') {
            showNotification(title, body, 'timer-complete');
        } else {
            // Fallback
            alert(title + '\n' + body);
        }
    }

    triggerNotification() {
        // Show immediate notification
        this.showCheckNotification();

        // If Loop is checked, restart timer immediately
        if (this.elCheckLoop.checked) {
            console.log('[Timer] Auto-restarting loop...');
            this.reset();
            this.start();
        }
    }

    stopNotificationLoop() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
            this.notificationInterval = null;
        }
    }
}
