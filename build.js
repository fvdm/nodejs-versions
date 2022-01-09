const { doRequest } = require ('httpreq');
const { open } = require ('fs').promises;


/**
 * Better console.log for promises
 *
 * @param   {mixed}           data
 * @return  {Promise<mixed>}  data
 */

async function colorLog (data) {
  console.dir (data, {
    depth: null,
    colors: true,
  });

  return data;
}


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

async function processVersions (data) {
  const today = new Date().toJSON().split ('T')[0];

  let release;
  let result = {
    lts: [],
    current: [],
  };

  console.log ('Processing versions');

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

async function updateVersions (versions) {
  const stored = {
    current: require ('./lts-current.json'),
    lts: require ('./lts.json'),
  };

  // LTS
  console.log ();
  console.log ('lts.json');
  colorLog (versions.lts);

  if (stored.lts.toString() === versions.lts.toString()) {
    console.dir ('LTS versions are up to date.')
  }
  else {
    write ('./lts.json', versions.lts);
  }

  // LTS + current
  console.log ();
  console.log ('lts-current.json');
  colorLog (versions.current);

  if (stored.current.toString() === versions.current.toString()) {
    console.dir ('LTS & current versions are up to date.')
  }
  else {
    write ('./lts-current.json', versions.current);
  }

  console.log ();
}

// Run it
getSchedule()
  .then (processVersions)
  .then (updateVersions)
  .catch (err => {
    colorLog (err);
    process.exit (1);
  })
;
