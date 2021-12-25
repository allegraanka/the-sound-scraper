const axios = require('axios');
const express = require('express');
const cheerio = require('cheerio');

const { google } = require('googleapis');
const keys = require('./keys.json');

const app = express();
const PORT = 8000;

const client = new google.auth.JWT(
    keys.client_email, 
    null, 
    keys.private_key, 
    ['https://www.googleapis.com/auth/spreadsheets']
);


// ANTHOLOGY UPCOMING SHOWS CALENDAR DATA
axios('https://www.anthologylive.com/')
    .then(response => {
        const anthologyData = response.data;
        const $ = cheerio.load(anthologyData);

        const anthologyEvent = [];
        const anthologyEventsList = [];

        $('.tw-section', '.container', anthologyData).each(function() {
            // show data from anthology home page
            const detailsUrl = $(this).find('.tw-image > a').attr('href');
            const imageUrl = $(this).find('.tw-image > a > img').attr('src');
            const promoter = $(this).find('.tw-name-presenting').text().trim();
            const headliner = $(this).find('.headliner').text().trim();
            const openers = $(this).find('.tw-open-bottom').text().trim();
            const dayOfWeek = $(this).find('.tw-day-of-week').text().trim();
            const eventDate = $(this).find('.tw-event-date').text().trim();
            const eventShowTime = $(this).find('.tw-event-time').text().trim();
            const eventDoors = $(this).find('.tw-event-door-time').text().trim();
            const ticketPrice = $(this).find('.tw-price').text().trim();
            const ticketUrl = $(this).find('.tw-info-price-buy-tix > a').attr('href');

            anthologyEventsList.push({
                detailsUrl,
                imageUrl,
                promoter,
                headliner,
                openers,
                dayOfWeek,
                eventDate,
                eventShowTime,
                eventDoors,
                ticketPrice,
                ticketUrl
            });
        });

        // console.log('whats happening here --->', anthologyEventsList);
        const convertedEventsList = anthologyEventsList.map(Object.values);
        // console.log(`Converted array of events: ${convertedEventsList}`);

        client.authorize(function(error, tokens) {
            if (error) {
                console.log(`There was an error connecting to Google Sheets: ${error}`);
                return;
            } else {
                console.log('Connected to Google Sheets.');
                gsrun(client);
            }
        });

        async function gsrun(cl) {
            const gsapi = google.sheets({
                version: 'v4',
                auth: cl,
            });
        
            // GET DATA FROM GOOGLE SPREADSHEET
            const options = {
                spreadsheetId: '1buceb3Ctwsva8JmW9_4rxZWb2Na1miY5wPgYmAuHFaE',
                range: 'anthology!A1:B5'
            };
        
            // let sheetData = await gsapi.spreadsheets.values.get(options);
            // let dataArray = sheetData.data.values;
            // console.log(`Data array from GET: ${dataArray}`);

            // UPDATE DATA IN GOOGLE SPREADSHEET
            const updateOptions = {
                spreadsheetId: '1buceb3Ctwsva8JmW9_4rxZWb2Na1miY5wPgYmAuHFaE',
                range: 'anthology!B2',
                valueInputOption: 'USER_ENTERED',
                resource: { values: convertedEventsList }
            };

            let updateResponse = await gsapi.spreadsheets.values.update(updateOptions);
            console.log(`Check the spreadsheet! Update was successful!: ${updateResponse}`);
        }
    })
    .catch(err => console.log(`There was an error fetching data: ${err}`));

app.listen(PORT, () => { console.log(`Magic happening on port ${PORT}`); });