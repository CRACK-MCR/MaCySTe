# Attacking the radar

In MaCySTe we provide a sample implementation of the ASTERIX DoS attack on radar systems described in:

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

To use it, ensure to have deployed a scenario containing the malware (such as `attacker_siem`) and access the [attacker GUI](../reference/attack-gui.md) from the [MaCySTE GUI](../reference/gui-home.md).

Once there, click on attacks, select a range and start the DoS.

The result, as you can see below will be a packet obscuring the entire PPI.

![ASTERIX DoS attack](../images/radar-dos.png)