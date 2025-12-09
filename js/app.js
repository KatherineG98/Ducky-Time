/* Ducky-Time Main Application */

let swRegistration = null;

document.addEventListener('DOMContentLoaded', async () => {
    const modal = document.getElementById('permission-modal');
    const enableBtn = document.getElementById('btn-enable-notifications');
    // const statusEl removed

    // Step 1: Register Service Worker
    if ('serviceWorker' in navigator) {
        try {
            swRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('[App] Service Worker registered:', swRegistration);
        } catch (error) {
            console.error('[App] Service Worker registration failed:', error);
        }
    }

    // Step 2: Check if we need to show the permission modal
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            // Already have permission, hide modal
            modal.classList.add('hidden');
        } else {
            // Show modal for user to click
            modal.classList.remove('hidden');
        }
    } else {
        modal.classList.add('hidden');
    }

    // Step 3: Handle the enable button click (USER GESTURE)
    enableBtn.addEventListener('click', async () => {
        console.log('[App] User clicked enable notifications');

        try {
            const permission = await Notification.requestPermission();
            console.log('[App] Permission result:', permission);

            if (permission === 'granted') {
                modal.classList.add('hidden');

                // Send test notification immediately
                setTimeout(() => {
                    showNotification(
                        '¡Ducky-Time Listo!',
                        'Las notificaciones están funcionando. Te avisaremos cuando termine el temporizador.'
                    );
                }, 500);
            } else {
                // Permission denied logic
                alert('No se pudieron activar las notificaciones. Por favor revisa la configuración de permisos de tu navegador.');
            }
        } catch (err) {
            console.error('[App] Permission request error:', err);
            modal.classList.add('hidden');
            statusEl.innerHTML = '❌ Error: ' + err.message;
            statusEl.style.color = '#ff4444';
        }
    });

    // Initialize Timer Module
    window.timer = new StudyTimer();
});

// Global function to show notifications via Service Worker
// Global function to show notifications via Service Worker
function showNotification(title, body, tag = 'ducky-time') {
    console.log('[App] showNotification called:', title);

    // PRIORITY 1: Send to the controller (the SW actually controlling this page)
    if (navigator.serviceWorker.controller) {
        console.log('[App] Sending to active controller');
        navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: title,
            body: body,
            tag: tag
        });
        return;
    }

    // PRIORITY 2: Send to registration.active (if controller not yet claimed but SW exists)
    if (swRegistration && swRegistration.active) {
        console.log('[App] Sending to registration.active');
        swRegistration.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: title,
            body: body,
            tag: tag
        });
        return;
    }

    // PRIORITY 3: Direct Notification API (Fallback)
    if (Notification.permission === 'granted') {
        console.log('[App] Using direct Notification API (Fallback)');
        try {
            const notif = new Notification(title, {
                body: body,
                requireInteraction: true,
                icon: '/assets/duck-icon.png'
            });
        } catch (e) {
            console.error('[App] Direct notification failed:', e);
            alert(title + '\n' + body);
        }
    } else {
        alert(title + '\n' + body);
    }
}
