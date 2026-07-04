# RISC-V RV32I Simulator — CS3051

Simulador de arquitectura RISC-V RV32I con interfaz estilo IDE (registros, desensamblado, memoria y consola de comandos).

## Cómo ejecutarlo

Solo abre `index.html` en el navegador.

## Estructura del proyecto

```
riscv-simulator/
├── index.html          # Estructura HTML (markup de la UI)
├── css/
│   └── styles.css       # Estilos (tema tipo VS Code dark)
└── js/
    ├── cpu.js           # Núcleo del simulador: clase CPU (fetch/decode/execute, disasm)
    ├── demos.js         # Programas de demostración precompilados (riscvtest, quicksort, árbol)
    ├── state.js         # Estado global compartido (instancia de CPU, registros previos, dirección de memoria)
    ├── render.js         # Funciones de renderizado (registros, desensamblado, memoria, status bar)
    ├── console.js        # Terminal de comandos (step, run, regs, mem, disasm, reset, etc.)
    ├── controls.js        # Listeners de botones, atajos de teclado (F7/F8/F9), carga de archivos .bin
    └── main.js           # Inicialización (mensajes de bienvenida y primer render)
```
