# scriptacle

Script-like additions for your tiny node automations

## Usage

Just create a new executable script, for example `buckler`, and then mark
it as executable (Eg: `chmod +x buckler`).

Example copy-paste script:
```js
#!/bin/npx https://github.com/pblanco-dekalabs/scriptacle.git

echo `populating {bold environment}...`
for (const key in process.env) {
  env[key] = process.env[key]
}
ok `environment populated`

echo `checking requirements of {cyan backend}...`
cd `backend`
when('full', () => {
  run `git pull`
  run `yarn`
}, () => {
  echo `{gray skipping...}`
})
echo `spawning {cyan backend} process...`
const back = container `Backend`
back.spawn('yarn', 'dev')
ok `process started`
back.on('line', line => {
  if (line.match(/Validation Error Count: [0-9]+/)) {
    err `${line}`
    panic `Server crashed!`
  }
})
ok `Crash listener attached to the backend process`

echo `checking requirements of {green frontend}...`
cd `frontend`
when('full', () => {
  run `git pull`
  run `yarn`
}, () => {
  echo `{gray skipping...}`
})
echo `spawning {green frontend} process...`
const front = container `Frontend`
front.spawn('yarn', 'dev')
ok `process started`
```
