import cron from 'cron'
import Parse from 'parse/node'

const CronJob = cron.CronJob
const PARSE_TIMEZONE = 'GMT'

Parse.initialize('myApp', null, 'masterKey')
Parse.serverURL = 'http://example.com:1337/parse'

const cronJobs = {}

const fetchSchedule = async () => {
  const results = await new Parse.Query('_JobSchedule').find({
    useMasterKey: true
  })

  for (let job of results) {
    try {
      cronJobs[job.id] = createCronJobs(job)
    } catch (error) {
      console.log(error)
    }
  }
  console.log(`${Object.keys(cronJobs).length} job(s) scheduled.`)
}

const createCronJobs = (job) => {
  const startDate = new Date(job.get('startAfter'))
  const repeatMinutes = job.get('repeatMinutes')
  console.log(typeof repeatMinutes)
  console.log(startDate)

  // Launch just once
  if (!repeatMinutes) {
    return [
      new CronJob(
        startDate,
        () => { // On tick
          console.log('Start the cron')
        },
        null, // On complete
        true, // Start
        PARSE_TIMEZONE // Timezone
      )
    ]
  }
  // Periodic job. Create a cron to launch the periodic job a the start date.
  const actualJob = new CronJob(
    '* * * * * *',
    () => { // On tick
      console.log('Tick!')
    },
    null, // On complete
    false, // Start
    PARSE_TIMEZONE // Timezone
  )

  const startCron = new CronJob(
    startDate,
    () => { // On tick
      console.log('Start the cron')
      actualJob.start()
    },
    null, // On complete
    true, // Start
    PARSE_TIMEZONE // Timezone
  )

  return [startCron, actualJob]
}

fetchSchedule()
