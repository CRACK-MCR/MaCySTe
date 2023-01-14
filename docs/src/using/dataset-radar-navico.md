# NAVICO data

MaCySTe can generate radar data for a NAVICO BR24 radar system.

Like its real counterpart (a system coming in a ready-to-use pre-configured state) the IP addresses and ports used by Navico are fixed.

The protocol is proprietary and our implementation was inspired by the following research article:

```bibtex
@incollection{dabrowski2011digital,
  title={A digital interface for imagery and control of a Navico/Lowrance broadband radar},
  author={Dabrowski, Adrian and Busch, Sebastian and Stelzer, Roland},
  booktitle={Robotic Sailing},
  pages={169--181},
  year={2011},
  publisher={Springer}
}
```

You can visualize the NAVICO data flow inside of the [PPI](../reference/ppi-opencpn.md).
