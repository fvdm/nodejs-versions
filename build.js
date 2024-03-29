const { open } = require( 'fs' ).promises;


/**
 * Better console.log for promises
 *
 * @param   {mixed}           data
 * @return  {Promise<mixed>}  data
 */

async function colorLog( data ) {
  console.dir( data, {
    depth: null,
    colors: true,
  } );

  return data;
}


/**
 * Fetch current release schedule
 *
 * @return  {Promise<object>}
 */

async function getSchedule () {
  console.log( 'Fetching release schedule' );

  const url = 'https://raw.githubusercontent.com/nodejs/Release/main/schedule.json';
  const res = await fetch( url );

  if ( ! res.ok ) {
    throw new Error( `Error ${res.status} ${res.statusText}` );
  }

  return res.json();
}


/**
 * Filter schedule to 'current' and 'lts' versions
 *
 * @return  {Promise<object>}
 */

async function processVersions ( data ) {
  const today = new Date().toJSON().split( 'T' )[0];

  let release;
  let result = {
    lts: [],
    current: [],
    lts_current: [],
  };

  console.log( 'Processing versions' );

  for( let version in data ) {
    release = data[version];
    version = version.replace( /^v/, '' );

    // skip future
    if ( release.start > today ) {
      continue;
    }

    // skip end of life
    if ( release.end <= today ) {
      continue;
    }

    // skip maintenance
    if ( release.maintenance <= today ) {
      continue;
    }  

    // active LTS status
    if ( release.lts <= today ) {
      result.lts.push( version );
    }

    // current versions
    if ( release.lts > today ) {
      result.current.push( version );
    } 
  }

  result.lts_current = [...result.lts, ...result.current];

  for ( let key in result ) {
    result[key] = result[key].sort().reverse();
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

async function write ( filename, data ) {
  const file = await open( filename, 'w' );
  
  data = JSON.stringify( data );
  await file.writeFile( data );

  return file.close();
}


/**
 * Update the version files
 *
 * @return  {Promise}
 */

async function updateVersions ( versions ) {
  const stored = {
    current: require( './current.json' ),
    lts: require( './lts.json' ),
    lts_current: require( './lts-current.json' ),
  };

  // LTS
  console.log();
  process.stdout.write( 'lts.json          ' );

  if ( stored.lts.toString() === versions.lts.toString() ) {
    console.log( '\u001b[1;32mOK\u001b[0m' );
  }
  else {
    console.log( '\u001b[1;33mOUTDATED\u001b[0m' );
    write( './lts.json', versions.lts );
  }

  colorLog( versions.lts );
  console.log();

  // LTS + current
  process.stdout.write( 'lts-current.json  ' );

  if ( stored.lts_current.toString() === versions.lts_current.toString() ) {
    console.log( '\u001b[1;32mOK\u001b[0m' );
  }
  else {
    console.log( '\u001b[1;33mOUTDATED\u001b[0m' );
    write( './lts-current.json', versions.lts_current );
  }

  colorLog( versions.lts_current );
  console.log();

  // current
  process.stdout.write( 'current.json      ' );

  if ( stored.current.toString() === versions.current.toString() ) {
    console.log( '\u001b[1;32mOK\u001b[0m' );
  }
  else {
    console.log( '\u001b[1;33mOUTDATED\u001b[0m' );
    write( './current.json', versions.current );
  }

  colorLog( versions.current );
  console.log();
}

// Run it
getSchedule()
  .then( processVersions )
  .then( updateVersions )
  .catch( err => {
    colorLog( err );
    process.exit( 1 );
  } )
;
