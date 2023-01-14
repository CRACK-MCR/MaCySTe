#!/usr/bin/env python3
import asyncio
import logging

from nats_command import multicast_listener
from nats_image import radar_receiver, send_radar, update_heading, send_asterix, update_cell_length
from radarparser import natsRadarParser

async def async_main(parsed_args):
    tasks = []
    #
    # subscribe to opencpn commands (zoom)
    #
    command_task = asyncio.create_task(multicast_listener(parsed_args))
    tasks.append(command_task)
    #
    # subscribe to heading_updates
    #
    heading_task = asyncio.create_task(update_heading(parsed_args))
    tasks.append(heading_task)
    #
    # send radar image
    #
    send_radar_task = asyncio.create_task(send_radar(parsed_args))
    tasks.append(send_radar_task)
    #
    # subscribe to radar image (key_value)
    #
    receive_radar_task = asyncio.create_task(radar_receiver(parsed_args))
    tasks.append(receive_radar_task)
    #
    #  Await any for failure
    done, pending = await asyncio.wait(tasks, return_when = asyncio.FIRST_EXCEPTION)
    for fut in done:
        fut.result()
    for fut in pending:
        fut.cancel()

async def asterix_main(parsed_args):
    tasks = []
    #
    # subscribe to cell_length update
    #
    cell_task = asyncio.create_task(update_cell_length(parsed_args))
    tasks.append(cell_task)
    #
    # send radar image
    #
    send_radar_task = asyncio.create_task(send_asterix(parsed_args))
    tasks.append(send_radar_task)
    #
    # subscribe to radar image (key_value)
    #
    receive_radar_task = asyncio.create_task(radar_receiver(parsed_args))
    tasks.append(receive_radar_task)
    #
    #  Await any for failure
    done, pending = await asyncio.wait(tasks, return_when = asyncio.FIRST_EXCEPTION)
    for fut in done:
        fut.result()
    for fut in pending:
        fut.cancel()

if __name__ == '__main__':
    parsed_args = vars(natsRadarParser.parse_args())
    if parsed_args['verbose']:
        logging.basicConfig(level = logging.DEBUG)
    else:
        logging.basicConfig(level = logging.INFO)
    logging.debug(f'Parsed args:{parsed_args}')
    if parsed_args['protocol'] == 'NAVICO': 
        asyncio.run(async_main(parsed_args))
    elif parsed_args['protocol'] == 'ASTERIX':
        asyncio.run(asterix_main(parsed_args))
    else:
        logging.error("Wrong protocol. Only ASTERIX or NAVICO")
