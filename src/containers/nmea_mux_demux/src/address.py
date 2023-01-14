#!/usr/bin/python3
import ipaddress

from dataclasses import dataclass

@dataclass
class AddressAndPort:

  address: ipaddress.IPv4Address | ipaddress.IPv6Address
  port: int

  @property
  def as_tuple(self):
    return (self.address.exploded, self.port)

  @classmethod
  def parse(cls, addr: str, default_port: int):
    if ':' in addr:
      addr, port = addr.split(':', 2)
      return cls(ipaddress.ip_address(addr), int(port))
    else:
      return cls(ipaddress.ip_address(addr), default_port)

  @classmethod
  def parse_nmea(cls, addr: str):
    return cls.parse(addr, 10110)
  
  def __repr__(self) -> str:
    return self.address.exploded + ':' + str(self.port)