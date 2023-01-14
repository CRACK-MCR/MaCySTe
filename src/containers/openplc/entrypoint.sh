#!/bin/bash
if [ -f "/data/main.st" ]; then
  echo "Loading program: main.st"
  cp /data/main.st webserver/st_files/
  SQL_SCRIPT="INSERT INTO Programs (Name, Description, File, Date_upload) VALUES ('main', 'main program', 'main.st', strftime('%s', 'now'));"
  sqlite3 ./webserver/openplc.db "$SQL_SCRIPT"
  rm -f webserver/core/openplc
  cd webserver
  ./scripts/compile_program.sh main.st
  cd ..
fi

if [ -f "/data/mbconfig.cfg.tmpl" ]; then
  envsubst < /data/mbconfig.cfg.tmpl > /data/mbconfig.cfg
fi

if [ -f "/data/mbconfig.cfg" ]; then
  cp /data/mbconfig.cfg /tmp/tmp_mbconfig.cfg
  sed -i -e "s/ = /=/g" /tmp/tmp_mbconfig.cfg
  #
  source /tmp/tmp_mbconfig.cfg
  max=$Num_Devices
  sed -i -e '1,3d' /tmp/tmp_mbconfig.cfg
  SQL_DEVICE=""
  if [ -n "$IP_ADDRESS" ]; then
    for (( i=0; i<$max; i++))
    do
      sed -i -e "s/device${i}.//g" /tmp/tmp_mbconfig.cfg
      source /tmp/tmp_mbconfig.cfg
      SQL_DEVICE+="INSERT INTO Slave_dev (dev_name, dev_type, slave_id, ip_address, ip_port, di_start, di_size, coil_start, coil_size, ir_start, ir_size, hr_read_start, hr_read_size, hr_write_start, hr_write_size) VALUES ('$name', '$protocol', $slave_id, '$IP_ADDRESS', $IP_Port, $Discrete_Inputs_Start, $Discrete_Inputs_Size, $Coils_Start, $Coils_Size, $Input_Registers_Start, $Input_Registers_Size, $Holding_Registers_Read_Start, $Holding_Registers_Read_Size, $Holding_Registers_Start, $Holding_Registers_Size);"
      sed -i -e '1,25d' /tmp/tmp_mbconfig.cfg
    done
  else
    for (( i=0; i<$max; i++))
    do
      sed -i -e "s/device${i}.//g" /tmp/tmp_mbconfig.cfg
      source /tmp/tmp_mbconfig.cfg
      SQL_DEVICE+="INSERT INTO Slave_dev (dev_name, dev_type, slave_id, ip_address, ip_port, di_start, di_size, coil_start, coil_size, ir_start, ir_size, hr_read_start, hr_read_size, hr_write_start, hr_write_size) VALUES ('$name', '$protocol', $slave_id, '$address', $IP_Port, $Discrete_Inputs_Start, $Discrete_Inputs_Size, $Coils_Start, $Coils_Size, $Input_Registers_Start, $Input_Registers_Size, $Holding_Registers_Read_Start, $Holding_Registers_Read_Size, $Holding_Registers_Start, $Holding_Registers_Size);"
      sed -i -e '1,25d' /tmp/tmp_mbconfig.cfg
    done
  fi
  cp /data/mbconfig.cfg ./webserver
  sqlite3 ./webserver/openplc.db "$SQL_DEVICE"
fi

SQL_AUTO_START="UPDATE Settings SET Value = 'true' WHERE Key = 'Start_run_mode';"
sqlite3 ./webserver/openplc.db "$SQL_AUTO_START"

exec ./start_openplc.sh