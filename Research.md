# Engineering references

The lessons target electronics students. These are primary manufacturer references for general component roles; the teaching board is a generic illustrative design, without real part compatibility or fabrication outputs.

- [NVIDIA · GPU architecture fundamentals](https://docs.nvidia.com/deeplearning/performance/dl-performance-gpu-background/)
- [TI · Multiphase processor power](https://www.ti.com/product-category/power-management/multiphase.html)
- [Micron · Graphics memory](https://www.micron.com/products/memory/graphics-memory)
- [NVIDIA · GA102 architecture whitepaper](https://www.nvidia.com/content/PDF/nvidia-ampere-ga-102-gpu-architecture-whitepaper-v2.pdf)
- [Winbond · Code-storage flash memory](https://www.winbond.com/export/sites/winbond/product-selection-guide/file/2025-Product-Selection-Guide-Winbond-Code-Storage-Flash-Memory.pdf?__locale=en)
- [SiTime · Clock-generation reference example](https://www.sitime.com/support/resource-library/datasheets/sit95211-datasheet)
- [Noctua · PWM fan specifications](https://cdn.noctua.at/media/Noctua_PWM_specifications_white_paper.pdf)
- [TI · High-speed PCB layout guidance](https://www.ti.com/lit/an/scaa082a/scaa082a.pdf)
- [TI · Heat sinks and thermal interfaces](https://www.ti.com/video/6243724387001)

Reference assignments and the component descriptions are stored with the lesson data in `app/src/catalog.js`. All artwork is original SVG. Generic GDDR6 parameters illustrate 2 GB per x32 package at 16 Gb/s per pin; four independent channels give 8 GB, 128 bits and 256 GB/s theoretical bandwidth. These are training assumptions, not measured results.
