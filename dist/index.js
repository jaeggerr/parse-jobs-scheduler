'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.recreateSchedule = undefined;

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
 * Stop all scheduled jobs, fetch all jobs from Parse server and schedule crons
 */
var recreateSchedule = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    var results, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, job;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (_node2.default.applicationId) {
              _context.next = 2;
              break;
            }

            throw new Error('Parse is not initialized');

          case 2:
            _context.prev = 2;
            _context.next = 5;
            return new _node2.default.Query('_JobSchedule').find({
              useMasterKey: true
            });

          case 5:
            results = _context.sent;


            destroyJobs();

            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 10;
            for (_iterator = results[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              job = _step.value;

              try {
                cronJobs[job.id] = createCronJobs(job);
              } catch (error) {
                console.log(error);
              }
            }
            _context.next = 18;
            break;

          case 14:
            _context.prev = 14;
            _context.t0 = _context['catch'](10);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 18:
            _context.prev = 18;
            _context.prev = 19;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 21:
            _context.prev = 21;

            if (!_didIteratorError) {
              _context.next = 24;
              break;
            }

            throw _iteratorError;

          case 24:
            return _context.finish(21);

          case 25:
            return _context.finish(18);

          case 26:
            console.log(Object.keys(cronJobs).length + ' job(s) scheduled.');
            _context.next = 32;
            break;

          case 29:
            _context.prev = 29;
            _context.t1 = _context['catch'](2);

            console.log('Could not fetch jobs');

          case 32:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[2, 29], [10, 14, 18, 26], [19,, 21, 25]]);
  }));

  return function recreateSchedule() {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Stop all jobs and remove them from the list of jobs
 */
var destroyJobs = function destroyJobs() {
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = Object.keys(cronJobs)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var key = _step2.value;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = cronJobs[key][Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
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

var createCronJobs = function createCronJobs(job) {
  var startDate = new Date(job.get('startAfter'));
  var repeatMinutes = job.get('repeatMinutes');
  var jobName = job.get('jobName');
  var params = job.get('params');

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
  var timeOfDay = (0, _moment2.default)(job.get('timeOfDay'), 'HH:mm:ss.Z');
  var daysOfWeek = job.get('daysOfWeek');
  var cronDoW = daysOfWeek ? daysOfWeekToCronString(daysOfWeek) : '*';
  var cron = '0 ' + timeOfDay.utc().minutes() + '/' + repeatMinutes + ' ' + timeOfDay.utc().hour() + ' * * ' + cronDoW;

  console.log(jobName + ': ' + cron);

  var actualJob = new CronJob(cron, function () {
    // On tick
    console.log('Tick!');
    performJob(jobName, params);
  }, null, // On complete
  false, // Start
  PARSE_TIMEZONE // Timezone
  );

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
  var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(jobName, params) {
    var request;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
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
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function performJob(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

exports.recreateSchedule = recreateSchedule;