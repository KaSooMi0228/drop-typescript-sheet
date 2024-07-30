exit 0
set -e 
#ssh root@dropsheet.remdal.com "bash -c \"sudo -u dropsheet pg_dump\" > /root/backups/bck2-`date +\"%y-%m-%d\"`.bck"

#ssh root@dropsheet.remdal.com sudo -u dropsheet dropdb dropsheet
#ssh root@dropsheet.remdal.com sudo -u dropsheet createdb dropsheet
#pg_dump -d dropsheet -O | ssh -C root@dropsheet.remdal.com sudo -u dropsheet psql dropsheet

echo CAREFUL
