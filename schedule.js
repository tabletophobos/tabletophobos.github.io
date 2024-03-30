
// Function to format date and time
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}


function getNextRecurringDate(event) {
    const startDate = new Date(event.start.dateTime);
    const today = new Date(); // Current date
    const recurrenceText = event.recurrence; // Access recurrence property of each event
    if (!recurrenceText) {return startDate}

    // If the event's start date is after today, return it as the next occurrence
    if (startDate > today) {
        return startDate;
    }

    const recurrenceRule = event.recurrence[0];
    const ruleParts1 = recurrenceRule.split(':');
    
    const ruleParts = ruleParts1[1].split(';');
    const freqPart = ruleParts.find(part => part.startsWith('FREQ='));

    const frequency = freqPart.split('=')[1];
    const intervalPart = ruleParts.find(part => part.startsWith('INTERVAL='));
    const interval = intervalPart ? parseInt(intervalPart.split('=')[1]) : 1; // Default interval is 1 if not provided
    const byDayPart = ruleParts.find(part => part.startsWith('BYDAY='));
    const byDay = byDayPart ? byDayPart.split('=')[1] : null; // Null if BYDAY part is missing

    let nextDate = new Date(startDate);
    while (nextDate <= today) {
        if (frequency === 'WEEKLY') {
            nextDate.setDate(nextDate.getDate() + (7 * interval));
        } else if (frequency === 'DAILY') {
            nextDate.setDate(nextDate.getDate() + interval);
        } else if (frequency === 'MONTHLY') {
            nextDate.setMonth(nextDate.getMonth() + interval);
        } else {
            return null; // Unsupported frequency
        }

        // If BYDAY is specified, adjust the next date based on the specified day
        if (byDay) {
            // Convert the BYDAY value to a numeric representation of the day of the week
            const byDayIndex = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].indexOf(byDay);
            if (byDayIndex === -1) {
                // If BYDAY value is invalid, return null or handle the error accordingly
                return null;
            }
        
            const currentDay = nextDate.getDay();
            const daysToAdd = (byDayIndex >= currentDay) ? byDayIndex - currentDay : 7 - (currentDay - byDayIndex);
            nextDate.setDate(nextDate.getDate() + daysToAdd);
        }
    }

    return nextDate;
}


function calculateDaysDifference(startDate) {
    const today = new Date();
    const eventStartDate = new Date(startDate);
    const timeDifference = eventStartDate.getTime() - today.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24)); // Convert milliseconds to days
    return daysDifference;
}


// Function to fetch events from multiple calendars
async function fetchEvents() {
    const calendarUrls = [
        'https://www.googleapis.com/calendar/v3/calendars/e1f61f3290a1bcb6ef7b66a4d7a02f4bc2c9700f04e821479b2e1c6d378db8b9@group.calendar.google.com/events?key=AIzaSyBO0S0akRYV0vNyM84eog6V8kkMtVRdx18',
        'https://www.googleapis.com/calendar/v3/calendars/705045bf56f1d3ed79b7081f5320ff0ad6d1980d5621b8292be624c35c88e0dd@group.calendar.google.com/events?key=AIzaSyBO0S0akRYV0vNyM84eog6V8kkMtVRdx18'
    ];

    try {
        let allEvents = [];
        // Fetch events from each calendar URL
        for (const url of calendarUrls) {
            const response = await fetch(url);
            const data = await response.json();
            const events = data.items;
            allEvents = allEvents.concat(events); // Combine events from both calendars
        }
  
        allEvents.forEach(event => {
            const nextDate = getNextRecurringDate(event);
            if (nextDate) {
                event.start.dateTime = nextDate.toISOString(); // Update the start date of the event
            }
        });
        

        // Sort events by start date
        allEvents.sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime));

        // Display sorted events
        const eventsList1 = document.getElementById('eventsList1');
        eventsList1.innerHTML = ''; // Clear previous events
        const eventsList2 = document.getElementById('eventsList2');
        eventsList2.innerHTML = ''; // Clear previous events
        const eventsList3 = document.getElementById('eventsList3');
        eventsList3.innerHTML = ''; // Clear previous events

        let columnIndex = 1;
        allEvents.forEach(event => {
            const startDate = new Date(event.start.dateTime);
            const organizer = event.organizer ? event.organizer.displayName : 'Unknown';
            const description = event.description

            daysDifference = calculateDaysDifference(startDate)

            if (daysDifference > -2){
                const card = document.createElement('div');
                card.classList.add('card', 'mb-3');
                if (organizer=='Hobos Games'){
                    imageUrl = 'img\\hobo.webp'
                } else {
                    imageUrl = 'img\\real.webp'
                }
                card.innerHTML = `
                    <div class="card-body d-flex flex-column align-items-center">
                        <img src="${imageUrl}" class="card-img-top rounded-circle" style="width: 50%;" alt="Event Image">
                        
                        <p class="card-text">Organizer: ${organizer}</p>
                        <p class="card-text">Start Date: ${startDate}</p>
                        <p class="card-text">${description}</p>
                    </div>
                `;
                //eventsList.appendChild(card);

                switch(columnIndex) {
                    case 1:
                        eventsList1.appendChild(card);
                        columnIndex = 2;
                      break;
                    case 2:
                        eventsList2.appendChild(card);
                        columnIndex = 3;
                      break;
                    case 3:
                        eventsList3.appendChild(card);
                        columnIndex = 1;
                      break;
                }


            }      
            
        });
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

// Call fetchEvents function when the page loads
window.onload = fetchEvents;




