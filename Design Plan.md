# GPU Builder — interface and implementation plan

Audience: electronics students. This is a separate application from the Code Zen Studios business website. Source and notes remain local and portable for self-hosting.

## Scope

An interactive learning workbench for assembling a generic graphics card and studying the GPU inside it. A graphics card PCB, GPU package, and GPU die architecture are distinct layers of the experience. Layout coordinates, package dimensions, memory choices, and power phases are illustrative teaching parameters, not a vendor reference design. Component roles and formulas should be technically grounded. Build checks assess the teaching model, not electrical or manufacturing readiness.

## Visual direction

An engineering bench with a warm white frame, precise typography, dark green PCB, copper traces, gold edge fingers, and restrained orange selection. Large original SVG board artwork is the primary visual. Avoid stock hardware photography, decorative gradients, and a generic marketing-page layout. Maintain a clear view of the board while reading lessons.

Desktop: parts library on the left, board in the center, lesson/inspector on the right, and a compact BOM/checks/notes dock underneath. Tablet: narrower columns with lesson below; mobile: one-column layout with the board and touch controls followed by library and guide. All core operations have button equivalents to dragging.

## Learning sequence

PCB substrate → PCIe edge interface → auxiliary power → PWM controller → four power stages → four inductors → bulk capacitors → GPU package → four GDDR6 memory packages → SPI flash → reference oscillator → local decoupling bank → display connector → fan connector → heatsink → fan assembly.

Use consistent reference designators: PCB1, J1/J2/J3/J4, U1 for the GPU, U2–U5 for memory, U6 for the PWM controller, U7 for flash, U8–U11 for integrated power stages, L1–L4, C1/C2/C3–C10, Y1, HS1, FAN1. Power stages are integrated ICs rather than single discrete MOSFETs. Grouped parts explicitly identify their designator range.

Each lesson explains function, connection/placement rationale, prerequisites, a practical engineering observation, and a multiple-choice check with explanatory feedback. Guided mode uses suggested footprints; exploration mode permits moving and rotating parts within model constraints. The PCB is the first user-placed component. Completed parts can be selected for inspection.

## Interaction and data

Native HTML/CSS/JavaScript modules, SVG rendering, zero production dependencies and no server-side data collection. State persists to browser localStorage; JSON export is portable. Import validates a versioned, bounded schema and rejects unknown parts, duplicate IDs, invalid coordinates, and invalid values. Imported content is rendered as text. Undo/redo restore consistent snapshots. Reset requires a concrete confirmation dialog. Storage errors must leave the current workspace usable.

Board view includes zoom/fit, selection, component removal, placement previews, and power/data overlays. The architecture view is an explanatory block diagram rather than an ASIC floorplan editor. BOM export is a CSV teaching inventory with the same identifiers as the board. The theoretical memory bandwidth calculation uses data rate × bus width / 8, with illustrative GDDR6 parameters; it is not a benchmark.

## Verification

Unit checks for dependency enforcement, placement constraints, import validation, state updates, memory calculations, and checks after removal. Browser checks exercise the complete guided build, quizzes, undo/redo, persistence, export/import, both views, overlays, and phone/tablet layouts. Run a local preview on a separate port; do not alter the live business site or publish the learning app without a requested destination.

## Research

Primary sources used for component roles and learning content:

- [NVIDIA GPU architecture fundamentals](https://docs.nvidia.com/deeplearning/performance/dl-performance-gpu-background/): parallel compute, SMs, memory hierarchy, theoretical throughput limitations.
- [NVIDIA Ampere GA102 architecture whitepaper](https://www.nvidia.com/content/PDF/nvidia-ampere-ga-102-gpu-architecture-whitepaper-v2.pdf): GPU functional-block context. The app does not reproduce that chip layout.
- [TI multiphase processor power](https://www.ti.com/product-category/power-management/multiphase.html): PWM control, integrated power stages, inductors and multiphase regulation.
- [Micron graphics memory](https://www.micron.com/products/memory/graphics-memory): GDDR as external graphics DRAM. The training board uses illustrative GDDR6 parameters rather than claiming compatibility with a particular processor.

Planning completed before implementation. Selected lesson level: electronics student.
