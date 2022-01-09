const { doRequest } = require ('httpreq');
const { open } = require ('fs').promises;


/**
 * Fetch current release schedule
 *
 * @return  {Promise<object>}
 */

async function getSchedule () {
  console.log ('Fetching release schedule');

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
  console.log ('Processing versions');

  const data = await getSchedule();
  const today = new Date().toJSON().split ('T')[0];

  let release;
  let result = {
    lts: [],
    current: [],
  };

  for (let version in data) {
    release = data[version];
    version = version.replace (/^v/, '');

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

  // sort versions
  result.current = result.current.sort().reverse();
  result.lts = result.lts.sort().reverse();

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
  const file = await open (filename, 'w');
  
  data = JSON.stringify (data);
  await file.writeFile (data);

  return file.close();
}


/**
 * Update the version files
 *
 * @return  {Promise}
 */

async function updateVersions () {
  const versions = await processVersions();

  console.log ('lts.json');
  console.dir (versions.lts, { colors: true });
  console.log ();

  console.log ('lts-current.json');
  console.dir (versions.current, { colors: true });
  console.log ();

  write ('./lts.json', versions.lts);
  write ('./lts-current.json', versions.current);
}
