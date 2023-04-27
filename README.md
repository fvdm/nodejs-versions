# nodejs-versions

[![Update versions](https://github.com/fvdm/nodejs-versions/actions/workflows/update_versions.yml/badge.svg?branch=main)](https://github.com/fvdm/nodejs-versions/actions/workflows/update_versions.yml)

The current major Node.js versions for use in
automation scripts.

At the moment the list is maintained by hand.

My packages are always tested against the officialy
supported LTS (active) versions.


## Files

file             | stages
:----------------|:------
current.json     | Only current
lts.json         | Only active LTS
lts-current.json | LTS + current


## Data source

- [Node.js release schedule](https://nodejs.org/en/about/releases/)
- [Node.js release.json](https://raw.githubusercontent.com/nodejs/Release/main/schedule.json)


## Github action

Here the `lts.json` is retrieved and made available in
`needs.lts_versions.outputs.matrix`.
Then in the build you convert the JSON array to a matrix.


```yml
jobs:
  lts_versions:
    name: "Get versions"
    runs-on: ubuntu-latest
    steps:
      - id: set-matrix
        run: echo "matrix=$(curl -s https://raw.githubusercontent.com/fvdm/nodejs-versions/main/lts.json)" >> $GITHUB_OUTPUT
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}

  build:
    name: "Node"
    needs: lts_versions
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: ${{ fromJson(needs.lts_versions.outputs.matrix) }}
    steps:
    - uses: actions/checkout@v2
    - name: Test on Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v2
      with:
        node-version: ${{ matrix.node-version }}
    - run: npm install
    - run: npm test
```
