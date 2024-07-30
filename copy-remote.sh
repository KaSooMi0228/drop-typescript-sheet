dropdb dropsheet
createdb dropsheet
ssh -C root@dropsheet.remdal.com sudo -u dropsheet pg_dump -d dropsheet -O | psql dropsheet