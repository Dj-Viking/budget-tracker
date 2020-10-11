## User Story
AS AN avid traveler
I WANT to be able to track my withdrawals and deposits with or without a data/internet connection
SO THAT my account balance is accurate when I am traveling 

## Acceptance Criteria

GIVEN a budget tracker without an internet connection
WHEN the user inputs an expense or deposit
THEN they will 
* DONE receive a notification that they have added an expense or deposit
  - DONE something appearing in the document if response.ok? 
WHEN the user reestablishes an internet connection
THEN 
* DONE the deposits or expenses added 
* DONE while they were offline are added to their transaction history 
* DONE and their totals are updated


* [x] add indexed db to save data while offline and upload to server database when back online
* [x] create service worker to service static assets while offline
* [x] create manifest.json file for pwa installation onto a user's phone homescreen

* [x] deploy to heroku with mongoDB database connected to heroku deployment