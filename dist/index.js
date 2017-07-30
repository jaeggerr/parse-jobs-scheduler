'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.destroySchedule = exports.recreateSchedule = undefined;

var _cron = require('cron');

var _cron2 = _interopRequireDefault(_cron);

require('babel-polyfill');

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _node = require('parse/node');

var _node2 = _interopRequireDefault(_node);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var CronJob = _cron2.default.CronJob;
var PARSE_TIMEZONE = 'UTC';

var cronJobs = {};

/**
 * Parse job schedule object
 * @typedef {Object} _JobSchedule
 * @property {String} id The job id
 */

/**
 * Recreate the cron schedules for a specific _JobSchedule or all _JobSchedule objects
 * @param {_JobSchedule | string} [job=null] The job schedule to recreate. If not specified, all jobs schedules will be recreated.
 * Can be a _JobSchedule object or the id of a _JobSchedule object.
 */
var recreateSchedule = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(job) {
    var jobObject;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!job) {
              _context.next = 25;
              break;
            }

            if (!(job instanceof String || typeof job === 'string')) {
              _context.next = 18;
              break;
            }

            _context.prev = 2;
            _context.next = 5;
            return _node2.default.Object.extend('_JobSchedule').createWithoutData(job).fetch({
              useMasterKey: true
            });

          case 5:
            jobObject = _context.sent;

            if (!jobObject) {
              _context.next = 10;
              break;
            }

            recreateJobSchedule(jobObject);
            _context.next = 11;
            break;

          case 10:
            throw new Error('No _JobSchedule was found with id ' + job);

          case 11:
            _context.next = 16;
            break;

          case 13:
            _context.prev = 13;
            _context.t0 = _context['catch'](2);
            throw _context.t0;

          case 16:
            _context.next = 23;
            break;

          case 18:
            if (!(job instanceof _node2.default.Object && job.className === '_JobSchedule')) {
              _context.next = 22;
              break;
            }

            recreateJobSchedule(job);
            _context.next = 23;
            break;

          case 22:
            throw new Error('Invalid job type. Must be a string or a _JobSchedule');

          case 23:
            _context.next = 32;
            break;

          case 25:
            _context.prev = 25;

            recreateScheduleForAllJobs();
            _context.next = 32;
            break;

          case 29:
            _context.prev = 29;
            _context.t1 = _context['catch'](25);
            throw _context.t1;

          case 32:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[2, 13], [25, 29]]);
  }));

  return function recreateSchedule(_x) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * (Re)creates all schedules (crons) for all _JobSchedule from the Parse server
 */
var recreateScheduleForAllJobs = function () {
  var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
    var results, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, job;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (_node2.default.applicationId) {
              _context2.next = 2;
              break;
            }

            throw new Error('Parse is not initialized');

          case 2:
            _context2.prev = 2;
            _context2.next = 5;
            return new _node2.default.Query('_JobSchedule').find({
              useMasterKey: true
            });

          case 5:
            results = _context2.sent;


            destroySchedules();

            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context2.prev = 10;
            for (_iterator = results[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              job = _step.value;

              try {
                recreateJobSchedule(job);
              } catch (error) {
                console.log(error);
              }
            }
            _context2.next = 18;
            break;

          case 14:
            _context2.prev = 14;
            _context2.t0 = _context2['catch'](10);
            _didIteratorError = true;
            _iteratorError = _context2.t0;

          case 18:
            _context2.prev = 18;
            _context2.prev = 19;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 21:
            _context2.prev = 21;

            if (!_didIteratorError) {
              _context2.next = 24;
              break;
            }

            throw _iteratorError;

          case 24:
            return _context2.finish(21);

          case 25:
            return _context2.finish(18);

          case 26:
            console.log(Object.keys(cronJobs).length + ' job(s) scheduled.');
            _context2.next = 32;
            break;

          case 29:
            _context2.prev = 29;
            _context2.t1 = _context2['catch'](2);
            throw _context2.t1;

          case 32:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined, [[2, 29], [10, 14, 18, 26], [19,, 21, 25]]);
  }));

  return function recreateScheduleForAllJobs() {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * (Re)creates the schedule (crons) of a _JobSchedule
 * @param {_JobSchedule} job The _JobSchedule
 */
var recreateJobSchedule = function recreateJobSchedule(job) {
  destroySchedule(job.id);
  cronJobs[job.id] = createCronJobs(job);
};

/**
 * Stop all jobs and remove them from the list of jobs
 */
var destroySchedules = function destroySchedules() {
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = Object.keys(cronJobs)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var key = _step2.value;

      destroySchedule(key);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  cronJobs = {};
};

/**
 * Destroy a planned cron job
 * @param {String} id The _JobSchedule id
 */
var destroySchedule = function destroySchedule(id) {
  var jobs = cronJobs[id];
  if (jobs) {
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = jobs[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var job = _step3.value;

        job.stop();
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    delete cronJobs[id];
  }
};

var createCronJobs = function createCronJobs(job) {
  var startDate = new Date(job.get('startAfter'));
  var repeatMinutes = job.get('repeatMinutes');
  var jobName = job.get('jobName');
  var params = job.get('params');
  var now = (0, _moment2.default)();

  // Launch just once
  if (!repeatMinutes) {
    return [new CronJob(startDate, function () {
      // On tick
      performJob(jobName, params);
    }, null, // On complete
    true, // Start
    PARSE_TIMEZONE // Timezone
    )];
  }
  // Periodic job. Create a cron to launch the periodic job a the start date.
  var timeOfDay = (0, _moment2.default)(job.get('timeOfDay'), 'HH:mm:ss.Z').utc();
  var daysOfWeek = job.get('daysOfWeek');
  var cronDoW = daysOfWeek ? daysOfWeekToCronString(daysOfWeek) : '*';
  var minutes = repeatMinutes % 60;
  var hours = Math.floor(repeatMinutes / 60);

  var cron = '0 ';
  // Minutes
  if (minutes) {
    cron += timeOfDay.minutes() + '-59/' + minutes + ' ';
  } else {
    cron += '0 ';
  }

  // Hours
  cron += timeOfDay.hours() + '-23';
  if (hours) {
    cron += '/' + hours;
  }
  cron += ' ';

  // Day of month
  cron += '* ';

  // Month
  cron += '* ';

  // Days of week
  cron += cronDoW;

  console.log(jobName + ': ' + cron);

  var actualJob = new CronJob(cron, function () {
    // On tick
    performJob(jobName, params);
  }, null, // On complete
  false, // Start
  PARSE_TIMEZONE // Timezone
  );

  // If startDate is before now, start the cron now
  if ((0, _moment2.default)(startDate).isBefore(now)) {
    actualJob.start();
    return [actualJob];
  }

  // Otherwise, schedule a cron that is going to launch our actual cron at the time of the day
  var startCron = new CronJob(startDate, function () {
    // On tick
    console.log('Start the cron');
    actualJob.start();
  }, null, // On complete
  true, // Start
  PARSE_TIMEZONE // Timezone
  );

  return [startCron, actualJob];
};

/**
 * Converts the Parse scheduler days of week
 * @param {Array} daysOfWeek An array of seven elements for the days of the week. 1 to schedule the task for the day, otherwise 0.
 */
var daysOfWeekToCronString = function daysOfWeekToCronString(daysOfWeek) {
  var daysNumbers = [];
  for (var i = 0; i < daysOfWeek.length; i++) {
    if (daysOfWeek[i]) {
      daysNumbers.push((i + 1) % 7);
    }
  }
  return daysNumbers.join(',');
};

/**
 * Perform a background job
 * @param {String} jobName The job name on Parse Server
 * @param {Object=} params The parameters to pass to the request
 */
var performJob = function () {
  var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(jobName, params) {
    var request;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            try {
              request = (0, _requestPromise2.default)({
                method: 'POST',
                uri: _node2.default.serverURL + '/jobs/' + jobName,
                headers: {
                  'X-Parse-Application-Id': _node2.default.applicationId,
                  'X-Parse-Master-Key': _node2.default.masterKey
                },
                json: true // Automatically parses the JSON string in the response
              });

              if (params) {
                request.body = params;
              }
              console.log('Job ' + jobName + ' launched.');
            } catch (error) {
              console.log(error);
            }

          case 1:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function performJob(_x2, _x3) {
    return _ref3.apply(this, arguments);
  };
}();

exports.recreateSchedule = recreateSchedule;
exports.destroySchedule = destroySchedule;