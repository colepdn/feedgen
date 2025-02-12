cd /var/lib/feedgen/
sudo git pull --force
sudo cp /var/lib/feedgen/feedgen-cron.service /etc/systemd/system
sudo cp /var/lib/feedgen/feedgen-cron.timer /etc/systemd/system
sudo cp /var/lib/feedgen/feedgend.service /etc/systemd/system
sudo systemctl daemon-reload
sudo chown -R feedgen:feedgen /var/lib/feedgen
