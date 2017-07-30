# Parse server jobs scheduler

## Purpose of the library
By default, *_JobSchedule* objects created on self-hosted Parse servers are not handled by the Parse server library.
This library is a minimalist tool that fetches all *_JobSchedule* objects and schedules cron tasks that will run the scheduled jobs.

## How to use it?

### Install the library

```sh
$ npm install --save https://github.com/jaeggerr/parse-jobs-scheduler
```

### Add those lines your Parse Cloud code main file

```js
// Import the library
const JobsScheduler = require('parse-jobs-scheduler')

// Recreates all crons when the server is launched
JobsScheduler.recreateSchedule()

// Recreates all crons when a job schedule has changed
Parse.Cloud.afterSave('_JobSchedule', async (request) => {
  JobsScheduler.recreateSchedule()
})

// Recreates all crons when a job schedule was removed
Parse.Cloud.afterDelete('_JobSchedule', async (request) => {
  JobsScheduler.recreateSchedule()
})
```

### I want to run this library on another server
It is easy to run the code on another server. Just initialize Parse with your master key before you call *recreateSchedule()*.
The master key is required to fetch *_JobSchedule* objects.
```js
Parse.serverURL = 'http://example.com:1337/parse'
Parse.initialize('myAppId', null, 'masterKey')
```
However, keep in mind that you can only manage one Parse server at once since the Parse object is a singleton.

 ## Future improvements
 * Only delete / recreate crons for the concerned *_JobSchedule* instead of recreating all crons
 * Add unit tests
 * Add support for Parse Webhooks if you prefer to handle crons on another server
