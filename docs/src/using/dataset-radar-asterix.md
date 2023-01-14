# ASTERIX data

ASTERIX is a protocol for radar data exchange, MaCySTe can generate it according to its standard profile (UAP).

In the default configuration MaCySTe will send ASTERIX video to address `239.0.1.2` on port `8600`

For more details on the protocol structure we refer the interested reader to section __2.E__ of [Attacking (and defending) the Maritime Radar System](https://doi.org/10.48550/arxiv.2207.05623)

```bibtex
@misc{https://doi.org/10.48550/arxiv.2207.05623,
  doi = {10.48550/ARXIV.2207.05623},
  url = {https://arxiv.org/abs/2207.05623},
  author = {Longo,  G. and Russo,  E. and Armando,  A. and Merlo,  A.},
  keywords = {Cryptography and Security (cs.CR),  FOS: Computer and information sciences,  FOS: Computer and information sciences},
  title = {Attacking (and defending) the Maritime Radar System},
  publisher = {arXiv},
  year = {2022},
  copyright = {arXiv.org perpetual,  non-exclusive license}
}
```

As with NMEA, ASTERIX can be listened to and dissected with Wireshark.

![ASTERIX in Wireshark](../images/asterix-wireshark.png)

You can visualize the ASTERIX data flow inside of the [PPI](../reference/ppi-asterix.md).
