import cron from 'cron'
import 'babel-polyfill'
import moment from 'moment'
import Parse from 'parse/node'
import rp from 'request-promise'

const CronJob = cron.CronJob
const PARSE_TIMEZONE = 'UTC'

let cronJobs = {}

/**
 * Stop all scheduled jobs, fetch all jobs from Parse server and schedule crons
 */
const recreateSchedule = async () => {
  if (!Parse.applicationId) {
    throw new Error('Parse is not initialized')
  }

  try {
    const results = await new Parse.Query('_JobSchedule').find({
      useMasterKey: true
    })

    destroyJobs()

    for (let job of results) {
      try {
        cronJobs[job.id] = createCronJobs(job)
      } catch (error) {
        console.log(error)
      }
    }
    console.log(`${Object.keys(cronJobs).length} job(s) scheduled.`)
  } catch (error) {
    console.log('Could not fetch jobs')
  }
}

/**
 * Stop all jobs and remove them from the list of jobs
 */
const destroyJobs = () => {
  for (let key of Object.keys(cronJobs)) {
    for (let job of cronJobs[key]) {
      job.stop()
    }
  }
  cronJobs = {}
}

const createCronJobs = (job) => {
  const startDate = new Date(job.get('startAfter'))
  const repeatMinutes = job.get('repeatMinutes')
  const jobName = job.get('jobName')
  const params = job.get('params')
  const now = moment()

  // Launch just once
  if (!repeatMinutes) {
    return [
      new CronJob(
        startDate,
        () => { // On tick
          performJob(jobName, params)
        },
        null, // On complete
        true, // Start
        PARSE_TIMEZONE // Timezone
      )
    ]
  }
  // Periodic job. Create a cron to launch the periodic job a the start date.
  const timeOfDay = moment(job.get('timeOfDay'), 'HH:mm:ss.Z')
  const daysOfWeek = job.get('daysOfWeek')
  const cronDoW = (daysOfWeek) ? daysOfWeekToCronString(daysOfWeek) : '*'
  const cron = `0 ${timeOfDay.utc().minutes()}/${repeatMinutes} ${timeOfDay.utc().hour()} * * ${cronDoW}`

  console.log(`${jobName}: ${cron}`)

  const actualJob = new CronJob(
    cron,
    () => { // On tick
      performJob(jobName, params)
    },
    null, // On complete
    false, // Start
    PARSE_TIMEZONE // Timezone
  )

  // If startDate is before now, start the cron now
  if (moment(startDate).isBefore(now)) {
    actualJob.start()
    return [actualJob]
  }

  // Otherwise, schedule a cron that is going to launch our actual cron at the time of the day
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

/**
 * Converts the Parse scheduler days of week
 * @param {Array} daysOfWeek An array of seven elements for the days of the week. 1 to schedule the task for the day, otherwise 0.
 */
const daysOfWeekToCronString = (daysOfWeek) => {
  const daysNumbers = []
  for (let i = 0; i < daysOfWeek.length; i++) {
    if (daysOfWeek[i]) {
      daysNumbers.push((i + 1) % 7)
    }
  }
  return daysNumbers.join(',')
}

/**
 * Perform a background job
 * @param {String} jobName The job name on Parse Server
 * @param {Object=} params The parameters to pass to the request
 */
const performJob = async (jobName, params) => {
  try {
    const request = rp({
      method: 'POST',
      uri: Parse.serverURL + '/jobs/' + jobName,
      headers: {
        'X-Parse-Application-Id': Parse.applicationId,
        'X-Parse-Master-Key': Parse.masterKey
      },
      json: true // Automatically parses the JSON string in the response
    })
    if (params) {
      request.body = params
    }
    console.log(`Job ${jobName} launched.`)
  } catch (error) {
    console.log(error)
  }
}

export { recreateSchedule }
