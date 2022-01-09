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
  console.log();
  process.stdout.write ('lts.json          ');

  if (stored.lts.toString() === versions.lts.toString()) {
    console.log ('\u001b[32mOK\u001b[0m');
  }
  else {
    console.log ('\u001b[33mOUTDATED\u001b[0m');
    write ('./lts.json', versions.lts);
  }

  colorLog (versions.lts);
  console.log();

  // LTS + current
  process.stdout.write ('lts-current.json  ');

  if (stored.current.toString() === versions.current.toString()) {
    console.log ('\u001b[32mOK\u001b[0m');
  }
  else {
    console.log ('\u001b[33mOUTDATED\u001b[0m');
    write ('./lts-current.json', versions.current);
  }

  colorLog (versions.current);
  console.log();
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
