# Software PLCs

MaCySTe leverages the OpenPLC runtime for its PLCs, they communicate via ModBus and run programs written in ladder logic which are subsequently transformed into IEC 61131-3 structured text instructions.

We invite the users to visit the OpenPLC documentation to learn more.

Our OpenPLC container allows the user to preseed the program and slave device configuration, and to replace environment variables present inside of these configuration files.

## Implementation of 32-bit floating point values

Given that ModBus supports holding registers keeping at most 16-bit values, the floating point numbers exchanged in MaCySTe are written and read by splitting a 32-bit float into two successive 16-bit registers.
