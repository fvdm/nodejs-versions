const { doRequest } = require ('httpreq');
const { open } = require ('fs').promises;


/**
 * Fetch current release schedule
 *
 * @return  {Promise<object>}
 */

async function getSchedule () {
  return doRequest ({
    url: 'https://raw.githubusercontent.com/nodejs/Release/main/schedule.json',
  })
    .then (res => res.body)
    .then (JSON.parse)
  ;
}


/**
 * Filter schedule to 'current' and 'lts' versions
 *
 * @return  {Promise<object>}
 */

async function processVersions () {
  const data = await getSchedule();
  const today = new Date().toJSON().split ('T')[0];

  let release;
  let result = {
    lts: [],
    current: [],
  };

  for (let key in data) {
    release = data[key];

    // skip future
    if (release.start > today) {
      continue;
    }

    // skip end of life
    if (release.end <= today) {
      continue;
    }

    // active LTS status
    if (release.lts <= today) {
      result.lts.push (version);
    }

    // current versions (including LTS)
    result.current.push (version);
  }

  return result;
}


/**
 * Write data to JSON file
 *
 * @param   {string}        filename  File to write
 * @param   {object|array}  data      Data to write
 *
 * @return  {Promise}
 */

async function write (filename, data) {
  try {
    const file = await open (filename, 'w');
  
    data = JSON.stringify (data);
    file.writeFile (data);
  }
  finally {
    return file.close();
  }
}


/**
 * Update the version files
 *
 * @return  {Promise}
 */

async function updateVersions () {
  const versions = await processVersions();

  write ('./lts.json', versions.lts);
  write ('./lts-current.json', versions.current);
}
