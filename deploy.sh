set -e
git push
echo export default \"`date`\" > src/version.ts
npm run build
npx tsc -project . -outDir build
rsync -avr build/ root@dropsheet.remdal.com:dropsheet-web/
rsync -avr --delete dist/ root@dropsheet.remdal.com:dropsheet-web/dist/
ssh root@dropsheet.remdal.com "cd dropsheet-web && git stash && git pull"
echo "CI"
ssh root@dropsheet.remdal.com "cd dropsheet-web && sudo -u dropsheet npm ci"
echo "PSQL"
ssh root@dropsheet.remdal.com "sudo -u dropsheet psql < dropsheet-web/functions.sql"
echo "RESTART"
ssh root@dropsheet.remdal.com "systemctl restart dropsheet.service"