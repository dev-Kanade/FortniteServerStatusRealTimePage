async function fetchStatus() {
    try {
        const response = await fetch('/api/status');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        const card = document.getElementById('statusCard');
        const text = document.getElementById('statusText');

        if (data.status === 'UP') {
            card.classList.remove('offline');
            card.classList.add('online');
            text.textContent = 'Online';
        } else {
            card.classList.remove('online');
            card.classList.add('offline');
            text.textContent = 'Offline';
        }
    } catch (error) {
        console.error('Error fetching status:', error);

    }
}


fetchStatus();


setInterval(fetchStatus, 1000);
